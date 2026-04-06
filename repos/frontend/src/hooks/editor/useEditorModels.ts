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
      for (const model of monaco.editor.getModels()) {
        model.dispose();
      }
      Editor.instance.clearModels();

      const entries = await props.workspace.filesystem.root.tree();

      await Promise.all(
        entries.map(async (entry) => {
          if (!(entry instanceof FilesystemFileEntry)) return;

          const content = await entry.read();
          const normalizedPath = entry.path.replaceAll("\\", "/");
          const fileUri = monaco.Uri.file(normalizedPath);

          const model = monaco.editor.createModel(
            content,
            getLanguage(entry.name),
            fileUri,
          );

          Editor.instance.addModel(model);
        }),
      );

      Editor.instance.markModelsLoaded();
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
