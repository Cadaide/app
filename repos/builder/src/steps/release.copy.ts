import path from "path";
import { BuildStep } from "../step";
import { chmod, cp, exists, mkdir, rm, writeFile } from "fs/promises";
import { BuildConfig, Platform } from "../config";
import { Shell } from "../shell";

export class ReleaseCopy extends BuildStep {
  #releaseDir = path.join(process.cwd(), "../../release");
  #buildDir = path.join(process.cwd(), "build");
  #tmpDir = path.join(process.cwd(), "build/tmp");

  constructor() {
    super("release.copy");
  }

  async run() {
    await this.#deleteDir().catch((e) => this.logger.error(e));
    await this.#makeDir().catch((e) => this.logger.error(e));

    this.logger.info("Copying release...");
    await this.#copy().catch((e) => this.logger.error(e));
  }

  async #deleteDir() {
    if (!(await exists(this.#releaseDir))) {
      return;
    }

    this.logger.info("Deleting release directory...");

    await rm(this.#releaseDir, { recursive: true, force: true }).catch((e) =>
      Promise.reject(e),
    );
  }

  async #makeDir() {
    this.logger.info("Making release directory...");

    await mkdir(this.#releaseDir, { recursive: true }).catch((e) =>
      Promise.reject(e),
    );
  }

  async #copy() {
    switch (BuildConfig.platform) {
      case Platform.Linux:
        await this.#copyLinux().catch((e) => Promise.reject(e));
        break;
      default:
        break;
    }
  }

  async #copyLinux() {
    await this.#copyPkgZip().catch((e) => Promise.reject(e));
    await this.#createAppimage().catch((e) => Promise.reject(e));
  }

  async #createAppimage() {
    this.logger.info("Creating AppImage...");

    const dirPath = path.join(this.#tmpDir, "Cadaide.AppDir");
    await mkdir(dirPath, { recursive: true }).catch((e) => Promise.reject(e));

    const pkgSrc = path.join(this.#buildDir, "pkg");
    const binSrc = path.join(this.#buildDir, "bin");
    await cp(pkgSrc, path.join(dirPath, "pkg"), { recursive: true }).catch(
      (e) => Promise.reject(e),
    );
    await cp(binSrc, path.join(dirPath, "bin"), { recursive: true }).catch(
      (e) => Promise.reject(e),
    );

    const desktopSrc = path.join(
      this.#releaseDir,
      "../resources/cadaide.desktop",
    );
    const desktopDest = path.join(dirPath, "cadaide.desktop");

    await cp(desktopSrc, desktopDest).catch((e) => Promise.reject(e));

    const iconSrc = path.join(this.#releaseDir, "../resources/icon.png");
    const iconDest = path.join(dirPath, "cadaide.png");

    await cp(iconSrc, iconDest).catch((e) => Promise.reject(e));

    await writeFile(
      path.join(dirPath, "AppRun"),
      `#!/usr/bin/env bash

      SELF=$(readlink -f "$0")
      HERE=$(dirname "$SELF")

      cd "$HERE"/pkg/desktop
      ./cadaide
      `,
    ).catch((e) => Promise.reject(e));

    await chmod(path.join(dirPath, "AppRun"), 0o755).catch((e) =>
      Promise.reject(e),
    );

    await Shell.run(
      ["bun", "install", "--frozen-lockfile", "--production"],
      path.join(dirPath, "pkg/backend"),
    )
      .await()
      .catch((e) => Promise.reject(e));

    await Shell.run(
      ["bun", "pm", "cache", "clean", "--all"],
      path.join(dirPath, "pkg/backend"),
    )
      .await()
      .catch((e) => Promise.reject(e));

    await Shell.run(
      [
        "appimagetool",
        dirPath,
        path.join(
          this.#releaseDir,
          `cadaide_${BuildConfig.version}_${BuildConfig.platform}.AppImage`,
        ),
      ],
      dirPath,
      {
        ARCH: "x86_64",
      },
    )
      .await()
      .catch((e) => Promise.reject(e));
  }

  async #copyPkgZip() {
    this.logger.info("Copying pkg.zip...");

    const src = path.join(this.#buildDir, "pkg.zip");
    const dest = path.join(
      this.#releaseDir,
      `cadaide_${BuildConfig.version}_${BuildConfig.platform}.zip`,
    );

    await cp(src, dest).catch((e) => Promise.reject(e));
  }
}
