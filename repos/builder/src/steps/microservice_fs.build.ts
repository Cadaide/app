import path from "path";
import { BuildStep } from "../step";
import { Shell } from "../shell";
import { BuildConfig, Platform } from "../config";

export class MicroserviceFsBuild extends BuildStep {
  #msRoot: string;

  constructor() {
    super("microservice_fs.build");

    this.#msRoot = path.join(process.cwd(), "../microservices/fs");
  }

  async run() {
    await this.#build().catch((e) => this.logger.error(e));
  }

  async #build() {
    this.logger.info("Building fs microservice...");

    if (BuildConfig.platform == Platform.Macos) {
      console.log("Please run this on mac:");
      console.log("go build -o build/fs src/main.go");
      console.log(" - in " + this.#msRoot);
      console.log("Press enter when you are done.");

      await new Promise((resolve) => {
        process.stdin.once("data", resolve);
      });

      return;
    } else {
      const cmd = Shell.run(
        [
          "go",
          "build",
          "-o",
          `build/fs${BuildConfig.platform == Platform.Windows ? ".exe" : ""}`,
          "src/main.go",
        ],
        this.#msRoot,
        BuildConfig.platform == Platform.Windows
          ? { GOOS: "windows", GOARCH: "amd64" }
          : {},
      );

      await cmd.await().catch((e) => Promise.reject(e));
    }
  }
}
