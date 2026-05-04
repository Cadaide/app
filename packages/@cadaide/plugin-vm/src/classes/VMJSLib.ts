import type { QuickJSRuntime, QuickJSContext } from "quickjs-emscripten";
import { VMConsoleJSLib } from "./jslib/VMConsoleJSLib";
import { VMTimeoutsJSLib } from "./jslib/VMTimeoutJSLib";
import { VMRPCJSLib } from "./jslib/VMRPCJSLib";
import type { RPC } from "@cadaide/rpc";

export class VMJSLib {
  #libInstances = [
    new VMTimeoutsJSLib(),
    new VMConsoleJSLib(),
    new VMRPCJSLib(),
  ];

  constructor() {}

  create(
    runtime: QuickJSRuntime,
    context: QuickJSContext,
    rpcs: Record<string, RPC>,
    executePendingPromises: () => void,
  ) {
    for (const lib of this.#libInstances)
      lib.create(runtime, context, rpcs, executePendingPromises);
  }

  dispose() {
    for (const lib of this.#libInstances) lib.dispose();
  }

  // Singleton fields & methods
  static #instance: VMJSLib;
  static get instance(): VMJSLib {
    if (!this.#instance) this.#instance = new VMJSLib();

    return this.#instance;
  }
}
