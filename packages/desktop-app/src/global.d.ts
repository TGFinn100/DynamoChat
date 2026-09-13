declare global {
  interface Window {
    hotkeys: {
      onToggleMain: (callback: () => void) => () => void;
    };
    deepLink: {
      onJoinRoom: (callback: (roomCode: string) => void) => () => void;
    };
  }
}

export {};
