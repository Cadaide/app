import type { Monaco } from "@monaco-editor/react";
import type { editor } from "monaco-editor";
import { useCallback } from "react";
import type { Workspace } from "@/classes/Workspace";
import { Editor } from "@/classes/Editor";

export interface IEditorLspOutput {
  onMount: (editor: editor.IStandaloneCodeEditor, monaco: Monaco) => void;
}

export function useEditorLsp(workspace: Workspace): IEditorLspOutput {
  const onMount = useCallback(
    (editor: editor.IStandaloneCodeEditor, monaco: Monaco) => {
      Editor.instance.lsp.setWorkspace(workspace);
      Editor.instance.lsp.setMonaco(monaco);

      editor.onDidChangeModelContent(() => {
        Editor.instance.lsp.notifyFileChange(editor.getModel()!);
      });
    },
    [workspace],
  );

  return {
    onMount: onMount,
  };
}
