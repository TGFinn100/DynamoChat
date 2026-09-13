import { useEffect } from "react";
import { useSessionStore } from "./state/sessionStore";
import { JoinScreen } from "./screens/JoinScreen";
import { LobbyScreen } from "./screens/LobbyScreen";
import { UpdateBanner } from "./components/UpdateBanner";

export function App() {
  const screen = useSessionStore((s) => s.screen);
  const setRoomCode = useSessionStore((s) => s.setRoomCode);

  useEffect(() => {
    return window.deepLink.onJoinRoom((roomCode) => {
      setRoomCode(roomCode);
    });
  }, [setRoomCode]);

  return (
    <>
      <UpdateBanner />
      {screen === "lobby" ? <LobbyScreen /> : <JoinScreen />}
    </>
  );
}
