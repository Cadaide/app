import { ReactNode } from "react";
import { IconType } from "react-icons";
import {
  PiBooks,
  PiBug,
  PiFlask,
  PiFolder,
  PiGitBranch,
  PiMagnifyingGlass,
} from "react-icons/pi";
import { ExplorerView } from "../ExplorerView";
import { PackageManagerView } from "../PackageManagerView";

interface ISidebarTabConfigItem {
  id: string;
  icon: IconType;
  title: string;
  view: ReactNode;
}

export const SidebarTabsConfig: ISidebarTabConfigItem[] = [
  {
    id: "explorer",
    icon: PiFolder,
    title: "Explorer",
    view: <ExplorerView />,
  },
  {
    id: "search",
    icon: PiMagnifyingGlass,
    title: "Search",
    view: <p>TODO</p>,
  },
  {
    id: "git",
    icon: PiGitBranch,
    title: "Git",
    view: <p>TODO</p>,
  },
  {
    id: "packages",
    icon: PiBooks,
    title: "Packages",
    view: <PackageManagerView />,
  },
  {
    id: "debug",
    icon: PiBug,
    title: "Debug",
    view: <p>TODO</p>,
  },
  {
    id: "tests",
    icon: PiFlask,
    title: "Tests",
    view: <p>TODO</p>,
  },
];
