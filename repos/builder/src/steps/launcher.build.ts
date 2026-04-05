import path from "path";
import { BuildStep } from "../step";
import { Shell } from "../shell";
import { cp, readFile, writeFile } from "fs/promises";
import { BuildConfig, Platform } from "../config";

export class LauncherBuild extends BuildStep {
  #launcherRoot: string;

  constructor() {
    super("launcher.build");

    this.#launcherRoot = path.join(process.cwd(), "../launcher");
  }

  async run() {
    await this.#copySource().catch((e) => this.logger.error(e));
    await this.#copyPkg().catch((e) => this.logger.error(e));
    await this.#embedPkg().catch((e) => this.logger.error(e));
    await this.#build().catch((e) => this.logger.error(e));
  }

  async #copySource() {
    this.logger.info("Copying source...");

    const src = this.#launcherRoot;
    const dest = path.join(process.cwd(), "build/launcher");

    await cp(src, dest, { recursive: true }).catch((e) => Promise.reject(e));
  }

  async #copyPkg() {
    this.logger.info("Copying pkg...");

    const src = path.join(process.cwd(), "build/pkg.zip");
    const dest = path.join(process.cwd(), "build/launcher/src/pkg.zip");

    await cp(src, dest).catch((e) => Promise.reject(e));
  }

  async #embedPkg() {
    this.logger.info("Embedding pkg...");

    const main = path.join(process.cwd(), "build/launcher/src/main.go");

    const content = await readFile(main, "utf-8").catch((e) =>
      Promise.reject(e),
    );

    const newContent = content.replace(
      "// @cadaide:embed:pkg",
      "//go:embed pkg.zip",
    );

    await writeFile(main, newContent, "utf-8").catch((e) => Promise.reject(e));
  }

  async #build() {
    this.logger.info("Building launcher...");

    switch (BuildConfig.platform) {
      case Platform.Linux:
        await this.#buildLinux().catch((e) => Promise.reject(e));
        break;
      case Platform.Windows:
        await this.#buildWindows().catch((e) => Promise.reject(e));
        break;
    }
  }

  async #buildLinux() {
    const cmd = Shell.run(
      ["go", "build", "-o", "../dist/cadaide", "src/main.go"],
      path.join(process.cwd(), "build/launcher"),
    );

    await cmd.await().catch((e) => Promise.reject(e));
  }

  async #buildWindows() {
    const cmd1 = Shell.run(
      ["docker", "build", "-t", "cadaide-builder", "."],
      path.join(process.cwd(), "build/launcher"),
    );

    await cmd1.await().catch((e) => Promise.reject(e));

    const cmd2 = Shell.run(
      [
        "docker",
        "run",
        "--rm",
        "-v",
        `${path.join(process.cwd(), "build/dist")}:/app/build`,
        "cadaide-builder",
      ],
      path.join(process.cwd(), "build/launcher"),
    );

    await cmd2.await().catch((e) => Promise.reject(e));
  }
}
