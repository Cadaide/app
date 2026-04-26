import { Injectable, Logger } from '@nestjs/common';
import { randomUUID } from 'crypto';
import { PluginRuntime } from 'src/classes/PluginRuntime';
import { PluginService } from '../plugin/plugin.service';
import { IPluginRuntimeAPIProvider } from 'src/types/Plugin';

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
    if (!session) throw new Error('Session not found');

    this.#logger.log(`Dispose session: ${session.sessionId}`);

    for (const runtime of Object.values(session.session.pluginRuntimes)) {
      runtime.stop();
    }

    session.session.client.close();
    this.#sessions.delete(session.sessionId);
  }

  async #initializePluginRuntimes(apiProvider: IPluginRuntimeAPIProvider) {
    const pluginRuntimes: {
      [id: string]: PluginRuntime;
    } = {};

    const installedPlugins = await this.pluginService.listInstalled();
    for (const plugin of installedPlugins) {
      pluginRuntimes[plugin.id] = new PluginRuntime(plugin.id, apiProvider);

      await pluginRuntimes[plugin.id].start();
    }

    return pluginRuntimes;
  }

  #constructApiProvider(client: WebSocket): IPluginRuntimeAPIProvider {
    const callbacks: {
      [key: string]: ((value: unknown) => void)[];
    } = {};

    const apiProvider: IPluginRuntimeAPIProvider = {
      'api:notify': {
        fn: (message: string) => {
          client.send(JSON.stringify({ type: 'api:notify', args: [message] }));
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
    };

    return apiProvider;
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
