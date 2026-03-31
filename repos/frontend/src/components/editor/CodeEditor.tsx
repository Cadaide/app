import { useProjectStore } from "@/hooks/stores/useProjectStore";
import { useCodeEditorSetup } from "@/hooks/useCodeEditorSetup";
import { pathToName } from "@/utils/files/file";
import { Editor } from "@monaco-editor/react";
import { Tabs } from "./Tabs";

export function CodeEditor() {
  const setupProps = useCodeEditorSetup();

  const path = useProjectStore((state) => state.path);
  const tabs = useProjectStore((state) => state.tabs);

  if (!path) return <div></div>;

  return (
    <div className="w-full h-full overflow-hidden">
      <Tabs files={tabs.map((path) => ({ path, name: pathToName(path) }))} />
      <Editor
        {...setupProps}
        theme="catpuccin-mocha"
        language="typescript"
        height="100%"
        options={{
          fontSize: 18,
          fontWeight: "700",
          fontFamily: "var(--font-jetBrains), 'JetBrains Mono', monospace",
          fontLigatures: true,
          minimap: {
            scale: 1.5,
          },
        }}
      />
    </div>
  );
}
