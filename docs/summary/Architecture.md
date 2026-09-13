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
  - The dev build (`electron-forge start`) and the packaged/installed build share the same Electron app identity (both read `productName` from package.json, now "Dynamo Chat"), so they share one userData directory and one single-instance lock. Running the dev build while the installed app is open makes the dev instance silently exit immediately with no window and no error — looks like a crash, is actually `requestSingleInstanceLock()` correctly refusing a second instance. See [Deployment And Distribution](DeploymentAndDistribution.md).
  - Renaming `productName` (the v0.7.0 rebrand) silently points the app at a brand-new, empty userData folder, since that path is derived from the product name — required a manual one-time folder copy to avoid resetting Finn's saved settings. See [Deployment And Distribution](DeploymentAndDistribution.md).
  - Discord (and most chat apps) only auto-link `http(s)://` URLs plus a small hardcoded allowlist (`steam://`, etc.) — a custom URI scheme like this app's `ronvoice://` deep link shows up as inert plain text, not clickable. Fixed with an `https://` bridge page (GitHub Pages) that hands off to the app link client-side. See [Game Integration](GameIntegration.md).
- **Theme system** (`lib/theme.ts`): each theme stores only 3 base colors per light/dark mode (bg, text, accent); every other token (surface, border, muted, accent background) is derived at apply-time via simple hex color mixing, so both built-in presets and user-created custom themes share one code path. Applied by setting CSS custom properties directly on `document.documentElement.style`, which overrides the static `:root`/media-query values in the stylesheet (inline style always wins on specificity) — the static CSS values just serve as the pre-JS fallback. v0.7.0 added a game-triggered auto-switch on top of this - see [Game Integration](GameIntegration.md).
- **Game-process detection** (`processCheck.ts`): a shared `isProcessRunning(imageName)` helper shelling out to Windows' `tasklist /FI "IMAGENAME eq X" /NH /FO CSV`, filtered server-side so it's cheap to poll every few seconds. One helper backs three independent features - the overlay's show/hide, the stats panel's game auto-select, and the theme auto-switch. See [Game Integration](GameIntegration.md).

## Open questions

None currently — see [Implementation Status](ImplementationStatus.md), [Game Integration](GameIntegration.md), and [Deployment And Distribution](DeploymentAndDistribution.md) for feature-level state.
