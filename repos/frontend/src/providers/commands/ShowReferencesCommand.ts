import { Monaco } from "@monaco-editor/react";
import { editor } from "monaco-editor";

export class ShowReferencesCommand {
  static register(monaco: Monaco, editor: editor.IStandaloneCodeEditor) {
    monaco.editor.registerCommand(
      "cadaide.showReferences",
      (_accessor: any, _uri: any, pos: any) => {
        editor.setPosition(
          new monaco.Position(pos.line + 1, pos.character + 1),
        );
        editor.trigger("", "editor.action.referenceSearch.trigger", null);
      },
    );
  }
}
