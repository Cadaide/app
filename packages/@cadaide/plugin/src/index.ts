import { HostEvents } from "./host/events";
import { CadaideEventOn } from "./lib/events";
import { CadaideHttp } from "./lib/http";
import { CadaideNotifications } from "./lib/notifications";

HostEvents.initialize();

export const cadaide = {
  notifications: CadaideNotifications,
  http: CadaideHttp,

  on: CadaideEventOn,
};
