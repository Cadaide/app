import { exists, rm } from "fs/promises";
import { Shell } from "../shell";
import { BuildStep } from "../step";
import path from "path";

export class FrontendClean extends BuildStep {
  #feRoot: string;

  constructor() {
    super("frontend.clean");

    this.#feRoot = path.join(process.cwd(), "../frontend");
  }

  async run() {
    await this.#removeOldBuild().catch((e) => this.logger.error(e));
    await this.#removeOldNodeModules().catch((e) => this.logger.error(e));
  }

  async #removeOldBuild() {
    const dir = path.join(this.#feRoot, ".next");

    const oldExists = await exists(dir);
    if (!oldExists) return;

    this.logger.info("Removing old frontend build...");

    await rm(dir, { recursive: true, force: true }).catch((e) =>
      Promise.reject(e),
    );
  }

  async #removeOldNodeModules() {
    const dir = path.join(this.#feRoot, "node_modules");

    const oldExists = await exists(dir);
    if (!oldExists) return;

    this.logger.info("Removing old frontend node_modules...");

    await rm(dir, { recursive: true, force: true }).catch((e) =>
      Promise.reject(e),
    );
  }
}
