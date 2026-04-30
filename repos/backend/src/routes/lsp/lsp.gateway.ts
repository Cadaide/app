import {
  OnGatewayConnection,
  SubscribeMessage,
  WebSocketGateway,
} from '@nestjs/websockets';
import { createConnection } from 'net';
import { WebSocket } from 'ws';
import { LspService } from './lsp.service';
import { Language } from 'src/types/Language';
import { IncomingMessage } from 'http';

@WebSocketGateway({ path: '/lsp' })
export class LspGateway implements OnGatewayConnection {
  constructor(private readonly lspService: LspService) {}

  async handleConnection(client: WebSocket, req: IncomingMessage) {
    const url = new URL(
      req.url!,
      `http://localhost:${process.env.PORT || 3001}`,
    );
    const language = url.searchParams.get('language') as Language;

    if (!language) {
      client.close();

      return;
    }

    await this.lspService.createSession(client, language);
  }
}
