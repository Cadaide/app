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
    return await this.windowService.createSession(client);
  }

  async handleDisconnect(client: any) {
    return await this.windowService.disposeSession(client);
  }
}
