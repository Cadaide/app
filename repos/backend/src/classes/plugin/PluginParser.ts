import { existsSync, readFileSync } from 'fs';
import { readFile } from 'fs/promises';
import path from 'path';
import { CFG_PATH_PLUGINS_DIR } from 'src/config/paths';
import { IPluginIndex, IPluginRepoIndexEntry } from 'src/types/Plugin';

export interface IPluginParseData {
  id: string;
  name: string;
  entrypoint: string;
}

export class PluginParser {
  #pluginId: string;
  #pluginRootPath: string;

  constructor(pluginId: string) {
    this.#pluginId = pluginId;
    this.#pluginRootPath = path.join(CFG_PATH_PLUGINS_DIR, this.#pluginId);
  }

  async parse(): Promise<
    | {
        isValid: false;
        message: string;
      }
    | {
        isValid: true;
        data: IPluginParseData;
      }
  > {
    const dirExists = existsSync(this.#pluginRootPath);
    if (!dirExists)
      return this.#invalidReturn('Plugin directory does not exist');

    const plugindexExists = existsSync(
      path.join(this.#pluginRootPath, 'plugindex.json'),
    );
    if (!plugindexExists)
      return this.#invalidReturn('plugindex.json does not exist');

    let plugindexData: IPluginIndex;
    try {
      plugindexData = JSON.parse(
        await readFile(
          path.join(this.#pluginRootPath, 'plugindex.json'),
          'utf-8',
        ),
      );
    } catch (err) {
      return this.#invalidReturn('Invalid plugindex.json (syntax)');
    }

    const typeIsCorrect = plugindexData['@type'] === 'cadaide:plugin';
    if (!typeIsCorrect)
      return this.#invalidReturn('Invalid plugindex.json (type)');

    const idIsCorrect = plugindexData.id === this.#pluginId;
    if (!idIsCorrect) return this.#invalidReturn('Invalid plugindex.json (id)');

    const containsAllFields =
      'name' in plugindexData && 'entrypoint' in plugindexData;
    if (!containsAllFields)
      return this.#invalidReturn('Invalid plugindex.json (missing fields)');

    const entrypointExists = existsSync(
      path.join(this.#pluginRootPath, plugindexData.entrypoint),
    );
    if (!entrypointExists)
      return this.#invalidReturn(
        'Invalid plugindex.json (entrypoint does not exist)',
      );

    return this.#validReturn({
      id: this.#pluginId,
      name: plugindexData.name,
      entrypoint: plugindexData.entrypoint,
    });
  }

  #invalidReturn(message: string): {
    isValid: false;
    message: string;
  } {
    return {
      isValid: false,
      message: message,
    };
  }

  #validReturn(data: IPluginParseData): {
    isValid: true;
    data: IPluginParseData;
  } {
    return {
      isValid: true,
      data: data,
    };
  }
}
