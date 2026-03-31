const { contextBridge, ipcRenderer } = require("electron");

contextBridge.exposeInMainWorld("api", {
  fetch: (endpoint: string, options: any) =>
    ipcRenderer.invoke("api-request", endpoint, options),
});
