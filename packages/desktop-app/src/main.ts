import { app, BrowserWindow, globalShortcut } from 'electron';
import path from 'node:path';
import started from 'electron-squirrel-startup';
import { updateElectronApp } from 'update-electron-app';
import { HOTKEY_TOGGLE_MAIN, TOGGLE_MAIN_ACCELERATOR } from './lib/hotkeyChannel';
import { DEEP_LINK_JOIN_ROOM, DEEP_LINK_PROTOCOL, extractRoomCodeFromArgs } from './lib/deepLink';

// Handle creating/removing shortcuts on Windows when installing/uninstalling.
if (started) {
  app.quit();
}

// Only meaningful for a packaged install (Squirrel-installed), not `electron
// forge start` during dev - update-electron-app checks GitHub Releases for
// this repo and applies newer versions via Squirrel automatically.
if (app.isPackaged) {
  updateElectronApp();
}

// A protocol link launches a whole new process on Windows; without a single
// instance lock every click would open a duplicate window instead of routing
// into the one already running. If this instance loses the race, quit
// immediately rather than also registering windows/listeners it'll never use.
const gotSingleInstanceLock = app.requestSingleInstanceLock();
if (!gotSingleInstanceLock) {
  app.quit();
}

let mainWindow: BrowserWindow | null = null;

if (gotSingleInstanceLock) {
  if (process.defaultApp) {
    if (process.argv.length >= 2) {
      app.setAsDefaultProtocolClient(DEEP_LINK_PROTOCOL, process.execPath, [
        path.resolve(process.argv[1]),
      ]);
    }
  } else {
    app.setAsDefaultProtocolClient(DEEP_LINK_PROTOCOL);
  }

  app.on('second-instance', (_event, argv) => {
    if (mainWindow) {
      if (mainWindow.isMinimized()) mainWindow.restore();
      mainWindow.focus();
    }
    const roomCode = extractRoomCodeFromArgs(argv);
    if (roomCode) {
      mainWindow?.webContents.send(DEEP_LINK_JOIN_ROOM, roomCode);
    }
  });
}

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

  // A cold start via protocol link passes the URL in argv; wait for the page
  // to actually load before sending it, or the renderer's listener won't be
  // attached yet and the message is silently lost.
  mainWindow.webContents.once('did-finish-load', () => {
    const roomCode = extractRoomCodeFromArgs(process.argv);
    if (roomCode) {
      mainWindow?.webContents.send(DEEP_LINK_JOIN_ROOM, roomCode);
    }
  });
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
if (gotSingleInstanceLock) {
  app.on('ready', () => {
    createWindow();
    registerChannelHotkeys();
  });
}

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
