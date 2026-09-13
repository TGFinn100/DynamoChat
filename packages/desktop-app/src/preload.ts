// See the Electron documentation for details on how to use preload scripts:
// https://www.electronjs.org/docs/latest/tutorial/process-model#preload-scripts

import { contextBridge, ipcRenderer } from 'electron';
import {
  HOTKEY_SETTINGS_GET,
  HOTKEY_SETTINGS_SET,
  HOTKEY_TOGGLE_MAIN,
  type SetHotkeyResult,
} from './lib/hotkeyChannel';
import { DEEP_LINK_JOIN_ROOM } from './lib/deepLink';
import { UPDATE_RESTART_NOW, UPDATE_STATUS_CHANGED, type UpdateStatus } from './lib/updateChannel';
import { APP_GET_VERSION } from './lib/appInfoChannel';
import {
  OVERLAY_GAMES_STATUS_GET,
  OVERLAY_GAME_SET_WINDOWED,
  type OverlayGameStatus,
  type SetWindowedFullscreenResult,
} from './lib/overlayGameChannel';
import { OVERLAY_DATA_UPDATE, type OverlayData } from './lib/overlayDataChannel';
import {
  STATS_GAMES_LIST,
  STATS_GET_FOR_GAME,
  type StatsGameInfo,
  type GetStatsResult,
} from './lib/statsChannel';
import { GAMES_RUNNING_LIST } from './lib/gamesRunningChannel';

contextBridge.exposeInMainWorld('hotkeys', {
  onToggleMain(callback: () => void): () => void {
    const listener = () => callback();
    ipcRenderer.on(HOTKEY_TOGGLE_MAIN, listener);
    return () => ipcRenderer.removeListener(HOTKEY_TOGGLE_MAIN, listener);
  },
});

contextBridge.exposeInMainWorld('hotkeySettings', {
  get(): Promise<string> {
    return ipcRenderer.invoke(HOTKEY_SETTINGS_GET);
  },
  set(accelerator: string): Promise<SetHotkeyResult> {
    return ipcRenderer.invoke(HOTKEY_SETTINGS_SET, accelerator);
  },
});

contextBridge.exposeInMainWorld('deepLink', {
  onJoinRoom(callback: (roomCode: string) => void): () => void {
    const listener = (_event: Electron.IpcRendererEvent, roomCode: string) =>
      callback(roomCode);
    ipcRenderer.on(DEEP_LINK_JOIN_ROOM, listener);
    return () => ipcRenderer.removeListener(DEEP_LINK_JOIN_ROOM, listener);
  },
});

contextBridge.exposeInMainWorld('updateStatus', {
  onStatusChange(callback: (status: UpdateStatus) => void): () => void {
    const listener = (_event: Electron.IpcRendererEvent, status: UpdateStatus) =>
      callback(status);
    ipcRenderer.on(UPDATE_STATUS_CHANGED, listener);
    return () => ipcRenderer.removeListener(UPDATE_STATUS_CHANGED, listener);
  },
  restartNow(): void {
    ipcRenderer.send(UPDATE_RESTART_NOW);
  },
});

contextBridge.exposeInMainWorld('appInfo', {
  getVersion(): Promise<string> {
    return ipcRenderer.invoke(APP_GET_VERSION);
  },
});

contextBridge.exposeInMainWorld('overlayData', {
  update(data: OverlayData): void {
    ipcRenderer.send(OVERLAY_DATA_UPDATE, data);
  },
});

contextBridge.exposeInMainWorld('gameStats', {
  listGames(): Promise<StatsGameInfo[]> {
    return ipcRenderer.invoke(STATS_GAMES_LIST);
  },
  getStats(gameId: string): Promise<GetStatsResult> {
    return ipcRenderer.invoke(STATS_GET_FOR_GAME, gameId);
  },
});

contextBridge.exposeInMainWorld('gamesRunning', {
  list(): Promise<string[]> {
    return ipcRenderer.invoke(GAMES_RUNNING_LIST);
  },
});

contextBridge.exposeInMainWorld('overlayGames', {
  getStatuses(): Promise<OverlayGameStatus[]> {
    return ipcRenderer.invoke(OVERLAY_GAMES_STATUS_GET);
  },
  setWindowedFullscreen(gameId: string, enabled: boolean): Promise<SetWindowedFullscreenResult> {
    return ipcRenderer.invoke(OVERLAY_GAME_SET_WINDOWED, gameId, enabled);
  },
});
