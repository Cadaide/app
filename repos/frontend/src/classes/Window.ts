import { notify } from "@/hooks/stores/useNotificationState";
import { IPluginRepoIndexEntry } from "@/api/plugin";
import { Workspace } from "./Workspace";

export class Window {
  #workspace: Workspace;

  constructor(workspace: Workspace) {
    this.#workspace = workspace;
  }

  init() {
    this.#workspace.pluginHost.provideCallHandler(
      "window",
      "showNotification",
      (source: string, _data: unknown) => {
        const data = _data as { type: string; message: string };

        if (!["info", "warning", "error", "success"].includes(data.type)) {
          notify({
            type: "error",
            title: source,
            message: `Invalid notification type: ${data.type}`,
            duration: 2000,
          });

          return;
        }

        if (typeof data.message !== "string") {
          notify({
            type: "error",
            title: source,
            message: "Invalid notification message",
            duration: 2000,
          });

          return;
        }

        notify({
          type: data.type as "info" | "warning" | "error" | "success",
          title: source,
          message: data.message,
          duration: 2000,
        });
      },
    );

    this.#workspace.pluginHost.provideCallHandler(
      "http",
      "get",
      async (source: string, _data: unknown) => {
        const data = _data as { url: string; headers?: Record<string, string> };

        const response = await fetch(data.url, {
          headers: data.headers,
        });

        return await response.text();
      },
    );
  }
}
