import { Filesystem } from "./Filesystem";
import { basename } from "@/utils/files/path";
import { API } from "@/api";
import { Window } from "./Window";
import { PluginHost } from "./PluginHost";

export class Workspace {
  #path: string;

  #filesystem: Filesystem;
  #window: Window;
  #pluginHost: PluginHost;

  #isInitialized: boolean = false;

  get pluginHost() {
    return this.#pluginHost;
  }

  constructor(path: string) {
    this.#path = path;

    this.#filesystem = new Filesystem(path);
    this.#pluginHost = new PluginHost();
    this.#window = new Window(this);
  }

  async init() {
    if (this.#isInitialized) return;
    this.#isInitialized = true;

    this.#window.init();

    this.#pluginHost.call("@all", "events", "initialize", {});
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
}
