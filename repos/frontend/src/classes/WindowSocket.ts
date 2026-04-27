import { IPluginRepoIndexEntry } from "@/api/plugin";

export class WindowSocket {
  #socket: WebSocket;

  #listeners: {
    [key: string]: Array<
      (source: IPluginRepoIndexEntry, ...args: any[]) => void
    >;
  } = {};

  constructor() {
    this.#socket = new WebSocket("ws://localhost:3001/window/ws");

    this.#socket.addEventListener("message", (e) => {
      const message = JSON.parse(e.data);

      if (this.#listeners[message.type]) {
        this.#listeners[message.type].forEach((listener) =>
          listener(message.source, ...message.args),
        );
      }
    });
  }

  on(
    eventName: string,
    callback: (source: IPluginRepoIndexEntry, ...args: any[]) => void,
  ) {
    if (!this.#listeners[eventName]) {
      this.#listeners[eventName] = [];
    }

    this.#listeners[eventName].push(callback);
  }
}
