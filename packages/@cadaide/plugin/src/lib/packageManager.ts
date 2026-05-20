import { HostRPC } from "../host/rpc";
import type { IPackageManager } from "../types/PackageManager";

export class CadaidePackageManager {
  static provide(languages: string[], provider: new () => IPackageManager) {
    const instance = new provider();

    HostRPC.instance.backend.callProcedure(
      "packageManager.register",
      languages,
    );

    HostRPC.instance.frontend.registerProcedure(
      "packageManager.listInstalled",
      async () => {
        return await instance.listInstalled();
      },
    );

    HostRPC.instance.frontend.registerProcedure(
      "packageManager.search",
      async ({ query }: any) => {
        return await instance.search(query);
      },
    );

    HostRPC.instance.frontend.registerProcedure(
      "packageManager.detail",
      async ({ id }: any) => {
        return await instance.detail(id);
      },
    );

    HostRPC.instance.frontend.registerProcedure(
      "packageManager.install",
      async ({ id, version }: any) => {
        return await instance.install(id, version);
      },
    );

    HostRPC.instance.frontend.registerProcedure(
      "packageManager.uninstall",
      async ({ id }: any) => {
        return await instance.uninstall(id);
      },
    );
  }
}
