import { app, BrowserWindow, globalShortcut } from 'electron';
import path from 'node:path';
import started from 'electron-squirrel-startup';
import { HOTKEY_TOGGLE_MAIN, TOGGLE_MAIN_ACCELERATOR } from './lib/hotkeyChannel';

// Handle creating/removing shortcuts on Windows when installing/uninstalling.
if (started) {
  app.quit();
}

let mainWindow: BrowserWindow | null = null;

const createWindow = () => {
  // Create the browser window.
  mainWindow = new BrowserWindow({
    width: 800,
    height: 600,
    webPreferences: {
      preload: path.join(__dirname, 'preload.js'),
    },
  });

  // and load the index.html of the app.
  if (MAIN_WINDOW_VITE_DEV_SERVER_URL) {
    mainWindow.loadURL(MAIN_WINDOW_VITE_DEV_SERVER_URL);
  } else {
    mainWindow.loadFile(
      path.join(__dirname, `../renderer/${MAIN_WINDOW_VITE_NAME}/index.html`),
    );
  }

  // Open the DevTools.
  mainWindow.webContents.openDevTools();
};

// Electron's globalShortcut has no press/release distinction, so holding the
// key re-fires it at the OS's key-repeat rate (observed ~1/sec on Windows
// defaults). This cooldown can't give true release-detection - a deliberate
// double-tap within the window is also swallowed - but it keeps a held key
// from spamming repeated toggles. True release-detection would need a
// lower-level global keyboard hook (e.g. uiohook-napi), deliberately avoided
// here since it's more likely to draw anti-cheat scrutiny than globalShortcut.
const TOGGLE_COOLDOWN_MS = 1200;
let lastToggleAt = 0;

function registerChannelHotkeys(): void {
  const ok = globalShortcut.register(TOGGLE_MAIN_ACCELERATOR, () => {
    const now = Date.now();
    if (now - lastToggleAt < TOGGLE_COOLDOWN_MS) {
      return;
    }
    lastToggleAt = now;
    mainWindow?.webContents.send(HOTKEY_TOGGLE_MAIN);
  });
  if (!ok) {
    console.warn(`Failed to register global shortcut: ${TOGGLE_MAIN_ACCELERATOR}`);
  }
}

// This method will be called when Electron has finished
// initialization and is ready to create browser windows.
// Some APIs can only be used after this event occurs.
app.on('ready', () => {
  createWindow();
  registerChannelHotkeys();
});

app.on('will-quit', () => {
  globalShortcut.unregisterAll();
});

// Quit when all windows are closed, except on macOS. There, it's common
// for applications and their menu bar to stay active until the user quits
// explicitly with Cmd + Q.
app.on('window-all-closed', () => {
  if (process.platform !== 'darwin') {
    app.quit();
  }
});

app.on('activate', () => {
  // On OS X it's common to re-create a window in the app when the
  // dock icon is clicked and there are no other windows open.
  if (BrowserWindow.getAllWindows().length === 0) {
    createWindow();
  }
});

// In this file you can include the rest of your app's specific main process
// code. You can also put them in separate files and import them here.
