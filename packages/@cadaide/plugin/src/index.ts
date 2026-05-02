import { HostEvents } from "./host/events";
import { CadaideEventOn } from "./lib/events";
import { CadaideHttp } from "./lib/http";
import { CadaideNotifications } from "./lib/notifications";
import { CadaidePackageManager } from "./lib/packageManager";

export * from "./types/PackageManager";

HostEvents.initialize();

export const cadaide = {
  notifications: CadaideNotifications,
  http: CadaideHttp,
  packageManager: CadaidePackageManager,

  on: CadaideEventOn,
};
