declare global {
  interface Window {
    hotkeys: {
      onToggleMain: (callback: () => void) => () => void;
    };
  }
}

export {};
