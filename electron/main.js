// MNEMO — janela do aplicativo de desktop
const { app, BrowserWindow, ipcMain, Menu, shell } = require('electron');
const path = require('path');

let win;
function create() {
  win = new BrowserWindow({
    width: 1366, height: 820, minWidth: 900, minHeight: 600,
    backgroundColor: '#0b0820', title: 'MNEMO', show: false, autoHideMenuBar: true,
    icon: path.join(__dirname, '..', 'assets', 'icon.png'),
    webPreferences: { preload: path.join(__dirname, 'preload.js'), contextIsolation: true, nodeIntegration: false, backgroundThrottling: false },
  });
  Menu.setApplicationMenu(null);
  win.loadFile(path.join(__dirname, '..', 'index.html'));
  win.once('ready-to-show', () => { win.maximize(); win.show(); });
  win.webContents.setWindowOpenHandler(({ url }) => { shell.openExternal(url); return { action: 'deny' }; });
}
ipcMain.on('toggle-fullscreen', () => { if (win) win.setFullScreen(!win.isFullScreen()); });

const single = app.requestSingleInstanceLock();
if (!single) app.quit();
else {
  app.on('second-instance', () => { if (win) { if (win.isMinimized()) win.restore(); win.focus(); } });
  app.whenReady().then(create);
  app.on('window-all-closed', () => app.quit());
}
