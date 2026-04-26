import { Workspace } from "@/classes/Workspace";
import { useEditorLsp } from "@/hooks/editor/useEditorLsp";
import { useEditorModels } from "@/hooks/editor/useEditorModels";
import { useEditorProps } from "@/hooks/editor/useEditorProps";
import { useEditorProviders } from "@/hooks/editor/useEditorProviders";
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
  const providers = useEditorProviders();

  const editorProps = useEditorProps({
    theme: theme,
    models: models,
    singleton: singleton,
    lsp: lsp,
    providers: providers,
  });

  return (
    <div className="flex-1 w-full h-full min-h-0 min-w-0 overflow-hidden">
      <Editor {...editorProps} loading={null} />
    </div>
  );
}
