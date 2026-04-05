import path from "path";
import { BuildStep } from "../step";
import { Shell } from "../shell";

export class BackendInstall extends BuildStep {
  #beRoot: string;

  constructor() {
    super("backend.install");

    this.#beRoot = path.join(process.cwd(), "../backend");
  }

  async run() {
    await this.#install().catch((e) => this.logger.error(e));
  }

  async #install() {
    this.logger.info("Installing backend dependencies...");

    const cmd = Shell.run(
      ["bun", "install", "--frozen-lockfile"],
      this.#beRoot,
    );

    await cmd.await().catch((e) => Promise.reject(e));
  }
}
