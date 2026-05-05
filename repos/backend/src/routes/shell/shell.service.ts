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
}
