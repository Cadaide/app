import { spawn, type ChildProcess } from "child_process";
import path from "path";
import { app } from "electron";

export enum ModLauncherProfile {
  Backend = "backend",
  Frontend = "frontend",
}

const isProd = app.isPackaged;

function getResourcesPath(): string {
  return app.isPackaged
    ? app.getAppPath().replace("app.asar", "app.asar.unpacked")
    : process.cwd();
}

const configurations: {
  [key in ModLauncherProfile]: {
    command: string;
    args: string[];
    cwd: string;
    env?: NodeJS.ProcessEnv;
  };
} = {
  [ModLauncherProfile.Backend]: isProd
    ? {
        command: "node",
        args: ["dist/main"],
        cwd: path.join(getResourcesPath(), "resources/backend"),
        env: {
          ...process.env,
          PATH: `${process.env.PATH};${path.join(getResourcesPath(), "resources/binaries")}`,
          NODE_ENV: "production",
          FS_BINARY_PATH: path.join(
            getResourcesPath(),
            "resources/binaries/microservices/fs.exe",
          ),
        },
      }
    : {
        command: "bun",
        args: ["run", "start:dev"],
        cwd: path.join(process.cwd(), "../backend"),
        env: {
          ...process.env,
          FS_BINARY_PATH: path.join(
            process.cwd(),
            "../microservices/fs/build/fs",
          ),
        },
      },
  [ModLauncherProfile.Frontend]: isProd
    ? {
        command: "node",
        args: [".next/standalone/server.js"],
        cwd: path.join(getResourcesPath(), "resources/frontend"),
        env: {
          ...process.env,
          PATH: `${process.env.PATH};${path.join(getResourcesPath(), "resources/binaries")}`,
          NODE_ENV: "production",
          HOSTNAME: "127.0.0.1",
        },
      }
    : {
        command: "bun",
        args: ["run", "dev"],
        cwd: path.join(process.cwd(), "../frontend"),
      },
};

export class ModLauncher {
  #process: ChildProcess | null = null;

  constructor(profile: ModLauncherProfile) {
    const { command, args, cwd, env } = configurations[profile];

    this.#process = spawn(command, args, {
      cwd,
      env: env ?? process.env,
      detached: true,
      stdio: "inherit",
    });

    this.#process.on("error", (error) => {
      console.error("Failed to start " + profile + ":", error);
    });

    this.#process.on("exit", (code) => {
      console.log(profile + " exited with code " + code);
    });
  }

  public kill() {
    if (this.#process?.pid) {
      try {
        process.kill(-this.#process.pid, "SIGTERM");
      } catch {
        this.#process.kill("SIGTERM");
      }
    }

    this.#process = null;
  }
}
