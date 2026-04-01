import { getIcon } from "@/editor/icons";
import { useProjectStore } from "@/hooks/stores/useProjectStore";
import { Icon } from "@iconify/react";
import { useEffect, useRef } from "react";
import { PiX } from "react-icons/pi";

interface ITabsProps {
  files: {
    name: string;
    path: string;
  }[];
}

export function Tabs({ files }: ITabsProps) {
  return (
    <div className="w-full h-10 flex flex-row overflow-x-auto no-scrollbar">
      {files.map((f) => (
        <Tab file={f} key={f.path} />
      ))}
    </div>
  );
}

function Tab({ file }: { file: ITabsProps["files"][0] }) {
  const activeFile = useProjectStore((state) => state.activeFile);
  const setActiveFile = useProjectStore((state) => state.setActiveFile);
  const closeTab = useProjectStore((state) => state.closeTab);
  const unsavedFiles = useProjectStore((state) => state.unsavedFiles);

  const isUnsaved = unsavedFiles.has(file.path);

  const tabRef = useRef<HTMLDivElement>(null);

  useEffect(() => {
    // Scroll to active tab
    if (activeFile === file.path) {
      tabRef.current?.scrollIntoView({ block: "nearest" });
    }
  }, [activeFile, file.path]);

  return (
    <div
      ref={tabRef}
      className={`group min-w-48 w-fit flex-shrink-0 whitespace-nowrap flex flex-row items-center gap-1.5 px-3.5 text-[15px] border-b border-ctp-surface0 ${activeFile === file.path ? "bg-ctp-base text-ctp-text border-t-ctp-lavender border-t-2" : "bg-ctp-mantle text-ctp-subtext1  hover:bg-ctp-surface0"} cursor-pointer transition-colors duration-200`}
      onClick={() => setActiveFile(file.path)}
    >
      <Icon icon={getIcon(file.name)} className="w-5 h-5 flex-shrink-0" />
      {file.name}
      <div
        className="w-4 h-4 flex-shrink-0 ml-auto flex items-center justify-center"
        onClick={(e) => {
          e.stopPropagation();
          closeTab(file.path);
        }}
      >
        {isUnsaved ? (
          <>
            <div className="w-2.5 h-2.5 rounded-full bg-ctp-text group-hover:hidden" />
            <PiX className="w-4 h-4 text-ctp-overlay0 hover:text-ctp-red transition-colors duration-200 hidden group-hover:block" />
          </>
        ) : (
          <PiX className="w-4 h-4 text-ctp-overlay0 hover:text-ctp-red transition-all duration-200 opacity-0 group-hover:opacity-100" />
        )}
      </div>
    </div>
  );
}
