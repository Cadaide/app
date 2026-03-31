"use client";

import { Bottombar } from "@/components/app/Bottombar";
import { Menubar } from "@/components/app/Menubar";
import { CodeEditor } from "@/components/editor/CodeEditor";
import { Explorer } from "@/components/fs/Explorer";
import { HomeScreen } from "@/components/screen/HomeScreen";
import { useProjectStore } from "@/hooks/stores/useProjectStore";

export default function Page() {
  const path = useProjectStore((state) => state.path);

  return (
    <div className="w-screen h-screen flex flex-col overflow-hidden">
      <Menubar />
      {path ? (
        <div className="flex flex-row grow overflow-hidden">
          <Explorer />
          <CodeEditor />
        </div>
      ) : (
        <HomeScreen />
      )}
      <Bottombar />
    </div>
  );
}
