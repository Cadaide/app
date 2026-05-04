import { getQuickJS, QuickJSWASMModule } from "quickjs-emscripten";

export class QuickJSInstance {
  static #instance: QuickJSWASMModule | null = null;

  static async get(): Promise<QuickJSWASMModule> {
    if (!this.#instance) this.#instance = await getQuickJS();

    return this.#instance;
  }
}