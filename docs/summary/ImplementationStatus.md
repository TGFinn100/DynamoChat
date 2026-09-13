# Implementation Status

## Current state

All 7 phases of the original build plan are implemented and verified, plus two rounds of post-plan feature requests. Current desktop-app version: v0.7.0 (published and confirmed running via auto-update). The v0.7.0 round (in-game overlay, game stats, theme auto-switch, rebrand) is detailed in [Game Integration](GameIntegration.md) rather than repeated here.

## History

Verified with real multi-client testing, phase by phase:

- **Backend**: `/rooms` (generates + registers a code), `/token` (mints a scoped LiveKit JWT, rejects unregistered codes with a clear error instead of silently creating an empty room).
- **Lobby UI**: React + Zustand + `@dnd-kit`. Drag your own tile into a team box to self-assign; host can add teams (broadcast via LiveKit data messages, synced to late joiners).
- **Audio routing**: see [Architecture](Architecture.md) for the design; verified with 3 real clients that Main is always heard and teams stay isolated from each other.
- **Hotkey**: single **F1** by default (remappable in Settings) toggles Main ⇄ your last team. Verified working with Ready or Not running in actual exclusive fullscreen, no conflicts with the game.
- **Audio cue**: synthesized (not a sound file) two-note Web Audio chirp on every successful switch — rising into a team, falling back to Main. Follows the selected output device via `setSinkId`.
- **Reliability**: reconnection handling (re-asserts channel + resubscribes after a dropped connection resumes), cold-start retry with a "waking up the server" status (Render's free tier sleeps after 15 min idle), distinct error messages for bad room code / mic permission denied / backend unreachable.
- **Settings** (now a global overlay accessible from both the Join and Lobby screens, not just post-connect):
  - Hotkey rebinding — captured via a keydown listener, validated and persisted to a JSON file in Electron's userData by the main process (re-registering `globalShortcut` has to happen there).
  - Microphone/output device pickers — LiveKit's device list, applied via `switchActiveDevice`, persisted in localStorage.
  - **Theme system**: 4 built-in light/dark preset pairs (Blue, Forest, Ember, Violet) plus user-created custom themes — named, editable, deletable. Each theme stores only 3 base colors (bg/text/accent) per light/dark mode; everything else (surface/border/muted/accent background) is derived via color mixing. Live preview applies the draft as colors are picked; Cancel reverts to whatever was active before opening the form. Applied theme follows `prefers-color-scheme` automatically and re-applies on OS theme change.
- **Display name persists** across restarts (localStorage) — previously reset to blank every launch.
- **App version** shown in a small footer, fetched from the main process via IPC (`app.getVersion()`).
- **Update banner**: a persistent in-app banner (not just Electron's native dialog) warns not to close the app while an update downloads, and shows a clear "Restart Now" button once ready — see [Deployment And Distribution](DeploymentAndDistribution.md) for why this was added.

## Open questions

None currently.
