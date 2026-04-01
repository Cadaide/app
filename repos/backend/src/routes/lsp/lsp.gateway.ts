import { OnGatewayConnection, WebSocketGateway } from '@nestjs/websockets';
import { createConnection } from 'net';
import { WebSocket } from 'ws';
import { LspService } from './lsp.service';

@WebSocketGateway(3001, { path: '/lsp' })
export class LspGateway implements OnGatewayConnection {
  constructor(private readonly lspService: LspService) {}

  handleConnection(client: WebSocket) {
    this.lspService.createConnection(client);
  }
}
