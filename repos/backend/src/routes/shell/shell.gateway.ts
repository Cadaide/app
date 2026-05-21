import {
  OnGatewayConnection,
  OnGatewayDisconnect,
  WebSocketGateway,
} from '@nestjs/websockets';
import { ShellService } from './shell.service';
import { IncomingMessage } from 'http';

@WebSocketGateway({ path: '/shell/ws' })
export class ShellGateway implements OnGatewayConnection, OnGatewayDisconnect {
  constructor(private readonly shellService: ShellService) {}

  handleConnection(client: any, ...args: any[]) {
    const params = new URLSearchParams(
      (args[0] as IncomingMessage).url?.split('?')[1],
    );

    this.shellService.createPtySession(
      client,
      params.get('cwd') ?? process.env.HOME,
    );
  }

  handleDisconnect(client: any) {
    this.shellService.disposePtySession(client);
  }
}
