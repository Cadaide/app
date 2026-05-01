import { Logger } from '@nestjs/common';
import {
  OnGatewayConnection,
  OnGatewayDisconnect,
  SubscribeMessage,
  WebSocketGateway,
} from '@nestjs/websockets';
import { PluginService } from './plugin.service';

@WebSocketGateway({ path: '/plugin/ws' })
export class PluginGateway implements OnGatewayConnection, OnGatewayDisconnect {
  constructor(private readonly pluginService: PluginService) {}

  handleConnection(client: any, ...args: any[]) {
    this.pluginService.createHostSession(client);
  }

  handleDisconnect(client: any) {
    this.pluginService.disposeHostSession(client);
  }

  @SubscribeMessage('call_response')
  handleCallResponse(client: any, payload: any) {
    this.pluginService.handleHostCallResponse(client, payload);
  }

  @SubscribeMessage('call')
  handleCall(client: any, payload: any) {
    this.pluginService.handleHostCall(client, payload);
  }
}
