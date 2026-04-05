import { exists, rm } from "fs/promises";
import { Shell } from "../shell";
import { BuildStep } from "../step";
import path from "path";

export class BackendClean extends BuildStep {
  #beRoot: string;

  constructor() {
    super("backend.clean");

    this.#beRoot = path.join(process.cwd(), "../backend");
  }

  async run() {
    await this.#removeOldBuild().catch((e) => this.logger.error(e));
    await this.#removeOldNodeModules().catch((e) => this.logger.error(e));
  }

  async #removeOldBuild() {
    const dir = path.join(this.#beRoot, "dist");

    const oldExists = await exists(dir);
    if (!oldExists) return;

    this.logger.info("Removing old backend build...");

    await rm(dir, { recursive: true, force: true }).catch((e) =>
      Promise.reject(e),
    );
  }

  async #removeOldNodeModules() {
    const dir = path.join(this.#beRoot, "node_modules");

    const oldExists = await exists(dir);
    if (!oldExists) return;

    this.logger.info("Removing old backend node_modules...");

    await rm(dir, { recursive: true, force: true }).catch((e) =>
      Promise.reject(e),
    );
  }
}
