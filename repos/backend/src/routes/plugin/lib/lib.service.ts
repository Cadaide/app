import { RPC } from '@cadaide/rpc';
import { Injectable, Logger } from '@nestjs/common';
import axios, { AxiosRequestConfig } from 'axios';
import { spawn } from 'child_process';

@Injectable()
export class PluginLibService {
  createProcedures(rpc: RPC) {
    this.createHttpProcedures(rpc);
    this.createShellProcedures(rpc);
  }

  createHttpProcedures(rpc: RPC) {
    rpc.registerProcedure(
      'http.get',
      async (url: string, options?: AxiosRequestConfig) => {
        const res = await axios
          .get(url, options)
          .catch((data: any) => data.response);

        return res.data;
      },
    );
  }

  createShellProcedures(rpc: RPC) {
    rpc.registerProcedure(
      'shell.run',
      async (
        command: string[],
        options?: Partial<{
          cwd: string;
        }>,
      ) => {
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
      },
    );
  }
}
