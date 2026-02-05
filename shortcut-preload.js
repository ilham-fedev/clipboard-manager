const { contextBridge, ipcRenderer } = require("electron");

contextBridge.exposeInMainWorld("shortcutAPI", {
  getCurrentShortcut: () => ipcRenderer.invoke("get-current-shortcut"),
  saveShortcut: (accelerator) =>
    ipcRenderer.invoke("save-shortcut", accelerator),
  closeWindow: () => ipcRenderer.invoke("close-shortcut-window"),
});
