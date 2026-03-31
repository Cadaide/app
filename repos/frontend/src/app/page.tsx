"use client";

import { CodeEditor } from "@/components/editor/CodeEditor";
import { Explorer } from "@/components/fs/Explorer";

export default function Page() {
  return (
    <div className="flex flex-row">
      <Explorer />
      <CodeEditor />
    </div>
  );
}
