# Gifty Spritepack Runtime (Plan 2) Implementation Plan

> **For agentic workers:** REQUIRED SUB-SKILL: Use superpowers:subagent-driven-development to implement this plan task-by-task. Steps use checkbox (`- [ ]`) syntax for tracking.

**Goal:** Build `SpritePackPlayer`, the React runtime that renders the giftyc sprite pack (replacing the 12-layer `RigGifty` on the new path), after amending giftyc to emit per-frame canvas placement.

**Architecture:** giftyc gains a `place` field per frame (manifest v2). The runtime is a small set of pure modules (`frameStyle`, `moodMap`, types) + a `useSpritePack` loader hook + the `SpritePackPlayer` component that paints the hero frame first, then stacks 3 flat channel layers (body→arms→face) using CSS atlas-cropping (the proven `spriteCss` technique). Same prop surface as `RigGifty` → AI integration unchanged.

**Tech Stack:** giftyc (Rust, as Plan 1) for Task 0; React 19 + TypeScript + Next.js for the runtime; Node `--test` for the pure-module unit tests (matching the existing `spriteStyle.test.mjs` / `pickTier.test.mjs` pattern).

## Global Constraints

- **giftyc repo:** `/Users/aap/Projects/Rory/giftyc` (standalone, HEAD 9e231b1). **mvp-ui repo:** `/Users/aap/Projects/Rory/mvp-ui`, branch `feat/gifty-sprite-engine`. **NEVER touch `/Users/aap/Projects/Rory/mvp-rust`** — other sessions work there. In mvp-ui, stage only files you create/change with explicit `git add <path>` — never `git add -A`/`.` (other sessions have uncommitted work there).
- **Manifest is bumped to `version: 2`** by Task 0 (adds `place`). The runtime refuses any major version other than 2.
- **`place`** is normalized `{x,y,w,h}` in 0..1 (frame's alpha bbox on the canvas, post-resize divided by tier size). `cell` stays pixel sheet coords.
- **giftyc determinism unchanged:** Task 0 must keep `verify` byte-identity (regenerate the golden pack as part of the task; same input → identical output). cwebp 1.6.0 pinned.
- **Prop surface to preserve (drop-in for `RigGifty`):** `{ size=320, mood="normal", talking=false, wave=false, armR?, armL?, legs?, brow="neutral", eyes?, mouth?, tier="web" }`. v1 no-ops (documented): `brow`, `legs`, `tier`.
- **No 12-layer composite, no CSS masks** in the new path. Channels: body→arms→face z-order.
- **Do not delete or modify `RigGifty.tsx`** — the player is additive; parity is proven on a demo before any rollout.
- **Frame-name conventions:** face frames `mouth_<key>` + `eyes_<key>`; arms `armR_<pose>` + `armL_<pose>`; body `body`.

---

### Task 0: giftyc manifest v2 — add per-frame `place`, regenerate golden pack

**Files:**
- Modify: `giftyc/src/manifest.rs` (add `place` to `Frame`, bump default version usage)
- Modify: `giftyc/src/build.rs` (compute + thread `place` through `bake_channel`/`pack_and_write`; set version 2)
- Modify: `giftyc/tests/manifest.rs` (assert `place` present + version 2)
- Regenerate: `mvp-ui/public/gifty/packs/256/*` (golden pack, committed)

**Interfaces:**
- Produces: `Frame { name: String, cell: Cell, place: Place, ms: u32 }` where `Place { x: f32, y: f32, w: f32, h: f32 }` (serde `Serialize`, normalized 0..1).
- Produces: manifest `version: 2`.

- [ ] **Step 1: Write the failing manifest test**

In `giftyc/tests/manifest.rs`, extend the serialization test to require `place` and version 2:
```rust
#[test]
fn manifest_v2_emits_place_and_version_2() {
    use giftyc::manifest::{Manifest, ChannelEntry, Frame, Place};
    use giftyc::pack::Cell;
    let m = Manifest {
        version: 2, canvas: 1024, tier: 256,
        hero: Frame { name: "hero".into(), cell: Cell { sx:2, sy:2, sw:10, sh:10 },
                      place: Place { x: 0.1, y: 0.2, w: 0.3, h: 0.4 }, ms: 0 },
        channels: vec![ ChannelEntry { name: "face".into(), sheet: "face.webp".into(),
            frames: vec![ Frame { name: "mouth_smile".into(), cell: Cell { sx:2, sy:2, sw:5, sh:5 },
                          place: Place { x: 0.5, y: 0.5, w: 0.1, h: 0.1 }, ms: 0 } ],
            transitions: vec![] } ],
    };
    let j = m.to_json_pretty();
    assert!(j.contains("\"version\": 2"));
    assert!(j.contains("\"place\""));
    assert!(j.contains("\"x\": 0.5"));
}
```

- [ ] **Step 2: Run to verify failure**

Run: `cd giftyc && cargo test --test manifest manifest_v2 2>&1 | head -20`
Expected: FAIL — `Place` unresolved / `Frame` has no `place` field.

- [ ] **Step 3: Add `Place` and the `Frame.place` field**

In `giftyc/src/manifest.rs`, add the type and field:
```rust
#[derive(Debug, Clone, Copy, Serialize)]
pub struct Place { pub x: f32, pub y: f32, pub w: f32, pub h: f32 }
```
Add `pub place: Place,` to `struct Frame` (after `cell`, before `ms`).

- [ ] **Step 4: Compute `place` in build.rs and thread it through**

In `giftyc/src/build.rs`:

`bake_channel` currently discards the crop bbox (`let (cropped, _bb) = tier::crop_to_alpha(&resized);`). Capture it and carry it on `Baked`. Update the `Baked` struct:
```rust
struct Baked { name: String, img: RgbaImage, place: crate::manifest::Place }
```
In `bake_channel`, after the crop, normalize the bbox by the resized canvas size (`t`, the tier, since `resize_to_tier` scales the 1024 canvas to `t`×`t`):
```rust
let resized = tier::resize_to_tier(&canvas, t, rig.canvas);
let (cropped, bb) = tier::crop_to_alpha(&resized);
let place = crate::manifest::Place {
    x: bb.x as f32 / t as f32,
    y: bb.y as f32 / t as f32,
    w: bb.w as f32 / t as f32,
    h: bb.h as f32 / t as f32,
};
out.push(Baked { name: name.clone(), img: cropped, place });
```
Do the same for the hero (around line 78-81): capture the hero bbox and build its `place` the same way, and construct the hero `Baked` with it.

In `pack_and_write`, set `place` on each emitted `Frame`:
```rust
frames.push(Frame { name: b.name.clone(), cell: *cell, place: b.place, ms: 0 });
```

Set the manifest version to 2 where `Manifest { version: 1, ... }` is constructed in `build_pack` → `version: 2`.

- [ ] **Step 5: Run manifest test + full suite**

Run: `cd giftyc && GIFTYC_RIG=/Users/aap/Projects/Rory/mvp-ui/public/gifty/rig-final cargo test 2>&1 | tail -20`
Expected: PASS — manifest v2 test green; build_e2e still byte-identical across two builds; spike_fidelity green.

- [ ] **Step 6: Regenerate the golden pack (it WILL change — that's expected)**

The manifest JSON now includes `place` + version 2, so the golden `manifest.json` legitimately changes (the .webp sheets do NOT change — same pixels). Regenerate:
```bash
cd giftyc && cargo build --release
./target/release/giftyc build --rig /Users/aap/Projects/Rory/mvp-ui/public/gifty/rig-final --out /Users/aap/Projects/Rory/mvp-ui/public/gifty/packs/256 --tier 256
./target/release/giftyc verify --rig /Users/aap/Projects/Rory/mvp-ui/public/gifty/rig-final --golden /Users/aap/Projects/Rory/mvp-ui/public/gifty/packs/256 --tier 256
```
Expected: `verify OK` (the freshly built pack matches what was just written). Confirm `manifest.json` now contains `place` and `"version": 2`; confirm the 4 .webp files are byte-identical to before (only manifest changed):
```bash
cd /Users/aap/Projects/Rory/mvp-ui && git status --short public/gifty/packs/256
```
Expected: only `manifest.json` shows as modified; the .webp files unchanged.

- [ ] **Step 7: Commit (two repos)**

giftyc:
```bash
cd giftyc && git add src/manifest.rs src/build.rs tests/manifest.rs
git commit -m "feat(giftyc): manifest v2 — per-frame place{x,y,w,h} for channel registration

Co-Authored-By: Claude Opus 4.8 <noreply@anthropic.com>"
```
mvp-ui (stage ONLY the pack):
```bash
cd /Users/aap/Projects/Rory/mvp-ui && git add public/gifty/packs/256/manifest.json
git status   # confirm ONLY manifest.json staged
git commit -m "feat(gifty): regenerate golden pack as manifest v2 (adds place)

Co-Authored-By: Claude Opus 4.8 <noreply@anthropic.com>"
```

---

### Task 0.5: giftyc — split face into facebase/eyes/mouth sub-channels

**Why:** Each current `face` frame is a *complete face* (bow+brows+eyes+pupils+mouth composited), so the runtime can't move eyes and mouth independently (talking would freeze the mood's eyes; arbitrary eyes+mouth combos aren't baked). Splitting the face into isolated sub-channels — `facebase` (bow+brows), `eyes`, `mouth` — gives true independent expression. The rig has isolated part PNGs already registered on the canvas, so `place` (Task 0) handles registration for free.

**Files:**
- Modify: `giftyc/src/build.rs` (replace the single face channel with 3 sub-channels; new band-filter helpers)
- Test: `giftyc/tests/build_e2e.rs` (assert the new sheet set + determinism)
- Regenerate: `mvp-ui/public/gifty/packs/256/*` (golden pack: face.webp → facebase/eyes/mouth.webp)

**Interfaces:**
- Produces sheets: `facebase.webp`, `eyes.webp`, `mouth.webp` (replacing `face.webp`), plus unchanged `arms.webp`, `body.webp`, `hero.webp`.
- Produces manifest channels: `facebase` (1 frame `facebase`), `eyes` (frames `eyes_<key>`), `mouth` (frames `mouth_<key>`), `arms`, `body`. Still `version: 2`.

- [ ] **Step 1: Update the e2e test for the new sheet set**

In `giftyc/tests/build_e2e.rs`, change the asserted file list from `["manifest.json","face.webp","arms.webp","body.webp","hero.webp"]` to `["manifest.json","facebase.webp","eyes.webp","mouth.webp","arms.webp","body.webp","hero.webp"]` (both the existence loop and the byte-identity loop). Add an assertion that the manifest contains a `facebase`, `eyes`, and `mouth` channel:
```rust
let manifest: String = std::fs::read_to_string(tmp.join("a").join("manifest.json")).unwrap();
for ch in ["\"name\": \"facebase\"", "\"name\": \"eyes\"", "\"name\": \"mouth\""] {
    assert!(manifest.contains(ch), "manifest missing channel {ch}");
}
```

- [ ] **Step 2: Run to verify failure**

Run: `cd giftyc && GIFTYC_RIG=/Users/aap/Projects/Rory/mvp-ui/public/gifty/rig-final cargo test --test build_e2e 2>&1 | head -20`
Expected: FAIL — `face.webp` no longer written / new channels absent.

- [ ] **Step 3: Add the three sub-channel band helpers in build.rs**

Replace `face_layers` with three helpers (each returns the isolated layers for that sub-channel). Note the selection: `facebase` ignores eyes/mouth; `eyes` is just the eyes(+pupils); `mouth` is just the mouth:
```rust
/// facebase: bow + eyebrows only (static under the eyes/mouth).
fn facebase_layers(_rig: &Rig, _sel: &Selection) -> Result<Vec<String>> {
    Ok(vec!["bow".into(), "eyebrow_l".into(), "eyebrow_r".into()])
}
/// eyes: the eye pair (+ pupils if present) for the selected eyes key. No bow/brows/mouth.
fn eyes_layers(rig: &Rig, sel: &Selection) -> Result<Vec<String>> {
    let e = rig.eyes.get(&sel.eyes)
        .ok_or_else(|| anyhow::anyhow!("unknown eyes key: {}", sel.eyes))?;
    let mut v = vec![e.l.clone(), e.r.clone()];
    if let Some(p) = rig.pupils.get(&sel.pupils) { v.push(p.l.clone()); v.push(p.r.clone()); }
    Ok(v)
}
/// mouth: just the mouth for the selected mouth key.
fn mouth_layers(rig: &Rig, sel: &Selection) -> Result<Vec<String>> {
    let m = rig.mouths.get(&sel.mouth)
        .ok_or_else(|| anyhow::anyhow!("unknown mouth key: {}", sel.mouth))?;
    Ok(vec![m.clone()])
}
```
(Leave the old `face_layers` removed; nothing else references it after Step 4.)

- [ ] **Step 4: Rebuild the channel assembly in build_pack**

Replace the FACE block (the `face_states` / `let face = bake_channel(... &face_layers)` section) and the later `face_frames` line with three sub-channel bakes. The `bake_channel`, `pack_and_write`, `place` machinery is unchanged:
```rust
    // FACEBASE: single static state (bow + eyebrows).
    let facebase_states = vec![("facebase".to_string(), sel_with(d, None, None))];
    let facebase = bake_channel(&rig, rig_dir, t, &facebase_states, &facebase_layers)?;

    // EYES: each eyes variant (isolated).
    let mut eyes_states = Vec::new();
    let mut eyes_keys: Vec<_> = rig.eyes.keys().cloned().collect(); eyes_keys.sort();
    for e in &eyes_keys { eyes_states.push((format!("eyes_{e}"), sel_with(d, None, Some(e)))); }
    let eyes_ch = bake_channel(&rig, rig_dir, t, &eyes_states, &eyes_layers)?;

    // MOUTH: each mouth variant (isolated, incl. talk visemes).
    let mut mouth_states = Vec::new();
    let mut mouth_keys: Vec<_> = rig.mouths.keys().cloned().collect(); mouth_keys.sort();
    for m in &mouth_keys { mouth_states.push((format!("mouth_{m}"), sel_with(d, Some(m), None))); }
    let mouth_ch = bake_channel(&rig, rig_dir, t, &mouth_states, &mouth_layers)?;
```
Then replace the `let face_frames = pack_and_write(out_dir, "face.webp", &face)?;` line and the face entry in the `Manifest { channels: vec![...] }` construction. Write the three sheets:
```rust
    let facebase_frames = pack_and_write(out_dir, "facebase.webp", &facebase)?;
    let eyes_frames = pack_and_write(out_dir, "eyes.webp", &eyes_ch)?;
    let mouth_frames = pack_and_write(out_dir, "mouth.webp", &mouth_ch)?;
```
And in the manifest `channels` vec, replace the single face `ChannelEntry` with three (keep arms + body entries as they are):
```rust
        ChannelEntry { name: "facebase".into(), sheet: "facebase.webp".into(), frames: facebase_frames, transitions: vec![] },
        ChannelEntry { name: "eyes".into(),     sheet: "eyes.webp".into(),     frames: eyes_frames,     transitions: vec![] },
        ChannelEntry { name: "mouth".into(),    sheet: "mouth.webp".into(),    frames: mouth_frames,    transitions: vec![] },
```

- [ ] **Step 5: Full suite**

Run: `cd giftyc && GIFTYC_RIG=/Users/aap/Projects/Rory/mvp-ui/public/gifty/rig-final cargo test 2>&1 | tail -20`
Expected: all green — build_e2e (new sheets, byte-identical across two builds), spike, manifest, tier, pack. `cargo build` warning-free.

- [ ] **Step 6: Regenerate the golden pack + verify**

```bash
cd giftyc && cargo build --release
# remove the now-stale face.webp from the golden dir first
rm -f /Users/aap/Projects/Rory/mvp-ui/public/gifty/packs/256/face.webp
./target/release/giftyc build --rig /Users/aap/Projects/Rory/mvp-ui/public/gifty/rig-final --out /Users/aap/Projects/Rory/mvp-ui/public/gifty/packs/256 --tier 256
./target/release/giftyc verify --rig /Users/aap/Projects/Rory/mvp-ui/public/gifty/rig-final --golden /Users/aap/Projects/Rory/mvp-ui/public/gifty/packs/256 --tier 256
du -sk /Users/aap/Projects/Rory/mvp-ui/public/gifty/packs/256
ls -la /Users/aap/Projects/Rory/mvp-ui/public/gifty/packs/256
```
Expected: `verify OK`. New sheet set (facebase/eyes/mouth/arms/body/hero + manifest). Record total size — isolated face parts should keep it near/under the prior ~140KB (smaller per-sheet content). Confirm `face.webp` is gone.

- [ ] **Step 7: Commit (two repos)**

giftyc:
```bash
cd giftyc && git add src/build.rs tests/build_e2e.rs
git commit -m "feat(giftyc): split face into facebase/eyes/mouth sub-channels for independent expression

Co-Authored-By: Claude Opus 4.8 <noreply@anthropic.com>"
```
mvp-ui (stage ONLY the pack dir — confirm with git status):
```bash
cd /Users/aap/Projects/Rory/mvp-ui && git add public/gifty/packs/256
git status   # confirm ONLY packs/256 files staged (facebase/eyes/mouth added, face.webp removed, manifest changed)
git commit -m "feat(gifty): regenerate golden pack with split face sub-channels

Co-Authored-By: Claude Opus 4.8 <noreply@anthropic.com>"
```

---

### Task 1: Manifest TS types + `frameStyle` pure module

**Files:**
- Create: `mvp-ui/src/app/components/shared/gifty/spritepack/spritePackTypes.ts`
- Create: `mvp-ui/src/app/components/shared/gifty/spritepack/frameStyle.ts`
- Test: `mvp-ui/src/app/components/shared/gifty/spritepack/frameStyle.test.mjs`

**Interfaces:**
- Produces: types `Place`, `Cell`, `Frame`, `Channel`, `Manifest` (v2 shape).
- Produces: `frameCss({ place, cell, atlas, size }): CSSProperties` — positions a channel div at `place*size` and crops `cell` from the sheet. Mirrors the existing `spriteCss` but ALSO sets `left`/`top` from `place` (so the div is absolutely positioned on the canvas, not just sized).

- [ ] **Step 1: Write the failing test**

`frameStyle.test.mjs` (Node test, mirrors `spriteStyle.test.mjs`):
```js
import { test } from "node:test";
import assert from "node:assert/strict";
import { frameCss } from "./frameStyle.ts";

test("frameCss positions div at place*size and crops the cell", () => {
  const css = frameCss({
    place: { x: 0.25, y: 0.10, w: 0.5, h: 0.5 },
    cell: { sx: 2, sy: 2, sw: 100, sh: 100 },
    atlas: { w: 400, h: 200 },
    size: 320,
  });
  // div geometry from place
  assert.equal(css.left, 80);    // 0.25 * 320
  assert.equal(css.top, 32);     // 0.10 * 320
  assert.equal(css.width, 160);  // 0.5 * 320
  assert.equal(css.height, 160); // 0.5 * 320
  assert.equal(css.position, "absolute");
  // background crops the cell: scaleX = 160/100 = 1.6
  assert.equal(css.backgroundSize, `${400 * 1.6}px ${200 * 1.6}px`);
  assert.equal(css.backgroundPosition, `-${2 * 1.6}px -${2 * 1.6}px`);
  assert.equal(css.backgroundRepeat, "no-repeat");
});
```

- [ ] **Step 2: Run to verify failure**

Run: `cd mvp-ui && node --test src/app/components/shared/gifty/spritepack/frameStyle.test.mjs 2>&1 | head -20`
Expected: FAIL — module not found.

- [ ] **Step 3: Implement the types + frameCss**

`spritePackTypes.ts`:
```ts
export type Place = { x: number; y: number; w: number; h: number };
export type Cell = { sx: number; sy: number; sw: number; sh: number };
export type Frame = { name: string; cell: Cell; place: Place; ms: number };
export type Channel = { name: string; sheet: string; frames: Frame[]; transitions: unknown[] };
export type Manifest = { version: number; canvas: number; tier: number; hero: Frame; channels: Channel[] };
```

`frameStyle.ts`:
```ts
import type { Place, Cell } from "./spritePackTypes";
import type { CSSProperties } from "react";

/** Absolute-position a channel div at place*size and crop `cell` from its sheet.
 *  Same atlas-crop math as spriteCss, plus left/top so channels register on the canvas. */
export function frameCss(
  { place, cell, atlas, size }:
  { place: Place; cell: Cell; atlas: { w: number; h: number }; size: number },
): CSSProperties {
  const divW = place.w * size;
  const divH = place.h * size;
  const scaleX = divW / cell.sw;
  const scaleY = divH / cell.sh;
  return {
    position: "absolute",
    left: place.x * size,
    top: place.y * size,
    width: divW,
    height: divH,
    backgroundSize: `${atlas.w * scaleX}px ${atlas.h * scaleY}px`,
    backgroundPosition: `-${cell.sx * scaleX}px -${cell.sy * scaleY}px`,
    backgroundRepeat: "no-repeat",
  };
}
```

- [ ] **Step 4: Run to verify pass**

Run: `cd mvp-ui && node --test src/app/components/shared/gifty/spritepack/frameStyle.test.mjs 2>&1 | tail -10`
Expected: PASS.

- [ ] **Step 5: Commit**

```bash
cd mvp-ui && git add src/app/components/shared/gifty/spritepack/spritePackTypes.ts src/app/components/shared/gifty/spritepack/frameStyle.ts src/app/components/shared/gifty/spritepack/frameStyle.test.mjs
git commit -m "feat(gifty): spritepack TS types + frameCss channel-registration helper

Co-Authored-By: Claude Opus 4.8 <noreply@anthropic.com>"
```

---

### Task 2: `moodMap` — Mood → { eyes, mouth }

**Files:**
- Create: `mvp-ui/src/app/components/shared/gifty/spritepack/moodMap.ts`
- Test: `mvp-ui/src/app/components/shared/gifty/spritepack/moodMap.test.mjs`

**Interfaces:**
- Produces: `moodToFace(mood): { eyes: string; mouth: string }` — maps a `Mood` to baked frame keys. Falls back to `{ eyes: "normal", mouth: "smile" }` for unknown/unbaked moods.

The baked frames available (from the pack): eyes ∈ {normal, smug, happy}; mouths ∈ {smile, shy, proud, hmm, talk_ah, talk_oh, talk_eh}. Moods that have no distinct baked expression fall back sensibly.

- [ ] **Step 1: Write the failing test**

`moodMap.test.mjs`:
```js
import { test } from "node:test";
import assert from "node:assert/strict";
import { moodToFace } from "./moodMap.ts";

test("known moods map to baked eyes+mouth keys", () => {
  assert.deepEqual(moodToFace("normal"), { eyes: "normal", mouth: "smile" });
  assert.deepEqual(moodToFace("happy"),  { eyes: "happy",  mouth: "smile" });
  assert.deepEqual(moodToFace("smug"),   { eyes: "smug",   mouth: "hmm" });
  assert.deepEqual(moodToFace("proud"),  { eyes: "normal", mouth: "proud" });
  assert.deepEqual(moodToFace("shy"),    { eyes: "normal", mouth: "shy" });
});

test("unknown/unbaked mood falls back to normal+smile", () => {
  assert.deepEqual(moodToFace("thinking"), { eyes: "normal", mouth: "hmm" });
  assert.deepEqual(moodToFace("nonsense"), { eyes: "normal", mouth: "smile" });
});
```

- [ ] **Step 2: Run to verify failure**

Run: `cd mvp-ui && node --test src/app/components/shared/gifty/spritepack/moodMap.test.mjs 2>&1 | head -20`
Expected: FAIL — module not found.

- [ ] **Step 3: Implement moodMap**

`moodMap.ts`:
```ts
/** Maps a mood to the baked face frame keys (eyes + resting mouth).
 *  Keys must exist in the pack: eyes ∈ {normal,smug,happy}; mouths ∈ {smile,shy,proud,hmm,talk_*}. */
export type Face = { eyes: string; mouth: string };

const TABLE: Record<string, Face> = {
  normal:   { eyes: "normal", mouth: "smile" },
  happy:    { eyes: "happy",  mouth: "smile" },
  smug:     { eyes: "smug",   mouth: "hmm" },
  proud:    { eyes: "normal", mouth: "proud" },
  shy:      { eyes: "normal", mouth: "shy" },
  thinking: { eyes: "normal", mouth: "hmm" },
  puppy:    { eyes: "happy",  mouth: "shy" },
};

export function moodToFace(mood: string): Face {
  return TABLE[mood] ?? { eyes: "normal", mouth: "smile" };
}
```

- [ ] **Step 4: Run to verify pass**

Run: `cd mvp-ui && node --test src/app/components/shared/gifty/spritepack/moodMap.test.mjs 2>&1 | tail -10`
Expected: PASS.

- [ ] **Step 5: Commit**

```bash
cd mvp-ui && git add src/app/components/shared/gifty/spritepack/moodMap.ts src/app/components/shared/gifty/spritepack/moodMap.test.mjs
git commit -m "feat(gifty): moodToFace mapping for spritepack runtime

Co-Authored-By: Claude Opus 4.8 <noreply@anthropic.com>"
```

---

### Task 3: `useSpritePack` loader hook (hero-first, then sheets)

**Files:**
- Create: `mvp-ui/src/app/components/shared/gifty/spritepack/useSpritePack.ts`

**Interfaces:**
- Consumes: `Manifest` type (Task 1).
- Produces: `useSpritePack(): { hero: HeroState | null; pack: LoadedPack | null }` where `HeroState = { url: string; frame: Frame }` and `LoadedPack = { manifest: Manifest; sheets: Record<"face"|"arms"|"body", { url: string; w: number; h: number }> }`. Hero resolves first; pack resolves once manifest + 3 sheets are decoded.

- [ ] **Step 1: Implement the hook (no separate unit test — it's IO/React; covered by the Task 5 smoke render)**

`useSpritePack.ts`:
```ts
"use client";
import { useEffect, useState } from "react";
import type { Manifest, Frame } from "./spritePackTypes";

const BASE = "/gifty/packs/256";

export type HeroState = { url: string; frame: Frame };
export type SheetImg = { url: string; w: number; h: number };
export type LoadedPack = { manifest: Manifest; sheets: Record<string, SheetImg> };

function loadImg(url: string): Promise<{ w: number; h: number }> {
  return new Promise((res, rej) => {
    const img = new Image();
    img.onload = () => res({ w: img.naturalWidth, h: img.naturalHeight });
    img.onerror = () => rej(new Error(`load ${url}`));
    img.src = url;
  });
}

export function useSpritePack(): { hero: HeroState | null; pack: LoadedPack | null } {
  const [hero, setHero] = useState<HeroState | null>(null);
  const [pack, setPack] = useState<LoadedPack | null>(null);

  useEffect(() => {
    let alive = true;
    (async () => {
      const manifest: Manifest = await fetch(`${BASE}/manifest.json`).then((r) => r.json());
      if (manifest.version !== 2) throw new Error(`unsupported pack version ${manifest.version}`);
      // hero first
      await loadImg(`${BASE}/hero.webp`);
      if (!alive) return;
      setHero({ url: `${BASE}/hero.webp`, frame: manifest.hero });
      // then channel sheets (face split into facebase/eyes/mouth sub-channels)
      const names = ["facebase", "eyes", "mouth", "arms", "body"] as const;
      const dims = await Promise.all(names.map((n) => loadImg(`${BASE}/${n}.webp`)));
      if (!alive) return;
      const sheets: Record<string, SheetImg> = {};
      names.forEach((n, i) => { sheets[n] = { url: `${BASE}/${n}.webp`, w: dims[i].w, h: dims[i].h }; });
      setPack({ manifest, sheets });
    })().catch(() => { /* keep hero; graceful degradation */ });
    return () => { alive = false; };
  }, []);

  return { hero, pack };
}
```

- [ ] **Step 2: Type-check**

Run: `cd mvp-ui && npx tsc --noEmit -p tsconfig.json 2>&1 | grep -i spritepack | head` (or the project's typecheck script)
Expected: no errors referencing the spritepack dir.

- [ ] **Step 3: Commit**

```bash
cd mvp-ui && git add src/app/components/shared/gifty/spritepack/useSpritePack.ts
git commit -m "feat(gifty): useSpritePack loader — hero first, then channel sheets

Co-Authored-By: Claude Opus 4.8 <noreply@anthropic.com>"
```

---

### Task 4: `SpritePackPlayer` component (hero-first, sub-channel stack, talk/wave/breathe)

> Render model: stacks body → armL → armR → facebase → eyes → mouth, each one cropped div positioned by its frame `place`. Eyes and mouth are independent, so talking cycles the mouth while the mood's eyes stay put.

**Files:**
- Create: `mvp-ui/src/app/components/shared/gifty/spritepack/SpritePackPlayer.tsx`

**Interfaces:**
- Consumes: `useSpritePack`, `frameCss`, `moodToFace`, types.
- Produces: `SpritePackPlayer(props)` with the RigGifty-compatible prop surface.

- [ ] **Step 1: Implement the component**

`SpritePackPlayer.tsx`:
```tsx
"use client";
import { useEffect, useRef, useState } from "react";
import { useSpritePack } from "./useSpritePack";
import { frameCss } from "./frameStyle";
import { moodToFace } from "./moodMap";
import type { Frame, Channel } from "./spritePackTypes";

type Props = {
  size?: number; mood?: string; talking?: boolean; wave?: boolean;
  armR?: string; armL?: string; legs?: string; brow?: string;
  eyes?: string; mouth?: string; tier?: string;
};

const TALK = ["talk_ah", "talk_oh", "talk_eh"];

function findFrame(ch: Channel | undefined, name: string): Frame | undefined {
  return ch?.frames.find((f) => f.name === name);
}

export function SpritePackPlayer({
  size = 320, mood = "normal", talking = false, wave = false,
  armR, armL, eyes, mouth,
}: Props) {
  const { hero, pack } = useSpritePack();
  const [viseme, setViseme] = useState(0);
  const [t, setT] = useState(0);
  const raf = useRef<number | undefined>(undefined);

  useEffect(() => {
    const start = performance.now();
    let lastV = 0;
    const loop = (now: number) => {
      const e = now - start;
      setT(e / 1000);
      if (talking && e - lastV > 110) { lastV = e; setViseme((v) => (v + 1) % TALK.length); }
      raf.current = requestAnimationFrame(loop);
    };
    raf.current = requestAnimationFrame(loop);
    return () => { if (raf.current) cancelAnimationFrame(raf.current); };
  }, [talking]);

  // resolve current frame keys
  const face = moodToFace(mood);
  const eyesKey = eyes ?? face.eyes;
  const mouthKey = talking ? TALK[viseme] : (mouth ?? face.mouth);
  const armRKey = wave ? "wave" : (armR ?? "thumbsup");
  const armLKey = armL ?? "down";

  // breathe transform (matches RigGifty feel)
  const bob = Math.sin(t * 1.6) * size * 0.012;
  const breathe = 1 + Math.sin(t * 1.6) * 0.014;

  const box: React.CSSProperties = {
    position: "relative", width: size, height: size,
    transform: `translateY(${bob}px) scale(${breathe})`, willChange: "transform",
  };

  // before the pack loads: paint the hero crop full-box
  if (!pack) {
    if (!hero) return <div style={{ width: size, height: size }} />;
    const css = frameCss({ place: hero.frame.place, cell: hero.frame.cell, atlas: { w: 1, h: 1 }, size });
    // hero atlas dims unknown until decoded; use a plain <img> cropped via object-fit fallback:
    return (
      <div style={box}>
        <div style={{ ...frameCss({ place: hero.frame.place, cell: hero.frame.cell, atlas: hero.frame.cell, size }),
                      backgroundImage: `url(${hero.url})` }} />
      </div>
    );
  }

  const ch = (name: string) => pack.manifest.channels.find((c) => c.name === name);
  const facebaseCh = ch("facebase");
  const eyesCh = ch("eyes");
  const mouthCh = ch("mouth");
  const armsCh = ch("arms");
  const bodyCh = ch("body");

  const layer = (chName: string, frame: Frame | undefined, key: string, extra?: React.CSSProperties) => {
    if (!frame) return null;
    const sheet = pack.sheets[chName];
    const css = frameCss({ place: frame.place, cell: frame.cell, atlas: { w: sheet.w, h: sheet.h }, size });
    return <div key={key} style={{ ...css, backgroundImage: `url(${sheet.url})`, ...extra }} />;
  };

  const waveSwing = wave ? `rotate(${Math.sin(t * 8) * 12}deg)` : undefined;

  // z-order: body → armL → armR → facebase → eyes → mouth (matches bake draw order)
  return (
    <div style={box}>
      {layer("body", findFrame(bodyCh, "body"), "body")}
      {layer("arms", findFrame(armsCh, `armL_${armLKey}`), "armL")}
      {layer("arms", findFrame(armsCh, `armR_${armRKey}`), "armR", waveSwing ? { transform: waveSwing, transformOrigin: "30% 30%" } : undefined)}
      {layer("facebase", findFrame(facebaseCh, "facebase"), "facebase")}
      {layer("eyes", findFrame(eyesCh, `eyes_${eyesKey}`), "eyes")}
      {layer("mouth", findFrame(mouthCh, `mouth_${mouthKey}`), "mouth")}
    </div>
  );
}
```

> Note for implementer: the hero pre-pack branch uses the hero sheet's own cell dims as the atlas (it's a one-cell sheet) so `frameCss` crops it correctly before the channel sheets' dimensions are known. If the hero render looks wrong, decode the hero image dims in `useSpritePack` (add hero w/h to `HeroState`) and pass those as `atlas` — but try the simple path first.

- [ ] **Step 2: Type-check**

Run: `cd mvp-ui && npx tsc --noEmit 2>&1 | grep -i spritepack | head`
Expected: no spritepack errors.

- [ ] **Step 3: Commit**

```bash
cd mvp-ui && git add src/app/components/shared/gifty/spritepack/SpritePackPlayer.tsx
git commit -m "feat(gifty): SpritePackPlayer — hero-first 3-channel stack render

Co-Authored-By: Claude Opus 4.8 <noreply@anthropic.com>"
```

---

### Task 5: Demo page + visual parity verification

**Files:**
- Create: `mvp-ui/src/app/components/GiftyPackDemo.tsx`
- Modify: `mvp-ui/src/app/App.tsx` (add `/gifty-pack-demo` route)

**Interfaces:**
- Consumes: `SpritePackPlayer`.

- [ ] **Step 1: Create the demo page**

`GiftyPackDemo.tsx` — a minimal page that renders `SpritePackPlayer` with controls for mood/talking/wave, mirroring `GiftyDemo` but using the new player:
```tsx
"use client";
import { useState } from "react";
import { SpritePackPlayer } from "./shared/gifty/spritepack/SpritePackPlayer";

const MOODS = ["normal", "happy", "smug", "proud", "shy", "thinking", "puppy"];
const ARMS = ["thumbsup", "wave", "down", "salute", "open", "present", "calm", "fist", "sad"];

export default function GiftyPackDemo() {
  const [mood, setMood] = useState("normal");
  const [talking, setTalking] = useState(false);
  const [wave, setWave] = useState(false);
  const [armR, setArmR] = useState<string | undefined>(undefined);
  return (
    <div style={{ minHeight: "100vh", display: "grid", placeItems: "center", background: "#0d1b3a", color: "#fff" }}>
      <div style={{ textAlign: "center" }}>
        <div style={{ width: 400, height: 400, margin: "0 auto", display: "grid", placeItems: "center",
                      background: "radial-gradient(circle at 50% 42%, #1b2f63, #0d1b3a)", borderRadius: 28 }}>
          <SpritePackPlayer size={340} mood={mood} talking={talking} wave={wave} armR={armR} />
        </div>
        <p style={{ opacity: 0.7, fontSize: 13, marginTop: 12 }}>
          spritepack runtime · mood <b>{mood}</b>{talking && " · talking"}{wave && " · waving"}
        </p>
        <div style={{ display: "flex", gap: 8, justifyContent: "center", flexWrap: "wrap", maxWidth: 460, margin: "10px auto" }}>
          {MOODS.map((m) => <button key={m} onClick={() => setMood(m)} style={{ padding: "4px 10px" }}>{m}</button>)}
        </div>
        <div style={{ display: "flex", gap: 8, justifyContent: "center", flexWrap: "wrap", maxWidth: 460, margin: "6px auto" }}>
          {ARMS.map((a) => <button key={a} onClick={() => setArmR(a)} style={{ padding: "4px 10px" }}>{a}</button>)}
        </div>
        <div style={{ marginTop: 8, display: "flex", gap: 8, justifyContent: "center" }}>
          <button onClick={() => setTalking((v) => !v)}>🗣 talk</button>
          <button onClick={() => setWave((v) => !v)}>👋 wave</button>
        </div>
      </div>
    </div>
  );
}
```

- [ ] **Step 2: Register the route**

In `mvp-ui/src/app/App.tsx`, near the existing `/gifty-demo` route (`<Route path="/gifty-demo" element={<GiftyDemo />} />`), add:
```tsx
<Route path="/gifty-pack-demo" element={<GiftyPackDemo />} />
```
and import `GiftyPackDemo` at the top alongside the other page imports. (Match the existing import style — default import from `./components/GiftyPackDemo`.)

- [ ] **Step 3: Type-check + build**

Run: `cd mvp-ui && npx tsc --noEmit 2>&1 | grep -iE 'spritepack|GiftyPackDemo' | head`
Expected: no errors.

- [ ] **Step 4: Visual verification (manual, by the controller)**

This is a render-correctness gate that a unit test cannot fully cover. The controller verifies by running the dev server and loading `/gifty-pack-demo`:
- Gifty appears recognizable (present-box body, bow, face, two arms).
- Channels register (mouth/eyes sit on the face, arms attach to the body — no floating parts).
- `talk` cycles the mouth; `wave` shows the wave arm with a swing; mood buttons change the expression; breathe animates.
- Throttle the network (DevTools) and reload: the hero frame paints before the channel sheets finish.
If parts float or misregister, the `place` math (Task 0) or `frameCss` (Task 1) is the suspect — this is the registration risk the spec flagged.

- [ ] **Step 5: Commit**

```bash
cd mvp-ui && git add src/app/components/GiftyPackDemo.tsx src/app/App.tsx
git commit -m "feat(gifty): /gifty-pack-demo — visual parity page for the spritepack runtime

Co-Authored-By: Claude Opus 4.8 <noreply@anthropic.com>"
```

---

## Notes / follow-ups (out of scope for this plan)

- **Blink** needs an eyelid frame baked into the pack (giftyc face channel addition).
- **Baked arm transition clips** (hub-and-spoke) — manifest `transitions` is empty today; the runtime snaps. Add giftyc transition frames + runtime playback later.
- **Independent pupils/gaze** — no pupils frame baked (the Plan 1 open question); v1 uses whatever the eyes frame contains.
- **512px tier** — only 256 exists; add a tier + runtime `pickTier` upgrade for hi-DPI.
- **Retiring `RigGifty`** — once the player is adopted at real call sites and proven, remove the heavy rig. Not in this plan.
- **AI loop** — the prop surface already supports it (emit `{mood|eyes|mouth, armR, armL, talking, wave}`); wiring it to the chatbot is a separate integration.
