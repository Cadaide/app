import * as DiscordRPC from "discord-rpc";

export class DiscordRPCModule {
  #rpc = new DiscordRPC.Client({ transport: "ipc" });
  #startTimestamp = new Date();

  constructor() {
    this.#rpc.on("ready", this.#setActivity.bind(this));
    this.#rpc.login({ clientId: "1488232982580957346" });
  }

  #setActivity() {
    this.#rpc.setActivity({
      startTimestamp: this.#startTimestamp,
      state: "Cadaide",
      details: "In SessionManager.ts",
      instance: false,
    });
  }
}
