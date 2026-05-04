import type { QuickJSContext, QuickJSRuntime } from "quickjs-emscripten";

export class VMConsoleJSLib {
  create(runtime: QuickJSRuntime, context: QuickJSContext) {
    const consoleLogHandle = context.newFunction("log", (..._args) => {
      const args = _args.map(context.dump);
      console.log("VM:", ...args); // TODO: Switch for RPC
    });

    const consoleHandle = context.newObject();

    context.setProp(consoleHandle, "log", consoleLogHandle);
    context.setProp(context.global, "console", consoleHandle);

    consoleHandle.dispose();
    consoleLogHandle.dispose();
  }

  dispose() {}
}
