import path from "path";
import { BuildStep } from "../step";
import { BuildConfig } from "../config";
import { exists, mkdir, rm } from "fs/promises";

export class OutputPrepare extends BuildStep {
  #outdir: string;

  constructor() {
    super("output.prepare");

    this.#outdir = path.join(process.cwd(), BuildConfig.outdir);
  }

  async run() {
    await this.#removeOldOutdir().catch((error) => this.logger.error(error));
    await this.#createOutdir().catch((error) => this.logger.error(error));
  }

  async #removeOldOutdir() {
    const outdirExists = await exists(this.#outdir);
    if (!outdirExists) return;

    this.logger.info(`Removing old output directory...`);

    await rm(this.#outdir, { recursive: true, force: true }).catch((e) =>
      Promise.reject(e),
    );
  }

  async #createOutdir() {
    const outdirExists = await exists(this.#outdir);
    if (outdirExists) return;

    this.logger.info(`Creating output directory...`);

    await mkdir(this.#outdir, { recursive: true }).catch((e) =>
      Promise.reject(e),
    );
    await mkdir(path.join(this.#outdir, "pkg"), { recursive: true }).catch(
      (e) => Promise.reject(e),
    );
    await mkdir(path.join(this.#outdir, "dist"), { recursive: true }).catch(
      (e) => Promise.reject(e),
    );
    await mkdir(path.join(this.#outdir, "bin"), { recursive: true }).catch(
      (e) => Promise.reject(e),
    );
    await mkdir(path.join(this.#outdir, "tmp"), { recursive: true }).catch(
      (e) => Promise.reject(e),
    );
  }
}
