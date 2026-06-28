# Gifty Rig Compressor — Design Spec

**Status:** approved direction, pre-implementation
**Date:** 2026-06-28
**Relates to:** `2026-06-27-gifty-layered-mascot-design.md` (the rig this compresses)
**Branch:** `feat/gifty-sprite-engine`

## Goal

Make the layered Gifty rig load and render efficiently on real devices without
losing the high-quality source art. Today the rig is **58 PNG layers, each a full
1024×1024 canvas, ~37 MB total** — but each layer's actual content (a mouth, an
eye, an arm) occupies only a small region of that canvas. We ship a 1 MB image to
draw a 150 px mouth.

This project builds a **build-time compressor** that packs the rig into
**multi-resolution sprite atlases** (one downloaded image per tier instead of 58),
and a **runtime tier** in `RigGifty` that renders from those atlases — defaulting
to a fast 512 tier and progressively upgrading to 1024 on capable clients.

The original 1024 PNG layers are **preserved untouched** as the HQ tier for hero
images and future high-quality renders.

**Explicitly out of scope (deferred):** the *animation* spritesheet exporter
(pre-rendering smug → happy-wave → sad transition frames). That is a separate
project we return to once this optimizable runtime works. "Spritesheet" here means
an **icon-library-style static atlas of body parts**, not animation frames.

## Non-goals

- No change to how Gifty *looks*. Pixel-equivalent output at each tier.
- No re-cutting or re-arting of layers. We consume the existing PNGs + `rig.json`.
- No animation/transition exporter (separate future project).
- No backend/CDN work; atlases are static assets under `public/`.

## Architecture

Two deliverables, one clean interface (the atlas JSON) between them.

### 1. Compressor — `scripts/gifty/compress-rig.mjs` (Node, uses `sharp`)

`sharp` is already a project dependency.

Input: `public/gifty/rig-layers/*.png` + `rig.json`.
Output: a new `public/gifty/rig-web/` directory (originals never modified):

```
public/gifty/rig-web/
  rig-1024.webp   rig-1024.png   rig-1024.json
  rig-512.webp    rig-512.png    rig-512.json   ← default tier
  rig-256.webp    rig-256.png    rig-256.json
  rig-128.webp    rig-128.png    rig-128.json
```

Pipeline per run:

1. **Crop** each layer to its real alpha bounding box (the main size win). Record
   each layer's **placement box** as 0..1 fractions of the 1024² face
   (`{x, y, w, h}` — derivable from the existing `rig.meta` boxes, which already
   store exactly this; we recompute from the actual cropped bbox to be exact).
2. **Pack** all crops into a single atlas image via shelf/row packing (sort by
   height desc, place left→right wrapping to new rows). Record each layer's atlas
   cell `{sx, sy, sw, sh}` in pixels.
3. **Scale** per tier: the 1024 tier uses native crop pixels; 512 = ×0.5, 256 =
   ×0.25, 128 = ×0.125. (Tier number = the final whole-Gifty render size the tier
   is sized for.)
4. **Encode**: WebP lossy `quality≈90` (default) + lossless PNG fallback per tier.
5. **Emit JSON** per tier: `{ tier, canvas, atlas: {w,h}, layers: { <name>:
   {place:{x,y,w,h}, cell:{sx,sy,sw,sh}} }, ...carried rig metadata }`. The JSON
   also carries the non-image rig data the runtime needs (order, base, mouths,
   eyes, pupils, eyelid, lashline, eyerim, sockets, pupilRest, lidRest, defaults,
   moods) so the web runtime needs only `rig-<tier>.json` + the atlas.

Flags (defaults baked per tier so a plain run "just works"):
- `--quality=<n>` WebP quality (default 90).
- `--scale=<f>` extra global scale multiplier for ad-hoc smaller tiers.
- `--tiers=128,256,512,1024` which tiers to emit (default all four).
- `--out=<dir>` output dir (default `public/gifty/rig-web`).

The script is **idempotent and re-runnable**; it regenerates the whole `rig-web/`
dir from current sources. Add an npm script: `"rig:compress": "node
scripts/gifty/compress-rig.mjs"`.

### 2. Runtime — `RigGifty.tsx` tiers

**Back up `RigGifty.tsx` to `RigGifty.hq.bak.tsx` before editing** (per user
instruction — protect the known-good render path).

- New prop `tier?: "web" | "hq"`, **default `"web"`**.
- `tier="hq"` → the **current full-canvas-PNG render path, preserved verbatim**.
  Used for hero/high-quality renders.
- `tier="web"` → new **CSS background-sprite** path:
  - Fetch `rig-<resTier>.json` + use `rig-<resTier>.webp` (with `.png` fallback
    via `<picture>`/feature-detect) as the atlas `background-image`.
  - Each layer renders as a `<div>` positioned/sized by its `place` box (scaled to
    the component `size`), with `background-size` + `background-position` selecting
    its atlas cell. Visually identical to the full-canvas version.
  - **Full animation parity:** all current motion is preserved — bob/breathe,
    blink lid-slide, pupil dart/rest, wave, `lidRest`, the eyerim-on-top order.
    The CSS transforms that drive these move the sprite `<div>`s exactly as they
    move the `<img>`s today; only the pixel source changes.

**Progressive resolution loading** (`pickTier()` helper, intentionally simple now):
- Always load **512 first** for instant paint.
- Then **upgrade to 1024 if `window.devicePixelRatio > 1`** (retina/hi-DPI),
  by swapping the atlas/JSON to the 1024 tier (same layout keys, sharper image).
- Downgrade hooks (256/128) are supported by the data but not auto-triggered yet.
- `pickTier()` is the single seam where real frontend network/client config plugs
  in later. For now it encodes only the dpr rule above.

## Data flow

```
build:  rig-layers/*.png + rig.json
          └─ compress-rig.mjs ─→ rig-web/rig-{128,256,512,1024}.{webp,png,json}

runtime (tier="web", default):
  mount → load rig-512.json + rig-512.webp → paint immediately
        → pickTier(): dpr>1 ? swap to rig-1024 : stay
        → animate sprite <div>s (bob/blink/dart/wave) via CSS transforms

runtime (tier="hq"):  unchanged — loads rig.json + the 58 full-canvas PNGs
```

## Components / boundaries

| Unit | Purpose | Depends on | Testable by |
|---|---|---|---|
| `compress-rig.mjs` | Crop, pack, scale, encode, emit JSON | sharp, rig-layers, rig.json | run it; assert atlas + JSON shape, round-trip a layer |
| `rig-web/*.json` | Atlas map + carried rig data (the interface) | — | schema check |
| `RigGifty` web path | Render sprites from atlas, animate | rig-web JSON/atlas | visual composite vs hq path |
| `pickTier()` | Choose/upgrade resolution tier | `devicePixelRatio` | unit test the dpr branch |
| `RigGifty.hq.bak.tsx` | Frozen known-good render | — | reference for parity |

## Verification

- **Round-trip test:** for a sample of layers, composite the web atlas crop back at
  its `place` box and diff against the original full-canvas layer (alpha-aware) —
  assert negligible difference at the 1024 tier.
- **Parity render:** composite the eye region (and a full Gifty) via the web path
  and via the hq path; compare. Reuse the runtime-accurate compositing approach
  already used for the eyelid work (mask + transforms), not a naive preview.
- **Size assertion:** log per-tier total bytes; assert the 512 tier is an order of
  magnitude smaller than the 37 MB original.
- **Animation smoke:** confirm blink fully closes and pupils stay centered in the
  web path (the same checks used during the eyelid/pupil fixes).

## Risks & mitigations

- **Runtime regression** (the one risky change): mitigated by `tier="hq"` keeping
  the exact current path + a `.hq.bak.tsx` backup + web path being purely additive.
- **WebP fallback:** `<picture>` / capability check serves PNG where WebP is
  unsupported (rare in current browsers, but cheap insurance).
- **Sub-pixel placement drift** when scaling tiers: recompute `place` from the
  actual cropped bbox and round consistently; the parity render catches drift.
- **Atlas packing waste:** shelf packing is "good enough"; not optimizing to a
  perfect bin-pack (YAGNI).

## Future hooks (not built now)

- `pickTier()` gains real network/Save-Data/client-config inputs from the frontend.
- The deferred **animation exporter** can reuse `compress-rig`'s sharp-compositing
  code to render transition frames into animation spritesheets.
