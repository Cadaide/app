import { useCallback } from "react";
import { PiFolderOpen } from "react-icons/pi";

export function HomeScreen() {
  const handleOpenProject = useCallback(async () => {
    const path = await window.api.openSelectDirectoryDialog();
    if (!path) return;
  }, []);

  return (
    <div className="w-full h-full flex flex-col items-center justify-center bg-ctp-base text-ctp-text">
      <h1 className="text-4xl font-bold mb-2">Cadaide</h1>
      <p className="text-lg text-ctp-subtext1 mb-6">
        Open a project to get started
      </p>

      <button
        onClick={handleOpenProject}
        className="flex flex-row items-center gap-2 px-4 py-2 bg-ctp-lavender hover:bg-ctp-mauve transition-colors text-ctp-base rounded-md font-medium cursor-pointer"
      >
        <PiFolderOpen className="w-5 h-5 flex-shrink-0" />
        Open Project
      </button>
    </div>
  );
}
