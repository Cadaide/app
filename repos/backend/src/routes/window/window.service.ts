import { Injectable, Logger } from '@nestjs/common';
import { randomUUID } from 'crypto';
import { PluginRuntime } from 'src/classes/PluginRuntime';
import { PluginService } from '../plugin/plugin.service';
import {
  IPluginRepoIndexEntry,
  IPluginRuntimeAPIProvider,
} from 'src/types/Plugin';

@Injectable()
export class WindowService {
  #sessions: Map<
    string,
    {
      client: WebSocket;
      pluginRuntimes: {
        [id: string]: PluginRuntime;
      };
    }
  > = new Map();

  #logger = new Logger(WindowService.name);

  constructor(private readonly pluginService: PluginService) {}

  async createSession(client: WebSocket) {
    const sessionId = randomUUID();

    this.#logger.log(`New session: ${sessionId}`);

    this.#sessions.set(sessionId, {
      client,
      pluginRuntimes: await this.#initializePluginRuntimes(
        this.#constructApiProvider(client),
      ),
    });
  }

  async disposeSession(client: WebSocket) {
    const session = this.#getSession(client);
    if (!session) return;

    this.#logger.log(`Dispose session: ${session.sessionId}`);

    for (const runtime of Object.values(session.session.pluginRuntimes)) {
      runtime.stop();
    }

    session.session.client.close();
    this.#sessions.delete(session.sessionId);
  }

  async #initializePluginRuntimes(
    apiProvider: (plugin: IPluginRepoIndexEntry) => IPluginRuntimeAPIProvider,
  ) {
    const pluginRuntimes: {
      [id: string]: PluginRuntime;
    } = {};

    const installedPlugins = await this.pluginService.listInstalled();
    for (const plugin of installedPlugins) {
      pluginRuntimes[plugin.id] = new PluginRuntime(
        plugin.id,
        apiProvider(plugin),
      );

      await pluginRuntimes[plugin.id].start();
    }

    return pluginRuntimes;
  }

  #constructApiProvider(client: WebSocket) {
    return (plugin: IPluginRepoIndexEntry): IPluginRuntimeAPIProvider => {
      const callbacks: {
        [key: string]: ((value: unknown) => void)[];
      } = {};

      const apiProvider: IPluginRuntimeAPIProvider = {
        'api:notify': {
          fn: (type: string, message: string) => {
            client.send(
              JSON.stringify({
                type: 'api:notify',
                source: plugin,
                args: [type, message],
              }),
            );
          },
        },

        'api:initialize': {
          fn: () => {
            callbacks['api:event:initialize']?.forEach((cb) => cb({}));
          },
        },
        'api:event:initialize': {
          fn: (callback) => {
            if (!callbacks['api:event:initialize'])
              callbacks['api:event:initialize'] = [];

            callbacks['api:event:initialize'].push(callback);
          },
        },

        'api:event:packageManager.listInstalled': {
          fn: (callback) => {
            if (!callbacks['api:event:packageManager.listInstalled'])
              callbacks['api:event:packageManager.listInstalled'] = [];

            callbacks['api:event:packageManager.listInstalled'].push(callback);
          },
        },
      };

      return apiProvider;
    };
  }

  /**
   * Call a named function on plugin runtimes in this session.
   * - If `pluginId` is given, only that plugin's runtime is called.
   * - Otherwise all runtimes are raced; the first defined result wins.
   */
  async awaitPluginCall<T>(
    client: WebSocket,
    name: string,
    args: unknown[] = [],
    pluginId?: string,
  ): Promise<T | undefined> {
    const session = this.#getSession(client);
    if (!session) return undefined;

    const allRuntimes = session.session.pluginRuntimes;

    // Target a specific plugin when pluginId is provided
    if (pluginId) return allRuntimes[pluginId]?.awaitCall<T>(name, args);

    const runtimes = Object.values(allRuntimes);
    if (runtimes.length === 0) return undefined;

    // Race: first plugin that returns a defined value wins
    return new Promise<T | undefined>((resolve) => {
      let settled = false;
      let pending = runtimes.length;

      for (const runtime of runtimes) {
        runtime
          .awaitCall<T>(name, args)
          .then((result) => {
            pending--;

            if (!settled && result !== undefined) {
              settled = true;
              resolve(result);
            } else if (pending === 0 && !settled) resolve(undefined);
          })
          .catch(() => {
            pending--;

            if (pending === 0 && !settled) resolve(undefined);
          });
      }
    });
  }

  #getSession(client: WebSocket) {
    for (const [sessionId, session] of this.#sessions.entries()) {
      if (session.client === client) {
        return { sessionId, session };
      }
    }

    return null;
  }
}
