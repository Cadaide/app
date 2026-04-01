import { registerMonacoThemes } from "@/editor/themes";
import { LightLspClient } from "@/editor/lspClient";
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

  const lspClientRef = useRef<LightLspClient | null>(null);

  // Track which documents we've sent didOpen for
  const openedDocsRef = useRef<Set<string>>(new Set());

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

      // Notify the LSP about newly opened documents
      const client = lspClientRef.current;
      if (client && !openedDocsRef.current.has(uriStr)) {
        openedDocsRef.current.add(uriStr);
        client.sendDidOpen(uriStr, file.language, file.content);
      }
    }

    // Dispose models and notify LSP about closed documents
    for (const oldUri of ownedUrisRef.current) {
      if (!currentUris.has(oldUri)) {
        const client = lspClientRef.current;
        if (client && openedDocsRef.current.has(oldUri)) {
          openedDocsRef.current.delete(oldUri);
          client.sendDidClose(oldUri);
        }

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

      // Stop LSP client on unmount
      lspClientRef.current?.stop();
      lspClientRef.current = null;
      openedDocsRef.current.clear();
    };
  }, [monaco]);

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

    // Disable all built-in Monaco TS/JS language features so the external
    // LSP server is the sole provider of intelligence.
    const ts = monaco.languages.typescript;

    const disabledModeConfig = {
      completionItems: false,
      hovers: false,
      documentSymbols: false,
      definitions: false,
      references: false,
      documentHighlights: false,
      rename: false,
      diagnostics: false,
      documentRangeFormattingEdits: false,
      signatureHelp: false,
      onTypeFormattingEdits: false,
      codeActions: false,
      inlayHints: false,
    };

    ts.typescriptDefaults.setModeConfiguration(disabledModeConfig);
    ts.javascriptDefaults.setModeConfiguration(disabledModeConfig);

    ts.typescriptDefaults.setDiagnosticsOptions({
      noSemanticValidation: true,
      noSyntaxValidation: true,
      noSuggestionDiagnostics: true,
    });

    ts.javascriptDefaults.setDiagnosticsOptions({
      noSemanticValidation: true,
      noSyntaxValidation: true,
      noSuggestionDiagnostics: true,
    });
  }, []);

  const setCursor = useInmemoryEditorStore((state) => state.setCursor);

  const onMountHandler = useCallback(
    (editor: editor.IStandaloneCodeEditor, monaco: Monaco) => {
      editorRef.current = editor;

      editor.onDidChangeCursorPosition((e) => {
        setCursor(e.position.lineNumber, e.position.column);
      });

      editor.onDidChangeModelContent(() => {
        const model = editor.getModel();
        if (!model) return;

        const uri = model.uri;
        useProjectStore.getState().markUnsaved(uri.path);

        // Notify LSP of content changes
        const client = lspClientRef.current;
        if (client) {
          client.sendDidChange(uri.toString(), model.getValue());
        }
      });

      editor.addCommand(KeyMod.CtrlCmd | KeyCode.KeyS, async () => {
        const content = editor.getValue();
        const uri = editor.getModel()?.uri;

        if (!uri) return;

        await API.fs.writeFile(uri.path, content);
        useProjectStore.getState().markSaved(uri.path);

        // Notify LSP of save
        const client = lspClientRef.current;
        if (client) {
          client.sendDidSave(uri.toString(), content);
        }
      });

      // Start the lightweight LSP client
      const projectPath = useProjectStore.getState().path;
      const client = new LightLspClient({
        wsUrl: "ws://localhost:3001/lsp",
        monaco,
        languageIds: [
          /*"typescript",
          "javascript",
          "typescriptreact",
          "javascriptreact",*/
          "python",
        ],
        rootUri: projectPath ? `file://${projectPath}` : "file:///",
      });

      lspClientRef.current = client;

      client
        .start()
        .then(() => {
          // Send didOpen for all currently loaded files
          const files = useProjectStore.getState().loadedFiles;
          for (const file of files) {
            const uri = `file://${file.path}`;
            if (!openedDocsRef.current.has(uri)) {
              openedDocsRef.current.add(uri);
              client.sendDidOpen(uri, file.language, file.content);
            }
          }
        })
        .catch((e) => {
          console.error("[LSP] Failed to start:", e);
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
