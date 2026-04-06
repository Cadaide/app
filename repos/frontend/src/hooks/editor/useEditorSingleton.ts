import { Editor } from "@/classes/Editor";
import { Monaco } from "@monaco-editor/react";
import { editor } from "monaco-editor";
import { useCallback, useEffect } from "react";
import { useTabbarViewState } from "../stores/useTabbarViewState";

export interface IEditorSingletonOutput {
  onMount: (editor: editor.IStandaloneCodeEditor, monaco: Monaco) => void;
}

export function useEditorSingleton(): IEditorSingletonOutput {
  const activeTabPath = useTabbarViewState((state) => state.activeTabPath);

  const onMount = useCallback(
    (editor: editor.IStandaloneCodeEditor, monaco: Monaco) => {
      Editor.instance.editor = editor;

      Editor.instance.markEditorMounted();
    },
    [],
  );

  useEffect(() => {
    Editor.instance.openFile(activeTabPath);
  }, [activeTabPath]);

  useEffect(() => {
    const handleInitialized = () => {
      if (!activeTabPath) return;

      Editor.instance.openFile(activeTabPath);
    };

    const offInitialized = Editor.instance.onInitialized(handleInitialized);

    return () => {
      offInitialized();
    };
  }, [activeTabPath]);

  return { onMount };
}
