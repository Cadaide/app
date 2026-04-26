import { WindowSocket } from "./WindowSocket";

export class Window {
  #socket: WindowSocket;

  constructor() {
    this.#socket = new WindowSocket();

    this.#socket.on("api:notify", this.#apiNotify);
  }

  #apiNotify(message: string) {
    alert(message);
  }
}
