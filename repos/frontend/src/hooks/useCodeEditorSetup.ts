import { registerMonacoThemes } from "@/editor/themes";
//import { loadProjectTypeContext } from "@/editor/typedefs";
import { Monaco, useMonaco } from "@monaco-editor/react";
import {
  type editor,
  type IRange,
  type IPosition,
  type Uri,
  KeyMod,
  KeyCode,
} from "monaco-editor";
import { useCallback, useEffect, useMemo, useRef } from "react";
import { useProjectStore } from "./stores/useProjectStore";
import { useInmemoryEditorStore } from "./stores/useInmemoryEditorStore";
import { API } from "@/api";

export function useCodeEditorSetup() {
  const loadedFiles = useProjectStore((state) => state.loadedFiles);
  const activeFile = useProjectStore((state) => state.activeFile);
  const projectPath = useProjectStore((state) => state.path);

  const monaco = useMonaco();
  const editorRef = useRef<editor.IStandaloneCodeEditor | null>(null);

  const fullActiveFile = useMemo(
    () => loadedFiles.find((f) => f.path == activeFile),
    [loadedFiles, activeFile],
  );

  // Keep a ref of URIs this hook has created so we can clean up stale ones
  const ownedUrisRef = useRef<Set<string>>(new Set());

  // Create / update Monaco models for loaded files; dispose stale ones
  useEffect(() => {
    if (!monaco) return;

    const currentUris = new Set<string>();

    for (const file of loadedFiles) {
      const uri = monaco.Uri.parse(`file://${file.path}`);
      const uriStr = uri.toString();
      currentUris.add(uriStr);

      const existing = monaco.editor.getModel(uri);
      if (existing) {
        // Don't overwrite the Monaco model if the file has unsaved changes —
        // the editor is the source of truth for dirty files.
        if (useProjectStore.getState().unsavedFiles.has(file.path)) continue;

        // Update content only when it actually changed
        if (existing.getValue() !== file.content) {
          existing.setValue(file.content);
        }
      } else {
        monaco.editor.createModel(file.content, file.language, uri);
      }
    }

    // Dispose models that we previously owned but are no longer in loadedFiles
    for (const oldUri of ownedUrisRef.current) {
      if (!currentUris.has(oldUri)) {
        const model = monaco.editor.getModel(monaco.Uri.parse(oldUri));
        model?.dispose();
      }
    }

    ownedUrisRef.current = currentUris;
  }, [monaco, loadedFiles]);

  // Cleanup: dispose all owned models only when the component unmounts
  useEffect(() => {
    return () => {
      for (const uriStr of ownedUrisRef.current) {
        const model = monaco?.editor.getModel(monaco.Uri.parse(uriStr));
        model?.dispose();
      }
      ownedUrisRef.current.clear();
    };
  }, [monaco]);

  // Load type definitions from node_modules when project opens
  /*useEffect(() => {
    if (!monaco || !projectPath) return;
    loadProjectTypeContext(monaco, projectPath);
  }, [monaco, projectPath]);*/

  // Set the active file's model on the editor
  useEffect(() => {
    if (!monaco) return;
    if (!fullActiveFile) return;

    const uri = monaco.Uri.parse(`file://${fullActiveFile.path}`);
    const model = monaco.editor.getModel(uri);

    if (model && editorRef.current) editorRef.current.setModel(model);
  }, [monaco, fullActiveFile]);

  const beforeMountHandler = useCallback((monaco: Monaco) => {
    registerMonacoThemes(monaco);

    monaco.editor.registerEditorOpener({
      openCodeEditor: (
        source: editor.ICodeEditor,
        resource: Uri,
        selectionOrPosition?: IRange | IPosition,
      ) => openCodeEditor(monaco, source, resource, selectionOrPosition),
    });

    /*const ts = monaco.languages.typescript;

    ts.typescriptDefaults.setCompilerOptions({
      ...ts.typescriptDefaults.getCompilerOptions(),
      moduleResolution: ts.ModuleResolutionKind.NodeJs,
      module: ts.ModuleKind.ESNext,
      target: ts.ScriptTarget.ESNext,
      allowNonTsExtensions: true,
      noEmit: true,
    });

    ts.javascriptDefaults.setCompilerOptions({
      ...ts.javascriptDefaults.getCompilerOptions(),
      moduleResolution: ts.ModuleResolutionKind.NodeJs,
      module: ts.ModuleKind.ESNext,
      target: ts.ScriptTarget.ESNext,
      allowNonTsExtensions: true,
      noEmit: true,
    });

    // Keep semantic validation ON for cross-file go-to-definition,
    // but suppress "Cannot find module" errors that Monaco can't resolve
    // without node_modules / tsconfig context.
    ts.typescriptDefaults.setDiagnosticsOptions({
      noSemanticValidation: false,
      noSyntaxValidation: false,
      //diagnosticCodesToIgnore: [2307, 2792, 2304, 7016],
    });

    ts.javascriptDefaults.setDiagnosticsOptions({
      noSemanticValidation: false,
      noSyntaxValidation: false,
      diagnosticCodesToIgnore: [2307, 2792, 2304, 7016],
    });

    ts.typescriptDefaults.setEagerModelSync(true);
    ts.javascriptDefaults.setEagerModelSync(true);

    // Handle cross-file "Go to Definition" navigation
    monaco.editor.registerEditorOpener({
      openCodeEditor(
        source: editor.ICodeEditor,
        resource: Uri,
        selectionOrPosition?: IRange | IPosition,
      ) {
        const model = monaco.editor.getModel(resource);
        if (!model) return false;

        // Extract file path from the URI
        const filePath = resource.path;

        // Update the store's active file
        useProjectStore.getState().setActiveFile(filePath);

        // Switch model and navigate to position
        source.setModel(model);

        if (selectionOrPosition) {
          if ("endLineNumber" in selectionOrPosition) {
            source.setSelection(selectionOrPosition as any);
            source.revealRangeInCenter(selectionOrPosition as any);
          } else if ("lineNumber" in selectionOrPosition) {
            source.setPosition(selectionOrPosition as any);
            source.revealPositionInCenter(selectionOrPosition as any);
          }
        }

        return true;
      },
    });*/

    /*monaco.languages.typescript.typescriptDefaults.setCompilerOptions({
      jsx: monaco.languages.typescript.JsxEmit.ReactJSX,
      target: monaco.languages.typescript.ScriptTarget.ESNext,
      allowJs: true,
      allowSyntheticDefaultImports: true,
      esModuleInterop: true,
    });

    monaco.languages.typescript.typescriptDefaults.setEagerModelSync(true);*/
  }, []);

  const setCursor = useInmemoryEditorStore((state) => state.setCursor);

  const onMountHandler = useCallback(
    (editor: editor.IStandaloneCodeEditor) => {
      editorRef.current = editor;

      editor.onDidChangeCursorPosition((e) => {
        setCursor(e.position.lineNumber, e.position.column);
      });

      editor.onDidChangeModelContent(() => {
        const uri = editor.getModel()?.uri;
        if (uri) {
          useProjectStore.getState().markUnsaved(uri.path);
        }
      });

      editor.addCommand(KeyMod.CtrlCmd | KeyCode.KeyS, async () => {
        const content = editor.getValue();
        const uri = editor.getModel()?.uri;

        if (!uri) return;

        await API.fs.writeFile(uri.path, content);
        useProjectStore.getState().markSaved(uri.path);
      });
    },
    [setCursor],
  );

  return {
    beforeMount: beforeMountHandler,
    onMount: onMountHandler,
  };
}

export function openCodeEditor(
  monaco: Monaco,
  source: editor.ICodeEditor,
  resource: Uri,
  selectionOrPosition?: IRange | IPosition,
) {
  const model = monaco.editor.getModel(resource);
  if (!model) return false;

  const filePath = resource.path;

  useProjectStore.getState().setActiveFile(filePath);
  source.setModel(model);

  if (selectionOrPosition) {
    if ("endLineNumber" in selectionOrPosition) {
      source.setSelection(selectionOrPosition as any);
      source.revealRangeInCenter(selectionOrPosition as any);
    } else if ("lineNumber" in selectionOrPosition) {
      source.setPosition(selectionOrPosition as any);
      source.revealPositionInCenter(selectionOrPosition as any);
    }
  }

  return true;
}
