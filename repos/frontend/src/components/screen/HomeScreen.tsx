import { Application } from "@/classes/Application";
import { Workspace } from "@/classes/Workspace";
import { useTabbarViewState } from "@/hooks/stores/useTabbarViewState";
import { useWorkspaceState } from "@/hooks/stores/useWorkspaceState";
import { useCallback } from "react";
import { PiFolderOpen } from "react-icons/pi";

export function HomeScreen() {
  const setWorkspace = useWorkspaceState((state) => state.setWorkspace);
  const closeTabs = useTabbarViewState((state) => state.closeTabs);

  const handleOpenProject = useCallback(async () => {
    const path = await window.api.openSelectDirectoryDialog();
    if (!path) return;

    setWorkspace(new Workspace(path));
    closeTabs();

    // TODO: Reload without reloading
    location.reload();
  }, []);

  const handleOpenProjectPI = useCallback(async () => {
    const path = prompt("Enter path to project:");
    if (!path) return;

    setWorkspace(new Workspace(path));
    closeTabs();

    // TODO: Reload without reloading
    location.reload();
  }, [setWorkspace, closeTabs]);

  return (
    <div className="h-full flex flex-col grow items-center justify-center bg-ctp-base text-ctp-text">
      <h1 className="text-4xl font-bold mb-2">Cadaide</h1>
      <p className="text-lg text-ctp-subtext1 mb-6">
        Open a project to get started
      </p>

      <button
        onClick={Application.isNative ? handleOpenProject : handleOpenProjectPI}
        className="flex flex-row items-center gap-2 px-4 py-2 bg-ctp-lavender hover:bg-ctp-mauve transition-colors text-ctp-base rounded-md font-medium cursor-pointer"
      >
        <PiFolderOpen className="w-5 h-5 shrink-0" />
        Open Project
      </button>
    </div>
  );
}
