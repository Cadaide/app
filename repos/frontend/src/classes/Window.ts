import { notify } from "@/hooks/stores/useNotificationState";
import { IPluginRepoIndexEntry } from "@/api/plugin";
import { Workspace } from "./Workspace";
import { API } from "@/api";

export class Window {
  #workspace: Workspace;

  constructor(workspace: Workspace) {
    this.#workspace = workspace;
  }

  init() {
    this.#workspace.pluginHostSession.registerProcedure(
      "notifications.show",
      async (
        pluginId: string,
        opts: {
          type: "info" | "warning" | "error" | "success";
          message: string;
        },
      ) => {
        notify({
          type: opts.type,
          title: pluginId,
          message: opts.message,
          duration: 3000,
        });

        return true;
      },
    );
  }
}
