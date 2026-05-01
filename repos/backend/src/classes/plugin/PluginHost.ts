import { PluginCompiler } from './PluginCompiler';
import { IPluginParseData, PluginParser } from './PluginParser';
import { PluginVM } from './PluginVM';

export class PluginHost {
  #plugins: {
    [key: string]: {
      vm: PluginVM;
      metadata: IPluginParseData;
    };
  } = {};

  #eventListeners: Array<
    (
      pluginId: string,
      type: string,
      namespace: string,
      command: string,
      data: unknown,
      responseId?: string,
    ) => void
  > = [];

  constructor() {}

  async loadPlugin(id: string) {
    const pluginData = await new PluginParser(id).parse();
    if (!pluginData.isValid) throw new Error(pluginData.message);

    const vm = new PluginVM(id);
    await vm.initialize();

    this.#plugins[pluginData.data.id] = {
      metadata: pluginData.data,
      vm,
    };
  }

  async start() {
    for (const plugin of Object.values(this.#plugins)) {
      const pluginBundle = await new PluginCompiler(plugin.metadata.id).compile(
        plugin.metadata.entrypoint,
      );

      plugin.vm.onVMToHost(
        (payload: {
          type: string;
          namespace: string;
          command: string;
          data: unknown;
          responseId?: string;
        }) => {
          const { type, namespace, command, data, responseId } = payload;

          for (const listener of this.#eventListeners) {
            listener(
              plugin.metadata.id,
              type ?? 'execute',
              namespace,
              command,
              data,
              responseId,
            );
          }
        },
      );

      plugin.vm.load(pluginBundle);
    }
  }

  dispose() {
    for (const plugin of Object.values(this.#plugins)) {
      plugin.vm.dispose();
    }

    this.#plugins = {};
  }

  emitCallResponse(
    pluginId: string,
    namespace: string,
    command: string,
    data: any,
    responseId: string,
  ) {
    const plugin = this.#plugins[pluginId];
    if (!plugin) throw new Error(`Plugin "${pluginId}" not found`);

    plugin.vm.emitCallResponse(namespace, command, data, responseId);
  }

  call(
    pluginId: string,
    namespace: string,
    command: string,
    data: any,
    responseId?: string,
  ) {
    if (pluginId == '@all') {
      for (const plugin of Object.values(this.#plugins)) {
        plugin.vm.call(namespace, command, data, responseId);
      }
    } else {
      const plugin = this.#plugins[pluginId];
      if (!plugin) throw new Error(`Plugin "${pluginId}" not found`);

      plugin.vm.call(namespace, command, data, responseId);
    }
  }

  async callWithResult(
    pluginId: string,
    namespace: string,
    command: string,
    data: any,
  ): Promise<any> {
    const plugin = this.#plugins[pluginId];
    if (!plugin) throw new Error(`Plugin "${pluginId}" not found`);

    return new Promise((resolve, reject) => {
      const cancel = plugin.vm.callWithResult(
        namespace,
        command,
        data,
        (result: any) => {
          clearTimeout(timeout);
          resolve(result);
        },
      );

      const timeout = setTimeout(() => {
        cancel();
        reject(new Error(`Plugin "${pluginId}" timed out`));
      }, 10000);
    });
  }

  addListener(
    callback: (
      pluginId: string,
      type: string,
      namespace: string,
      command: string,
      data: unknown,
      responseId?: string,
    ) => void,
  ) {
    this.#eventListeners.push(callback);
  }
}
