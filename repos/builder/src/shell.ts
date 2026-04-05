import { spawn } from "child_process";
import process from "process";

export type ShellResult = {
  await(): Promise<void>;
};

export class Shell {
  static run(
    command: string[],
    cwd: string,
    env?: NodeJS.ProcessEnv,
  ): ShellResult {
    const proc = spawn(command[0]!, command.slice(1), {
      cwd: cwd,
      env: {
        ...process.env,
        ...env,
      },
      stdio: "inherit",
    });

    return {
      await: async () =>
        await new Promise<void>((resolve, reject) => {
          proc.on("close", (code) => {
            if (code === 0) resolve();
            else reject();
          });

          proc.on("error", (error) => {
            reject(error);
          });
        }),
    };
  }
}
