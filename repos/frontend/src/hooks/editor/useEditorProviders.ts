import { ReferencesCodeLensProvider } from "@/providers/codeLens/ReferencesCodeLensProvider";
import { ShowReferencesCommand } from "@/providers/commands/ShowReferencesCommand";
import { Monaco } from "@monaco-editor/react";
import { editor } from "monaco-editor";
import { useCallback } from "react";

export interface IEditorProvidersOutput {
  onMount: (editor: editor.IStandaloneCodeEditor, monaco: Monaco) => void;
}

export function useEditorProviders(): IEditorProvidersOutput {
  const onMount = useCallback(
    (editor: editor.IStandaloneCodeEditor, monaco: Monaco) => {
      ReferencesCodeLensProvider.register(monaco, editor);

      ShowReferencesCommand.register(monaco, editor);
    },
    [],
  );

  return {
    onMount: onMount,
  };
}
