import type { RPC } from "@cadaide/rpc";
import type { QuickJSContext, QuickJSRuntime } from "quickjs-emscripten";

export class VMRPCJSLib {
  #executePendingPromises: (() => void) | null = null;

  create(
    runtime: QuickJSRuntime,
    context: QuickJSContext,
    rpcs: Record<string, RPC>,
    executePendingPromises: () => void,
  ) {
    this.#executePendingPromises = executePendingPromises;

    const rpcPostHandle = context.newFunction("post", (_msg) => {
      const msg = context.dump(_msg) as string;

      const payload = JSON.parse(msg) as {
        target: "frontend" | "backend";
        message: string;
      };

      const rpc = rpcs[payload.target];
      if (!rpc)
        return console.error(
          "[PLUGIN VM] Error while posting message",
          payload.target,
        );

      rpc.handleRemoteMessage(payload.message);
      executePendingPromises();
    });
    const rpcHandlersHandle = context.newArray();

    const rpcHandle = context.newObject();

    context.setProp(rpcHandle, "post", rpcPostHandle);
    context.setProp(rpcHandle, "handlers", rpcHandlersHandle);
    context.setProp(context.global, "___vm_rpc", rpcHandle);

    rpcPostHandle.dispose();
    rpcHandlersHandle.dispose();
    rpcHandle.dispose();

    for (const [name, rpc] of Object.entries(rpcs)) {
      rpc.setRemoteMessageHandler((msg) => this.#postToVM(context, name, msg));
    }
  }

  #postToVM(context: QuickJSContext, target: string, msg: string) {
    const payload = JSON.stringify(JSON.stringify({ target, message: msg }));

    const code = `
    for (const handler of globalThis.___vm_rpc.handlers) {
      handler(${payload});
    }
    `;

    const result = context.evalCode(code);

    if (result.error) {
      console.error(
        "[PLUGIN VM] Error while posting message",
        context.dump(result.error),
      );
      result.error.dispose();
    } else result.value.dispose();

    if (this.#executePendingPromises) this.#executePendingPromises();
  }

  dispose() {
    this.#executePendingPromises = null;
  }
}
