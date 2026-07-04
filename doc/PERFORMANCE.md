# Performance notes (RagnaTouch)

Measured in the build sandbox. Real FPS / memory on a device are **not** measured
here — see the on-device checklist in the PR/CHANGES.

## Bundle baseline (`npm run build:online`)

| Artifact | Unminified | Minified (`--m`) |
| --- | --- | --- |
| `Online.js` (full game client) | **11.9 MB** | **7.19 MB** |
| `ThreadEventHandler.js` (worker) | 607 KB | — |
| `PathFindingWorker.js` | 5.3 KB | — |

The builder bundles each app into a single file (`codeSplitting: false`,
`entryFileNames: '<App>.js'`), and the minified build warns that chunks exceed
500 kB. There is no code-splitting today.

## Source composition (bytes, excluding `src/Vendors`)

| Subsystem | Bytes |
| --- | ---: |
| Network | 5,028,486 |
| DB | 2,119,243 |
| UI | 2,098,633 |
| (Vendors) | 1,347,562 |
| Renderer | 674,104 |
| Engine | 427,055 |
| everything else | < 160 KB each |

## B12 — code-split investigation (measure-only)

**Finding #1 (largest, well-localized): per-version packet length tables.**
`src/Network/Packets/` holds **23 files totalling 4.19 MB** of source
(`packets2003_len_main.js` … `packets2025_len_main.js`; `packets2008_len_main.js`
alone is 1.25 MB). `src/Network/PacketLength.js:14-36` imports **all 23**
statically, but `PacketLength.init(packetver)` (`:71-99`) selects exactly **one**
year per session. So ~4 MB of source is parsed and shipped that a given client
never uses.

The selection is already keyed by a computed `selectedYear`, so the natural fix
is to replace the 23 static `import * as pYYYY` with a dynamic
`import('./Packets/packets${selectedYear}_len_main.js')`, letting the bundler emit
one chunk per version and load only the matching one. Estimated initial-bundle
reduction: most of the 4.19 MB (only one ~50–180 KB version file would load).

**Why it is NOT done here (needs a dedicated, separately-approved task):**

1. `PacketLength.init()` is **synchronous**; a dynamic `import()` is async, so the
   connection/init flow (`NetworkManager`, `PacketVerManager`) must `await`
   packet-length init before processing packets. Non-trivial control-flow change.
2. The builder emits a **single file per app** (`codeSplitting: false`). Dynamic
   chunks require enabling code-splitting and serving multiple files, which changes
   the documented single-file deploy model (`doc/README.md` §4.1 "copy
   `dist/Web/*`").
3. `src/Network/` is a **REVIEW.md 🔴-critical area** — a regression can break any of
   the 23 supported packet versions. Requires careful, well-tested work.

**Smaller opportunities (lower priority):** the DB Skill/Item/Effect tables
(`src/DB/Skills` 521 KB, `src/DB/Items` 395 KB, `src/DB/Effects` 355 KB) are large
static data imported eagerly; they could be lazy-loaded, but are needed early in
gameplay. `GUIComponent`/`UIComponent` already lazy-load some heavy modules to keep
viewer bundles light.

**Recommendation:** pursue Finding #1 as its own approved task with full packet
regression testing; treat the builder code-splitting switch as part of that task.
