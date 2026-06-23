# CHANGES — RagnaTouch

**RagnaTouch** is a mobile-first derivative of
[roBrowserLegacy](https://github.com/MrAntares/roBrowserLegacy), which is itself a
continuation of [roBrowser](https://www.robrowser.com/) by **Vincent Thibault** and
contributors.

## License & attribution

- This project remains licensed under the **GNU General Public License v3** (see
  [`LICENSE`](./LICENSE)). It is **not** relicensed.
- Original author: **Vincent Thibault** and the roBrowser community. All existing
  copyright notices and source-file author headers are preserved unchanged.
- Upstream: roBrowserLegacy (MrAntares) and roBrowser (Vincent Thibault).
- The derived source is kept open under the same GPL-v3 terms.

RagnaTouch's goal is **reliable mobile (touch / phone) play**, plus measured gains in
load speed, runtime stability, and a small set of mobile-first features. Changes are
intended to be surgical extensions of the existing systems (including the existing
`Core/Mobile.js` + `UI/Components/MobileUI/MobileUI.js` mobile layer), not a rewrite.

> No proprietary game assets (GRF, SPR, BMP, BGM, kRO data) are included in this
> repository. Those are third-party IP supplied by the server operator at runtime.

---

## Unreleased

### Project identity

- Renamed the project to **RagnaTouch**. `package.json` `name` changed
  `robrowser` → `ragnatouch`; `description` updated to describe the mobile-first,
  GPL-v3 derivative. Version, author (`Vincent Thibault`), license (`GNU GPL V3`),
  and all build scripts are unchanged.
- Added this `CHANGES.md` to document every change in the derivative, per GPL-v3
  good practice.

### Mobile UX

- **Fixed on-screen "O" key button** (`src/UI/Components/MobileUI/MobileUI.js`). The
  `#oButton` entry in the letter-key map was bound to keyCode `89` (the "Y" key, a
  copy-paste duplicate of `#yButton`); corrected to `79` ("O"). Without this, the
  MobileUI "O" button emitted "Y".

### Stability

- **WebSocket auto-reconnect with exponential backoff** (opt-in). Added a pure,
  fully unit-tested `src/Network/ReconnectPolicy.js` (exponential backoff with cap,
  optional jitter, max-attempts, reset) and wired it into the WebSocket SocketHelper
  (`src/Network/SocketHelpers/WebSocket.js`): after an *unexpected* disconnect, the
  transport reopens on a backoff schedule and surfaces an `onReconnect` hook. It is
  enabled by `autoReconnect: true` in the config and is **off by default**, so the
  legacy behaviour (notify `onClose`, no retry) is unchanged unless opted in. Unit
  coverage: `tests/network/ReconnectPolicy.test.js`. Documented the option in
  `applications/pwa/Config.js`.
  - Scope note: the transport reconnects, but restoring an in-game RO session also
    requires re-authentication (login→char→map handshake). Full in-game reconnect is
    **UNVERIFIED** here and must be validated against a live server.

- **Asset-load retry with backoff for transient failures.** Added
  `src/Core/AssetRetry.js` (`isTransientError` + `withRetry`, both pure and
  unit-tested) and wired it into `FileManager.getHTTP` (`src/Core/FileManager.js`):
  the single-attempt loader was extracted to `_getHTTPOnce`, and transient failures
  (5xx, offline blips, dropped sockets) are now retried with exponential backoff
  (reusing `ReconnectPolicy`). Definitive failures (4xx, HTML "404 page", missing
  files) still fail fast so the many optional files the client probes don't slow
  loading. Error messages from `_getHTTPOnce` now carry the HTTP status so the retry
  layer can classify them. Retry count is `assetMaxRetries` (default 2; set 0 to
  disable) — documented in `applications/pwa/Config.js`. Unit coverage:
  `tests/core/AssetRetry.test.js`.
