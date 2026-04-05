import path from "path";
import { BuildStep } from "../step";
import { exists, rm } from "fs/promises";

export class MicroserviceFsClean extends BuildStep {
  #msRoot: string;

  constructor() {
    super("microservice_fs.clean");

    this.#msRoot = path.join(process.cwd(), "../microservices/fs");
  }

  async run() {
    await this.#removeOldBuild().catch((e) => this.logger.error(e));
  }

  async #removeOldBuild() {
    const dir = path.join(this.#msRoot, "build");

    const oldExists = await exists(dir);
    if (!oldExists) return;

    this.logger.info("Removing old microservice_fs build...");

    await rm(dir, { recursive: true, force: true }).catch((e) =>
      Promise.reject(e),
    );
  }
}
