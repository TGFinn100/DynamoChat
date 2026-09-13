import { useEffect } from "react";
import { useSessionStore } from "./state/sessionStore";
import { JoinScreen } from "./screens/JoinScreen";
import { LobbyScreen } from "./screens/LobbyScreen";
import { UpdateBanner } from "./components/UpdateBanner";
import { SettingsPanel } from "./components/SettingsPanel";
import { AppVersion } from "./components/AppVersion";
import { applyTheme, getActiveTheme } from "./lib/theme";

export function App() {
  const screen = useSessionStore((s) => s.screen);
  const setRoomCode = useSessionStore((s) => s.setRoomCode);
  const showSettings = useSessionStore((s) => s.showSettings);
  const setShowSettings = useSessionStore((s) => s.setShowSettings);

  useEffect(() => {
    return window.deepLink.onJoinRoom((roomCode) => {
      setRoomCode(roomCode);
    });
  }, [setRoomCode]);

  useEffect(() => {
    applyTheme(getActiveTheme());
    const media = window.matchMedia("(prefers-color-scheme: dark)");
    const reapply = () => applyTheme(getActiveTheme());
    media.addEventListener("change", reapply);
    return () => media.removeEventListener("change", reapply);
  }, []);

  return (
    <>
      <UpdateBanner />
      {showSettings ? (
        <SettingsPanel onClose={() => setShowSettings(false)} />
      ) : screen === "lobby" ? (
        <LobbyScreen />
      ) : (
        <JoinScreen />
      )}
      <AppVersion />
    </>
  );
}
