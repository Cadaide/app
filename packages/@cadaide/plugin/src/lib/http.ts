import { HostBridge } from "../host/bridge";

export const CadaideHttp = {
  get: (url: string, headers?: Record<string, string>) =>
    new Promise((r) =>
      HostBridge.executeWithResponse(
        "http",
        "get",
        {
          url,
          headers,
        },
        (data) => r(data),
      ),
    ),
};
