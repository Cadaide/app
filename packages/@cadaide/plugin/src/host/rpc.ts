import { RPC } from "@cadaide/rpc";

declare const ___vm_rpc: {
  post: (message: string) => void;
  handlers: ((data: string) => void)[];
};

export class HostRPC {
  #frontendRpc: RPC;
  #backendRpc: RPC;

  get frontend() {
    return this.#frontendRpc;
  }
  get backend() {
    return this.#backendRpc;
  }

  private constructor() {
    this.#frontendRpc = new RPC(false, 60_000);
    this.#backendRpc = new RPC(false, 60_000);

    this.#frontendRpc.setRemoteMessageHandler((msg) =>
      this.#postMessage("frontend", msg),
    );
    this.#backendRpc.setRemoteMessageHandler((msg) =>
      this.#postMessage("backend", msg),
    );

    ___vm_rpc.handlers.push((data: string) => this.#handleMessage(data));
  }

  #postMessage(target: "frontend" | "backend", message: string) {
    ___vm_rpc.post(
      JSON.stringify({
        target,
        message,
      }),
    );
  }

  #handleMessage(data: string) {
    const payload = JSON.parse(data);

    if (payload.target === "frontend")
      this.#frontendRpc.handleRemoteMessage(payload.message);
    if (payload.target === "backend")
      this.#backendRpc.handleRemoteMessage(payload.message);
  }

  static #instance: HostRPC;
  static get instance() {
    if (!this.#instance) this.#instance = new HostRPC();
    return this.#instance;
  }
}
