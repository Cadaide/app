import { HostRPC } from "../host/rpc";

export class CadaideWorkspace {
  static async getProjectPath(): Promise<string> {
    return await HostRPC.instance.frontend.callProcedure("workspace.cwd");
  }
}
