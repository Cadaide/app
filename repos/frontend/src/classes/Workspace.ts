import { Filesystem } from "./Filesystem";
import { basename } from "@/utils/files/path";
import { API } from "@/api";
import { Window } from "./Window";
import { PluginHostSession } from "./PluginHostSession";

export class Workspace {
  #path: string;

  #filesystem: Filesystem;
  #window: Window;
  #pluginHostSession: PluginHostSession;

  #isInitialized: boolean = false;

  static #instance: Workspace;

  get pluginHostSession(): PluginHostSession {
    return this.#pluginHostSession;
  }

  constructor(path: string) {
    this.#path = path;

    this.#filesystem = new Filesystem(path);
    this.#pluginHostSession = new PluginHostSession();
    this.#window = new Window(this);

    Workspace.#instance = this;

    this.#pluginHostSession.registerProcedure("workspace.cwd", async () => {
      return this.#path;
    });
  }

  static get instance() {
    return this.#instance;
  }

  async init() {
    if (this.#isInitialized) return;
    this.#isInitialized = true;

    this.#window.init();

    // Notify plugins about the initialization
    await this.#pluginHostSession.initialize();
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
