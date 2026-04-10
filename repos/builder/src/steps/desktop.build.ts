import path from "path";
import { BuildStep } from "../step";
import { Shell } from "../shell";
import { BuildConfig, Platform } from "../config";

export class DesktopBuild extends BuildStep {
  #desktopRoot: string;

  constructor() {
    super("desktop.build");

    this.#desktopRoot = path.join(process.cwd(), "../desktop");
  }

  async run() {
    await this.#build().catch((e) => this.logger.error(e));
  }

  async #build() {
    switch (BuildConfig.platform) {
      case Platform.Linux:
        await this.#buildLinux().catch((e) => Promise.reject(e));
        break;
      case Platform.Windows:
        await this.#buildWindows().catch((e) => Promise.reject(e));
        break;
      case Platform.Macos:
        await this.#buildMacos().catch((e) => Promise.reject(e));
        break;
    }
  }

  async #buildLinux() {
    this.logger.info("Building desktop...");

    const cmd = Shell.run(
      ["go", "build", "-o", "build/cadaide", "src/main.go"],
      this.#desktopRoot,
    );

    await cmd.await().catch((e) => Promise.reject(e));
  }

  async #buildMacos() {
    this.logger.info("Building desktop...");

    console.log("Please run this on mac:");
    console.log("go build -o build/cadaide src/main.go");
    console.log(" - in " + this.#desktopRoot);
    console.log("Press enter when you are done.");

    await new Promise((resolve) => {
      process.stdin.once("data", resolve);
    });
  }

  async #buildWindows() {
    this.logger.info("Building desktop...");

    const cmd1 = Shell.run(
      ["docker", "build", "-t", "cadaide-builder", "."],
      this.#desktopRoot,
    );

    await cmd1.await().catch((e) => Promise.reject(e));

    const cmd2 = Shell.run(
      [
        "docker",
        "run",
        "--rm",
        "-v",
        `${this.#desktopRoot}/build:/app/build`,
        "cadaide-builder",
      ],
      this.#desktopRoot,
    );

    await cmd2.await().catch((e) => Promise.reject(e));
  }
}
