import { useEffect, useState } from "react";
import { useSessionStore } from "../state/sessionStore";
import { captureAccelerator } from "../lib/hotkeyCapture";
import { listInputDevices, listOutputDevices } from "../lib/deviceSettings";
import { ThemeSettings } from "./ThemeSettings";
import { OverlaySettings } from "./OverlaySettings";

interface Props {
  onClose: () => void;
}

export function SettingsPanel({ onClose }: Props) {
  const selectedInputDevice = useSessionStore((s) => s.selectedInputDevice);
  const selectedOutputDevice = useSessionStore((s) => s.selectedOutputDevice);
  const setInputDevice = useSessionStore((s) => s.setInputDevice);
  const setOutputDevice = useSessionStore((s) => s.setOutputDevice);

  const [accelerator, setAccelerator] = useState("");
  const [recording, setRecording] = useState(false);
  const [hotkeyError, setHotkeyError] = useState<string | null>(null);
  const [inputDevices, setInputDevices] = useState<MediaDeviceInfo[]>([]);
  const [outputDevices, setOutputDevices] = useState<MediaDeviceInfo[]>([]);

  useEffect(() => {
    void window.hotkeySettings.get().then(setAccelerator);
    void listInputDevices().then(setInputDevices);
    void listOutputDevices().then(setOutputDevices);
  }, []);

  useEffect(() => {
    if (!recording) return;

    function handleKeyDown(e: KeyboardEvent) {
      e.preventDefault();
      const accel = captureAccelerator(e);
      if (!accel) return;

      void (async () => {
        const result = await window.hotkeySettings.set(accel);
        if (result.success) {
          setAccelerator(accel);
          setHotkeyError(null);
        } else {
          setHotkeyError(result.error ?? "Could not bind that key.");
        }
        setRecording(false);
      })();
    }

    window.addEventListener("keydown", handleKeyDown, true);
    return () => window.removeEventListener("keydown", handleKeyDown, true);
  }, [recording]);

  return (
    <div className="settings-panel">
      <div className="settings-panel__header">
        <h2>Settings</h2>
        <button type="button" onClick={onClose}>
          Close
        </button>
      </div>

      <section>
        <h3>Hotkey</h3>
        <p>
          Current: <strong>{accelerator || "..."}</strong>
        </p>
        <button
          type="button"
          onClick={() => {
            setHotkeyError(null);
            setRecording(true);
          }}
          disabled={recording}
        >
          {recording ? "Press a key..." : "Change Hotkey"}
        </button>
        {hotkeyError && <p className="settings-error">{hotkeyError}</p>}
      </section>

      <section>
        <h3>Microphone</h3>
        <select
          value={selectedInputDevice ?? ""}
          onChange={(e) => void setInputDevice(e.target.value)}
        >
          <option value="" disabled>
            Select a microphone
          </option>
          {inputDevices.map((d) => (
            <option key={d.deviceId} value={d.deviceId}>
              {d.label || d.deviceId}
            </option>
          ))}
        </select>
      </section>

      <section>
        <h3>Speaker / Output</h3>
        <select
          value={selectedOutputDevice ?? ""}
          onChange={(e) => void setOutputDevice(e.target.value)}
        >
          <option value="" disabled>
            Select an output device
          </option>
          {outputDevices.map((d) => (
            <option key={d.deviceId} value={d.deviceId}>
              {d.label || d.deviceId}
            </option>
          ))}
        </select>
      </section>

      <OverlaySettings />

      <ThemeSettings />
    </div>
  );
}
