# Deployment And Distribution

## Current state

- **Source**: public GitHub repo `TGFinn100/DynamoChat`.
- **Backend**: deployed to Render's free tier at `https://ron-voice-backend.onrender.com` via the `render.yaml` blueprint at the repo root — builds from the monorepo root with `--workspace=packages/backend` so the `@ron-voice/shared` workspace link resolves (a `rootDir`-scoped build would break this). This is the desktop app's default backend URL.
- **Installer**: Electron Forge + Squirrel.Windows (`npm run make` / `npm run publish` from `packages/desktop-app`) produces a working `Setup.exe` + `RELEASES` + `.nupkg`. Confirmed: a real install works, creates a desktop shortcut, shows the expected SmartScreen "unknown publisher" warning (app is unsigned).
- **Auto-update**: wired via `update-electron-app` (guarded to only run when `app.isPackaged`) + `@electron-forge/publisher-github`, checking Electron's free `update.electronjs.org` proxy service (which itself reads GitHub Releases). To publish: `GITHUB_TOKEN=$(gh auth token) npm run publish --workspace=packages/desktop-app`, then manually un-draft the release — Forge's GitHub publisher creates releases as **drafts**, which the updater cannot see — via `gh release edit vX.Y.Z --repo TGFinn100/DynamoChat --draft=false`.
- Installed on Finn's machine: v0.2.0 (has the update-checking code — v0.1.0 did not, since it was built before that feature existed, which is why an earlier test against 0.1.0 appeared to do nothing).

## History

- v0.1.0: first installer built and manually installed — predates the auto-update code, will never self-update.
- v0.2.0: published; first version containing `update-electron-app`. Installed manually over 0.1.0 (Squirrel upgraded in place, no conflict).
- v0.3.0: published with a deliberately loud purple/blue theme swap specifically so an applied auto-update would be visually unmistakable. This is the version currently being used to test whether the installed 0.2.0 auto-updates to it.
- **Diagnosed but unresolved**: querying `update.electronjs.org` directly showed it was still caching v0.2.0 as "latest" several minutes after v0.3.0 was confirmed live on GitHub — a propagation delay on Electron's side, not a bug in this app's config. The polling check waiting for it to catch up was interrupted mid-session by the user.

## Open questions

- **Auto-update end-to-end is not yet confirmed working.** Next step: check whether `update.electronjs.org` now reports v0.3.0 —
  ```
  curl https://update.electronjs.org/TGFinn100/DynamoChat/win32-x64/0.0.1
  ```
  should return `v0.3.0` once it's caught up — then relaunch the installed app and confirm it detects/downloads/prompts to restart.
- Once confirmed, revert the v0.3.0 test theme to a normal palette (see [Implementation Status](ImplementationStatus.md)).
