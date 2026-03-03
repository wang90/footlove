const { contextBridge, ipcRenderer } = require("electron");

contextBridge.exposeInMainWorld("desktopApi", {
    getJson: (url) => ipcRenderer.invoke("http:get-json", url)
});
