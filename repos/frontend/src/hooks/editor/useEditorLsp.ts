import type { Monaco } from "@monaco-editor/react";
import type { editor } from "monaco-editor";
import * as monaco from "monaco-editor";
import { useCallback, useRef } from "react";
import { LspClient } from "@/classes/LspClient";
import type { Workspace } from "@/classes/Workspace";
import { Editor } from "@/classes/Editor";
import { EditorHook, EditorHookId } from "@/classes/EditorHook";

export interface IEditorLspOutput {
  onMount: (editor: editor.IStandaloneCodeEditor, monaco: Monaco) => void;
}

export function useEditorLsp(workspace: Workspace): IEditorLspOutput {
  const clientRef = useRef<LspClient | null>(null);

  const onMount = useCallback(
    (editor: editor.IStandaloneCodeEditor, monaco: Monaco) => {
      editor.onDidChangeModelContent(() => {
        const model = editor.getModel();
        if (!model) return;

        const uri = model.uri.toString();

        const client = clientRef.current;
        if (!client) return;

        client.sendDidChange(uri, model.getValue());
      });

      const projectPath = workspace.path.replaceAll("\\", "/");

      const client = new LspClient({
        wsUrl: `ws://localhost:3001/lsp?language=${"python"}`,
        monaco,
        languageIds: ["python"],
        rootUri: monaco.Uri.file(projectPath).toString(),
      });

      clientRef.current = client;

      client.start().then(() => {
        // Send didOpen for all currently open files
        const files = monaco.editor.getModels();

        for (const file of files) {
          client.sendDidOpen(
            file.uri.toString(),
            file.getLanguageId(),
            file.getValue(),
          );
        }

        Editor.instance.registerHook(
          new EditorHook(EditorHookId.EditorOpen, ({ path, model }) => {
            client.sendDidOpen(
              model.uri.toString(),
              model.getLanguageId(),
              model.getValue(),
            );
          }),
        );
      });
    },
    [workspace],
  );

  return {
    onMount: onMount,
  };
}
