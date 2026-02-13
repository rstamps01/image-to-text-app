// Electron preload script - secure bridge between main and renderer processes
const { contextBridge, ipcRenderer } = require('electron');

// Expose protected methods to renderer process
contextBridge.exposeInMainWorld('electronAPI', {
  // File selection
  selectFiles: () => ipcRenderer.invoke('select-files'),
  
  // Export file save
  saveExport: (defaultFilename) => ipcRenderer.invoke('save-export', defaultFilename),
  
  // Show message box
  showMessage: (options) => ipcRenderer.invoke('show-message', options),
  
  // Listen for menu events
  onMenuNewProject: (callback) => {
    ipcRenderer.on('menu-new-project', callback);
  },
  
  onMenuImportImages: (callback) => {
    ipcRenderer.on('menu-import-images', (event, filePaths) => callback(filePaths));
  },
  
  // Platform info
  platform: process.platform,
  isElectron: true,
});

console.log('[Preload] Electron API exposed to renderer');
