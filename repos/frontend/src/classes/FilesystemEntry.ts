import { FsAPI } from "@/api/fs";
import path from "path";
import { FilesystemFileEntry } from "./FilesystemFileEntry";
import { FilesystemFolderEntry } from "./FilesystemFolderEntry";

export abstract class FilesystemEntry {
  #path: string;

  constructor(path: string) {
    this.#path = path;
  }

  get name(): string {
    const normalizedPath = this.#path.replace(/\\/g, "/");

    return normalizedPath.split("/").pop()!;
  }

  get path(): string {
    return this.#path;
  }

  static async fromPath(path: string): Promise<FilesystemEntry> {
    const entry = await FsAPI.stat(path);

    if (entry.type === "file") return new FilesystemFileEntry(entry.path);
    else return new FilesystemFolderEntry(entry.path);
  }

  static async parent(path: string): Promise<FilesystemFolderEntry> {
    const parentPath = path.split("/").slice(0, -1).join("/");

    return new FilesystemFolderEntry(parentPath);
  }
}
