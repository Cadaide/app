import { randomUUID } from "crypto";
import { ApplicationConfig } from "./ApplicationConfig";

export class PluginHost {
  #socket: WebSocket;

  #queuedMessages: Array<string> = [];

  constructor() {
    this.#socket = new WebSocket(
      `ws://localhost:${ApplicationConfig.backendPort}/plugin/ws`,
    );

    this.#socket.addEventListener("open", () => {
      this.#queuedMessages.forEach((data) => this.#socket.send(data));
      this.#queuedMessages = [];
    });
  }

  #send(data: string) {
    if (this.#isConnected()) {
      this.#socket.send(data);
    } else this.#queuedMessages.push(data);
  }

  #isConnected(): boolean {
    return this.#socket.readyState === WebSocket.OPEN;
  }

  #emit(event: string, data: unknown) {
    this.#send(
      JSON.stringify({
        event: event,
        data: data,
      }),
    );
  }

  call(pluginId: string, namespace: string, command: string, data: unknown) {
    this.#emit("call", {
      pluginId: pluginId,
      namespace: namespace,
      command: command,
      data: data,
    });
  }

  awaitCall(
    pluginId: string,
    namespace: string,
    command: string,
    data: unknown,
  ) {
    const id = (Math.random() * performance.now()).toString(16).split(".")[1];

    return new Promise((resolve) => {
      this.#emit("call", {
        pluginId: pluginId,
        namespace: namespace,
        command: command,
        data: data,
        responseId: id,
      });

      const onMessage = (event: MessageEvent) => {
        const data = JSON.parse(event.data as string);

        if (data.event != "call_response" || data.data.data?.responseId != id)
          return;

        resolve(data.data.data.data);
        this.#socket.removeEventListener("message", onMessage);
      };

      this.#socket.addEventListener("message", onMessage);
    });
  }

  provideCallHandler(
    namespace: string,
    command: string,
    handler: (source: string, data: unknown) => unknown,
  ) {
    this.#socket.addEventListener("message", async (event) => {
      const data = JSON.parse(event.data as string);

      if (
        data.event !== "call" ||
        data.data.namespace !== namespace ||
        data.data.command !== command
      ) {
        return;
      }

      const result = await handler(data.data.pluginId, data.data.data);

      if (data.data.responseId) {
        this.#emit("call_response", {
          pluginId: data.data.pluginId,
          namespace,
          command,
          responseId: data.data.responseId,
          data: result,
        });
      }
    });
  }
}
