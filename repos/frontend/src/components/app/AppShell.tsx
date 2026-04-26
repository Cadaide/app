import { useWorkspaceState } from "@/hooks/stores/useWorkspaceState";
import { SidebarTabView } from "../views/SidebarTabView";
import { SidebarView } from "../views/SidebarView";
import { TabbarView } from "../views/TabbarView";
import { Bottombar } from "./Bottombar";
import { Menubar } from "./Menubar";
import dynamic from "next/dynamic";
import { LoadingScreen } from "../base/LoadingScreen";
import { CodePathView } from "../views/CodePathView";
import { HomeScreen } from "../screen/HomeScreen";
import { useTabbarViewState } from "@/hooks/stores/useTabbarViewState";
import { BrowserPlatformCompat } from "@/platform/browser/compat/_compat";
import { TerminalView } from "../views/TerminalView";
import { useState } from "react";
import { PluginManagerScreen } from "../screen/PluginManagerScreen";
import { useScreenState } from "@/hooks/stores/useScreenState";

const CodeEditor = dynamic(
  async () => (await import("../editor/CodeEditor")).CodeEditor,
  {
    loading: () => <LoadingScreen />,
    ssr: false,
  },
);

export function AppShell() {
  const workspace = useWorkspaceState((state) => state.workspace);
  const activeTabPath = useTabbarViewState((state) => state.activeTabPath);

  const screen = useScreenState((state) => state.screen);

  return (
    <div className="w-screen h-screen min-w-screen max-w-screen min-h-screen max-h-screen flex flex-col overflow-hidden">
      <Menubar />
      <div className="w-full flex-1 min-h-0 overflow-hidden flex flex-row">
        <SidebarView />
        <SidebarTabView />
        {screen == "editor" ? (
          workspace ? (
            <div className="flex-1 flex flex-col min-h-0">
              <div className="flex-1 min-h-0 overflow-hidden flex flex-col">
                {activeTabPath && (
                  <>
                    <TabbarView />
                    <CodePathView />
                    <CodeEditor workspace={workspace} />
                  </>
                )}
              </div>
              <TerminalView />
            </div>
          ) : (
            <HomeScreen />
          )
        ) : (
          <PluginManagerScreen />
        )}
      </div>
      <Bottombar />

      <BrowserPlatformCompat />

      <div
        id="ghost-container"
        className="absolute top-[-9999px] left-[-9999px]"
      />
    </div>
  );
}
