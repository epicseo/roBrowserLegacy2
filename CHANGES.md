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
