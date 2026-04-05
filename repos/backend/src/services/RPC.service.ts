import {
  Inject,
  Injectable,
  OnModuleDestroy,
  OnModuleInit,
} from '@nestjs/common';
import { ChildProcess, spawn } from 'child_process';
import { randomUUID } from 'crypto';

interface IPendingRequest {
  resolve: (value: any) => void;
  reject: (reason?: any) => void;
}

export const RPC_BINARY = 'RPC_BINARY';

@Injectable()
export class RPCService implements OnModuleInit, OnModuleDestroy {
  #process: ChildProcess;
  #pendingRequests: Map<string, IPendingRequest> = new Map();
  #buffer = '';

  constructor(@Inject(RPC_BINARY) private readonly binaryPath: string) {}

  onModuleInit() {
    this.#process = spawn(this.binaryPath, [], {
      stdio: ['pipe', 'pipe', 'inherit'],
    });

    this.#process.stdout!.setEncoding('utf8');

    this.#process.stdout!.on('data', (chunk: string) => {
      this.#buffer += chunk;

      let newlineIndex: number;
      while ((newlineIndex = this.#buffer.indexOf('\n')) !== -1) {
        const line = this.#buffer.slice(0, newlineIndex);

        this.#buffer = this.#buffer.slice(newlineIndex + 1);
        this.#processLine(line);
      }
    });

    this.#process.on('exit', (code) => {
      console.error('RPC process exited with code:', code);

      for (const [, pending] of this.#pendingRequests) {
        pending.reject(new Error('RPC process exited'));
      }

      this.#pendingRequests.clear();
    });
  }

  onModuleDestroy() {
    this.#process?.kill();
  }

  call<T = any>(method: string, params: object): Promise<T> {
    return new Promise((resolve, reject) => {
      const id = randomUUID();
      this.#pendingRequests.set(id, { resolve, reject });

      const line = JSON.stringify({ id, method, params }) + '\n';
      this.#process.stdin?.write(line);
    });
  }

  #processLine(line: string) {
    if (!line.trim()) return;

    try {
      const response = JSON.parse(line);
      const pending = this.#pendingRequests.get(response.id);

      if (!pending) return;

      this.#pendingRequests.delete(response.id);

      if (response.error) pending.reject(new Error(response.error.message));
      else pending.resolve(response.result);
    } catch (e) {
      console.error('Failed to parse RPC response:', e);
    }
  }
}
