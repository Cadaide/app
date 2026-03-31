"use client";

import { Menubar } from "@/components/app/Menubar";
import { CodeEditor } from "@/components/editor/CodeEditor";
import { Explorer } from "@/components/fs/Explorer";

export default function Page() {
  return (
    <div className="w-screen h-screen flex flex-col overflow-hidden">
      <Menubar />
      <div className="flex flex-row grow overflow-hidden">
        <Explorer />
        <CodeEditor />
      </div>
    </div>
  );
}
