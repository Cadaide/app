import path from 'path';
import { getQuickJS, QuickJSContext, QuickJSRuntime } from 'quickjs-emscripten';
import { CFG_PATH_PLUGINS_DIR } from 'src/config/paths';
import { IPluginIndex, IPluginRuntimeAPIProvider } from 'src/types/Plugin';
import * as esbuild from 'esbuild';
import { readFile } from 'fs/promises';

const PLUGIN_RUNTIME_BOOTSTRAP_CODE = `
globalThis.___cadaide_internal.__listeners = {};

globalThis.___cadaide_internal.on = (event, callback) => {
  if (!globalThis.___cadaide_internal.__listeners[event]) {
    globalThis.___cadaide_internal.__listeners[event] = [];
  }

  globalThis.___cadaide_internal.__listeners[event].push(callback);
};

globalThis.___cadaide_internal.emit = (event, args) => {
  const listeners = globalThis.___cadaide_internal.__listeners[event];

  if (!listeners) return;
  for (const listener of listeners) {
    listener(...JSON.parse(args));
  }
};

globalThis.___cadaide_internal.exec = (data) => {
  const stringified = JSON.stringify(data);
  const res = globalThis.___cadaide_internal.execraw(stringified);

  if (!res) return undefined;
  return JSON.parse(res);
}

globalThis.cadaide = {
  notify: (msg) => {
    ___cadaide_internal.exec({ type: 'api:notify', args: [msg] });
  },
  on: (event, callback) => {
    ___cadaide_internal.on(event, callback);
  },
};
`;

const PLUGIN_RUNTIME_SUFFIX_CODE = `
globalThis.___cadaide_internal.exec({ type: 'api:initialize', args: [{}] });
`;

export class PluginRuntime {
  #id: string;
  #rootPath: string;
  #apiProvider: IPluginRuntimeAPIProvider;

  #runtime?: QuickJSRuntime;
  #vm?: QuickJSContext;

  constructor(pluginId: string, apiProvider: IPluginRuntimeAPIProvider) {
    this.#id = pluginId;
    this.#rootPath = path.join(CFG_PATH_PLUGINS_DIR, pluginId);
    this.#apiProvider = apiProvider;
  }

  async start() {
    const quickjs = await getQuickJS();
    this.#runtime = quickjs.newRuntime();
    const runtime = this.#runtime;

    runtime.setMemoryLimit(16 * 1024 * 1024); // 16MB

    this.#vm = runtime.newContext();
    const vm = this.#vm;

    const cadaideHandle = vm.newObject();
    const execHandle = vm.newFunction('execraw', (dataHandle) => {
      const data = vm.getString(dataHandle);

      return vm.newString(this.#execApiProvider(data));
    });

    vm.setProp(cadaideHandle, 'execraw', execHandle);
    vm.setProp(vm.global, '___cadaide_internal', cadaideHandle);

    for (const [id, cfg] of Object.entries(this.#apiProvider).filter(([k]) =>
      k.startsWith('api:event:'),
    )) {
      const callback = (...args: any[]) => {
        if (!vm.alive) return;

        const res = vm.evalCode(
          `globalThis.___cadaide_internal.emit("${id.split('api:event:')[1]}", '${JSON.stringify(args)}')`,
        );

        res.dispose();
      };

      cfg.fn(callback);
    }

    execHandle.dispose();
    cadaideHandle.dispose();

    const config = JSON.parse(
      await readFile(path.join(this.#rootPath, 'plugindex.json'), 'utf-8'),
    ) as IPluginIndex;
    const entrypoint = await readFile(
      path.join(this.#rootPath, config.entrypoint),
      'utf-8',
    );

    const bundle = await esbuild.build({
      stdin: {
        contents: entrypoint,
        loader: 'ts',
        resolveDir: this.#rootPath,
      },
      bundle: true,
      write: false,
      format: 'cjs',
    });

    const code = bundle.outputFiles![0].text;

    const result = vm.evalCode(
      PLUGIN_RUNTIME_BOOTSTRAP_CODE +
        '\n' +
        code +
        '\n' +
        PLUGIN_RUNTIME_SUFFIX_CODE,
    );
    if (result.error) {
      console.error(vm.dump(result.error));

      result.dispose();
    } else result.dispose();
  }

  stop() {
    if (this.#vm?.alive) this.#vm.dispose();
    if (this.#runtime?.alive) this.#runtime.dispose();
  }

  #execApiProvider(data: string): string {
    const parsedData = JSON.parse(data) as {
      type: string;
      args: any[];
    };

    if (parsedData.type.startsWith('api:event:')) return '{}';

    const provider: any =
      this.#apiProvider[parsedData.type as keyof IPluginRuntimeAPIProvider];

    if (!provider) {
      throw new Error(`Plugin API provider not found: ${parsedData.type}`);
    }

    const result = provider.fn(...parsedData.args);
    return result === undefined ? '' : (JSON.stringify(result) ?? '');
  }
}
