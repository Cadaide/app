import { API } from "@/api";
import { FsEntry } from "@/api/fs";
import { getIcon } from "@/editor/icons";
import { useProjectStore } from "@/hooks/stores/useProjectStore";
import { useApiFetch } from "@/hooks/useApiFetch";
import { pathToName } from "@/utils/files/file";
import { Icon } from "@iconify/react";
import { useState } from "react";
import { PiCaretRight } from "react-icons/pi";

export function Explorer() {
  const path = useProjectStore((state) => state.path);

  if (!path) return <div></div>;

  return (
    <div className="w-1/4 h-full grow bg-ctp-base text-ctp-text text-[15px] border-r border-ctp-surface0 pb-8 overflow-hidden">
      <div className="flex flex-row items-center gap-1.5 px-3.5 py-1 bg-ctp-mantle text-ctp-lavender font-bold pl-6">
        <p>{pathToName(path)}</p>
      </div>
      <div className="overflow-auto max-h-full h-full grow">
        <ExplorerList path={path} />
      </div>
    </div>
  );
}

interface ExplorerListProps {
  path: string;
}

function ExplorerList(props: ExplorerListProps) {
  const {
    data: entries,
    loading,
    error,
  } = useApiFetch(API.fs.listDir(props.path));

  if (loading)
    return <div className="px-3.5 py-1 text-ctp-subtext0">Loading...</div>;
  if (error)
    return (
      <div className="px-3.5 py-1 text-ctp-red">Error: {error.message}</div>
    );
  if (!entries) return null;

  return (
    <div className="w-full">
      {[
        ...entries
          .filter((e) => e.type == "directory")
          .sort((a, b) => a.name.localeCompare(b.name)),
        ...entries
          .filter((e) => e.type == "file")
          .sort((a, b) => a.name.localeCompare(b.name)),
      ].map((entry) =>
        entry.type == "file" ? (
          <ExplorerFileEntry key={entry.path} entry={entry} />
        ) : (
          <ExplorerDirectoryEntry key={entry.path} entry={entry} />
        ),
      )}
    </div>
  );
}

function ExplorerFileEntry(props: { entry: FsEntry }) {
  const setActiveFile = useProjectStore((state) => state.setActiveFile);

  return (
    <div
      onClick={() => setActiveFile(props.entry.path)}
      className="flex flex-row items-center gap-1.5 px-3.5 py-1 hover:bg-ctp-surface0 cursor-pointer text-ctp-subtext1 hover:text-ctp-text transition-colors"
    >
      <div className="w-5 h-5 flex-shrink-0" />{" "}
      <Icon
        icon={getIcon(props.entry.name)}
        className="w-5 h-5 flex-shrink-0"
      />{" "}
      <span className="truncate">{props.entry.name}</span>
    </div>
  );
}

function ExplorerDirectoryEntry(props: { entry: FsEntry }) {
  const [isExpanded, setIsExpanded] = useState(false);

  return (
    <div className="w-full flex flex-col">
      <div
        className="flex flex-row items-center gap-1.5 px-1.5 py-1 hover:bg-ctp-surface0 cursor-pointer transition-colors text-ctp-text"
        onClick={() => setIsExpanded(!isExpanded)}
      >
        <PiCaretRight
          className={`w-5 h-5 flex-shrink-0 text-ctp-overlay0 transition-transform ${isExpanded ? "rotate-90" : ""}`}
        />{" "}
        <Icon
          icon={getIcon(props.entry.name, true)}
          className="w-5 h-5 flex-shrink-0"
        />{" "}
        <span className="truncate">{props.entry.name}</span>
      </div>
      {isExpanded && (
        <div className="w-full border-l border-ctp-surface0 ml-3.5">
          <ExplorerList path={props.entry.path} />
        </div>
      )}
    </div>
  );
}
