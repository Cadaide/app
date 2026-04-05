import path from "path";
import { BuildStep } from "../step";
import { Shell } from "../shell";

export class PackageZip extends BuildStep {
  #outDir: string;

  constructor() {
    super("package.zip");

    this.#outDir = path.join(process.cwd(), "build/pkg.zip");
  }

  async run() {
    await this.#zip().catch((e) => this.logger.error(e));
  }

  async #zip() {
    const cmd = Shell.run(
      ["zip", "-r", this.#outDir, "pkg", "bin"],
      path.join(process.cwd(), "build"),
    );

    await cmd.await().catch((e) => Promise.reject(e));
  }
}
