import { RPC } from "@cadaide/rpc";
import { ApplicationConfig } from "./ApplicationConfig";
import { notify } from "@/hooks/stores/useNotificationState";

export class PluginHostSession {
  #socket: WebSocket;
  #rpc: RPC;

  #queuedMessages: Array<string> = [];

  constructor() {
    this.#socket = new WebSocket(
      `ws://localhost:${ApplicationConfig.backendPort}/plugin/ws`,
    );
    this.#rpc = new RPC(false, 60_000);

    this.#socket.addEventListener("open", () => this.#onOpen());

    this.#socket.addEventListener("message", (event) => {
      const parsed = JSON.parse(event.data);
      const parsedPacket = JSON.parse(parsed.message);

      if (parsedPacket.kind === "error")
        return notify({
          type: "error",
          title: "Plugin error", // TODO: Add plugin name. Wait, isn't that if WE screw up. Nevermind?
          message: parsedPacket.error.message,
          duration: 3000,
        });

      if (parsedPacket.kind == "response")
        this.#rpc.handleRemoteMessage(
          JSON.stringify({
            ...parsedPacket,
            result: { pluginId: parsed.pluginId, result: parsedPacket.result },
          }),
        );

      if (parsedPacket.kind == "call")
        this.#rpc.handleRemoteMessage(
          JSON.stringify({
            ...parsedPacket,
            args: [parsed.pluginId, ...parsedPacket.args],
          }),
        );
    });

    this.#rpc.setRemoteMessageHandler((msg: string) => {
      const parsed = JSON.parse(msg);

      if (parsed.kind == "error")
        return notify({
          type: "error",
          title: "Plugin error", // TODO: Add plugin name. Wait, that is if WE screw up. Nevermind?
          message: parsed.error.message,
          duration: 3000,
        });

      if (parsed.kind == "call") {
        const [pluginId, procedureName] = parsed.name.split("@");
        const packet = JSON.stringify({ ...parsed, name: procedureName });

        this.#trySend(
          JSON.stringify({
            pluginId,
            message: packet,
          }),
        );
      }

      if (parsed.kind === "response") {
        const pluginId = parsed.result.pluginId;
        const result = parsed.result.result;

        this.#trySend(
          JSON.stringify({
            pluginId,
            message: JSON.stringify({ ...parsed, result }),
          }),
        );
      }
    });
  }

  callProcedure<T>(pluginId: string, procedureName: string, ...args: any[]) {
    return this.#rpc.callProcedure(
      `${pluginId}@${procedureName}`,
      ...args,
    ) as Promise<{
      result: T;
      pluginId: string;
    }>;
  }

  registerProcedure(procedureName: string, procedure: (...args: any[]) => any) {
    this.#rpc.registerProcedure(
      procedureName,
      async (pluginId: string, ...args) => {
        const res = await procedure(pluginId, ...args);

        return {
          pluginId,
          result: res,
        };
      },
    );
  }

  #trySend(data: string) {
    if (this.#socket.readyState === WebSocket.OPEN) this.#socket.send(data);
    else this.#queuedMessages.push(data);
  }

  #onOpen() {
    this.#queuedMessages.forEach((data) => this.#trySend(data));
    this.#queuedMessages = [];
  }
}
