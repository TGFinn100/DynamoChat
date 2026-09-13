// See the Electron documentation for details on how to use preload scripts:
// https://www.electronjs.org/docs/latest/tutorial/process-model#preload-scripts

import { contextBridge, ipcRenderer } from 'electron';
import { HOTKEY_TOGGLE_MAIN } from './lib/hotkeyChannel';

contextBridge.exposeInMainWorld('hotkeys', {
  onToggleMain(callback: () => void): () => void {
    const listener = () => callback();
    ipcRenderer.on(HOTKEY_TOGGLE_MAIN, listener);
    return () => ipcRenderer.removeListener(HOTKEY_TOGGLE_MAIN, listener);
  },
});
