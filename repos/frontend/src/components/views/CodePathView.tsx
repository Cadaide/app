import { useTabbarViewState } from "@/hooks/stores/useTabbarViewState";
import { useWorkspaceState } from "@/hooks/stores/useWorkspaceState";
import path from "path";
import React from "react";
import { PiCaretRight } from "react-icons/pi";

interface ICodePathViewItemProps {
  name: string;
}

export function CodePathView() {
  const activeTab = useTabbarViewState((state) => state.activeTabPath);
  const workspace = useWorkspaceState((state) => state.workspace);

  const relativePath = path.relative(workspace?.path!, activeTab!);
  const parts = relativePath.includes("..")
    ? activeTab?.split("/")
    : relativePath.split("/");

  return (
    <div className="w-full h-6 bg-ctp-mantle flex flex-row gap-2 px-4 items-center text-ctp-overlay2">
      {parts
        ?.filter((p) => p.trim().length > 0)
        ?.map((part, i) => (
          <React.Fragment key={i}>
            <CodePathViewItem name={part} />
            {i < parts.length - 1 && (
              <PiCaretRight className="w-4 h-4 text-ctp-overlay2" />
            )}
          </React.Fragment>
        ))}
    </div>
  );
}

function CodePathViewItem(props: ICodePathViewItemProps) {
  return <p>{props.name}</p>;
}
