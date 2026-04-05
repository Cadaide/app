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
  }

  async #downloadBun() {
    this.logger.info("Downloading bun...");

    const url =
      BuildConfig.platform == Platform.Windows
        ? "https://github.com/oven-sh/bun/releases/download/bun-v1.3.11/bun-windows-x64.zip"
        : "https://github.com/oven-sh/bun/releases/download/bun-v1.3.11/bun-linux-x64.zip";

    await this.#downloadAndUnzip(
      url,
      BuildConfig.platform == Platform.Windows
        ? "bun-windows-x64"
        : "bun-linux-x64",
      BuildConfig.platform == Platform.Windows ? "bun.exe" : "bun",
    ).catch((e) => Promise.reject(e));
  }

  async #downloadAndUnzip(url: string, folderName: string, fileName: string) {
    const zipTmpName = randomUUID() + ".zip";
    const zipTmpPath = path.join(this.#tmpDir, zipTmpName);

    const cmd = Shell.run(["curl", "-L", url, "-o", zipTmpPath], process.cwd());

    await cmd.await().catch((e) => Promise.reject(e));

    const unzipCmd = Shell.run(
      ["unzip", zipTmpPath, "-d", this.#tmpDir],
      process.cwd(),
    );

    await unzipCmd.await().catch((e) => Promise.reject(e));

    const bunPath = path.join(this.#tmpDir, folderName, fileName);
    const destPath = path.join(this.#binDir, fileName);

    await cp(bunPath, destPath).catch((e) => Promise.reject(e));
  }
}
