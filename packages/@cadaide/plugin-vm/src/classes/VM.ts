import type { QuickJSContext, QuickJSRuntime } from "quickjs-emscripten";
import { QuickJSInstance } from "./QuickJSInstance";
import { MBToBytes } from "../utils/byte";
import type { RPC } from "@cadaide/rpc";
import esbuild from "esbuild";
import path from "path";
import { VMJSLib } from "./VMJSLib";

export interface IVMOptions {
  codeRootPath: string;
  entrypoint: string;
  limits: {
    memoryMB: number;
  };
}

export class VM {
  #rpcs: Record<string, RPC>;
  #options: IVMOptions;

  #qjsRuntime: QuickJSRuntime | null = null;
  #qjsContext: QuickJSContext | null = null;

  constructor(rpcs: Record<string, RPC>, options: IVMOptions) {
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
    } catch (_) {}
  }

  async #createRuntime(): Promise<QuickJSRuntime> {
    const qjs = await QuickJSInstance.get();

    const runtime = qjs.newRuntime();
    runtime.setMemoryLimit(MBToBytes(this.#options.limits.memoryMB));

    return runtime;
  }

  async #createContext(): Promise<QuickJSContext> {
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
      this.#executePendingPromises.bind(this),
    );
  }

  #compile(rootPath: string, entrypoint: string) {
    const bundled = esbuild.buildSync({
      entryPoints: [path.join(rootPath, entrypoint)],
      absWorkingDir: rootPath,
      bundle: true,
      write: false,
      format: "esm",
      target: "es2022",
      platform: "neutral",
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
    const result = this.#qjsContext!.evalCode(
      this.#compile(this.#options.codeRootPath, this.#options.entrypoint),
    );

    if (result?.error) {
      const err = this.#qjsContext!.dump(result.error);
      result.dispose();

      throw err;
    } else result.dispose();

    await this.#executePendingPromises();
  }
}
