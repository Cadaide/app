import { Workspace } from "@/classes/Workspace";
import { useEditorLsp } from "@/hooks/editor/useEditorLsp";
import { useEditorModels } from "@/hooks/editor/useEditorModels";
import { useEditorProps } from "@/hooks/editor/useEditorProps";
import { useEditorSingleton } from "@/hooks/editor/useEditorSingleton";
import { useEditorTheme } from "@/hooks/editor/useEditorTheme";
import { Editor } from "@monaco-editor/react";

interface ICodeEditorProps {
  workspace: Workspace;
}

export function CodeEditor(props: ICodeEditorProps) {
  const theme = useEditorTheme();
  const models = useEditorModels({ workspace: props.workspace });
  const singleton = useEditorSingleton();
  const lsp = useEditorLsp(props.workspace);

  const editorProps = useEditorProps({
    theme: theme,
    models: models,
    singleton: singleton,
    lsp: lsp,
  });

  return (
    <div className="w-full h-full">
      <Editor {...editorProps} loading={null} />
    </div>
  );
}
