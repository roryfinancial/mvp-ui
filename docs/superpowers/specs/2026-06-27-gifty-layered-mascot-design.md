# Gifty Layered Mascot — Design Spec

**Status:** approved direction, pre-implementation
**Date:** 2026-06-27
**Supersedes:** the sprite-clip engine on branch `feat/gifty-sprite-engine`
(kept for reference; not merged).

## Goal

A reactive, alive Gifty mascot for the Rory app, built from the high-quality
Gemini renders we have — looking exactly as good as those renders, never
downscaled, smeared, or jittery.

## Approach: "Rig the idle, swap the poses" (Option C)

Two mechanisms working together:

1. **Idle rig (cutout / VTuber-style):** the default resting Gifty is cut into a
   few transparent layers and animated by CSS transforms — body breathes/bobs,
   eyes blink, pupils dart, bow bobs. This is the state the user stares at most,
   so it must feel alive.

2. **Pose-swap reactions:** for every other state (wave, sad, celebrate, sleep,
   proud, think, present, thumbs-up, salute) we cross-fade the whole-image
   high-quality render in. Each render gets subtle whole-image micro-life (gentle
   breathe/scale) so it never reads as a dead PNG.

Why this and not the alternatives: the sprite-clip engine fought low-res frames
and transition smear; a full cutout rig would require painful inpainting of
occluded parts. Option C uses the pristine renders directly and only rigs the
parts that actually move at rest (no occlusion problem — eyes/pupils/bow sit ON
the kept-whole base).

## Assets (already in `docs/design/gifty/`)

| Render | State |
|---|---|
| `…cqmh61…` | **idle** — arms-down neutral (RIG BASE; clean, unoccluded) |
| `…kc9x3v…` | wave |
| `…1c2np9…` | thumbs-up |
| `…r9wewp…` | salute / hello |
| `…u1b4qy…` | proud (crown, fist) |
| `…ew4fcu…` | celebrate / pop (confetti) |
| `…bfzncm…` | sad (empty box) |
| `…vcp61a…` | sleep (zzz) |
| `…xzp7kc…` | think (lightbulb) |
| `…wvymda…` | present-gift |
| `…jyyc72…` | 9-pose reference sheet (not shipped; design reference) |

All are 1024×1024, solid light-grey background (cleanly removable).

## Validated facts (proven during exploration)

- Background removal from the grey is clean (no halo). → `00_char.png`.
- Eye-whites are reliably locatable via interior-white detection in the face
  zone; they form two compact blobs (cluster, drop <50px specks, take bboxes).
- Pupils = dark pixels within each eye bbox. Bow = pink+gold in the top region.
- Region-masked extraction (color within a spatial bbox) works where global
  color thresholding over-grabbed.

## Components / files

### Build pipeline — `scripts/gifty/extract-layers.mjs`
Input: the render PNGs. Output: `public/gifty/rig/` containing:
- `base.png` — full character, bg removed (the body+arms+legs+ribbon, whole)
- `eye-white-l.png`, `eye-white-r.png` — extracted eye whites (with positions)
- `pupil-l.png`, `pupil-r.png` — extracted pupils (with positions)
- `bow.png` — extracted bow (with position) — optional bob layer
- `layers.json` — per-layer { src, x, y, w, h } in a 0–1000 normalized space
And `public/gifty/poses/` — each non-idle render, bg-removed + trimmed +
normalized to a common canvas/anchor so cross-fades don't jump:
`wave.png`, `sad.png`, `celebrate.png`, `sleep.png`, `proud.png`, `think.png`,
`present.png`, `thumbsup.png`, `salute.png`, plus `poses.json`.

Re-runnable; deterministic. Uses `sharp` (devDependency).

### Runtime — `src/app/components/shared/gifty/`
- **`RigIdle.tsx`** — renders the idle layer stack absolutely-positioned from
  `layers.json`; drives transforms with a small rAF loop or CSS keyframes:
  - body: breathe (scale 1→1.02), gentle bob (translateY)
  - eyes: blink (scaleY→~0.1 briefly, randomized 3–6s); pupils: slow dart
  - bow: subtle bob/tilt offset from body
- **`Gifty.tsx`** — public component `<Gifty state size />`. Shows `RigIdle`
  for `idle`; for any other state cross-fades to the pose render (two stacked
  `<img>`, opacity transition ~180ms) with whole-image micro-breathe. On a
  one-shot reaction (e.g. `celebrate`), optionally auto-return to idle.
- Honors `prefers-reduced-motion`: static idle base, no rAF.

### Demo — `/gifty-demo`
Buttons for every state; shows the idle rig living and pose cross-fades.

## State model

```
type GiftyState =
  | "idle" | "wave" | "sad" | "celebrate" | "sleep"
  | "proud" | "think" | "present" | "thumbsup" | "salute";
```
`idle` = rigged. All others = pose-swap. `celebrate` is one-shot (returns to
idle); the rest hold until `state` changes.

## Normalization (critical for clean cross-fades)

Every pose render and the rig base must share the same **anchor**: bg-removed,
trimmed to alpha bbox, scaled so the body occupies a consistent height, centered
horizontally with feet on a common baseline. Otherwise cross-fades visibly jump
in size/position. Same union-anchor lesson learned from the sprite jitter fix.

## Out of scope (v1)

- Inpainting occluded parts (not needed — base stays whole).
- Independent arm/leg rigging (arms move only via pose-swap, not transforms).
- RIFE / generated in-betweens (pose cross-fade replaces them).
- New clip generation (we have all needed states as renders).

## Risks

- **Eye extraction fidelity:** if blink/dart overlays don't perfectly match the
  render's eyes, blink can look "off." Mitigation: extract the real eye art (not
  drawn); keep base eyes underneath so a slightly-imperfect overlay still reads.
- **Pose anchor drift:** renders are hand-generated at varying framings;
  normalization must be robust. Mitigation: trim+baseline-align every pose.
- **Cross-fade between very different poses** (idle→celebrate) still dissolves;
  acceptable for whole-image swaps (no smear because each image is pristine).
