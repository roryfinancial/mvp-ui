# Gifty Spritepack Runtime (Plan 2) — Design Spec

**Date:** 2026-06-29
**Status:** Approved (design carried from the 2026-06-28 spritepack brainstorm; not re-brainstormed)
**Topic:** `SpritePackPlayer` — the React/TS runtime that renders the precomputed `giftyc` sprite pack, replacing the 12-layer `RigGifty` compositor on mobile/low-bandwidth, and exposing the same prop surface so the AI can drive the mascot.

---

## 1. What this builds

Plan 1 (`giftyc`) shipped a deterministic **140KB sprite pack** at `mvp-ui/public/gifty/packs/256/` (manifest.json + face/arms/body/hero WebP sheets). Nothing in the app consumes it yet — Gifty still renders via the heavy `RigGifty.tsx` (12 CSS layers, 65 assets). This plan builds the consumer: a `SpritePackPlayer` React component that

1. paints the **pre-flattened hero frame** instantly on cold load (one tiny crop, no pack fetch),
2. lazy-loads the pack and renders Gifty by **stacking ≤3 flat channel canvases** (face / arms / body) — no CSS masks, no 12-layer composite,
3. animates state changes via short transitions (crossfade for face, snap/crossfade for arms in v1),
4. preserves the existing prop surface so call sites and the AI integration are unchanged.

## 2. The manifest contract (frozen, from Plan 1)

```jsonc
{
  "version": 1, "canvas": 1024, "tier": 256,
  "hero": { "name": "hero", "cell": { "sx":2,"sy":2,"sw":173,"sh":214 }, "ms": 0 },
  "channels": [
    { "name": "face", "sheet": "face.webp", "frames": [ { "name":"mouth_smile", "cell": {…}, "ms":0 }, { "name":"eyes_normal", … } ], "transitions": [] },
    { "name": "arms", "sheet": "arms.webp", "frames": [ { "name":"armR_wave", … }, { "name":"armL_down", … } ], "transitions": [] },
    { "name": "body", "sheet": "body.webp", "frames": [ { "name":"body", … } ], "transitions": [] }
  ]
}
```

Frame-name conventions the runtime keys off:
- **face:** `mouth_<key>` (smile, shy, proud, hmm, talk_ah, talk_oh, talk_eh) and `eyes_<key>` (normal, smug, happy). A face render = one mouth frame + one eyes frame stacked.
- **arms:** `armR_<pose>` and `armL_<pose>` (down, wave, thumbsup, fist, salute, open, present, calm, sad, hip, hold). An arms render = one armR + one armL frame stacked.
- **body:** single `body` frame (the breathe/bob is a runtime CSS transform, not baked).
- `cell` = pixel rect in the sheet. **`place`** = normalized `{x,y,w,h}` (0..1) bbox on the 1024 canvas — where this frame sits, for cross-channel registration (added in manifest v2; see §5). `ms` always a number; `transitions` always an array (uniform shape — guaranteed by Plan 1).

**Hero note:** the hero is the full default composite (default mouth=smile, eyes=normal, armR=thumbsup, armL=down). It lives in `hero.webp`, a separate one-cell sheet.

## 3. Prop surface (must match `RigGifty` exactly — drop-in)

```ts
RigGifty({ size=320, mood="normal", talking=false, wave=false,
           armR?, armL?, legs?, brow="neutral", eyes?, mouth?, tier="web" })
```

`SpritePackPlayer` accepts the same props. v1 mapping:
- `mood` → resolves to an `(eyes, mouth)` pair via a small mood table (same moods `RigGifty` supports). Direct `eyes`/`mouth` props override `mood` (as today).
- `talking` → cycles the mouth through the `talk_*` visemes (110ms/frame, matching `RigGifty`'s `TALK_CYCLE`).
- `wave` → plays the right arm `wave` pose (v1: snap to wave + a CSS swing transform; baked wave-clip frames are a future giftyc addition).
- `armR`/`armL`/`legs` → direct pose selection (legs has only `body` baked in v1 → ignored/no-op, documented).
- `brow` → **not in the pack** (eyebrows are baked into the face band, not independently posable). v1: accepted but no-op, documented. (Independent brows would need a giftyc brow channel — out of scope.)
- `size` → CSS pixel size of the square render box.
- `tier` → ignored in v1 (only the 256 pack exists); kept for signature compatibility.

This means **the AI integration point is identical to today's**: emit `{ mood|eyes|mouth, armR, armL, talking, wave }`, pass to the component, it plays.

## 4. Architecture — files & responsibilities

```
src/app/components/shared/gifty/spritepack/
  useSpritePack.ts      — fetch + cache the manifest and sheet <img>s (WebP, hero first)
  spritePackTypes.ts    — TS types for the manifest (version 1)
  moodMap.ts            — Mood → { eyes, mouth } table (mirrors RigGifty's mood semantics)
  frameStyle.ts         — pure: cell rect → CSS background-position/size for a sheet-backed div
  SpritePackPlayer.tsx  — the component: hero-first paint, 3-channel stack, talk/wave/transition loop
```

Each unit is independently testable:
- `frameStyle.ts` — pure function (sheet dims + cell → CSS), unit-tested like the existing `spriteStyle.ts`.
- `moodMap.ts` — pure lookup, unit-tested.
- `useSpritePack.ts` — hook; loads hero immediately, then manifest + 3 sheets.
- `SpritePackPlayer.tsx` — composition + animation tick (rAF), mirroring `RigGifty`'s loop structure.

## 5. Render model

- A fixed-size square box (`size`×`size`). Inside, **three absolutely-positioned channel layers**, z-ordered body → arms → face (matching the bake band order, so the stack reproduces the full composite).
- Each channel layer is a `<div>` (or two, for the two-frame channels) with `background-image: url(<sheet>)` and `background-position/size` computed by `frameStyle` to crop the active cell, scaled to fill the box. This is the same atlas-crop technique the current `spriteStyle.ts`/`useWebRig` already uses — proven, no canvas needed.
- **face** = two stacked divs (mouth cell + eyes cell). **arms** = two stacked divs (armR + armL). **body** = one div.
- Frames are placed using each frame's **`place`** field — its normalized bbox on the 1024 canvas (`{x,y,w,h}` in 0..1) — so channels register correctly over each other. The runtime sizes/positions each channel div to `place * size`, and crops the sheet cell into it via `frameStyle` (mirrors the existing `spriteCss` `{place, cell, atlas, size}` signature).

**Manifest v2 amendment (giftyc Task 0):** the v1 pack records only `cell` (sheet coords), not where the frame sits on the canvas — the runtime can't register channels without that. giftyc is amended to add `place: {x,y,w,h}` (normalized 0..1, from the alpha bbox `crop_to_alpha` already computes) to every frame and the hero, and bump `version` to `2`. The golden pack is regenerated and re-verified. The runtime consumes v2; it refuses other major versions.

## 6. Cold-load & lazy sequence

1. Mount → fetch `hero.webp` + read the hero cell from a tiny inline default (or a `hero.json`); paint one cropped div. Time-to-first-Gifty = one small image.
2. After first paint (idle callback / effect) → fetch `manifest.json` + face/arms/body sheets.
3. When all three sheets are ready → swap from hero-only to the 3-channel stack at the current state.
4. Prop changes after that → update the active frame per channel; face mood changes crossfade (short opacity tween), arms snap (v1).

If the pack fetch fails, the hero frame stays (graceful degradation — Gifty still visible).

## 7. Animation (v1, mirrors RigGifty where it already works)

- **Breathe/bob:** CSS transform on the whole stack (`translateY`/`scale` sine), same constants as `RigGifty`.
- **Blink:** v1 has no separate eyelid frame in the pack → **no blink in v1** (documented gap; a future giftyc eyelid sub-bake adds it). Acceptable: the eyes frames are open/expressive.
- **Talking:** cycle mouth frame through `talk_ah → talk_oh → talk_eh` at 110ms while `talking` is true; return to resting mouth when false.
- **Wave:** show `armR_wave` + a CSS rotation swing on the arm layer.
- **Transitions:** face mood/mouth change = 120ms crossfade between two face renders; arms = snap in v1.

## 8. Integration & migration

- Add a route/usage that renders `SpritePackPlayer` (reuse `/gifty-demo` with a toggle, or a new `/gifty-pack-demo`, to compare side-by-side with `RigGifty` before switching).
- **Do not delete `RigGifty` in this plan.** Prove the player at parity first; retiring the heavy rig is a follow-up once the player is adopted at real call sites.
- The only current call site is `GiftyDemo`. v1 wires the player into a demo for visual verification; broader rollout is incremental and out of scope here.

## 9. Scope

**In (v1):** `SpritePackPlayer` + the 4 helper modules; hero-first cold load; 3-channel stack render; mood→eyes/mouth mapping; talking viseme cycle; wave; breathe; face crossfade; a demo page for visual parity check; unit tests for the pure modules + a render smoke test.

**Out (v1, documented no-ops or follow-ups):** blink (needs eyelid bake), independent brow posing (baked into face), independent smug-pupils (no pupils frame baked — the Plan 1 open question), baked arm transition clips (hub-and-spoke frames; manifest `transitions` is empty today), 512px tier, deleting `RigGifty`, the live AI compositor service.

**Unchanged:** the prop surface (AI drives it identically); the pack format; `giftyc`.

## 10. Open question carried from Plan 1

The pack bakes no independent pupils frame (face = mouths×default-eyes + eyes×default-mouth). If the product wants the `smug` mood's pupils to differ from `normal`, the `eyes_smug` frame already encodes that (eyes baked with their own pupils), so **mood-level pupil variation works**; what's missing is *independent* pupil drift/gaze. v1 accepts static pupils (whatever the eyes frame contains). If gaze is wanted later, add a giftyc pupils channel. **Decision for v1: static pupils, no independent gaze.**

## 11. Success criteria

- `SpritePackPlayer` renders a recognizable Gifty from the 140KB pack on the demo page.
- Hero frame paints before the channel sheets load (verifiable: throttle network, hero shows first).
- Talking cycles visemes; wave shows the wave arm; breathe animates.
- Mood prop produces the same expression `RigGifty` would for the moods that map to baked frames.
- Pure modules (`frameStyle`, `moodMap`) unit-tested; component renders without error in a smoke test.
- No 12-layer composite, no CSS masks in the new path.
