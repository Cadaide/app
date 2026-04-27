import { notify } from "@/hooks/stores/useNotificationState";
import { WindowSocket } from "./WindowSocket";
import { IPluginRepoIndexEntry } from "@/api/plugin";

export class Window {
  #socket: WindowSocket;

  constructor() {
    this.#socket = new WindowSocket();

    this.#socket.on("api:notify", this.#apiNotify);
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
