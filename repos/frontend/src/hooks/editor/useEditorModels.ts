import type { Monaco } from "@monaco-editor/react";
import type { editor } from "monaco-editor";
import { useCallback, useEffect } from "react";
import { Editor } from "@/classes/Editor";
import { FilesystemFileEntry } from "@/classes/FilesystemFileEntry";
import type { Workspace } from "@/classes/Workspace";
import { getLanguage } from "@/editor/languages";
import { EditorHookId } from "@/classes/EditorHook";

interface IEditorModelsProps {
  workspace: Workspace;
}

export interface IEditorModelsOutput {
  onBeforeMount: (monaco: Monaco) => Promise<void>;
  onMount: (editor: editor.IStandaloneCodeEditor, monaco: Monaco) => void;
}

export function useEditorModels(
  props: IEditorModelsProps,
): IEditorModelsOutput {
  const onBeforeMount = useCallback(
    async (monaco: Monaco) => {
      Editor.instance.clearModels();
    },
    [props.workspace],
  );

  const onMount = useCallback(
    async (editor: editor.IStandaloneCodeEditor, monaco: Monaco) => {
      editor.onDidChangeModelContent((event) => {
        Editor.instance.notifyHook(EditorHookId.ModelChange, {
          editor,
          event,
          monaco,
        });
      });

      editor.addCommand(
        monaco.KeyMod.CtrlCmd | monaco.KeyCode.KeyS,
        async () => {
          const content = editor.getModel()?.getValue();
          const path = editor.getModel()?.uri.path;

          if (!content || !path) return;

          await Editor.instance.saveFile(path, content);
        },
      );
    },
    [],
  );

  return { onMount, onBeforeMount };
}
