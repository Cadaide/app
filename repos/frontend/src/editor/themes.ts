import { Monaco } from "@monaco-editor/react";
import { themeCatppuccinMocha } from "./themes/catppuccin/mocha.theme";

const themes = {
  "catpuccin-mocha": themeCatppuccinMocha,
};

export function registerMonacoThemes(monaco: Monaco) {
  Object.entries(themes).forEach(([name, theme]) => {
    monaco.editor.defineTheme(name, theme);
  });
}
