export const HOTKEY_TOGGLE_MAIN = "hotkey:toggle-main";
export const TOGGLE_MAIN_ACCELERATOR = "F1";

export const HOTKEY_SETTINGS_GET = "hotkey-settings:get";
export const HOTKEY_SETTINGS_SET = "hotkey-settings:set";

export interface SetHotkeyResult {
  success: boolean;
  error?: string;
}
