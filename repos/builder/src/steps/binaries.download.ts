import { cp, writeFile } from "fs/promises";
import { BuildStep } from "../step";
import path from "path";
import { Shell } from "../shell";
import { randomUUID } from "crypto";
import { BuildConfig, Platform } from "../config";

export class BinariesDownload extends BuildStep {
  #tmpDir: string;
  #binDir: string;

  constructor() {
    super("binaries.download");

    this.#tmpDir = path.join(process.cwd(), "build/tmp");
    this.#binDir = path.join(process.cwd(), "build/bin");
  }

  async run() {
    await this.#downloadBun().catch((e) => this.logger.error(e));
    await this.#downloadNode().catch((e) => this.logger.error(e));
  }

  async #downloadBun() {
    this.logger.info("Downloading bun...");

    const url =
      BuildConfig.platform == Platform.Windows
        ? "https://github.com/oven-sh/bun/releases/download/bun-v1.3.11/bun-windows-x64.zip"
        : BuildConfig.platform == Platform.Linux
          ? "https://github.com/oven-sh/bun/releases/download/bun-v1.3.11/bun-linux-x64.zip"
          : "https://github.com/oven-sh/bun/releases/download/bun-v1.0.25/bun-darwin-x64.zip";

    await this.#downloadAndExtract(
      url,
      BuildConfig.platform == Platform.Windows
        ? "bun-windows-x64"
        : BuildConfig.platform == Platform.Linux
          ? "bun-linux-x64"
          : "bun-darwin-x64",
      BuildConfig.platform == Platform.Windows ? "bun.exe" : "bun",
    ).catch((e) => Promise.reject(e));
  }

  async #downloadNode() {
    this.logger.info("Downloading node...");

    const url =
      BuildConfig.platform == Platform.Windows
        ? "https://nodejs.org/dist/v22.19.0/node-v22.19.0-win-x64.zip"
        : BuildConfig.platform == Platform.Linux
          ? "https://nodejs.org/dist/v22.19.0/node-v22.19.0-linux-x64.tar.xz"
          : "https://nodejs.org/dist/v22.19.0/node-v22.19.0-darwin-x64.tar.xz";

    await this.#downloadAndExtract(
      url,
      BuildConfig.platform == Platform.Windows
        ? "node-v22.19.0-win-x64"
        : BuildConfig.platform == Platform.Linux
          ? path.join("node-v22.19.0-linux-x64", "bin")
          : path.join("node-v22.19.0-darwin-x64", "bin"),
      BuildConfig.platform == Platform.Windows ? "node.exe" : "node",
    ).catch((e) => Promise.reject(e));
  }

  async #downloadAndExtract(url: string, folderName: string, fileName: string) {
    const isTar = url.endsWith(".tar.xz") || url.endsWith(".tar.gz");
    const ext = isTar ? (url.endsWith(".tar.xz") ? ".tar.xz" : ".tar.gz") : ".zip";
    const tmpName = randomUUID() + ext;
    const tmpPath = path.join(this.#tmpDir, tmpName);

    const cmd = Shell.run(["curl", "-L", url, "-o", tmpPath], process.cwd());

    await cmd.await().catch((e) => Promise.reject(e));

    if (isTar) {
      const tarCmd = Shell.run(
        ["tar", "-xf", tmpPath, "-C", this.#tmpDir],
        process.cwd(),
      );
      await tarCmd.await().catch((e) => Promise.reject(e));
    } else {
      const unzipCmd = Shell.run(
        ["unzip", tmpPath, "-d", this.#tmpDir],
        process.cwd(),
      );
      await unzipCmd.await().catch((e) => Promise.reject(e));
    }

    const extractedPath = path.join(this.#tmpDir, folderName, fileName);
    const destPath = path.join(this.#binDir, fileName);

    await cp(extractedPath, destPath).catch((e) => Promise.reject(e));
  }
}
