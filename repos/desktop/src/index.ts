import { app, BrowserWindow, ipcMain, dialog } from "electron";
import { DiscordRPCModule } from "./modules/discord-rpc";
import path from "path";
import axios from "axios";
import { ModLauncher, ModLauncherProfile } from "./modules/mod-launcher";

const socketAxios = axios.create({
  baseURL: "http://localhost:3001",
  //socketPath: path.join(process.cwd(), "../backend/backend.sock"),
});

let rpcModule: DiscordRPCModule | null = null;

let feModLauncher: ModLauncher | null = null;
let beModLauncher: ModLauncher | null = null;

function createWindow() {
  const win = new BrowserWindow({
    width: 800,
    height: 600,
    autoHideMenuBar: true,
    webPreferences: {
      nodeIntegration: false,
      preload: path.join(app.getAppPath(), "dist/preload.js"),
      devTools: true,
    },
    frame: false,
  });

  win.loadURL("http://localhost:3000");
}

app.whenReady().then(() => {
  createWindow();

  rpcModule = new DiscordRPCModule();

  feModLauncher = new ModLauncher(ModLauncherProfile.Frontend);
  beModLauncher = new ModLauncher(ModLauncherProfile.Backend);

  app.on("activate", () => {
    if (BrowserWindow.getAllWindows().length === 0) createWindow();
  });
});

function cleanup() {
  feModLauncher?.kill();
  beModLauncher?.kill();

  feModLauncher = null;
  beModLauncher = null;
}

app.on("window-all-closed", () => {
  if (process.platform !== "darwin") {
    app.quit();
  }
});

app.on("will-quit", cleanup);

const exitSignals: NodeJS.Signals[] = [
  "SIGINT",
  "SIGTERM",
  "SIGQUIT",
  "SIGHUP",
];

exitSignals.forEach((signal) => {
  process.on(signal, () => {
    cleanup();

    process.exit(0);
  });
});

ipcMain.handle("api-request", async (event, endpoint, options) => {
  try {
    const response = await socketAxios({ url: endpoint, ...options });

    return { data: response.data, status: response.status };
  } catch (error: any) {
    return { error: error.message };
  }
});

ipcMain.handle("dialog:openDirectory", async () => {
  const { canceled, filePaths } = await dialog.showOpenDialog({
    properties: ["openDirectory"],
  });

  if (canceled) return null;
  else return filePaths[0];
});

ipcMain.handle("discord-rpc:setActivity", async (event, file: string) => {
  rpcModule?.setActivity(`Editing ${file}`);
});
