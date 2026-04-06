import { Settings } from "@/classes/Settings";
import { registerMonacoThemes } from "@/editor/themes";
import { EditorProps, Monaco } from "@monaco-editor/react";
import { useCallback } from "react";

export interface IEditorThemeOutput {
  theme: string;
  onBeforeMount: (monaco: Monaco) => void;
  options: EditorProps["options"];
}

const activeTheme = "catppuccin-mocha";

export function useEditorTheme(): IEditorThemeOutput {
  const onBeforeMount = useCallback(
    (monaco: Monaco) => {
      registerMonacoThemes(monaco);
    },
    [registerMonacoThemes],
  );

  return {
    theme: activeTheme,
    onBeforeMount,
    options: {
      fontSize: Settings.instance.get("editor.fontSize") || 18,
      fontWeight: "700",
      fontFamily: "var(--font-jetBrains), 'JetBrains Mono', monospace",
      fontLigatures: true,
      minimap: {
        scale: 1.5,
      },
    },
  };
}
