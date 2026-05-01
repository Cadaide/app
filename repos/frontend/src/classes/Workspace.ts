import path from "path";
import { Filesystem } from "./Filesystem";
import { basename } from "@/utils/files/path";
import { API } from "@/api";
import { Window } from "./Window";
import { IPluginIndex, IPluginRepoIndexEntry } from "@/api/plugin";

export class Workspace {
  #path: string;

  #filesystem: Filesystem;
  #window: Window;

  constructor(path: string) {
    this.#path = path;

    this.#filesystem = new Filesystem(path);
    this.#window = new Window();
  }

  get name(): string {
    return basename(this.#path);
  }

  get path(): string {
    return this.#path;
  }

  get filesystem(): Filesystem {
    return this.#filesystem;
  }

  async getLanguage(): Promise<string> {
    const data = await API.project.detectLanguage(this.#path);

    return data.language;
  }

  public plugins = {
    awaitCall: async <T>(
      name: string,
      args: unknown[] = [],
      pluginId?: string,
    ): Promise<T> => {
      return new Promise<T>((resolve, reject) => {
        const timeout = setTimeout(
          () => reject(new Error("Request timed out")),
          10000,
        );

        this.#window.once(name, (_source: IPluginRepoIndexEntry, res: T) => {
          clearTimeout(timeout);
          resolve(res);
        }, pluginId);

        this.#window.emit(name, args, pluginId);
      });
    },
  };
}
