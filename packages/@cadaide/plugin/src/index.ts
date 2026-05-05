import { HostEvents } from "./host/events";
import { HostRPC } from "./host/rpc";
import { CadaideHTTP } from "./lib/http";
import { CadaideNotifications } from "./lib/notifications";
import { CadaidePackageManager } from "./lib/packageManager";
import { CadaideShell } from "./lib/shell";

export * from "./types/PackageManager";

void HostRPC.instance;

export const cadaide = {
  notifications: CadaideNotifications,
  packageManager: CadaidePackageManager,
  http: CadaideHTTP,
  shell: CadaideShell,

  events: HostEvents,
};

HostRPC.instance.backend.callProcedure("log", "TEST");
