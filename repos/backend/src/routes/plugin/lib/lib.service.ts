import { RPC } from '@cadaide/rpc';
import { Injectable, Logger } from '@nestjs/common';
import axios, { AxiosRequestConfig } from 'axios';
import { spawn } from 'child_process';
import { SettingsService } from 'src/services/settings.service';

@Injectable()
export class PluginLibService {
  constructor(private readonly settingsService: SettingsService) {}

  createProcedures(rpc: RPC, pluginId: string) {
    this.createHttpProcedures(rpc);
    this.createShellProcedures(rpc);
    this.createPackageManagerProcedures(rpc, pluginId);
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

          child.on('exit', (code) => {
            r({
              stdout,
              stderr,
              code,
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

  createPackageManagerProcedures(rpc: RPC, pluginId: string) {
    rpc.registerProcedure(
      'packageManager.register',
      async (languages: string[]) => {
        Logger.log(
          `Plugin ${pluginId} has registered package manager for languages: ${languages.join(', ')}`,
        );

        // Register plugin as package manager provider for the given languages
        // if there isn't some already assigned
        const currentProviders = await this.settingsService.readKey(
          'packageManager.provider',
        );

        for (const language of languages) {
          const provider = currentProviders[language];

          if (!provider) {
            await this.settingsService.writeKey(`packageManager.provider`, {
              ...currentProviders,
              [language]: pluginId,
            });
          }
        }
      },
    );
  }
}
