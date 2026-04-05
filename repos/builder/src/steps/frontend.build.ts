import path from "path";
import { BuildStep } from "../step";
import { Shell } from "../shell";

export class FrontendBuild extends BuildStep {
  #feRoot: string;

  constructor() {
    super("frontend.build");

    this.#feRoot = path.join(process.cwd(), "../frontend");
  }

  async run() {
    await this.#build().catch((e) => this.logger.error(e));
  }

  async #build() {
    this.logger.info("Building frontend...");

    const cmd = Shell.run(["bun", "run", "build"], this.#feRoot);

    await cmd.await().catch((e) => Promise.reject(e));
  }
}
