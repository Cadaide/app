import { useSidebarViewState } from "@/hooks/stores/useSidebarViewState";
import { useMemo } from "react";

export function TerminalView() {
  const activeViewIds = useSidebarViewState((state) => state.activatedViewIds);

  const isActive = useMemo(
    () => activeViewIds.includes("terminal"),
    [activeViewIds],
  );
  if (!isActive) return null;

  return (
    <div className="w-full min-h-[30%] bg-ctp-crust border-t border-ctp-surface1">
      <p>TODO</p>
    </div>
  );
}
