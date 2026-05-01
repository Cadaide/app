import { HostBridge } from "../host/bridge";

const showNotification = (type: string, msg: string) => {
  ___cadaide_debug_log(msg);

  HostBridge.execute("window", "showNotification", {
    type,
    message: msg,
  });
};

export const CadaideNotifications = {
  info: (message: string) => showNotification("info", message),
  warning: (message: string) => showNotification("warning", message),
  error: (message: string) => showNotification("error", message),
  success: (message: string) => showNotification("success", message),
};
