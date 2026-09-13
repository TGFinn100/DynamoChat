import { app, autoUpdater, BrowserWindow, globalShortcut, ipcMain, screen } from 'electron';
import path from 'node:path';
import started from 'electron-squirrel-startup';
import { updateElectronApp } from 'update-electron-app';
import {
  HOTKEY_SETTINGS_GET,
  HOTKEY_SETTINGS_SET,
  HOTKEY_TOGGLE_MAIN,
  TOGGLE_MAIN_ACCELERATOR,
  type SetHotkeyResult,
} from './lib/hotkeyChannel';
import { DEEP_LINK_JOIN_ROOM, DEEP_LINK_PROTOCOL, extractRoomCodeFromArgs } from './lib/deepLink';
import { loadAccelerator, saveAccelerator } from './hotkeyPersistence';
import { UPDATE_RESTART_NOW, UPDATE_STATUS_CHANGED, type UpdateStatus } from './lib/updateChannel';
import { APP_GET_VERSION } from './lib/appInfoChannel';
import {
  OVERLAY_GAMES_STATUS_GET,
  OVERLAY_GAME_SET_WINDOWED,
  SUPPORTED_OVERLAY_GAMES,
} from './lib/overlayGameChannel';
import { getAllOverlayGameStatuses, setWindowedFullscreen } from './overlayGameConfig';
import { OVERLAY_DATA_UPDATE, type OverlayData } from './lib/overlayDataChannel';
import { isProcessRunning } from './processCheck';
import { STATS_GAMES_LIST, STATS_GET_FOR_GAME } from './lib/statsChannel';
import { listStatsGames, getStatsForGame } from './statsReader';
import { GAMES_RUNNING_LIST } from './lib/gamesRunningChannel';

// Handle creating/removing shortcuts on Windows when installing/uninstalling.
if (started) {
  app.quit();
}

function sendUpdateStatus(status: UpdateStatus): void {
  mainWindow?.webContents.send(UPDATE_STATUS_CHANGED, status);
}

// Only meaningful for a packaged install (Squirrel-installed), not `electron
// forge start` during dev - update-electron-app checks GitHub Releases for
// this repo and applies newer versions via Squirrel automatically. A prior
// update silently downloaded and applied with no visible sign anything was
// happening, and got interrupted when the app was closed mid-apply, leaving
// a broken partial install - these events drive an in-app banner so closing
// early is a deliberate choice, not an accident. notifyUser is off since the
// banner replaces update-electron-app's own native "restart?" dialog.
if (app.isPackaged) {
  autoUpdater.on('update-available', () => sendUpdateStatus({ state: 'downloading' }));
  autoUpdater.on('update-downloaded', () => sendUpdateStatus({ state: 'ready' }));
  autoUpdater.on('error', (err) => sendUpdateStatus({ state: 'error', message: err.message }));
  updateElectronApp({ notifyUser: false });
}

ipcMain.on(UPDATE_RESTART_NOW, () => {
  autoUpdater.quitAndInstall();
});

ipcMain.handle(APP_GET_VERSION, () => app.getVersion());

ipcMain.handle(OVERLAY_GAMES_STATUS_GET, () => getAllOverlayGameStatuses());
ipcMain.handle(OVERLAY_GAME_SET_WINDOWED, (_event, gameId: string, enabled: boolean) =>
  setWindowedFullscreen(gameId, enabled),
);

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

  // Only auto-open DevTools in dev - a packaged build shouldn't greet
  // friends with an inspector window every time they open the app.
  if (!app.isPackaged) {
    mainWindow.webContents.openDevTools();
  }

  // The overlay window has no frame, no taskbar entry, and no tray icon, so
  // if it outlives the main window there's nothing left for the user to
  // click to close it - the process would sit there running invisibly.
  mainWindow.on('closed', () => {
    overlayWindow?.close();
    overlayWindow = null;
    if (gamePollTimer) {
      clearInterval(gamePollTimer);
      gamePollTimer = null;
    }
  });

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

// Deliberately just a plain always-on-top window, not DirectX hooking/
// injection - that carries anti-cheat ban risk now that EAC is reportedly
// coming to RoN. This is only the OS compositor putting a window on top, so
// it depends on the game running in Windowed Fullscreen (see
// overlayGameConfig.ts); if RoN uses true exclusive fullscreen with
// Windows' "fullscreen optimizations" off, this will render behind the game
// or not show at all.
let overlayWindow: BrowserWindow | null = null;

function createOverlayWindow(): void {
  const { width, height } = screen.getPrimaryDisplay().bounds;
  overlayWindow = new BrowserWindow({
    x: 0,
    y: 0,
    width,
    height,
    show: false,
    transparent: true,
    frame: false,
    hasShadow: false,
    resizable: false,
    movable: false,
    skipTaskbar: true,
    fullscreenable: false,
    focusable: false,
    webPreferences: {
      contextIsolation: true,
    },
  });

  // 'screen-saver' is the topmost always-on-top level Windows offers - this
  // is the level overlay tools use to have any chance of beating an
  // exclusive-fullscreen app's swap chain without hooking it.
  overlayWindow.setAlwaysOnTop(true, 'screen-saver');
  overlayWindow.setIgnoreMouseEvents(true, { forward: true });
  overlayWindow.setVisibleOnAllWorkspaces(true, { visibleOnFullScreen: true });

  const html = `<html><head><style>
      body { margin: 0; background: transparent; font-family: system-ui, sans-serif; }
      #overlay-root {
        position: fixed; top: 24px; right: 24px; min-width: 200px;
        background: rgba(20, 20, 20, 0.25); color: #fff;
        border-radius: 10px; padding: 12px 16px;
      }
      #my-channel { font-size: 17px; font-weight: 700; margin-bottom: 6px; }
      .roster-row {
        display: flex; justify-content: space-between; gap: 14px;
        padding: 2px 0; font-size: 13px; opacity: 0.75;
      }
      .roster-row.speaking { opacity: 1; color: #7CFC9A; }
      .roster-row .chan { opacity: 0.65; font-size: 11px; }
    </style></head>
    <body>
      <div id="overlay-root">
        <div id="my-channel">Not connected</div>
        <div id="roster"></div>
      </div>
      <script>
        function esc(s) {
          return String(s).replace(/[&<>"']/g, function (c) {
            return { '&': '&amp;', '<': '&lt;', '>': '&gt;', '"': '&quot;', "'": '&#39;' }[c];
          });
        }
        window.renderOverlay = function (data) {
          document.getElementById('my-channel').textContent =
            data.myChannel ? 'You: ' + data.myChannel : 'Not connected';
          document.getElementById('roster').innerHTML = (data.participants || [])
            .map(function (p) {
              var cls = 'roster-row' + (p.speaking ? ' speaking' : '');
              var label = esc(p.name) + (p.isLocal ? ' (you)' : '');
              return '<div class="' + cls + '"><span>' + label + '</span>'
                + '<span class="chan">' + esc(p.channel) + '</span></div>';
            })
            .join('');
        };
      </script>
    </body></html>`;
  overlayWindow.loadURL(`data:text/html,${encodeURIComponent(html)}`);
}

function pushOverlayData(data: OverlayData): void {
  if (!overlayWindow) return;
  // Base64-encode so the payload never has to be escaped for embedding in a
  // JS string literal - avoids fighting quote/backslash/line-separator edge
  // cases in player-supplied display names.
  const payload = Buffer.from(JSON.stringify(data), 'utf-8').toString('base64');
  overlayWindow.webContents
    .executeJavaScript(`renderOverlay(JSON.parse(atob("${payload}")))`)
    .catch(() => {
      // Overlay window may not have finished loading yet - the next update
      // will simply supersede this one.
    });
}

ipcMain.on(OVERLAY_DATA_UPDATE, (_event, data: OverlayData) => pushOverlayData(data));

ipcMain.handle(STATS_GAMES_LIST, () => listStatsGames());
ipcMain.handle(STATS_GET_FOR_GAME, (_event, gameId: string) => getStatsForGame(gameId));

ipcMain.handle(GAMES_RUNNING_LIST, async () => {
  const running: string[] = [];
  for (const game of SUPPORTED_OVERLAY_GAMES) {
    if (await isProcessRunning(game.processName)) running.push(game.id);
  }
  return running;
});

// Only show the overlay while a supported game is actually running - it has
// no close button of its own, so leaving it visible over the desktop the
// rest of the time would just be a floating nuisance.
const GAME_POLL_INTERVAL_MS = 3000;
let gamePollTimer: ReturnType<typeof setInterval> | null = null;

function startGamePolling(): void {
  gamePollTimer = setInterval(() => {
    void (async () => {
      if (!overlayWindow) return;
      const runningChecks = await Promise.all(
        SUPPORTED_OVERLAY_GAMES.map((g) => isProcessRunning(g.processName)),
      );
      const anyRunning = runningChecks.some(Boolean);
      if (anyRunning && !overlayWindow.isVisible()) {
        overlayWindow.showInactive();
      } else if (!anyRunning && overlayWindow.isVisible()) {
        overlayWindow.hide();
      }
    })();
  }, GAME_POLL_INTERVAL_MS);
}

// Electron's globalShortcut has no press/release distinction, so holding the
// key re-fires it at the OS's key-repeat rate (observed ~1/sec on Windows
// defaults). This cooldown can't give true release-detection - a deliberate
// double-tap within the window is also swallowed - but it keeps a held key
// from spamming repeated toggles. True release-detection would need a
// lower-level global keyboard hook (e.g. uiohook-napi), deliberately avoided
// here since it's more likely to draw anti-cheat scrutiny than globalShortcut.
const TOGGLE_COOLDOWN_MS = 1200;
let lastToggleAt = 0;
let currentAccelerator = TOGGLE_MAIN_ACCELERATOR;

function registerToggleShortcut(accelerator: string): boolean {
  return globalShortcut.register(accelerator, () => {
    const now = Date.now();
    if (now - lastToggleAt < TOGGLE_COOLDOWN_MS) {
      return;
    }
    lastToggleAt = now;
    mainWindow?.webContents.send(HOTKEY_TOGGLE_MAIN);
  });
}

function registerChannelHotkeys(): void {
  currentAccelerator = loadAccelerator();
  const ok = registerToggleShortcut(currentAccelerator);
  if (!ok) {
    console.warn(`Failed to register global shortcut: ${currentAccelerator}`);
  }
}

ipcMain.handle(HOTKEY_SETTINGS_GET, () => currentAccelerator);

ipcMain.handle(HOTKEY_SETTINGS_SET, (_event, newAccelerator: string): SetHotkeyResult => {
  globalShortcut.unregister(currentAccelerator);
  const ok = registerToggleShortcut(newAccelerator);
  if (ok) {
    currentAccelerator = newAccelerator;
    saveAccelerator(newAccelerator);
    return { success: true };
  }
  // Re-register the old binding since the new one failed - leaving no
  // hotkey registered at all would be worse than keeping the previous one.
  registerToggleShortcut(currentAccelerator);
  return {
    success: false,
    error: 'That key is already in use by another application.',
  };
});

// This method will be called when Electron has finished
// initialization and is ready to create browser windows.
// Some APIs can only be used after this event occurs.
if (gotSingleInstanceLock) {
  app.on('ready', () => {
    createWindow();
    registerChannelHotkeys();
    createOverlayWindow();
    startGamePolling();
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
