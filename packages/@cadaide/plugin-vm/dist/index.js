// src/classes/QuickJSInstance.ts
import { getQuickJS } from "quickjs-emscripten";
var QuickJSInstance = class {
  static #instance = null;
  static async get() {
    if (!this.#instance) this.#instance = await getQuickJS();
    return this.#instance;
  }
};

// src/utils/byte.ts
function MBToBytes(mb) {
  return mb * 1024 * 1024;
}

// src/classes/VM.ts
import esbuild from "esbuild";
import path from "path";

// src/classes/jslib/VMConsoleJSLib.ts
var VMConsoleJSLib = class {
  create(runtime, context) {
    const consoleLogHandle = context.newFunction("log", (..._args) => {
      const args = _args.map(context.dump);
      console.log("VM:", ...args);
    });
    const consoleHandle = context.newObject();
    context.setProp(consoleHandle, "log", consoleLogHandle);
    context.setProp(context.global, "console", consoleHandle);
    consoleHandle.dispose();
    consoleLogHandle.dispose();
  }
  dispose() {
  }
};

// src/classes/jslib/VMTimeoutJSLib.ts
var VMTimeoutsJSLib = class {
  #timeouts = /* @__PURE__ */ new Map();
  create(runtime, context) {
    const hostSetTimeoutHandle = context.newFunction(
      "setTimeout",
      (_id, _delay) => {
        const id = context.dump(_id);
        const delay = context.dump(_delay);
        const timeout = setTimeout(() => {
          this.#timeouts.delete(id);
          if (!context || !context.alive) return;
          const vmTimeouts = context.getProp(context.global, "___vm_timeouts");
          const fireHandle = context.getProp(vmTimeouts, "fireTimeout");
          const idArg = context.newNumber(id);
          const result2 = context.callFunction(
            fireHandle,
            context.undefined,
            idArg
          );
          if (result2.error) {
            console.error(
              "[PLUGIN VM] Error while firing timeout:",
              context.dump(result2.error)
            );
            result2.error.dispose();
          } else result2.value.dispose();
          idArg.dispose();
          fireHandle.dispose();
          vmTimeouts.dispose();
        }, delay);
        this.#timeouts.set(id, timeout);
        _id.dispose();
        _delay.dispose();
      }
    );
    const hostClearTimeoutHandle = context.newFunction(
      "clearTimeout",
      (_id) => {
        const id = context.dump(_id);
        const timeout = this.#timeouts.get(id);
        if (timeout) {
          clearTimeout(timeout);
          this.#timeouts.delete(id);
        }
        _id.dispose();
      }
    );
    const vmTimeoutsHandle = context.newObject();
    context.setProp(vmTimeoutsHandle, "setTimeout", hostSetTimeoutHandle);
    context.setProp(vmTimeoutsHandle, "clearTimeout", hostClearTimeoutHandle);
    context.setProp(context.global, "___vm_timeouts", vmTimeoutsHandle);
    hostSetTimeoutHandle.dispose();
    hostClearTimeoutHandle.dispose();
    vmTimeoutsHandle.dispose();
    const result = context.evalCode(`
      const ___vm_timers = new Map();
      let ___vm_timerId = 0;

      globalThis.setTimeout = (callback, delay, ...args) => {
        const id = ++___vm_timerId;
        ___vm_timers.set(id, { callback, args });
        
        globalThis.___vm_timeouts.setTimeout(id, delay || 0);

        return id;
      }

      globalThis.clearTimeout = (id) => {
        ___vm_timers.delete(id);
        globalThis.___vm_timeouts.clearTimeout(id);
      };

      globalThis.___vm_timeouts.fireTimeout = (id) => {
        const timer = ___vm_timers.get(id);
        if (timer) {
          ___vm_timers.delete(id);
          timer.callback(...timer.args);
        }
      }
      `);
    if (result.error) {
      console.error(
        "[PLUGIN VM] Error initializing setTimeout",
        context.dump(result.error)
      );
      result.error.dispose();
    } else result.value.dispose();
  }
  dispose() {
    for (const timeout of this.#timeouts.values()) clearTimeout(timeout);
    this.#timeouts.clear();
  }
};

// src/classes/jslib/VMRPCJSLib.ts
var VMRPCJSLib = class {
  #executePendingPromises = null;
  create(runtime, context, rpcs, executePendingPromises) {
    this.#executePendingPromises = executePendingPromises;
    const rpcPostHandle = context.newFunction("post", (_msg) => {
      const msg = context.dump(_msg);
      const payload = JSON.parse(msg);
      const rpc = rpcs[payload.target];
      if (!rpc)
        return console.error(
          "[PLUGIN VM] Error while posting message",
          payload.target
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
  #postToVM(context, target, msg) {
    const code = `
    const payload = ${JSON.stringify(JSON.stringify({ target, message: msg }))};
    for (const handler of globalThis.___vm_rpc.handlers) {
      handler(payload);
    }
    `;
    const result = context.evalCode(code);
    if (result.error) {
      console.error(
        "[PLUGIN VM] Error while posting message",
        context.dump(result.error)
      );
      result.error.dispose();
    } else result.value.dispose();
    if (this.#executePendingPromises) this.#executePendingPromises();
  }
  dispose() {
    this.#executePendingPromises = null;
  }
};

// src/classes/VMJSLib.ts
var VMJSLib = class _VMJSLib {
  #libInstances = [
    new VMTimeoutsJSLib(),
    new VMConsoleJSLib(),
    new VMRPCJSLib()
  ];
  constructor() {
  }
  create(runtime, context, rpcs, executePendingPromises) {
    for (const lib of this.#libInstances)
      lib.create(runtime, context, rpcs, executePendingPromises);
  }
  dispose() {
    for (const lib of this.#libInstances) lib.dispose();
  }
  // Singleton fields & methods
  static #instance;
  static get instance() {
    if (!this.#instance) this.#instance = new _VMJSLib();
    return this.#instance;
  }
};

// src/classes/VM.ts
var VM = class {
  #rpcs;
  #options;
  #qjsRuntime = null;
  #qjsContext = null;
  constructor(rpcs, options) {
    this.#rpcs = rpcs;
    this.#options = options;
  }
  async initialize() {
    this.#qjsRuntime = await this.#createRuntime();
    this.#qjsContext = await this.#createContext();
    await this.#createInternalFunctions();
  }
  async dispose() {
    try {
      VMJSLib.instance.dispose();
      if (this.#qjsRuntime && this.#qjsRuntime.alive)
        this.#qjsRuntime.dispose();
      if (this.#qjsContext && this.#qjsContext.alive)
        this.#qjsContext.dispose();
      this.#qjsRuntime = null;
      this.#qjsContext = null;
    } catch (_) {
    }
  }
  async #createRuntime() {
    const qjs = await QuickJSInstance.get();
    const runtime = qjs.newRuntime();
    runtime.setMemoryLimit(MBToBytes(this.#options.limits.memoryMB));
    return runtime;
  }
  async #createContext() {
    if (!this.#qjsRuntime) throw new Error("Runtime not initialized");
    return this.#qjsRuntime.newContext();
  }
  async #createInternalFunctions() {
    if (!this.#qjsContext || !this.#qjsRuntime)
      throw new Error("Context or runtime not initialized");
    VMJSLib.instance.create(
      this.#qjsRuntime,
      this.#qjsContext,
      this.#rpcs,
      this.#executePendingPromises.bind(this)
    );
  }
  #compile(rootPath, entrypoint) {
    const bundled = esbuild.buildSync({
      entryPoints: [path.join(rootPath, entrypoint)],
      absWorkingDir: rootPath,
      bundle: true,
      write: false,
      format: "esm",
      target: "es2022",
      platform: "neutral"
    });
    return bundled.outputFiles[0]?.text ?? "";
  }
  #executePendingPromises() {
    if (!this.#qjsContext || !this.#qjsRuntime) return;
    while (this.#qjsRuntime.hasPendingJob()) {
      const result = this.#qjsRuntime.executePendingJobs();
      if (result.error) {
        const error = this.#qjsContext.dump(result.error);
        result.dispose();
        console.error(`[PLUGIN VM] Pending promise error:`, error);
      } else result.dispose();
    }
  }
  // -------------------------- TEMPORARY ----------------------------
  async run() {
    const result = this.#qjsContext.evalCode(
      this.#compile(this.#options.codeRootPath, this.#options.entrypoint)
    );
    if (result?.error) {
      const err = this.#qjsContext.dump(result.error);
      result.dispose();
      throw err;
    } else result.dispose();
    await this.#executePendingPromises();
  }
};
export {
  VM
};
