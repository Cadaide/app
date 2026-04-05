import path from "path";
import { BuildStep } from "../step";
import { Shell } from "../shell";

export class FrontendInstall extends BuildStep {
  #feRoot: string;

  constructor() {
    super("frontend.install");

    this.#feRoot = path.join(process.cwd(), "../frontend");
  }

  async run() {
    await this.#install().catch((e) => this.logger.error(e));
  }

  async #install() {
    this.logger.info("Installing frontend dependencies...");

    const cmd = Shell.run(
      ["bun", "install", "--frozen-lockfile"],
      this.#feRoot,
    );

    await cmd.await().catch((e) => Promise.reject(e));
  }
}
