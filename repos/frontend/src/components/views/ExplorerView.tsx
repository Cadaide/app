import { useWorkspaceState } from "@/hooks/stores/useWorkspaceState";
import { ExplorerFolder } from "../fs/Explorer";
import { GhostScrollbar } from "../utils/GhostScrollbar";

export function ExplorerView() {
  const workspace = useWorkspaceState((state) => state.workspace);

  if (!workspace) return null; // TODO

  return (
    <GhostScrollbar
      direction="both"
      thumbSize={8}
      className="w-full h-full bg-ctp-mantle"
    >
      <div className="min-w-fit flex flex-col">
        <ExplorerFolder folderEntry={workspace.filesystem.root} isRoot />
      </div>
    </GhostScrollbar>
  );
}
