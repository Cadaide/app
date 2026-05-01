import { notify } from "@/hooks/stores/useNotificationState";
import { WindowSocket } from "./WindowSocket";
import { IPluginRepoIndexEntry } from "@/api/plugin";

export class Window {
  #socket: WindowSocket;

  constructor() {
    this.#socket = new WindowSocket();

    this.#socket.on("api:notify", this.#apiNotify);
  }

  once<T>(
    event: string,
    callback: (source: IPluginRepoIndexEntry, args: T) => void,
    pluginId?: string,
  ) {
    this.#socket.once(event, callback, pluginId);
  }

  emit(event: string, args: unknown[], pluginId?: string) {
    this.#socket.emit(event, args, pluginId);
  }

  #apiNotify(
    source: IPluginRepoIndexEntry,
    type: "info" | "warning" | "error" | "success",
    message: string,
  ) {
    notify({
      type: type,
      title: source.name,
      message: message,
      duration: 2000,
    });
  }
}
