import {
  OnGatewayConnection,
  OnGatewayDisconnect,
  WebSocketGateway,
} from '@nestjs/websockets';
import { ShellService } from './shell.service';

@WebSocketGateway({ path: '/shell/ws' })
export class ShellGateway implements OnGatewayConnection, OnGatewayDisconnect {
  constructor(private readonly shellService: ShellService) {}

  handleConnection(client: any, ...args: any[]) {
    this.shellService.createPtySession(client);
  }

  handleDisconnect(client: any) {
    this.shellService.disposePtySession(client);
  }
}
