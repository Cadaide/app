import { Injectable } from '@nestjs/common';
import { existsSync } from 'fs';
import { readFile, writeFile } from 'fs/promises';
import { CFG_PATH_SETTINGS_FILE } from 'src/config/paths';

@Injectable()
export class SettingsService {
  async read() {
    if (!existsSync(CFG_PATH_SETTINGS_FILE)) return {};

    const rawSettings = await readFile(CFG_PATH_SETTINGS_FILE, 'utf-8');
    const json = JSON.parse(rawSettings);

    return json;
  }

  async write(settings: object) {
    const json = JSON.stringify(settings, null, 2);
    await writeFile(CFG_PATH_SETTINGS_FILE, json);
  }

  async readKey(key: string) {
    const json = await this.read();

    let data: any = json;
    for (const part of key.split('.')) {
      data = data[part];
    }

    return data;
  }

  async writeKey(key: string, value: any) {
    const json = await this.read();
    const parts = key.split('.');
    let current = json;

    for (let i = 0; i < parts.length - 1; i++) {
      const part = parts[i];

      if (!(part in current) || typeof current[part] !== 'object')
        current[part] = {};

      current = current[part];
    }

    current[parts[parts.length - 1]] = value;

    await this.write(json);
  }
}
