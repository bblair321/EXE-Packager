const { contextBridge, ipcRenderer } = require('electron');

// Expose protected methods that allow the renderer process
// to use ipcRenderer without exposing the entire object

contextBridge.exposeInMainWorld('electronAPI', {
  selectFolder: () => ipcRenderer.invoke('select-folder'),
  selectOutputFolder: () => ipcRenderer.invoke('select-output-folder'),
  createInstaller: (options) => ipcRenderer.invoke('create-installer', options),
  openFolder: (folderPath) => ipcRenderer.invoke('open-folder', folderPath),
  onPackagingProgress: (callback) => {
    ipcRenderer.on('packaging-progress', (event, progress) => callback(progress));
  },
  removeProgressListener: () => {
    ipcRenderer.removeAllListeners('packaging-progress');
  }
});

