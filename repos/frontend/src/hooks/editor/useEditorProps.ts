import type { Monaco } from "@monaco-editor/react";
import type { editor } from "monaco-editor";
import { useCallback } from "react";
import type { IEditorLspOutput } from "./useEditorLsp";
import type { IEditorModelsOutput } from "./useEditorModels";
import type { IEditorSingletonOutput } from "./useEditorSingleton";
import type { IEditorThemeOutput } from "./useEditorTheme";

export function useEditorProps(props: {
  theme: IEditorThemeOutput;
  models: IEditorModelsOutput;
  singleton: IEditorSingletonOutput;
  lsp: IEditorLspOutput;
}) {
  const onBeforeMount = useCallback(
    async (monaco: Monaco) => {
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

      props.theme.onBeforeMount(monaco);
      await props.models.onBeforeMount(monaco);
    },
    [props.theme, props.models],
  );

  const onMount = useCallback(
    (editor: editor.IStandaloneCodeEditor, monaco: Monaco) => {
      props.models.onMount(editor, monaco);
      props.singleton.onMount(editor, monaco);
      props.lsp.onMount(editor, monaco);

      editor.updateOptions({});
    },
    [props.models, props.singleton, props.lsp],
  );

  return {
    theme: props.theme.theme,
    options: {
      ...props.theme.options,
    },

    keepCurrentModel: true,

    beforeMount: onBeforeMount,
    onMount: onMount,
  };
}
