import { HostBridge } from "./bridge";

export class HostEvents {
  static #eventListeners: {
    [key: string]: Array<(data: unknown) => void>;
  } = {};

  constructor() {}

  static initialize() {
    HostBridge.provideCallHandler("events", "initialize", (data) => {
      this.emit("initialize", data);
    });
  }

  static on(event: string, handler: (data: unknown) => void) {
    if (!this.#eventListeners[event]) this.#eventListeners[event] = [];

    this.#eventListeners[event].push(handler);
  }

  static emit(event: string, data: unknown) {
    if (this.#eventListeners[event])
      this.#eventListeners[event].forEach((handler) => handler(data));
  }
}
