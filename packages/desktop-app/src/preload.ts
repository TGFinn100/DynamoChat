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
