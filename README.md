# RagnaTouch

**RagnaTouch** is a **mobile-first derivative** of
[roBrowserLegacy](https://github.com/MrAntares/roBrowserLegacy) (itself a continuation
of [roBrowser](https://www.robrowser.com/) by **Vincent Thibault** and contributors).
It targets reliable touch/phone play plus measured gains in load speed, runtime
stability, and a few mobile-first features — implemented as surgical extensions of the
existing systems, not a rewrite.

> **License & attribution.** RagnaTouch remains under the **GNU GPL v3** (see
> [`LICENSE`](./LICENSE)); it is **not** relicensed. All original copyright and
> source-file author headers are preserved. Original author: **Vincent Thibault** and
> the roBrowser community. Upstream: roBrowserLegacy (MrAntares).

## What's different (mobile-first)

See [`CHANGES.md`](./CHANGES.md) for the full, evidence-linked log. Highlights:

- **Stability:** asset-load
  retry for transient failures; (existing WebGL context-loss recovery audited).
- **Performance:** adaptive graphics defaults (lower render scale / FPS on
  mobile / low-end); non-blocking startup; bundle code-split analysis in
  [`doc/PERFORMANCE.md`](./doc/PERFORMANCE.md).
- **PWA / offline:** offline app-shell service worker; complete installable icon set
  (192 / 512 / maskable).
- **Mobile UX:** capability-based touch detection, safe-area (notch) handling,
  keyboard-safe chat input, opt-in responsive window scaling.
- **Features:** FPS + ping HUD, opt-in haptics, a mobile settings panel, and a
  left-handed layout option.

## Build & run the mobile / PWA target

```bash
npm install            # Node >= 22
npm run pwa            # Vite dev server for the PWA entry (applications/pwa/)
npm run build:pwa      # Production PWA build -> dist/Web/ (Online + worker + manifest
                       #   + icons + service worker)
npm run build:all      # Build every application target
npm test               # Vitest unit tests
```

Serve the built `dist/Web/` over **HTTPS** to install the PWA and exercise the service
worker (offline app shell). The service worker is registered only in the built PWA, not
the Vite dev server (to avoid HMR conflicts).

### Mobile config options

These live in `applications/pwa/Config.js` (or your `Config.local.js`) and are also
exposed in the in-game **mobile settings panel** (🎛️ in the MobileUI top bar):

| Option | Default | Effect |
| --- | --- | --- |
| `assetMaxRetries` | `2` | Retries for transient (5xx / offline) asset-load failures |
| `uiScale` | `'off'` | `'off'` / number / `'auto'` — scale fixed windows down for small screens |
| `haptics` | `false` | Vibration feedback on touch actions |
| `mobileLeftHanded` | `false` | Mirror the joystick / action clusters (left-handed) |
| `quality` | (adaptive) | Explicit render scale; unset → adaptive mobile/low-end default |

### Connect to a server (local test path)

The client alone is not a playable game. To reach a server you need:

1. **wsProxy** — a TCP↔WebSocket proxy
   ([roBrowserLegacy-wsProxy](https://github.com/MrAntares/roBrowserLegacy-wsProxy)).
   Set `socketProxy` in the config (e.g. `ws://127.0.0.1:5999/`).
2. **Game assets** — either a **Remote Client** serving GRF data
   ([PHP](https://github.com/MrAntares/roBrowserLegacy-RemoteClient-PHP) /
   [JS](https://github.com/FranciscoWallison/roBrowserLegacy-RemoteClient-JS); set
   `remoteClient`), **or** local GRFs dragged into the Intro screen
   (`skipIntro: false`).
3. A **game server** (rAthena / Hercules) with matching `packetver`.

> No proprietary game assets (GRF, SPR, BGM, kRO data) are included in this repo — they
> are supplied by the operator at runtime.

On-device behaviour (touch input, rendering, install/offline) must be
validated on a real phone; see the on-device checklist in `CHANGES.md` / the PR.

---

## ROBrowser Legacy

This is a continuation of [roBrowser](https://www.robrowser.com/) expanded with some features. This repo is not directly forked from the original repository due to safety concerns, but it is roBrowser.

If you wish to discuss anything related to this project, or you want to join, contact us on [Discord](https://discord.gg/8JdHwM4Kqm) or in the [GIT Discussions](https://github.com/MrAntares/roBrowserLegacy/discussions)

For info on how to setup the client read the contents of our [Getting Started doc](https://github.com/MrAntares/roBrowserLegacy/blob/master/doc/README.md). For the original branche's docs please visit the https://www.robrowser.com/ site.

## DEMO

[![Start Demo](https://img.shields.io/badge/%E2%96%B6%20Start%20Demo-Play%20Now-e8b84b?style=for-the-badge&labelColor=cc0000)](https://mrantares.github.io/roBrowserLegacy/master)

_Use `<Username>_M` or `<Username>_F` to register a male or a female account on the login screen, or use the Register/Request button to navigate to the server's account registration page._

More live examples:

- [#robrowser-servers on Discord](https://discord.gg/MFtJj9n5Hr)
- [roBrowserLegacy Servers on Discussions](https://github.com/MrAntares/roBrowserLegacy/discussions/categories/robrowserlegacy-servers)

## Quick Start

```bash
git clone https://github.com/MrAntares/roBrowserLegacy.git
cd roBrowserLegacy
npm install
npm run live          # Dev server with Vite (opens browser)
npm run build:all     # Build all applications to dist/Web/
```

#### Repo info:

| ![GitHub](https://img.shields.io/github/license/MrAntares/roBrowserLegacy.svg) | ![commit activity](https://img.shields.io/github/commit-activity/w/MrAntares/roBrowserLegacy) | ![GitHub repo size](https://img.shields.io/github/repo-size/MrAntares/roBrowserLegacy.svg) | ![CodeQL](https://img.shields.io/github/actions/workflow/status/MrAntares/roBrowserLegacy/analysis_codeql.yml?label=CodeQL) | ![Build & Tests](https://img.shields.io/github/actions/workflow/status/MrAntares/roBrowserLegacy/build.yml?branch=master&label=Build%20%26%20Tests&logo=vitest) | ![Lint](https://img.shields.io/github/actions/workflow/status/MrAntares/roBrowserLegacy/lint.yml?branch=master&label=Lint&logo=eslint) | ![Format](https://img.shields.io/github/actions/workflow/status/MrAntares/roBrowserLegacy/format.yml?branch=master&label=Format&logo=prettier) |
| ------------------------------------------------------------------------------ | --------------------------------------------------------------------------------------------- | ------------------------------------------------------------------------------------------ | --------------------------------------------------------------------------------------------------------------------------- | --------------------------------------------------------------------------------------------------------------------------------------------------------------- | -------------------------------------------------------------------------------------------------------------------------------------- | ---------------------------------------------------------------------------------------------------------------------------------------------- |

## Guide

Checkout the [getting started guide](doc/README.md)

## Wiki

[![Ask DeepWiki](https://deepwiki.com/badge.svg)](https://deepwiki.com/MrAntares/roBrowserLegacy)

## Tech Stack

- **ES6 Modules** — Modern `import`/`export` syntax (migrated from AMD/RequireJS)
- **Vite** — Build tool and dev server (replaced RequireJS optimizer and live-server)
- **WebGL** — 3D/2D rendering via OpenGL ES 2.0
- **WebSockets** — Network communication via wsProxy
- **ESLint + Prettier** — Code quality and formatting
- **Web Workers** — Background processing for GRF decompression and pathfinding

## Remote Client

Remote Client serves game assets to roBrowser via http by extracting them from their GRFs. You will need to setup a remote client if you want to serve the game assets centrally from your server. roBrowser can use local game assets via the Intro screen by dragging them into the file box. The original implementation of the Remote Client is written in PHP:

- [roBrowserLegacy-RemoteClient-PHP](https://github.com/MrAntares/roBrowserLegacy-RemoteClient-PHP)

Other implementations may arise and when they do we will list them here:

- [roBrowserLegacy-RemoteClient-JS](https://github.com/FranciscoWallison/roBrowserLegacy-RemoteClient-JS)

## WebSocket Proxy

The game server uses TCP/IP to communicate with the client, while roBrowser being a web page can't use TCP/IP. We use the WebSocket API to communicate with a proxy server that translates the packets into TCP/IP packets. This server is called wsProxy. You will need to install and configure wsProxy to make roBrowser able to connect to a game server. For more info, please visit the [roBrowserLegacy-wsProxy](https://github.com/MrAntares/roBrowserLegacy-wsProxy) repository.

## Plugins

For available plugins and information on how to install them please visit the [roBrowserLegacy-plugins](https://github.com/MrAntares/roBrowserLegacy-plugins) repository.

## Contributing

See [CONTRIBUTING](./doc/CONTRIBUTING.md)

All credits to the original owners/creators and the new ones.
<a href="https://github.com/MrAntares/roBrowserLegacy/graphs/contributors">
<img src="https://contrib.rocks/image?repo=MrAntares/roBrowserLegacy" />
</a>

## Contact

- Join us on [Discord](https://discord.gg/8JdHwM4Kqm)
- Or in the [GIT Discussions](https://github.com/MrAntares/roBrowserLegacy/discussions)

## Star history

[![Star History Chart](https://api.star-history.com/svg?repos=MrAntares/roBrowserLegacy&type=Date)](https://star-history.com/#MrAntares/roBrowserLegacy&Date)
