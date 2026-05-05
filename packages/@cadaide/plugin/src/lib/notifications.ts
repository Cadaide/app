import { HostRPC } from "../host/rpc";

export class CadaideNotifications {
  static async info(message: string) {
    return await this.#show("info", message);
  }

  static async warning(message: string) {
    return await this.#show("warning", message);
  }

  static async error(message: string) {
    return await this.#show("error", message);
  }

  static async success(message: string) {
    return await this.#show("success", message);
  }

  static async #show(
    type: "info" | "error" | "warning" | "success",
    message: string,
  ) {
    return await HostRPC.instance.frontend.callProcedure("notifications.show", {
      type,
      message,
    });
  }
}
