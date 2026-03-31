import { useCodeEditorSetup } from "@/hooks/useCodeEditorSetup";
import { Editor } from "@monaco-editor/react";

export function CodeEditor() {
  const setupProps = useCodeEditorSetup();

  return (
    <Editor
      {...setupProps}
      theme="catpuccin-mocha"
      language="typescript"
      height="100vh"
      options={{
        fontSize: 18,
        fontWeight: "700",
        fontFamily: "var(--font-jetBrains), 'JetBrains Mono', monospace",
        fontLigatures: true,
      }}
    />
  );
}
