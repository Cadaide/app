import { ApplicationConfig } from "./ApplicationConfig";

export class ShellPtySession {
  #socket: WebSocket;

  #titleChangeCallbacks: ((title: string) => void)[] = [];
  #dataCallbacks: ((data: string) => void)[] = [];

  constructor() {
    this.#socket = new WebSocket(
      `ws://localhost:${ApplicationConfig.backendPort}/shell/ws`,
    );

    this.#socket.addEventListener("message", (ev) => {
      const parsed = JSON.parse(ev.data) as { type: string; data: unknown };

      if (parsed.type == "title")
        this.#titleChangeCallbacks.forEach((cb) => cb(parsed.data as string));
      if (parsed.type == "data")
        this.#dataCallbacks.forEach((cb) => cb(parsed.data as string));
    });

    this.#socket.addEventListener("close", () => this.destroy());
  }

  get socket(): WebSocket {
    return this.#socket;
  }

  onTitleChange(callback: (title: string) => void) {
    this.#titleChangeCallbacks.push(callback);
  }

  onData(callback: (data: string) => void) {
    this.#dataCallbacks.push(callback);
  }

  write(data: string) {
    this.#socket.send(JSON.stringify({ type: "data", data }));
  }

  resize(columns: number, rows: number) {
    this.#socket.send(
      JSON.stringify({ type: "resize", data: { columns, rows } }),
    );
  }

  destroy() {
    this.#socket.close();
  }
}
