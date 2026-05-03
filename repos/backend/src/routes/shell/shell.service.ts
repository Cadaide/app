import { Injectable } from '@nestjs/common';
import { spawn } from 'child_process';

@Injectable()
export class ShellService {
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

      let buffer = '';

      child.on('exit', () => {
        r(buffer);
      });

      child.stdout.on('data', (data) => {
        buffer += data;
      });

      child.stderr.on('data', (data) => {
        buffer += data;
      });
    });
  }
}
