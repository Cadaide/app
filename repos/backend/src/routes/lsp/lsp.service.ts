import { Injectable } from '@nestjs/common';
import { ChildProcess, spawn } from 'child_process';
import { randomUUID } from 'crypto';
import { ILanguageConfig, LanguageConfig } from 'src/config/languages';
import { Language } from 'src/types/Language';
import { WebSocket } from 'ws';

@Injectable()
export class LspService {
  #sessions: Map<
    WebSocket,
    {
      language: Language;
      process: ChildProcess;
    }
  > = new Map();

  async createSession(client: WebSocket, language: Language) {
    const languageConfig = LanguageConfig[language];
    const lspProcess = await this.#spawnLsp(languageConfig);

    console.log('LSP::START', language);

    this.#sessions.set(client, { language, process: lspProcess });

    // LSP stdout → WebSocket klient
    let buffer = Buffer.alloc(0);
    let contentLength: number | null = null;

    lspProcess.stdout!.on('data', (chunk: Buffer) => {
      buffer = Buffer.concat([buffer, chunk]);

      while (true) {
        if (contentLength === null) {
          const headerEnd = buffer.indexOf('\r\n\r\n');
          if (headerEnd === -1) break;

          const headers = buffer.subarray(0, headerEnd).toString('utf8');
          const match = headers.match(/Content-Length:\s*(\d+)/i);
          if (match) contentLength = parseInt(match[1], 10);
          buffer = buffer.subarray(headerEnd + 4);
        }

        if (contentLength !== null && buffer.length >= contentLength) {
          const message = buffer.subarray(0, contentLength).toString('utf8');
          buffer = buffer.subarray(contentLength);
          contentLength = null;

          if (client.readyState === WebSocket.OPEN) {
            client.send(message);
          }
        } else break;
      }
    });

    lspProcess.stderr!.on('data', (data) => {
      console.error('[LSP STDERR]:', data.toString());
    });

    // WebSocket klient → LSP stdin
    client.on('message', (data: Buffer | string) => {
      const msg = data.toString('utf8');
      const length = Buffer.byteLength(msg, 'utf8');
      lspProcess.stdin!.write(`Content-Length: ${length}\r\n\r\n${msg}`);
    });

    // Cleanup
    client.on('close', () => {
      this.#sessions.delete(client);
      lspProcess.kill();

      console.log('LSP::STOP', language);
    });

    lspProcess.on('close', () => {
      if (client.readyState === WebSocket.OPEN) client.close();
      this.#sessions.delete(client);

      console.log('LSP::STOP', language);
    });
  }

  async #spawnLsp(languageConfig: ILanguageConfig) {
    const { command } = languageConfig.lsp;

    const lspProcess = spawn(command[0], command.slice(1));

    return lspProcess;
  }

  /*async createConnection(client: WebSocket) {
    const lspProcess = spawn('npx', [
      '--yes',
      '-p',
      'pyright',
      'pyright-langserver',
      '--stdio',
    ]);

    let buffer = Buffer.alloc(0);
    let contentLength: number | null = null;

    lspProcess.stdout.on('data', (chunk: Buffer) => {
      buffer = Buffer.concat([buffer, chunk]);

      while (true) {
        if (contentLength === null) {
          const headerEnd = buffer.indexOf('\r\n\r\n');
          if (headerEnd === -1) break;

          const headers = buffer.subarray(0, headerEnd).toString('utf8');
          const match = headers.match(/Content-Length:\s*(\d+)/i);

          if (match) {
            contentLength = parseInt(match[1], 10);
          }

          buffer = buffer.subarray(headerEnd + 4);
        }

        if (contentLength !== null) {
          if (buffer.length >= contentLength) {
            const message = buffer.subarray(0, contentLength).toString('utf8');

            buffer = buffer.subarray(contentLength);
            contentLength = null;

            client.send(message);
          } else break;
        }
      }
    });

    lspProcess.stderr.on('data', (data) => {
      console.error('[LSP STDERR]:', data.toString());
    });

    client.on('message', (data: Buffer | string) => {
      const messageStr = data.toString('utf8');
      const length = Buffer.byteLength(messageStr, 'utf8');
      const header = `Content-Length: ${length}\r\n\r\n`;

      lspProcess.stdin.write(header + messageStr);
    });

    client.on('close', () => {
      lspProcess.kill();
    });

    lspProcess.on('error', (error) => {
      console.error(error);
    });

    lspProcess.on('close', () => {
      client.close();
    });
  }*/
}
