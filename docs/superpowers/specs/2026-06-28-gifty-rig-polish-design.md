# Gifty Rig Polish — Design Spec

**Status:** approved direction, pre-implementation
**Date:** 2026-06-28
**Relates to:** the layered Gifty rig (`RigGifty.tsx`, `public/gifty/rig-layers/`)
**Branch:** `feat/gifty-sprite-engine`

## Goal

A focused polish pass fixing six issues found while reviewing the live rig, plus a
correctness audit of every mood/limb prop usage. No new features — make what
exists resolve, make sense, and read like coherent human actions.

After ANY art change to `rig-layers/`, re-run `npm run rig:compress` so the web
atlas (`rig-web/`) stays in sync — the web tier is the default render path.

## Fixes

### 1. Puppy eyes — yellow tint in the sclera ring
The thin ring of eye-white around the puppy's pupils has a yellow/cream cast
(~30% of the white pixels read yellow; the heatmap shows it's the crescent of
sclera around each pupil). The big pupils, tear-pools, and catchlights are fine.
**Fix:** neutralize only the yellowish white pixels (where `(R+G)/2 − B > ~12`
and the pixel is a bright-ish white, alpha high) toward a neutral cool-white that
matches the normal eyes' whites — desaturate the yellow by pulling R/G down to ≈B.
Write the corrected `puppy.png` in place (back up original to `.lid-backup/`).

### 2. Puppy eyes sit a smidge too low
The puppy layer's center is `cy≈0.404`; the normal eyes sit at `cy≈0.39`. The
puppy reads ~0.014 (of canvas) lower than the sockets it replaces.
**Fix:** nudge the puppy render UP by ~0.014·size. Cleanest as a render-time
offset in the `"puppy"` kind transform (a `translateY(-0.014·size)`), so the art
file is untouched and the value is tunable. Add a `puppyRest` (frac) to `rig.json`
defaulting to the offset so it's data-driven; verify against the normal eye Y.

### 3. Right (waving) arm clips INTO the body
Z-order is `body → legs → armL → armR → bow → …`, so arms paint ON TOP of the
body. Side-attached arms (wave/thumbsup/fist/open) then cut their root into the
box instead of tucking behind it. Across-body arms (hold) are *supposed* to be in
front. Measured body-overlap classifies them:
- **Behind-body (root meets the side, low overlap):** `armR_wave`(9%),
  `armR_open`(8%), `armR_fist`(13%), `armR_thumbsup`(14%); `armL_open`(37%),
  `armL_hip`(41%), `armL_thumbsup`(53%), `armL_salute`(60%).
- **In-front (reaches across the body, high overlap — keep on top):**
  `armL_hold`(100%), `armR_sad`(89%), `armR_calm`(75%), `armR_down`(62%),
  `armR_salute`(56%), `armL_sad`(100%), `armL_calm`(91%), `armL_down`(92%),
  `armL_wave`(92%).
  (Note: `armL_wave` overlaps 92% — the left wave art already includes the
  cross-body portion, so it stays in front; only the RIGHT wave needs to go
  behind. This matches "holding vs wave" intent per-arm.)
- **Outside body (z-order irrelevant):** `armR_present`(0%).

**Fix:** add a per-pose `behind` set in the component (or a `behindBody` list in
`rig.json`). When the active armR/armL pose is in the behind set, emit that arm
layer BEFORE `body` in the stack (so it tucks behind); otherwise keep it after.
Implement by splitting the `__armL__`/`__armR__` slots: at each slot, push the arm
only if its front/behind class matches the current position relative to body. The
simplest robust approach: insert a `__armL_behind__`/`__armR_behind__` emit before
`body` and the existing front emit after — each emits its arm only if the active
pose's class matches. Start from the measured classification above.

### 4. Legs show their tops when the body shrinks (idle breathe)
The idle `breathe` scales the body by `1 + sin(...)*0.014`; at the shrunk extreme
the body's bottom edge rises and exposes the leg-tops drawn beneath it.
**Fix:** nudge both legs UP by a hair (~0.01·size) so their tops always tuck under
the body's lowest breathe position. Cleanest as a render offset in the `"leg"`
kind transform (`translateY(-legRise·size)`), data-driven via a `legRise` frac in
`rig.json` (default ~0.012). Verify at the body's minimum breathe scale that no
leg-top is visible above the body's bottom edge.

### 5. Smug and proud render identically
Currently `MOOD_EYES: {smug:"smug", proud:"smug"}` and
`MOOD_MOUTH: {smug:"proud", proud:"proud"}` → both = smug eyes + proud mouth.
**Fix (Smug=sly, Proud=big grin):**
- **smug** → `eyes:"smug"` (half-lidded) + mouth `"smile"` (gentle, understated
  smug). DECIDED: use `smile`, not `hmm`/`shy`.
- **proud** → `eyes:"normal"` (open) + mouth `"proud"` (big toothy); chest-out happy.
Verify both moods look distinct in the browser.

### 6. Limb concurrency — fix the obvious nonsensical combos only
Keep the free per-limb pickers in the demo, but prevent the clearly-broken human
combos. The minimal rules (applied in the demo's pose selection / or as a guard):
- No **double thumbs-up** (both arms thumbsup), no **double wave**, no
  **mirrored salute** (both salute) — when one arm is set to such a pose, default
  the other arm to a neutral/complementary pose (e.g. `down`/`hip`).
- Fix `GiftyDemo` defaults: it currently sets `armL` and `armR` both to
  `thumbsup` → double thumbs-up by default. Default to a sensible non-mirrored
  pair (e.g. `armR:thumbsup, armL:down`, matching the rig defaults).

### 7. Attention emotes (per user) — left wave + thumbsup pulse
- **Left-arm wave:** the `wave` prop currently only animates the right arm
  (`canWave = wave && armRName === "wave"`). Extend so the LEFT arm waves too when
  `armL === "wave"` (the left wave art already exists and overlaps in-front).
- **Thumbsup/wave pulse (DECIDED: both triggers):**
  - **Always-on idle pulse:** whenever an arm is in `thumbsup` or `wave`, it gently
    pulses on its own every ~2.5s (≤~5% scale/rotate bump) to catch attention.
    Reduced-motion safe (no pulse when `prefers-reduced-motion`).
  - **Stronger pulse when `wave` prop is set:** the existing wave gesture stays, and
    layers a more pronounced motion on top of the idle pulse.
  Pivot the pulse from the arm's shoulder/root so it reads as a gesture, not a slide.

## Audit (every prop/usage must resolve, make sense, and not conflict)

Go through `MOOD_EYES`, `MOOD_MOUTH`, the eyes/pupils/mouths/armR/armL/legs maps,
and the `order` stack. For each: confirm the referenced layer exists in
`rig.json`, the fallback is sane, and the result reads correctly. Record a short
table of mood → (eyes, pupils, mouth) and arm/leg → (layer, behind/front) in the
implementation, and fix any dangling reference or nonsensical mapping found.

## Constraints
- Web tier is the default; re-run `npm run rig:compress` after art edits and
  verify in a REAL browser (Playwright), not a sharp composite (sharp masking ≠
  browser CSS masking — a lesson from the prior task).
- Don't break the eye work already tuned (rim on top, lash fade on close, domed
  lid, centered-inward pupils, blink). Verify eyes still correct after changes.
- HQ path (`tier="hq"`) stays a valid high-quality render; keep parity where the
  change is geometric (legs/puppy/arm z-order apply to both tiers).

## Verification
- Browser screenshots (Playwright) of: puppy mood (white neutral + aligned),
  wave (right arm behind body), idle at min-breathe (no leg-tops), smug vs proud
  (distinct), and a few arm/leg combos (no clipping, no nonsensical mirror).
- `npx tsc --noEmit` clean for gifty files.
- `npm run rig:compress` re-run; web atlas updated and committed.
