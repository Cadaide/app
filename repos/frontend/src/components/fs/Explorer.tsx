import { API } from "@/api";
import { FsEntry } from "@/api/fs";
import { useApiFetch } from "@/hooks/useApiFetch";
import { Icon } from "@iconify/react";
import { useState } from "react";
import { PiCaretRight } from "react-icons/pi";

export function Explorer() {
  return (
    <div className="w-1/4 h-screen max-h-screen flex-grow bg-ctp-base text-ctp-text text-[15px] border-r border-ctp-surface0 py-2 overflow-y-auto">
      <ExplorerList path="/home/marti/Workspace/Programming/Cadaide/repos/backend" />
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

function getFileIcon(name: string) {
  if (name.endsWith(".ts")) return "catppuccin:typescript";
  if (name.endsWith(".tsx")) return "catppuccin:typescript-react";
  if (name.endsWith(".js") || name.endsWith(".cjs") || name.endsWith(".mjs"))
    return "catppuccin:javascript";
  if (name.endsWith(".jsx")) return "catppuccin:javascript-react";
  if (name.endsWith(".json")) return "catppuccin:json";
  if (name.endsWith(".css")) return "catppuccin:css";
  if (name.endsWith(".go")) return "catppuccin:go";
  if (name.endsWith(".md")) return "catppuccin:markdown";
  if (name.endsWith(".html")) return "catppuccin:html";
  if (name.endsWith(".txt")) return "catppuccin:text";
  if (name.endsWith(".sum") || name.endsWith(".mod") || name.endsWith(".work"))
    return "catppuccin:go-mod";
  return "catppuccin:file";
}

function getFolderIcon(name: string) {
  switch (name) {
    case "src":
      return "catppuccin:folder-src";
    case "components":
      return "catppuccin:folder-components";
    case "api":
      return "catppuccin:folder-api";
    case "assets":
      return "catppuccin:folder-assets";
    case "hooks":
      return "catppuccin:folder-hooks";
    case "public":
      return "catppuccin:folder-public";
    case "utils":
      return "catppuccin:folder-utils";
    case "types":
      return "catppuccin:folder-types";
    case "node_modules":
      return "catppuccin:folder-node";
    default:
      return "catppuccin:folder";
  }
}

function ExplorerFileEntry(props: { entry: FsEntry }) {
  return (
    <div className="flex flex-row items-center gap-1.5 px-3.5 py-1 hover:bg-ctp-surface0 cursor-pointer text-ctp-subtext1 hover:text-ctp-text transition-colors">
      <div className="w-5 h-5 flex-shrink-0" />{" "}
      <Icon
        icon={getFileIcon(props.entry.name)}
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
        className="flex flex-row items-center gap-1.5 px-3.5 py-1 hover:bg-ctp-surface0 cursor-pointer transition-colors text-ctp-text"
        onClick={() => setIsExpanded(!isExpanded)}
      >
        <PiCaretRight
          className={`w-5 h-5 flex-shrink-0 text-ctp-overlay0 transition-transform ${isExpanded ? "rotate-90" : ""}`}
        />{" "}
        <Icon
          icon={getFolderIcon(props.entry.name)}
          className="w-5 h-5 flex-shrink-0"
        />{" "}
        <span className="truncate">{props.entry.name}</span>
      </div>
      {isExpanded && (
        <div className="pl-3 w-full border-l border-ctp-surface0 ml-2.5">
          <ExplorerList path={props.entry.path} />
        </div>
      )}
    </div>
  );
}
