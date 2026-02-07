const { contextBridge, ipcRenderer } = require('electron');

contextBridge.exposeInMainWorld('clipboardAPI', {
  // Get clipboard history
  getHistory: () => ipcRenderer.invoke('get-history'),

  // Get settings
  getSettings: () => ipcRenderer.invoke('get-settings'),

  // Paste an item
  pasteItem: (content) => ipcRenderer.invoke('paste-item', content),

  // Delete an item
  deleteItem: (id) => ipcRenderer.invoke('delete-item', id),

  // Toggle pin on an item
  togglePin: (id) => ipcRenderer.invoke('toggle-pin', id),

  // Close window
  closeWindow: () => ipcRenderer.invoke('close-window'),

  // Listen for history updates
  onUpdateHistory: (callback) => {
    ipcRenderer.on('update-history', (event, history) => callback(history));
  },

  // Listen for settings updates
  onUpdateSettings: (callback) => {
    ipcRenderer.on('update-settings', (event, settings) => callback(settings));
  }
});
