# Deployment And Distribution

## Current state

- **Source**: public GitHub repo `TGFinn100/DynamoChat`.
- **Backend**: deployed to Render's free tier at `https://ron-voice-backend.onrender.com` via the `render.yaml` blueprint at the repo root — builds from the monorepo root with `--workspace=packages/backend` so the `@ron-voice/shared` workspace link resolves (a `rootDir`-scoped build would break this). This is the desktop app's default backend URL.
- **Installer**: Electron Forge + Squirrel.Windows (`npm run make` / `npm run publish` from `packages/desktop-app`) produces a working `Setup.exe` + `RELEASES` + `.nupkg`. Confirmed: a real install works, creates a desktop shortcut, shows the expected SmartScreen "unknown publisher" warning (app is unsigned). DevTools no longer auto-opens in a packaged build (was unconditional since the original template).
- **Auto-update**: wired via `update-electron-app` (guarded to only run when `app.isPackaged`) + `@electron-forge/publisher-github`, checking Electron's free `update.electronjs.org` proxy service (which itself reads GitHub Releases). **Confirmed working end-to-end repeatedly** (v0.2.0 → v0.3.0 → v0.4.0 → v0.5.0 → v0.6.0 → v0.7.0), including a proper in-app banner (downloading warning + "Restart Now" button) added after the first update attempt applied silently and was interrupted mid-apply.
- **Publish process**: `GITHUB_TOKEN=$(gh auth token) npm run publish` from `packages/desktop-app`, then manually un-draft the release — Forge's GitHub publisher creates releases as **drafts**, which the updater cannot see — via `gh release edit vX.Y.Z --repo TGFinn100/DynamoChat --draft=false`. `update.electronjs.org` typically takes several minutes to a couple minutes to pick up a newly published release; check `curl https://update.electronjs.org/TGFinn100/DynamoChat/win32-x64/0.0.1` to see what it currently thinks is latest.
- **Join-link hosting**: a separate `gh-pages` branch (orphan, no source code - built in an isolated `git worktree` so master's working tree was never touched) serves a static bridge page at `https://tgfinn100.github.io/DynamoChat/join/?code=...` via GitHub Pages (was already enabled on the repo). The desktop app's "Copy Link" button points here instead of the raw `ronvoice://` scheme - see [Game Integration](GameIntegration.md) for why.
- Installed on Finn's machine: v0.7.0 (current).

## History

- v0.1.0: first installer built and manually installed — predates the auto-update code entirely, never self-updated.
- v0.2.0: first version containing `update-electron-app`. Installed manually over 0.1.0 (Squirrel upgraded in place, no conflict).
- v0.3.0 → v0.4.0: theme swap used specifically to make an auto-update visually obvious; also diagnosed a real bug here — Squirrel's own log showed the v0.2.0→v0.3.0 update got interrupted mid-apply (likely the app closed too soon), leaving a broken partial `app-0.3.0` folder that a manual re-run of `Update.exe` self-healed ("Found partially applied release folder, killing it"). This motivated the in-app update-status banner added in v0.4.0.
- **Recurring mistake fixed as process**: three separate times in this project, a build/publish or "go test it" happened before all the intended code was actually committed (an uncommitted `render.yaml`, a locally-verified-but-unpushed backend fix, and a v0.4.0 publish that predated a theme-revert commit). Now standard practice: run `git status --short` immediately before every build/publish command and confirm it's clean.
- v0.5.0: real light/dark palette (Blue/neutral) replacing the loud test colors.
- v0.6.0: theme system (presets + custom, editable, live preview), global Settings access, persisted display name, app version footer, DevTools fix.
- v0.7.0: in-game overlay, Ready or Not game stats, theme auto-switch, rebrand to Dynamo Chat, Discord-friendly join links — see [Game Integration](GameIntegration.md) for the feature detail. Rebranding required migrating `%APPDATA%\RoN Voice Chat` to `%APPDATA%\Dynamo Chat` (copied, not moved - old folder left in place as a fallback) before publishing, since `productName` drives that path and the old settings/theme/localStorage would otherwise have silently reset for Finn on first launch of the renamed app.
- **Dev/packaged builds share the same Electron identity**: both read `productName` ("Dynamo Chat" as of v0.7.0) from package.json, so they share the same userData directory (`%APPDATA%\Dynamo Chat`) and the same single-instance lock. If the packaged app is running, the dev build will silently exit immediately (no window, no error) rather than conflicting — this looks like a bug but is `requestSingleInstanceLock()` correctly refusing a second instance. Close whichever one is running before launching the other.

## Open questions

None currently — auto-update, installer, and deployment are all confirmed working.
