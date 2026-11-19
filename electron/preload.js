const { contextBridge, ipcRenderer } = require('electron');
contextBridge.exposeInMainWorld('mnemoNative', { toggleFullscreen: () => ipcRenderer.send('toggle-fullscreen') });
