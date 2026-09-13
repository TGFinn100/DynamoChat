import type { SetHotkeyResult } from "./lib/hotkeyChannel";

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
  }
}

export {};
