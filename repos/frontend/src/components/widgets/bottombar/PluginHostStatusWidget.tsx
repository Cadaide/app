import { LoadingSpinner } from "@/components/base/LoadingSpinner";
import { useWorkspaceState } from "@/hooks/stores/useWorkspaceState";
import { useEffect, useState } from "react";

export function PluginHostStatusWidget() {
  const workspace = useWorkspaceState((state) => state.workspace);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    if (!workspace) return;

    const off = workspace.pluginHostSession.onceInitialized(() => {
      setLoading(false);
    });

    return () => {
      off();
    };
  }, [workspace]);

  return (
    <div className="w-auto h-full flex flex-row gap-2 items-center justify-center">
      {(!workspace || loading) && <PluginHostLoading />}
    </div>
  );
}

function PluginHostLoading() {
  return (
    <>
      <LoadingSpinner size="sm" />
      <p className="text-ctp-lavender-700 text-md">Starting plugins...</p>
    </>
  );
}
