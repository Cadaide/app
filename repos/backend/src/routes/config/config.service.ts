import { Injectable } from '@nestjs/common';
import { existsSync } from 'fs';
import { access, constants, mkdir, readFile, writeFile } from 'fs/promises';
import path from 'path';
import { CFG_PATH_SETTINGS_FILE } from 'src/config/paths';
import { defaultSettings } from 'src/config/settings';
import { TSettings } from 'src/types/Settings';

@Injectable()
export class ConfigService {
  async getSettings(): Promise<TSettings> {
    return await this.#readSettingsFile();
  }

  async getSettingsPath() {
    return {
      path: CFG_PATH_SETTINGS_FILE,
    };
  }

  async #readSettingsFile(): Promise<TSettings> {
    const dir = path.dirname(CFG_PATH_SETTINGS_FILE);
    const dirExists = existsSync(dir);
    if (!dirExists) await mkdir(dir, { recursive: true });

    const fileExists = existsSync(CFG_PATH_SETTINGS_FILE);
    if (!fileExists) await this.#createDefaultSettings();

    return await JSON.parse(await readFile(CFG_PATH_SETTINGS_FILE, 'utf-8'));
  }

  async #createDefaultSettings(): Promise<void> {
    await this.#writeSettingsFile(defaultSettings);
  }

  async #writeSettingsFile(settings: TSettings) {
    await writeFile(CFG_PATH_SETTINGS_FILE, JSON.stringify(settings, null, 2));
  }
}
