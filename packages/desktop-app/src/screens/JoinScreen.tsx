import { useState } from "react";
import { useSessionStore } from "../state/sessionStore";
import { buildDeepLink } from "../lib/deepLink";
import { useRunningStatsGameName } from "../lib/useRunningStatsGame";

export function JoinScreen() {
  const backendUrl = useSessionStore((s) => s.backendUrl);
  const displayName = useSessionStore((s) => s.displayName);
  const roomCode = useSessionStore((s) => s.roomCode);
  const status = useSessionStore((s) => s.status);
  const setBackendUrl = useSessionStore((s) => s.setBackendUrl);
  const setDisplayName = useSessionStore((s) => s.setDisplayName);
  const setRoomCode = useSessionStore((s) => s.setRoomCode);
  const createRoom = useSessionStore((s) => s.createRoom);
  const join = useSessionStore((s) => s.join);
  const setShowSettings = useSessionStore((s) => s.setShowSettings);
  const setShowStats = useSessionStore((s) => s.setShowStats);

  const [copied, setCopied] = useState(false);
  const runningGameName = useRunningStatsGameName();

  async function handleCopyLink() {
    await navigator.clipboard.writeText(buildDeepLink(roomCode.trim()));
    setCopied(true);
    setTimeout(() => setCopied(false), 2000);
  }

  return (
    <main>
      <div className="lobby-header">
        <h1>Dynamo Chat</h1>
        <div className="button-row">
          <button type="button" onClick={() => setShowStats(true)}>
            {runningGameName ? `${runningGameName} Stats` : "Game Stats"}
          </button>
          <button type="button" onClick={() => setShowSettings(true)}>
            Settings
          </button>
        </div>
      </div>
      <section id="join-form">
        <label>
          Backend URL
          <input
            type="text"
            value={backendUrl}
            onChange={(e) => setBackendUrl(e.target.value)}
          />
        </label>
        <label>
          Display name
          <input
            type="text"
            placeholder="Your name"
            value={displayName}
            onChange={(e) => setDisplayName(e.target.value)}
          />
        </label>
        <label>
          Room code
          <input
            type="text"
            placeholder="e.g. RV3GDF"
            value={roomCode}
            onChange={(e) => setRoomCode(e.target.value)}
          />
        </label>
        <div className="button-row">
          <button type="button" onClick={() => void createRoom()}>
            Create New Room
          </button>
          <button type="button" onClick={() => void join()}>
            Join
          </button>
          {roomCode.trim() && (
            <button type="button" onClick={() => void handleCopyLink()}>
              {copied ? "Copied!" : "Copy Link"}
            </button>
          )}
        </div>
      </section>
      <p id="status">{status}</p>
    </main>
  );
}
