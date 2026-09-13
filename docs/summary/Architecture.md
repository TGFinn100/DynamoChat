# Architecture

## Current state

npm workspaces monorepo: `packages/shared` (TS types), `packages/backend` (Express), `packages/desktop-app` (Electron + React + Vite, via Electron Forge).

## History

- **Core design decision**: LiveKit does not support one client identity joining multiple rooms concurrently. Instead: one LiveKit room per session; each participant publishes their mic once and never republishes; channel membership is a participant **attribute** (`channel: "main" | "team:<id>"`) set via `setAttributes()`. Every client runs a reactive routing module (`channelRouting.ts`, connects with `autoSubscribe: false`) that subscribes to anyone on Main (always) plus anyone sharing your current team, unsubscribing from everyone else. This is client-side/voluntary enforcement, not a server ACL — an accepted tradeoff for a trusted friend group.
- **Gotchas hit and fixed**:
  - LiveKit access tokens need `canUpdateOwnMetadata: true` in the grant or `setAttributes()` fails with a permission error.
  - `electron-winstaller`/Squirrel breaks on a scoped npm package name (`@scope/name` → treats `/` as a path separator, fails writing the `.nuspec`). Fixed by renaming the desktop-app package to an unscoped `ron-voice-desktop-app` (nothing else depends on this package's own name).
  - Electron Forge's vite-typescript template pins an old TypeScript (~4.5.4) that can't parse newer `@types/node` syntax once npm workspaces hoist a newer version pulled in by the backend. Fixed by bumping desktop-app to TS 5.6+ and adding `"types": ["node", "vite/client"]` to its tsconfig (avoids pulling in stray `@types/*` packages from the shared monorepo `node_modules`).
  - Electron's `globalShortcut` has no press/release distinction — holding a key re-fires it at the OS's key-repeat rate. Fixed with a 1.2s cooldown in the main process rather than switching to a lower-level keyboard hook (`uiohook-napi`), which was deliberately avoided since it's more likely to draw anti-cheat scrutiny in Ready or Not than the simpler `globalShortcut` API.
  - The backend needed an in-memory room-code registry (`activeRooms.ts`, 12h TTL) — without it, any typed string was silently accepted as a valid room code and created an empty LiveKit room with zero feedback that it was wrong.

## Open questions

None currently — see [Implementation Status](ImplementationStatus.md) for feature-level state and [Deployment And Distribution](DeploymentAndDistribution.md) for the one open item (auto-update verification).
