import { notify } from "@/hooks/stores/useNotificationState";
import { WindowSocket } from "./WindowSocket";

export class Window {
  #socket: WindowSocket;

  constructor() {
    this.#socket = new WindowSocket();

    this.#socket.on("api:notify", this.#apiNotify);
  }

  #apiNotify(message: string) {
    notify({
      type: "info",
      title: "Plugin",
      message: message,
      duration: 2000,
    });
  }
}
