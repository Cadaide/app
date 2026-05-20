import { VM } from '@cadaide/plugin-vm';
import { RPC } from '@cadaide/rpc';
import { PluginParser } from './PluginParser';
import path from 'path';
import { CFG_PATH_PLUGINS_DIR } from 'src/config/paths';
import { RPCForwarder } from '../RPCForwarder';

export class PluginHostSession {
  #plugins: Map<
    string,
    {
      vm: VM;
      feRpc: RPCForwarder;
      beRpc: RPC;
    }
  > = new Map();

  static #PLUGIN_VM_MEMORY_LIMIT_MB = 256;

  constructor() {}

  async loadPlugin(
    pluginId: string,
    sendMessage: (message: string) => void,
    createProcedures: (rpc: RPC, pluginId: string) => void,
  ) {
    const pluginMetadata = await new PluginParser(pluginId).parse();
    if (!pluginMetadata.isValid) throw new Error(pluginMetadata.message);

    const feRpc = new RPCForwarder();
    const beRpc = new RPC(false, 60_000);

    feRpc.provideMessageSender(sendMessage);

    const pluginDir = path.join(CFG_PATH_PLUGINS_DIR, pluginId);

    const vm = new VM(
      {
        frontend: feRpc,
        backend: beRpc,
      } as any,
      {
        limits: {
          memoryMB: PluginHostSession.#PLUGIN_VM_MEMORY_LIMIT_MB, // TODO: Allow plugin to specify memory limits for itself (displayed in plugin manager)
        },
        codeRootPath: pluginDir,
        entrypoint: pluginMetadata.data.entrypoint,
      },
    );

    createProcedures(beRpc, pluginId);

    await vm.initialize();

    this.#plugins.set(pluginId, {
      vm,
      feRpc,
      beRpc,
    });
  }

  async start() {
    for (const [pluginId, { vm }] of this.#plugins.entries()) {
      try {
        await vm.run();
      } catch (error) {
        console.error(
          `[PLUGIN HOST] Error starting plugin ${pluginId}:`,
          error,
        );
      }
    }
  }

  async dispose() {
    for (const { vm } of this.#plugins.values()) {
      await vm.dispose();
    }

    this.#plugins.clear();
  }

  processFrontendMessage(pluginId: string, message: string) {
    if (pluginId === '*') {
      for (const { feRpc } of this.#plugins.values()) {
        feRpc.handleIncomingMessage(message);
      }

      return;
    }

    const plugin = this.#plugins.get(pluginId);
    if (!plugin) throw new Error(`Plugin "${pluginId}" not found`);

    plugin.feRpc.handleIncomingMessage(message);
  }
}
