import path from "path";
import { BuildStep } from "../step";
import { Shell } from "../shell";

export class BackendBuild extends BuildStep {
  #beRoot: string;

  constructor() {
    super("backend.build");

    this.#beRoot = path.join(process.cwd(), "../backend");
  }

  async run() {
    await this.#build().catch((e) => this.logger.error(e));
  }

  async #build() {
    this.logger.info("Building backend...");

    const cmd = Shell.run(["bun", "run", "build"], this.#beRoot);

    await cmd.await().catch((e) => Promise.reject(e));
  }
}
