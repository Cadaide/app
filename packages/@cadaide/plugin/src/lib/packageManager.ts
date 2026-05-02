import { HostBridge } from "../host/bridge";
import type { IPackageManager } from "../types/PackageManager";

export const CadaidePackageManager = {
  provide(provider: new () => IPackageManager) {
    HostBridge.provideCallHandler(
      "packageManager",
      "listInstalled",
      async () => {
        const instance = new provider();

        return await instance.listInstalled();
      },
    );

    HostBridge.provideCallHandler(
      "packageManager",
      "search",
      async ({ query }: any) => {
        const instance = new provider();

        return await instance.search(query);
      },
    );

    HostBridge.provideCallHandler(
      "packageManager",
      "detail",
      async ({ id }: any) => {
        const instance = new provider();

        return await instance.detail(id);
      },
    );

    HostBridge.provideCallHandler(
      "packageManager",
      "install",
      async ({ id, version }: any) => {
        const instance = new provider();

        return await instance.install(id, version);
      },
    );

    HostBridge.provideCallHandler(
      "packageManager",
      "uninstall",
      async ({ id }: any) => {
        const instance = new provider();

        return await instance.uninstall(id);
      },
    );
  },
};
