import type { SetHotkeyResult } from "./lib/hotkeyChannel";
import type { UpdateStatus } from "./lib/updateChannel";

declare global {
  interface Window {
    hotkeys: {
      onToggleMain: (callback: () => void) => () => void;
    };
    hotkeySettings: {
      get: () => Promise<string>;
      set: (accelerator: string) => Promise<SetHotkeyResult>;
    };
    deepLink: {
      onJoinRoom: (callback: (roomCode: string) => void) => () => void;
    };
    updateStatus: {
      onStatusChange: (callback: (status: UpdateStatus) => void) => () => void;
      restartNow: () => void;
    };
    appInfo: {
      getVersion: () => Promise<string>;
    };
  }
}

export {};
