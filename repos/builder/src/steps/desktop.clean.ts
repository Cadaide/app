import path from "path";
import { BuildStep } from "../step";
import { exists, rm } from "fs/promises";

export class DesktopClean extends BuildStep {
  #desktopRoot: string;

  constructor() {
    super("desktop.clean");

    this.#desktopRoot = path.join(process.cwd(), "../desktop");
  }

  async run() {
    await this.#removeOldBuild().catch((e) => this.logger.error(e));
  }

  async #removeOldBuild() {
    const dir = path.join(this.#desktopRoot, "build");

    const oldExists = await exists(dir);
    if (!oldExists) return;

    this.logger.info("Removing old desktop build...");

    await rm(dir, { recursive: true, force: true }).catch((e) =>
      Promise.reject(e),
    );
  }
}
