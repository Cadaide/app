import { IconifyIcon } from "@iconify/react";
import {
  CatppuccinFolderIcons,
  CatppuccinIcons,
} from "./icons/catppuccin/catppuccin.icons";
import { isMatch } from "matcher";

export type TIconpack = {
  pattern: string | string[];
  icon: IconifyIcon | string;
}[];

export const Iconpacks: Record<string, TIconpack> = {
  catppuccin: CatppuccinIcons,
  catppuccinFolders: CatppuccinFolderIcons,
};

export function getIcon(name: string, isFolder: boolean = false) {
  return (
    Iconpacks[isFolder ? "catppuccinFolders" : "catppuccin"].find((icon) =>
      isMatch(name, icon.pattern),
    )?.icon ?? (isFolder ? "catppuccin:folder" : "catppuccin:file")
  );
}
