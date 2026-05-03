import { HostBridge } from "../host/bridge";

export const CadaideCmd = {
  run: (command: string[]) =>
    new Promise((r) =>
      HostBridge.executeWithResponse(
        "cmd",
        "run",
        {
          command,
        },
        (data) => r(data),
      ),
    ),
};
