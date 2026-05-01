import { IPluginRepoIndexEntry } from "@/api/plugin";
import { ApplicationConfig } from "./ApplicationConfig";

export class WindowSocket {
  #socket: WebSocket;

  #listeners: {
    [key: string]: Array<{
      cb: (source: IPluginRepoIndexEntry, ...args: any[]) => void;
      pluginId?: string;
      once: boolean;
    }>;
  } = {};

  constructor() {
    this.#socket = new WebSocket(
      `ws://localhost:${ApplicationConfig.backendPort}/window/ws`,
    );

    this.#socket.addEventListener("message", (e) => {
      const message = JSON.parse(e.data);

      if (this.#listeners[message.type]) {
        this.#listeners[message.type].forEach((listener) => {
          if (listener.pluginId && message.source?.id !== listener.pluginId)
            return;

          listener.cb(message.source, ...message.args);

          if (listener.once) {
            this.#listeners[message.type].splice(
              this.#listeners[message.type].indexOf(listener),
              1,
            );
          }
        });
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

    this.#listeners[eventName].push({
      cb: callback,
      once: false,
    });
  }

  once<T>(
    eventName: string,
    callback: (source: IPluginRepoIndexEntry, args: T) => void,
    pluginId?: string,
  ) {
    if (!this.#listeners[eventName]) {
      this.#listeners[eventName] = [];
    }

    this.#listeners[eventName].push({
      cb: callback,
      pluginId,
      once: true,
    });
  }

  emit(eventName: string, args: unknown[], pluginId?: string) {
    this.#socket.send(JSON.stringify({ type: eventName, args, pluginId }));
  }
}
