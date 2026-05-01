import { Injectable, NotFoundException, OnModuleInit } from '@nestjs/common';
import axios from 'axios';
import { randomUUID } from 'crypto';
import { existsSync } from 'fs';
import { cp, mkdir, readdir, readFile, rmdir, writeFile } from 'fs/promises';
import JSZip from 'jszip';
import path from 'path';
import { PluginHost } from 'src/classes/plugin/PluginHost';
import { CFG_PATH_PLUGINS_DIR } from 'src/config/paths';
import { PLUGIN_REPOINDEX_URL } from 'src/config/plugins';
import { IPluginIndex, IPluginRepoIndex } from 'src/types/Plugin';

@Injectable()
export class PluginService implements OnModuleInit {
  #hostSessions: {
    [key: string]: {
      ws: WebSocket;
      pluginHost: PluginHost;
    };
  } = {};

  async onModuleInit() {
    if (existsSync(CFG_PATH_PLUGINS_DIR)) return;

    await mkdir(CFG_PATH_PLUGINS_DIR);
  }

  async listPlugins() {
    const response = await axios.get<IPluginRepoIndex>(PLUGIN_REPOINDEX_URL, {
      // Ignore cache
      headers: {
        'Cache-Control': 'no-cache, no-store, must-revalidate',
        Pragma: 'no-cache',
        Expires: '0',
      },
    });

    return response.data.plugins;
  }

  async getPlugin(id: string) {
    const allPlugins = await this.listPlugins();

    const plugin = allPlugins.find((plugin) => plugin.id === id);
    if (!plugin) throw new NotFoundException('Plugin not found');

    const response = await axios.get<IPluginIndex>(plugin.ref, {
      // Ignore cache
      headers: {
        'Cache-Control': 'no-cache, no-store, must-revalidate',
        Pragma: 'no-cache',
        Expires: '0',
      },
    });

    return response.data;
  }

  async listInstalled() {
    const potentialIds: string[] = [];

    for (const pluginId of await readdir(CFG_PATH_PLUGINS_DIR)) {
      potentialIds.push(pluginId);
    }

    const allPlugins = await this.listPlugins();
    const installedPlugins = allPlugins.filter((plugin) =>
      potentialIds.includes(plugin.id),
    );

    return installedPlugins;
  }

  async installPlugin(id: string) {
    const plugin = await this.getPlugin(id);

    const pluginPath = path.join(CFG_PATH_PLUGINS_DIR, plugin.id);

    // Download zip
    const response = await axios.get(plugin.package, {
      responseType: 'arraybuffer',
    });

    const zip = await JSZip.loadAsync(response.data);

    // Detect if zip contains a single root folder
    const topLevelDirs = new Set<string>();
    zip.forEach((relativePath) => {
      const firstSegment = relativePath.split('/')[0];
      topLevelDirs.add(firstSegment);
    });

    const stripPrefix =
      topLevelDirs.size === 1 ? [...topLevelDirs][0] + '/' : '';

    for (const [zipPath, entry] of Object.entries(zip.files)) {
      // Strip the top-level directory
      const relative = stripPrefix
        ? zipPath.startsWith(stripPrefix)
          ? zipPath.slice(stripPrefix.length)
          : zipPath
        : zipPath;

      if (!relative) continue;

      const targetPath = path.join(pluginPath, relative);

      if (entry.dir) await mkdir(targetPath, { recursive: true });
      else {
        await mkdir(path.dirname(targetPath), { recursive: true });

        const content = await entry.async('nodebuffer');
        await writeFile(targetPath, content);
      }
    }
  }

  async installFromFolder(folderPath: string) {
    // Read plugin index
    const pluginJson = JSON.parse(
      await readFile(path.join(folderPath, 'plugindex.json'), 'utf-8'),
    ) as IPluginIndex;

    // Create plugin folder
    await mkdir(path.join(CFG_PATH_PLUGINS_DIR, pluginJson.id), {
      recursive: true,
    });

    // Copy all files
    await cp(folderPath, path.join(CFG_PATH_PLUGINS_DIR, pluginJson.id), {
      recursive: true,
    });
  }

  async removePlugin(id: string) {
    const plugin = await this.getPlugin(id);

    const pluginPath = path.join(CFG_PATH_PLUGINS_DIR, plugin.id);

    await rmdir(pluginPath, { recursive: true });
  }

  async createHostSession(client: WebSocket) {
    const sessionId = randomUUID();

    const pluginHost = new PluginHost();

    this.#hostSessions[sessionId] = {
      ws: client,
      pluginHost: pluginHost,
    };

    const installedPlugins = await this.listInstalled();

    for (const plugin of installedPlugins) {
      await pluginHost.loadPlugin(plugin.id);
    }

    pluginHost.addListener(
      (pluginId, type, namespace, command, data, responseId) => {
        const payload = JSON.stringify({
          event: type == 'execute' ? 'call' : type,
          data: {
            pluginId,
            namespace,
            command,
            responseId,
            data,
          },
        });

        client.send(payload);
      },
    );

    await pluginHost.start();
  }

  async disposeHostSession(client: WebSocket) {
    const session = this.#findSessionBySocket(client);
    if (!session) return;

    session.pluginHost.dispose();

    delete this.#hostSessions[session.sessionId];
  }

  async handleHostCall(client: WebSocket, payload: any) {
    const session = this.#findSessionBySocket(client);
    if (!session) return;

    session.pluginHost.call(
      payload.pluginId,
      payload.namespace,
      payload.command,
      payload.data,
      payload.responseId,
    );
  }

  async handleHostCallResponse(client: WebSocket, payload: any) {
    const session = this.#findSessionBySocket(client);
    if (!session) return;

    session.pluginHost.emitCallResponse(
      payload.pluginId,
      payload.namespace,
      payload.command,
      payload.data,
      payload.responseId,
    );
  }

  #findSessionBySocket(client: WebSocket) {
    const session = Object.entries(this.#hostSessions).find(
      ([_, session]) => session.ws === client,
    );

    if (!session) return null;

    return {
      sessionId: session[0],
      ...session[1],
    };
  }
}
