# Gifty Spritepacks — Design Spec

**Date:** 2026-06-28
**Status:** Approved design, pending implementation plan
**Topic:** Convert Gifty (Rory® present-box mascot) from a live-composited layered rig into a precomputed, channel-based sprite-pack system with any→any transitions, built by a deterministic Rust pipeline.

---

## 1. Problem

Gifty today is a React/TypeScript browser component (`mvp-ui/src/app/components/shared/gifty/RigGifty.tsx`). It composites **12 ordered layers** at ~60fps using CSS transforms, masks, and z-order tricks, drawing from **58 source PNGs** (`public/gifty/rig-final/`, 127MB) compressed into multi-tier WebP/PNG atlases (`public/gifty/rig-web/`).

This is **too chunky for mobile and low-bandwidth clients**. All four costs bite at once:

- **Cold load latency** — nothing shows until JSON + atlas + ≥12 layer images arrive and decode.
- **Download size** — the 512 atlas alone is 167KB WebP / 625KB PNG; the source rig is 127MB.
- **Runtime compositing** — stacking 12 transformed/masked layers per frame janks on low-end mobile GPUs.
- **State-change stutter** — swapping eyes/mouth/arms can pop or flash mid-interaction.

**Goal:** Gifty appears near-instantly on a weak connection, never composites 12 layers at runtime, and can transition smoothly between **any state and any other state** — without the N² art explosion that a naive "every config → every config" spritesheet would require.

## 2. Motivations (why this is worth doing)

All four named by the product owner:

- **Performance / scale** — kill the request waterfall and the runtime composite for mobile.
- **Determinism / safety** — replace the fragile Node + Python + sharp pipeline with one tested, reproducible Rust toolchain.
- **Consistency with backend** — mvp-rust backend is Rust; the asset toolchain should be too.
- **New capability** — a clean primitive-composition contract that the chatbot AI can drive (AI emits a state, mascot plays it).

## 3. Key insight — channels, not combinations

The combinatorial trap: 7 moods × ~18 arm poses × ~5 mouth states ≈ **630 pose combinations**; full any→any transition clips ≈ ~400,000 clips. Dead on arrival.

The escape is **channel decomposition**, which turns multiplication into addition. Gifty's current rig *already* animates face, arms, body, and legs as independent z-order bands with independent transforms — we are baking a decomposition that already exists, not imposing a new one.

| Channel | States (from `rig.json`) | Plays independently |
|---|---|---|
| **Face** | 3 eyes × 7 mouths (incl. talk visemes `talk_ah/oh/eh`), + blink overlay | yes |
| **Arms** | 9 `armR` + 9 `armL` poses, + wave/gesture clips | yes |
| **Body** | breathe/bob loop, lean | yes |
| **Legs** | stand / walk / sit (low priority; folds into Body band for v1) | yes |

Runtime composites **≤3 flat channel sheets**, not 12 cropped+masked layers. Within each channel, any→any is free (channels are orthogonal). Cross-channel and within-channel *motion* transitions use:

- **Hub-and-spoke** for arms — each pose has a short `enter-from-idle` + `exit-to-idle` clip; any pose reaches any other via the neutral idle hub. ~2N clips, not N².
- **Crossfade** for faces — a short opacity dissolve where baked motion isn't worth it. Generated for free.

This synthesis — **channels as the structure, hub-and-spoke for arm motion, crossfade for faces** — is the load-bearing design idea.

## 4. Sizing math (decides precompute vs. hybrid)

Measured from current assets (256px tier ≈ **1.2KB/cell WebP**; 512px ≈ **2.9KB/cell**):

| Channel | Frames (incl. transitions) | @256px WebP |
|---|---|---|
| Face | ~24 | ~29KB |
| Arms (poses + hub-and-spoke enter/exit) | ~24 + ~36 | ~72KB |
| Body | ~8 | ~10KB |
| **Total catalog** | **~92 frames** | **~110KB** |

At 512px the full catalog is ~270KB. **The entire any→any system at mobile resolution (~110KB) is smaller than today's single 512 atlas (167KB WebP).**

**Decision: precompute-only for v1.** A live server would stand up infrastructure to generate something that fits in a single HTTP response. **Hybrid is rejected for v1**; the pack format is kept hybrid-*ready* so a live Rust compositor can be added later without redesign.

## 5. Architecture — three layers, runtime stays React

```
LAYER 1 — Asset Pipeline   → RUST (new, replaces Node+Python+sharp)
  rig-final/ PNGs + rig.json  →  giftyc  →  gifty.pack (manifest + channel WebP sheets)
  deterministic, golden-image tested, reproducible CLI

LAYER 2 — Runtime           → REACT/TS (RigGifty compositor replaced by SpritePackPlayer)
  plays pre-flattened idle frame instantly; lazy-loads pack;
  stacks ≤3 channel canvases; plays transition clips on state change
  AI contract unchanged: emits { face, arms, body, talking }

LAYER 3 — Live Compositor   → OUT OF SCOPE for v1 (format kept compatible)
```

**The frozen interface** is the spritepack manifest schema. Layer 1 produces it, Layer 2 consumes it, a future Layer 3 reuses it. The current `rig-final/rig.json` remains the **source of truth for art**; `giftyc` reads it and never overwrites it.

### Why the browser runtime is NOT rewritten to Rust/WASM

CSS/canvas frame playback is the right tool in the browser, runs at 60fps with zero server cost, and WASM would add download weight and risk on exactly the mobile devices we're optimizing for. Rust earns its keep in the **offline pipeline** (Layer 1), not the runtime.

## 6. Spritepack format (`gifty.pack`)

A versioned manifest JSON + per-channel WebP sheets (+ PNG fallback). The format supports **both** "play these stacked channel sheets" and "play this single pre-flattened sheet," chosen per-state — this is the escape hatch in §7.

Manifest declares (illustrative shape, finalized in the plan):

```jsonc
{
  "version": 1,
  "canvas": 1024,                 // source authoring resolution
  "tier": 256,                    // this pack's render resolution
  "hero": { "sheet": "hero.webp", "frame": 0 },   // pre-flattened idle, instant cold-load
  "channels": {
    "face":  { "sheet": "face.webp",  "frames": [...], "states": { "happy": [...], "talk": [...] } },
    "arms":  { "sheet": "arms.webp",  "frames": [...], "states": { "down": [...], "wave": [...] },
               "transitions": { "down->wave": { "frames": [...], "ms": 180 } } },  // hub-and-spoke
    "body":  { "sheet": "body.webp",  "loop": [...], "ms": 2400 }
  },
  "crossfade": { "face": { "ms": 120 } }            // dissolve for face mood swaps
}
```

Frozen contract rules:
- Schema is versioned; runtime refuses unknown major versions.
- States are named by **primitive** (what the part depicts), not by mood — the AI composes moods, consistent with the existing rig philosophy.
- Hub-and-spoke transitions are addressable as `from->to`; absence means "crossfade/snap."

## 7. Runtime behavior (`SpritePackPlayer`, Layer 2)

Replaces the `RigGifty` compositor; the public React prop surface stays compatible (`{ mood/face, arms, body, talking, wave }`), so existing call sites and the future AI integration point don't change.

1. **Cold load:** fetch + paint the **pre-flattened idle hero frame** (one `<img>`, ~3KB). Time-to-first-Gifty is one tiny image. No pack, no channels yet.
2. **After first paint / on first interaction:** lazy-fetch `gifty.pack` (~110KB @256px, one request).
3. **Steady state:** stack **≤3 channel canvases** (face / arms / body). Each plays its own frames on its own clock — body breathes while face talks while an arm waves, with zero extra art. No CSS masks, no per-layer transform-origin math, no arm-behind/arm-front z-juggling.
4. **State change:** play the hub-and-spoke transition clip for arms; crossfade for face; snap for instantaneous states. Nothing fetches mid-interaction.
5. **Tier:** default 256px on mobile; optional 512px pack lazy-upgraded on hi-DPI/desktop (reuses the existing `pickTier` policy idea).

Channel-independence preserves the idle hero as a one-layer instant paint while keeping cheap flexibility for everything after — option-2 cold-load, option-1 runtime.

## 8. Rust pipeline (`giftyc`, Layer 1)

Replaces `scripts/gifty/*` (Node `.mjs` + Python). Satisfies consistency, determinism, and performance motivations.

Steps:
1. Read `rig-final/` PNGs + `rig.json` (existing source of truth; never overwritten).
2. Composite each channel's named states into flat frames (`image` + `imageproc` crates; no sharp/Python).
3. Bake hub-and-spoke arm transition clips (rendered/interpolated from existing poses).
4. Pre-flatten the idle hero frame.
5. Shelf-pack each channel into a WebP sheet (+ PNG fallback); emit the manifest.
6. **Determinism:** same input → byte-identical output, asserted by golden-image tests in CI. No timestamps, no nondeterministic ordering.

CLI surface (finalized in plan): `giftyc build`, `giftyc verify` (diff against golden), `giftyc spike` (the fidelity check below).

## 9. Mandatory first step — fidelity spike

Channels compose cleanly only if the parts are **visually separable**. The current rig fakes some separation with masks and z-order (arm-behind/arm-front allowlists, eyelid clipped to the eye-white mask). Flattening channels independently could produce seams or a "floating arm" look.

**Before baking the full catalog**, the plan's first task bakes **one** face sheet + **one** arm sheet, composites them flat at 256px, and diffs against the live rig at mobile size.

- **Green** (no seams): proceed with full channel bake as designed.
- **Seams:** identify which channels must be **co-baked** (e.g. arms+body together, face alone). The design flexes to fewer/grouped channels without changing shape — the manifest already supports arbitrary channel groupings.

This ordering is the difference between confident and hoping. No full bake before the spike passes.

## 10. Mobile budget

No hard cap was set; the design targets a sensible, tunable default:

- **Hero idle frame:** ~3KB, target paint < 200ms on throttled 3G.
- **Core pack (@256px):** ~110KB, single lazy request.
- **512px pack:** ~270KB, optional hi-DPI upgrade.

Budgets are manifest-tunable (tier, channel inclusion) rather than hardcoded.

## 11. Scope

**In scope (v1):**
- `gifty.pack` format + versioned manifest schema.
- `giftyc` Rust pipeline (build + verify + spike), golden-image tested.
- `SpritePackPlayer` React runtime replacing the `RigGifty` compositor, prop-compatible.
- Fidelity spike as the first implementation task.
- Channels: Face, Arms, Body (Legs folded into Body).

**Out of scope (v1, design kept compatible):**
- Layer 3 live Rust compositor service.
- AI image-model generation of *new* art (no new poses synthesized; v1 uses existing `rig-final/` primitives only).
- Hybrid precompute/live serving.
- WASM runtime renderer.

**Unchanged:**
- `rig-final/` remains the art source of truth.
- The AI ↔ mascot contract: AI emits `{ face, arms, body, talking }`; runtime plays it.

## 12. Risks

| Risk | Mitigation |
|---|---|
| Channels don't composite without seams | Fidelity spike first (§9); fall back to co-baked channel groups. |
| Hub-and-spoke transitions look robotic | Crossfade fallback; tune clip frame counts; keep idle hub neutral. |
| Catalog grows past mobile budget if new poses added | Manifest tier/channel tuning; lazy per-channel packs; revisit hybrid only if size math breaks. |
| Rust pipeline non-reproducible | Golden-image CI assertion; no timestamps/nondeterministic ordering. |
| Other in-flight sessions touch shared files | Spec/pipeline are self-contained under `gifty/`; no edits to casino/social-layer files. |

## 13. Success criteria

- Time-to-first-Gifty < 200ms on throttled 3G (hero frame).
- Full any→any catalog ≤ ~110KB @256px, one lazy request.
- Runtime composites ≤3 layers, no CSS masks.
- Any state → any other state transitions smoothly (hub-and-spoke or crossfade).
- `giftyc build` is byte-deterministic (golden CI passes).
- Visual fidelity at 256px matches the live rig (spike + reviewer sign-off).
