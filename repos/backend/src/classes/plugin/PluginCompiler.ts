import * as esbuild from 'esbuild';
import { readFile } from 'fs/promises';
import path from 'path';
import { CFG_PATH_PLUGINS_DIR } from 'src/config/paths';

export class PluginCompiler {
  #pluginId: string;
  #pluginPath: string;

  constructor(pluginId: string) {
    this.#pluginId = pluginId;
    this.#pluginPath = path.join(CFG_PATH_PLUGINS_DIR, this.#pluginId);
  }

  async compile(entrypoint: string) {
    const entrypointPath = path.join(this.#pluginPath, entrypoint);
    const entrypointCode = await readFile(entrypointPath, 'utf-8');

    const bundle = await esbuild.build({
      stdin: {
        contents: entrypointCode,
        loader: 'ts',
        resolveDir: this.#pluginPath,
      },
      bundle: true,
      write: false,
      format: 'cjs',
    });

    return bundle.outputFiles![0].text;
  }
}
