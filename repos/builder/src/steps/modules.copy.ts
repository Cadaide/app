import path from "path";
import { BuildStep } from "../step";
import { cp, exists, mkdir, stat } from "fs/promises";
import { BuildConfig, Platform } from "../config";

const CopyMap = {
  "../frontend/package.json": "frontend/",
  "../frontend/.next/standalone": "frontend/",
  "../frontend/.next/static": "frontend/.next/static/",
  "../frontend/public": "frontend/public/",

  "../backend/package.json": "backend/",
  "../backend/dist": "backend/",

  "../microservices/fs/go.mod": "microservices/fs/",
  [`../microservices/fs/build/fs${BuildConfig.platform == Platform.Windows ? ".exe" : ""}`]:
    "microservices/fs/",

  [`../desktop/build/cadaide${BuildConfig.platform == Platform.Windows ? ".exe" : ""}`]:
    "desktop/",
};

export class ModulesCopy extends BuildStep {
  #modulesRoot: string;

  constructor() {
    super("modules.copy");
    this.#modulesRoot = path.join(process.cwd(), "build/pkg");
  }

  async run() {
    await this.#copyModules().catch((e) => this.logger.error(e));
  }

  async #copyModules() {
    this.logger.info("Copying modules...");

    for (const [src, dest] of Object.entries(CopyMap)) {
      const srcPath = path.join(process.cwd(), src);
      const destPath = path.join(this.#modulesRoot, dest);

      const srcExists = await exists(srcPath);
      if (!srcExists) continue;

      this.logger.info(`Copying ${src} to ${dest}...`);

      await mkdir(destPath, { recursive: true });

      const srcStat = await stat(srcPath);
      const resolvedDest = srcStat.isFile()
        ? path.join(destPath, path.basename(srcPath))
        : destPath;

      await cp(srcPath, resolvedDest, { recursive: true });
    }
  }
}
