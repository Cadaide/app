import { getIcon } from "@/editor/icons";
import { useProjectStore } from "@/hooks/stores/useProjectStore";
import { Icon } from "@iconify/react";
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

  return (
    <div
      className={`min-w-48 w-fit flex-shrink-0 whitespace-nowrap flex flex-row items-center gap-1.5 px-3.5 text-[15px] border-b border-ctp-surface0 ${activeFile === file.path ? "bg-ctp-base text-ctp-text border-t-ctp-lavender border-t-1" : "bg-ctp-mantle text-ctp-subtext1  hover:bg-ctp-surface0"} cursor-pointer transition-colors duration-200`}
      onClick={() => setActiveFile(file.path)}
    >
      <Icon icon={getIcon(file.name)} className="w-5 h-5 flex-shrink-0" />
      {file.name}
      <PiX className="w-4 h-4 flex-shrink-0 ml-auto text-ctp-overlay0 hover:text-ctp-red transition-colors duration-200 cursor-pointer" />
    </div>
  );
}
