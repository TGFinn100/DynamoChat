const SPECIAL_KEY_MAP: Record<string, string> = {
  " ": "Space",
  Escape: "Esc",
  ArrowUp: "Up",
  ArrowDown: "Down",
  ArrowLeft: "Left",
  ArrowRight: "Right",
  Tab: "Tab",
  Backspace: "Backspace",
  Delete: "Delete",
  Home: "Home",
  End: "End",
  PageUp: "PageUp",
  PageDown: "PageDown",
  Insert: "Insert",
};

const MODIFIER_KEYS = new Set(["Control", "Alt", "Shift", "Meta"]);

function normalizeKey(key: string): string | null {
  if (/^F([1-9]|1[0-9]|2[0-4])$/.test(key)) return key;
  if (/^[0-9]$/.test(key)) return key;
  if (/^[a-zA-Z]$/.test(key)) return key.toUpperCase();
  if (key in SPECIAL_KEY_MAP) return SPECIAL_KEY_MAP[key];
  return null;
}

/**
 * Builds an Electron accelerator string from a keydown event, or returns
 * null if the event was just a modifier on its own (caller should keep
 * listening) or an unsupported key.
 */
export function captureAccelerator(e: KeyboardEvent): string | null {
  if (MODIFIER_KEYS.has(e.key)) {
    return null;
  }

  const key = normalizeKey(e.key);
  if (!key) {
    return null;
  }

  const parts: string[] = [];
  if (e.ctrlKey) parts.push("Control");
  if (e.altKey) parts.push("Alt");
  if (e.shiftKey) parts.push("Shift");
  if (e.metaKey) parts.push("Super");
  parts.push(key);
  return parts.join("+");
}
