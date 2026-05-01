import {
  OnGatewayConnection,
  OnGatewayDisconnect,
  WebSocketGateway,
} from '@nestjs/websockets';
import { WindowService } from './window.service';

@WebSocketGateway({ path: '/window/ws' })
export class WindowGateway implements OnGatewayConnection, OnGatewayDisconnect {
  constructor(private readonly windowService: WindowService) {}

  async handleConnection(client: any) {
    await this.windowService.createSession(client);

    // Handle raw messages for plugin awaitCall requests
    client.on('message', async (raw: string) => {
      let message: { type: string; args?: unknown[]; pluginId?: string };

      try {
        message = JSON.parse(raw);
      } catch {
        return;
      }

      const { type, args = [], pluginId } = message;
      const result = await this.windowService.awaitPluginCall(
        client,
        type,
        args,
        pluginId,
      );

      if (result !== undefined)
        client.send(
          JSON.stringify({
            type,
            source: null,
            args: [result],
          }),
        );
    });
  }

  async handleDisconnect(client: any) {
    return await this.windowService.disposeSession(client);
  }
}
