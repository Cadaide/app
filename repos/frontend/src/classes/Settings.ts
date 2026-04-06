import { API } from "@/api";

export class Settings {
  static #instance: Settings;

  static get instance() {
    if (!Settings.#instance) Settings.#instance = new Settings();

    return Settings.#instance;
  }

  #settings: Record<string, any> = {};

  constructor() {}

  async load() {
    const settings = await API.config.getSettings();

    this.#settings = settings;
  }

  get<T>(key: string): T | undefined {
    const keys = key.split(".");
    let value: any = this.#settings;

    for (const key of keys) {
      value = value?.[key];
    }

    return value;
  }
}
