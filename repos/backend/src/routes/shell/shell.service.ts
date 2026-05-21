import { Injectable } from '@nestjs/common';
import { spawn } from 'child_process';
import { randomUUID } from 'crypto';
import { IPty, spawn as spawnPty } from 'node-pty';
import { Appmeta } from 'src/appmeta';
import { WebSocket } from 'ws';

@Injectable()
export class ShellService {
  #ptySessions = new Map<
    string,
    {
      ws: WebSocket;
      pty: IPty;
      titleObserverTimer: ReturnType<typeof setTimeout>;
    }
  >();

  async run(
    command: string[],
    options?: Partial<{
      cwd: string;
    }>,
  ) {
    return new Promise((r) => {
      const child = spawn(command[0], command.slice(1), {
        cwd: options?.cwd,
        stdio: 'pipe',
        env: process.env, // TODO: Ensure this is fine for security
      });

      let stdout = '';
      let stderr = '';

      child.on('exit', () => {
        r({
          stdout,
          stderr,
        });
      });

      child.stdout.on('data', (data) => {
        stdout += data;
      });

      child.stderr.on('data', (data) => {
        stderr += data;
      });
    });
  }

  async createPtySession(client: WebSocket, cwd?: string) {
    const sessionId = randomUUID();

    const pty = spawnPty(
      process.platform === 'win32' ? 'powershell.exe' : 'zsh',
      ['-i'],
      {
        name: 'xterm-256color',
        cols: 80,
        rows: 24,
        cwd: cwd || process.env.HOME,
        env: {
          ...process.env,
          TERM: 'xterm-256color',
          TERM_PROGRAM: 'cadaide',
          TERM_PROGRAM_VERSION: 'v' + Appmeta.version,
          TERMINAL_EMULATOR: 'cadaide',
        },
      },
    );

    let previousTitle = '';
    const titleObserverTimer = setInterval(() => {
      const title = pty.process;

      if (title !== previousTitle) {
        client.send(JSON.stringify({ type: 'title', data: title }));
        previousTitle = title;
      }
    }, 100);

    this.#ptySessions.set(sessionId, {
      ws: client,
      pty: pty,
      titleObserverTimer,
    });

    pty.onData((data) =>
      client.send(JSON.stringify({ type: 'data', data: data })),
    );
    client.onmessage = (ev) => {
      const message = JSON.parse(ev.data.toString());

      if (message.type == 'data') pty.write(message.data as string);
      if (message.type == 'resize')
        pty.resize(message.data.columns, message.data.rows);
    };

    client.onclose = () => this.disposePtySession(client);
    client.onerror = () => this.disposePtySession(client);
    pty.onExit(() => this.disposePtySession(client));
  }

  async disposePtySession(client: WebSocket) {
    const session = this.#findSessionBySocket(client);
    if (!session) return;

    if (client.readyState === WebSocket.OPEN) client.close();
    session.pty.kill();
    clearInterval(session.titleObserverTimer);

    this.#ptySessions.delete(session.sessionId);
  }

  #findSessionBySocket(client: WebSocket) {
    for (const [sessionId, session] of this.#ptySessions.entries()) {
      if (session.ws === client) return { sessionId, ...session };
    }

    return null;
  }
}
