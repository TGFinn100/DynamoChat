import { Room } from "livekit-client";

const INPUT_STORAGE_KEY = "ron-voice:audioinput-device";
const OUTPUT_STORAGE_KEY = "ron-voice:audiooutput-device";

export async function listInputDevices(): Promise<MediaDeviceInfo[]> {
  return Room.getLocalDevices("audioinput");
}

export async function listOutputDevices(): Promise<MediaDeviceInfo[]> {
  return Room.getLocalDevices("audiooutput");
}

export function getSavedInputDeviceId(): string | null {
  return localStorage.getItem(INPUT_STORAGE_KEY);
}

export function getSavedOutputDeviceId(): string | null {
  return localStorage.getItem(OUTPUT_STORAGE_KEY);
}

export function saveInputDeviceId(deviceId: string): void {
  localStorage.setItem(INPUT_STORAGE_KEY, deviceId);
}

export function saveOutputDeviceId(deviceId: string): void {
  localStorage.setItem(OUTPUT_STORAGE_KEY, deviceId);
}

/** Applies a saved device preference if one exists; silently ignored if the device is gone. */
export async function applySavedDevices(room: Room): Promise<void> {
  const savedInput = getSavedInputDeviceId();
  if (savedInput) {
    try {
      await room.switchActiveDevice("audioinput", savedInput);
    } catch {
      // Saved device no longer exists - fall back to whatever is default.
    }
  }
  const savedOutput = getSavedOutputDeviceId();
  if (savedOutput) {
    try {
      await room.switchActiveDevice("audiooutput", savedOutput);
    } catch {
      // Saved device no longer exists - fall back to whatever is default.
    }
  }
}
