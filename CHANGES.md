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

- **Capability-based touch detection.** `Core/Mobile.js` now flags primarily-touch
  devices at load via `matchMedia('(pointer: coarse)')` (new `Mobile.isTouchDevice()`,
  also called from `Mobile.init()`), so the mobile UI appears immediately on phones
  /tablets instead of only after the first touch. The `(pointer: coarse)` query
  deliberately excludes touch-capable laptops (primary pointer = fine); the existing
  first-touch handler stays as a fallback.

- **Safe-area (notch / home-indicator) handling.** Added `viewport-fit=cover` to the
  viewport meta of both mobile entry points (the builder-generated `index.html` in
  `applications/tools/builder-web.mjs` and `applications/pwa/index.html`) and inset
  the MobileUI control layer by `env(safe-area-inset-*)` (`MobileUI.css` `#MobileUI`
  rule). The whole control overlay now shifts clear of the notch and home indicator;
  a `0px` fallback makes it a no-op on devices/browsers without insets.

- **Keyboard-safe chat input.** Added `src/UI/KeyboardInset.js`, which keeps a
  focused field visible above the on-screen keyboard by translating its window up by
  the visual-viewport overlap (via the `visualViewport` API) on focus and resetting
  on blur. Wired into the ChatBox input (`src/UI/Components/ChatBox/ChatBox.js`). It
  is a no-op without `visualViewport` or off touch sessions, and uses `transform`
  only so it never disturbs the window's draggable position. Addresses the
  long-standing "resize event on mobile keyboard bug" TODO in `Core/Mobile.js`.

- **Optional global UI scaling for small screens (opt-in, default off).** Added
  `src/UI/UIScale.js`, which applies a uniform CSS `zoom` to each registered
  component host so fixed-size RO windows can shrink to fit a phone. `zoom` is used
  (not `transform: scale`) because it scales the layout box and the browser maps
  pointer events through it, preserving drag and hit-testing. Both base classes are
  wired (`GUIComponent.prepare` and `UIComponent.append` register their host) and the
  scale recomputes on resize. Controlled by the `uiScale` config: `'off'` (default →
  factor 1, hosts untouched, **no behavioural change**), a number for a fixed factor,
  or `'auto'` to derive one from the viewport. Documented in
  `applications/pwa/Config.js`.
  - On-device validation required: the scaling↔drag/clamp/hit-testing interaction
    across all windows cannot be verified in CI and is **UNVERIFIED** until tested on
    a real device. This is why it ships off by default.

- **Non-blocking startup (no external version fetch).** `applications/pwa/index.html`
  previously blocked initialization on a `https://api.github.com/.../commits/master`
  request (every load, rate-limited, and coupled to the upstream repo). It now
  initializes immediately and takes the cache-busting `version` from the
  operator-controlled config (`baseConfig.version`, falling back to a constant). The
  `getJSON` helper and the GitHub dependency were removed. (The built PWA already used
  the builder-generated HTML, which never did this fetch.)

- **Adaptive graphics defaults for mobile / low-end devices.** Added
  `src/Core/DeviceCaps.js` (`recommendQuality`, pure + unit-tested; `detect`, which
  reads pointer type / CPU cores / memory / DPR). `Preferences/Graphics.js` now seeds
  its `quality` and `fpslimit` *defaults* from it, so a first-run phone gets a lower
  render scale (and very low-end devices a lower FPS cap) automatically. These are
  defaults only: a saved user preference (merged by `Preferences.get`) or an explicit
  `quality` config always wins. `Renderer.resize` now falls back to the graphics
  preference instead of a hardcoded 100, so the adaptive scale also applies when the
  Intro is skipped. Unit coverage: `tests/core/DeviceCaps.test.js`.

### Stability

- **Reconnection backoff policy (building block; live reconnect deferred).** Added a
  pure, fully unit-tested `src/Network/ReconnectPolicy.js` (exponential backoff with
  cap, optional jitter, max-attempts, reset). Unit coverage:
  `tests/network/ReconnectPolicy.test.js`.
  - Live WebSocket auto-reconnect was intentionally **not** wired in this PR. A code
    review correctly noted that reopening the transport after a drop is unsafe on its
    own: RO connections are authenticated per-socket, so without a re-authentication
    path the client would sit "connected" on an unauthenticated socket instead of
    surfacing the disconnect. `src/Network/SocketHelpers/WebSocket.js` therefore keeps
    its original notify-`onClose`-and-stop behaviour, and `ReconnectPolicy` currently
    serves only as the backoff source for asset-load retry (below). Full in-game
    reconnect (transport reopen + login→char→map re-auth) is deferred to a separate
    task and must be validated against a live server.

- **Map (zone) session reconnect — with a mandatory send-side auth gate**
  (experimental, opt-in, **off by default**). The deferred follow-up above, brought
  back as a single scoped unit: the recovery path and the safety gate ship together.
  - **Send-side auth gate** (`src/Network/SendGate.js`, pure + unit-tested).
    `NetworkManager` now tracks an explicit *map-session-authenticated* state,
    distinct from transport-connected. It becomes true **only** when the map-accept
    (`ZC_ACCEPT_ENTER`) is processed in `src/Engine/MapEngine.js`, and false on every
    (re)connect and in `NetworkManager.onClose()`. While unauthenticated,
    `sendPacket()` refuses gameplay (zone) packets — only the registered handshake
    packets (the map-enter packet + the keepalive ping) and non-zone (login/char)
    packets pass. This makes the "connected-but-unauthenticated zombie" that caused
    the live-reconnect revert unrepresentable: gameplay can never be sent into a
    dropped or not-yet-admitted session. Coverage: `tests/network/SendGate.test.js`
    (regression/zombie guard + positive control + send-sink spy).
  - **Recovery — Approach B (clean manual reconnect).** Phase 0 (does the server hold
    a resumable map session within a usable grace window?) was **not** run in this
    sandbox — there is no live server here — so the server-agnostic path was chosen:
    on an unexpected map-server drop the client surfaces the drop and re-runs the full
    Login→Char→Map flow with a fresh `AuthCode` (no socket re-attach, no stored-token
    resume — what the official client does and what an unforgiving server supports).
    Reuses the existing return-to-login (`GameEngine.reload()`); never bypasses
    `onClose`.
  - **`AuthCode` hygiene.** The in-memory session secret (`Session.AuthCode`) is now
    cleared on every return-to-login (`GameEngine.reload()`); it is never persisted to
    localStorage / IndexedDB.
  - **Opt-in + experimental.** Gated by `experimentalReconnect` (default `false`) in
    `applications/pwa/Config.js`. When off, behaviour is byte-identical to before (the
    gate is inert). Stays experimental and **server-validation-gated**: the in-sandbox
    tests validate client state only — induced-disconnect tests against a live server
    (kill wsProxy mid-session; drop the network; exceed the grace window) must confirm
    no gameplay packets enter a dead socket and the drop is surfaced before the flag is
    enabled for real use.

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

### PWA / offline

- **Completed the PWA icon set and unified the theme colour.** The manifest
  (`applications/pwa/manifest.webmanifest`) previously declared a single `144x144`
  icon (the source `icon.png` is actually `450x450`). It now declares 192×192,
  512×512 (`purpose: any`) and a 512×512 `maskable` icon, which are the sizes a
  PWA needs to be installable. The builder (`applications/tools/builder-web.mjs`
  `copyPwaFiles`) generates these with `sharp` at build time (same approach already
  used for the screenshots), so no binaries are committed. The maskable icon pads
  the source into the central safe zone on an opaque background. `theme_color` was
  changed `#4169e1` → `#ff8cb5` to match the `theme-color` meta in the HTML.

- **Service worker for offline app-shell caching.** Added `applications/pwa/sw.js`,
  a stale-while-revalidate worker that precaches a small app shell and runtime-caches
  same-origin GETs (the app JS, etc.). Cross-origin requests pass through untouched,
  so remote-client game assets and the wsProxy WebSocket are never intercepted. The
  builder (`copyPwaFiles`) ships it to `dist/Web/sw.js` and injects a guarded
  registration into the generated `index.html` **only for the PWA build**
  (`createHTML` with the manifest), so normal/viewer builds and the Vite dev server
  are unaffected (avoiding HMR conflicts). Offline behaviour is on-device-validated.

### Mobile-first features

- **FPS HUD now also shows ping (round-trip latency).** Extended the existing FPS
  component (`src/UI/Components/FPS/`) with a `ms` readout. The latency is measured
  correctly in `MapEngine.onPong` as `Date.now() - sentAt` (the previous `SP.value`
  was always negative because `pongTime` is hardcoded to 0); the new `rtt`/`sentAt`
  fields live on `Session.ping` and are kept **separate** from the movement-critical
  `serverTick` adjustment, which is left untouched. Updates each pong (~10 s
  keepalive cadence); shows `--` until the first reply.

- **Customizable layout — left-handed mode.** Added a "Left-handed layout" toggle to
  the mobile settings panel that mirrors the joystick / action-button clusters and the
  side bars to the opposite edges (`MobileUI.css` `.swap-controls` rules, applied by a
  `mobileLeftHanded` config). MobileUI applies it on init and reacts to a
  `ragnatouch:mobilelayout` window event (decoupled from the panel to avoid an import
  cycle). Default off — a no-op CSS class until enabled. Fuller drag-to-reposition
  layout editing is a possible future extension.

- **Mobile settings panel.** Added `src/UI/Components/MobileSettings/` (GUIComponent),
  a draggable panel that centralizes the RagnaTouch mobile toggles — haptics, UI
  scale and left-handed layout — each writing to the runtime config (and refreshing the
  relevant module) and persisting via Preferences. Stored choices are re-applied to
  the config when the module loads, so they survive across sessions. Opened from a new
  🎛️ button in the MobileUI top bar. Render quality is intentionally left to the
  existing GraphicsOption UI + the adaptive default, to avoid overriding it.

- **Haptic feedback (opt-in).** Added `src/Core/Haptics.js`, a `navigator.vibrate`
  wrapper gated by capability + touch session + the `haptics` config (default off).
  Wired into MobileUI touch actions (`MobileUI.js`): light tap on button presses, a
  stronger pulse on skill-bar buttons, and an attack pulse. No-op on desktop or when
  unsupported/disabled. Documented in `applications/pwa/Config.js`.

### Documentation

- **README RagnaTouch section.** Prepended a RagnaTouch section to `README.md`: the
  derivative identity + GPL-v3 notice + attribution, the mobile-first highlights, how
  to build and run the PWA/mobile target, the mobile config options table, and the
  local test path (wsProxy + Remote Client). The existing roBrowserLegacy README
  content is preserved below it. Links `CHANGES.md` and `doc/PERFORMANCE.md`.

### Performance — investigation (no code change)

- **Code-split investigation (measure-only).** Documented the bundle baseline and
  composition in [`doc/PERFORMANCE.md`](doc/PERFORMANCE.md). Headline finding: the 23
  per-version packet-length files in `src/Network/Packets/` total **4.19 MB** of
  source and are all imported statically (`PacketLength.js:14-36`), yet only one is
  used per session — the single biggest code-split opportunity. It is **not**
  implemented here because it requires making packet-length init async (threading
  through the connection flow), switching the builder off single-file output (which
  changes the deploy model), and careful regression testing of a REVIEW.md-critical
  subsystem. Recommended as a dedicated, separately-approved task.
