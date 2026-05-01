import { randomUUID } from 'crypto';
import path from 'path';
import { getQuickJS, QuickJSContext, QuickJSRuntime } from 'quickjs-emscripten';
import { CFG_PATH_PLUGINS_DIR } from 'src/config/paths';

export class PluginVM {
  #pluginId: string;
  #pluginRootPath: string;

  #runtime: QuickJSRuntime | null = null;
  #context: QuickJSContext | null = null;

  #hostToVMOnMessageCallbacks: Array<(msg: string) => void> = [];
  #vmToHostOnMessageCallbacks: Array<(msg: string) => void> = [];

  static MEMORY_LIMIT_MB = 16;

  constructor(pluginId: string) {
    this.#pluginId = pluginId;
    this.#pluginRootPath = path.join(CFG_PATH_PLUGINS_DIR, this.#pluginId);
  }

  async initialize() {
    const quickjs = await getQuickJS();

    this.#runtime = quickjs.newRuntime();
    this.#runtime.setMemoryLimit(PluginVM.MEMORY_LIMIT_MB * 1024 * 1024);

    this.#context = this.#runtime.newContext();

    // VM --> HOST
    const serverBridgePostHandle = this.#context.newFunction(
      '___cadaide_server_bridge_post',
      (_json) => {
        if (!this.#context) return;

        const json = this.#context.dump(_json);

        this.#postToHost(json);
      },
    );

    const serverBridgeOnMessageCallbacksHandle = this.#context.newArray();

    const debugLogHandle = this.#context.newFunction(
      '___cadaide_debug_log',
      (_json) => {
        if (!this.#context) return;

        const json = this.#context.dump(_json);

        console.log(`[PLUGIN] ${this.#pluginId}: ${json}`);
      },
    );

    // HOST --> VM
    /*const serverBridgeOnMessageHandle = this.#context.newFunction(
      '___cadaide_server_bridge_onMessage',
      (_callback) => {
        const callback = this.#context.dump(_callback);

        this.#hostToVMOnMessageCallbacks.push(
          callback as (msg: string) => void,
        );
      },
    );*/

    this.#context.setProp(
      this.#context.global,
      '___cadaide_server_bridge_post',
      serverBridgePostHandle,
    );
    this.#context.setProp(
      this.#context.global,
      '___cadaide_server_bridge_onMessageCallbacks',
      serverBridgeOnMessageCallbacksHandle,
    );
    this.#context.setProp(
      this.#context.global,
      '___cadaide_debug_log',
      debugLogHandle,
    );
    /*this.#context.setProp(
      this.#context.global,
      '___cadaide_server_bridge_onMessage',
      serverBridgeOnMessageHandle,
    );*/

    serverBridgePostHandle.dispose();
    //serverBridgeOnMessageHandle.dispose();
  }

  dispose() {
    if (!this.#context || !this.#runtime) return;

    try {
      if (this.#context.alive) this.#context.dispose();
      if (this.#runtime.alive) this.#runtime.dispose();
    } catch (error) {}

    this.#context = null;
    this.#runtime = null;
  }

  load(code: string) {
    if (!this.#context) return;

    const result = this.#context.evalCode(code);

    if (result.error) {
      const error = this.#context.dump(result.error);

      result.dispose();

      throw error;
    } else result.dispose();

    this.#executePendingJobs();
  }

  #postToVM(msg: string) {
    if (!this.#context) return;

    const result = this.#context.evalCode(
      `for (const _callback of globalThis.___cadaide_server_bridge_onMessageCallbacks) {
        try {
          _callback(${JSON.stringify(msg)})
        } catch(e) {
          globalThis.___cadaide_debug_log("Error while calling onMessage callback");
        }
      }`,
    );

    if (result.error) {
      const error = this.#context.dump(result.error);
      result.dispose();

      console.error(`[PLUGIN VM] postToVM error:`, error);
    } else {
      result.dispose();
    }

    this.#executePendingJobs();
  }

  #executePendingJobs() {
    if (!this.#runtime || !this.#context) return;

    while (this.#runtime.hasPendingJob()) {
      const result = this.#runtime.executePendingJobs();

      if (result.error) {
        const error = this.#context.dump(result.error);
        result.dispose();

        console.error(`[PLUGIN VM] Pending job error:`, error);
      } else result.dispose();
    }
  }

  #postToHost(msg: string) {
    for (const callback of this.#vmToHostOnMessageCallbacks) {
      callback(msg);
    }
  }

  onceVMToHost(callback: (data: unknown) => void, wantedResponseId?: string) {
    const listener = (msg: string) => {
      const parsed = JSON.parse(msg);

      if (
        wantedResponseId &&
        (!parsed.responseId || parsed.responseId !== wantedResponseId)
      )
        return;

      callback(parsed.data);

      // Remove callback after execution
      removeListener();
    };

    const removeListener = () => {
      this.#vmToHostOnMessageCallbacks.splice(
        this.#vmToHostOnMessageCallbacks.indexOf(listener),
        1,
      );
    };

    this.#vmToHostOnMessageCallbacks.push(listener);

    return () => removeListener();
  }

  onVMToHost(callback: (data: unknown) => void, wantedResponseId?: string) {
    const listener = (msg: string) => {
      const parsed = JSON.parse(msg);

      if (
        wantedResponseId &&
        (!parsed.responseId || parsed.responseId !== wantedResponseId)
      )
        return;

      callback({
        type: parsed.type,
        namespace: parsed.namespace,
        command: parsed.command,
        data: parsed.data,
        responseId: parsed.responseId,
      });
    };

    const removeListener = () => {
      this.#vmToHostOnMessageCallbacks.splice(
        this.#vmToHostOnMessageCallbacks.indexOf(listener),
        1,
      );
    };

    this.#vmToHostOnMessageCallbacks.push(listener);

    return () => {
      removeListener();
    };
  }

  emitCallResponse(
    namespace: string,
    command: string,
    data: any,
    responseId: string,
  ) {
    const payload = JSON.stringify({
      type: 'call_response',
      data: {
        namespace,
        command,
        data,
        responseId,
      },
    });

    this.#postToVM(payload);
  }

  call(namespace: string, command: string, data: unknown, responseId?: string) {
    const payload = JSON.stringify({
      type: 'call',
      data: {
        namespace,
        command,
        data,
        responseId,
      },
    });

    this.#postToVM(payload);
  }

  callWithResult(
    namespace: string,
    command: string,
    data: unknown,
    callback: (result: unknown) => void,
  ) {
    const id = randomUUID();

    const payload = JSON.stringify({
      type: 'call',
      data: {
        namespace,
        command,
        data,
        responseId: id,
      },
    });

    const off = this.onceVMToHost(callback, id);
    this.#postToVM(payload);

    return off;
  }
}
