import { HostRPC } from "../host/rpc";

export class CadaideShell {
  static async run(
    command: string[],
    options?: Partial<{
      cwd: string;
    }>,
  ): Promise<{
    stdout: string;
    stderr: string;
    code: number;
  }> {
    return await HostRPC.instance.backend.callProcedure(
      "shell.run",
      command,
      options,
    );
  }
}
