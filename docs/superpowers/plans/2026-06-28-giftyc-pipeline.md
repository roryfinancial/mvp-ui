# giftyc Pipeline (Layer 1) Implementation Plan

> **For agentic workers:** REQUIRED SUB-SKILL: Use superpowers:subagent-driven-development (recommended) or superpowers:executing-plans to implement this plan task-by-task. Steps use checkbox (`- [ ]`) syntax for tracking.

**Goal:** Build `giftyc`, a standalone deterministic Rust CLI that bakes Gifty's 58-PNG layered rig into channel-based sprite packs (manifest + WebP/PNG channel sheets), gated by a fidelity spike that proves channels composite without seams.

**Architecture:** `giftyc` reads the existing `rig-final/rig.json` + full-canvas (1024×1024) PNGs, alpha-composites selected layers in `order` onto a canvas, crops/resizes per tier, and shelf-packs each channel (face/arms/body) into one WebP sheet plus a versioned manifest. The very first task is a **fidelity spike**: bake one face sheet + one arm sheet, composite them flat, and diff against a golden full-rig composite. If it seams, channel groupings are revised before the full bake. Build-time only; runtime (Plan 2) consumes static packs.

**Tech Stack:** Rust (edition 2021), crates: `image` (decode/encode/composite), `webp` (WebP encode) or `image`'s WebP feature, `serde`/`serde_json` (manifest + rig.json), `clap` (CLI), `anyhow` (errors). External `cwebp` available as fallback. No sharp, no Python.

## Global Constraints

- **Source of truth is read-only:** `giftyc` MUST NOT write to or modify `public/gifty/rig-final/`. Input is read-only; all output goes to `--out`.
- **Determinism:** same input → byte-identical output. No timestamps, no HashMap iteration order in output, no `std::fs::read_dir` ordering without sorting. Sort all collections before emitting.
- **Standalone crate:** `giftyc` lives in its own repo/dir with its own `Cargo.toml`. I/O is path-driven via CLI args (`--rig`, `--out`), never hardcoded to a repo.
- **Canvas is 1024:** all rig PNGs are full 1024×1024 with content registered in place; `meta.{x,y,w,h}` is the normalized alpha bbox, used for cropping channel sheets, not for placement.
- **Layer order (verbatim from rig.json):** `["__legs__","body","__armL__","__armR__","bow","eyebrow_l","eyebrow_r","__eyes__","__pupils__","__eyelid__","__puppy__","__mouth__"]` — `__x__` tokens are swap slots resolved from the selected state.
- **Defaults (verbatim):** `mouth=smile, eyes=normal, pupils=normal, armR=thumbsup, armL=down, legs=stand`.
- **Channels v1:** Face, Arms, Body (Legs fold into Body). Subject to revision by the spike result (Task 1).
- **Manifest schema is versioned:** `version: 1`. Runtime refuses unknown major versions.

---

### Task 1: Fidelity spike — prove channels composite without seams

**This task gates the entire effort. If it fails, stop and revise channel groupings in the spec before continuing.**

**Files:**
- Create: `giftyc/Cargo.toml`
- Create: `giftyc/src/main.rs`
- Create: `giftyc/src/rig.rs` (rig.json model + loader)
- Create: `giftyc/src/composite.rs` (layer→canvas compositor)
- Create: `giftyc/src/bin/spike.rs` (spike entry)
- Test: `giftyc/tests/spike_fidelity.rs`

**Interfaces:**
- Produces: `Rig::load(rig_dir: &Path) -> anyhow::Result<Rig>`; `Rig` exposes `order: Vec<String>`, `meta: BTreeMap<String, LayerMeta>`, `eyes/mouths/pupils/arm_r/arm_l/legs/eyelid/lashline/eyerim: BTreeMap<String, ...>`, `defaults: Defaults`, `arm_behind`, `eyes_closed`, `canvas: u32`.
- Produces: `composite_rig(rig: &Rig, sel: &Selection, rig_dir: &Path) -> anyhow::Result<RgbaImage>` — the full-rig flat composite (the golden reference).
- Produces: `Selection { mouth, eyes, pupils, arm_r, arm_l, legs }` (all `String`).

- [ ] **Step 1: Scaffold the standalone crate**

`giftyc/Cargo.toml`:
```toml
[package]
name = "giftyc"
version = "0.1.0"
edition = "2021"

[dependencies]
image = { version = "0.25", default-features = false, features = ["png"] }
serde = { version = "1", features = ["derive"] }
serde_json = "1"
clap = { version = "4", features = ["derive"] }
anyhow = "1"

[dev-dependencies]
image = { version = "0.25", default-features = false, features = ["png"] }
```

Create a placeholder `giftyc/src/main.rs`:
```rust
fn main() {
    println!("giftyc");
}
```

- [ ] **Step 2: Write the failing spike fidelity test**

`giftyc/tests/spike_fidelity.rs`:
```rust
use std::path::PathBuf;

/// Composite the FULL rig (golden) vs. compositing FACE channel and ARMS channel
/// separately then stacking them. If channels are visually separable, the two
/// results must be pixel-identical (the same PNGs drawn in the same order).
#[test]
fn channels_stack_identical_to_full_composite() {
    let rig_dir = rig_dir();
    let rig = giftyc::rig::Rig::load(&rig_dir).expect("load rig");
    let sel = giftyc::composite::Selection {
        mouth: "smile".into(),
        eyes: "normal".into(),
        pupils: "normal".into(),
        arm_r: "wave".into(),
        arm_l: "down".into(),
        legs: "stand".into(),
    };

    // Golden: one flat composite of all layers in order.
    let full = giftyc::composite::composite_rig(&rig, &sel, &rig_dir).expect("full composite");

    // Channels: composite the face-band layers and arm-band layers as separate
    // RGBA images, then alpha-stack them in the SAME order. Body band underneath.
    let stacked = giftyc::composite::composite_by_channels(&rig, &sel, &rig_dir).expect("channel composite");

    assert_eq!(full.dimensions(), stacked.dimensions());
    let diff = giftyc::composite::max_channel_diff(&full, &stacked);
    // Identical ordering of identical PNGs must yield 0 diff. Any nonzero diff
    // means a layer landed in the wrong band — a seam risk to investigate.
    assert_eq!(diff, 0, "channel stacking diverged from full composite by {diff}");
}

fn rig_dir() -> PathBuf {
    // Override with GIFTYC_RIG to point at public/gifty/rig-final.
    std::env::var("GIFTYC_RIG")
        .map(PathBuf::from)
        .expect("set GIFTYC_RIG=/abs/path/to/public/gifty/rig-final")
}
```

- [ ] **Step 3: Run the test to verify it fails**

Run: `cd giftyc && cargo test --test spike_fidelity 2>&1 | head -30`
Expected: FAIL — `giftyc::rig` / `giftyc::composite` unresolved (lib not defined yet).

- [ ] **Step 4: Define the rig model and loader**

Create `giftyc/src/lib.rs`:
```rust
pub mod rig;
pub mod composite;
```

Create `giftyc/src/rig.rs`:
```rust
use anyhow::{Context, Result};
use serde::Deserialize;
use std::collections::BTreeMap;
use std::path::Path;

#[derive(Debug, Clone, Deserialize)]
pub struct LayerMeta {
    pub cx: f32, pub cy: f32,
    pub x: f32, pub y: f32, pub w: f32, pub h: f32,
}

#[derive(Debug, Clone, Deserialize)]
pub struct LR { pub l: String, pub r: String }

#[derive(Debug, Clone, Deserialize)]
pub struct Defaults {
    pub mouth: String, pub eyes: String, pub pupils: String,
    #[serde(rename = "armR")] pub arm_r: String,
    #[serde(rename = "armL")] pub arm_l: String,
    pub legs: String,
}

#[derive(Debug, Clone, Deserialize)]
pub struct Rig {
    pub canvas: u32,
    pub order: Vec<String>,
    pub base: Vec<String>,
    pub meta: BTreeMap<String, LayerMeta>,
    pub mouths: BTreeMap<String, String>,
    pub eyes: BTreeMap<String, LR>,
    pub pupils: BTreeMap<String, LR>,
    pub eyelid: LR,
    pub lashline: LR,
    pub eyerim: LR,
    #[serde(rename = "armR")] pub arm_r: BTreeMap<String, String>,
    #[serde(rename = "armL")] pub arm_l: BTreeMap<String, String>,
    pub legs: BTreeMap<String, LR>,
    pub defaults: Defaults,
    #[serde(rename = "armBehind")] pub arm_behind: BTreeMap<String, Vec<String>>,
    #[serde(rename = "eyesClosed", default)] pub eyes_closed: Vec<String>,
    pub puppy: String,
}

impl Rig {
    pub fn load(rig_dir: &Path) -> Result<Rig> {
        let p = rig_dir.join("rig.json");
        let raw = std::fs::read_to_string(&p)
            .with_context(|| format!("reading {}", p.display()))?;
        let rig: Rig = serde_json::from_str(&raw)
            .with_context(|| format!("parsing {}", p.display()))?;
        Ok(rig)
    }
}
```

- [ ] **Step 5: Implement the compositor**

Create `giftyc/src/composite.rs`:
```rust
use crate::rig::Rig;
use anyhow::{Context, Result};
use image::{RgbaImage, GenericImageView, imageops};
use std::path::Path;

#[derive(Debug, Clone)]
pub struct Selection {
    pub mouth: String, pub eyes: String, pub pupils: String,
    pub arm_r: String, pub arm_l: String, pub legs: String,
}

/// Resolve the `order` array's swap tokens into concrete PNG basenames, in draw order.
/// Arm z-order: a pose listed in arm_behind draws in its band as-is (the order array
/// already places __armL__/__armR__ before the face); we keep the rig's own ordering.
fn resolve_layers(rig: &Rig, sel: &Selection) -> Vec<String> {
    let mut out = Vec::new();
    for slot in &rig.order {
        match slot.as_str() {
            "__legs__" => {
                let lr = &rig.legs[&sel.legs];
                out.push(lr.l.clone()); out.push(lr.r.clone());
            }
            "__armL__" => out.push(rig.arm_l[&sel.arm_l].clone()),
            "__armR__" => out.push(rig.arm_r[&sel.arm_r].clone()),
            "__eyes__" => {
                let lr = &rig.eyes[&sel.eyes];
                out.push(lr.l.clone()); out.push(lr.r.clone());
            }
            "__pupils__" => {
                if let Some(lr) = rig.pupils.get(&sel.pupils) {
                    out.push(lr.l.clone()); out.push(lr.r.clone());
                }
            }
            "__eyelid__" => { /* blink overlay omitted in static spike */ }
            "__puppy__" => { /* puppy mood omitted in spike */ }
            "__mouth__" => out.push(rig.mouths[&sel.mouth].clone()),
            name => out.push(name.to_string()), // static layer (body, bow, eyebrow_*)
        }
    }
    out
}

fn load_layer(rig_dir: &Path, name: &str) -> Result<RgbaImage> {
    let p = rig_dir.join(format!("{name}.png"));
    let img = image::open(&p).with_context(|| format!("open {}", p.display()))?;
    Ok(img.to_rgba8())
}

/// Alpha-composite the named layers in order onto a blank canvas.
fn composite_named(rig: &Rig, names: &[String], rig_dir: &Path) -> Result<RgbaImage> {
    let mut canvas = RgbaImage::new(rig.canvas, rig.canvas);
    for name in names {
        let layer = load_layer(rig_dir, name)?;
        imageops::overlay(&mut canvas, &layer, 0, 0);
    }
    Ok(canvas)
}

pub fn composite_rig(rig: &Rig, sel: &Selection, rig_dir: &Path) -> Result<RgbaImage> {
    let layers = resolve_layers(rig, sel);
    composite_named(rig, &layers, rig_dir)
}

/// Split the resolved layer list at channel boundaries, composite each band on its
/// own transparent canvas, then alpha-stack the bands in the SAME order. This must
/// equal the full composite when channels are visually separable.
pub fn composite_by_channels(rig: &Rig, sel: &Selection, rig_dir: &Path) -> Result<RgbaImage> {
    let layers = resolve_layers(rig, sel);
    // Band split by layer role: body/legs/bow/eyebrow -> BODY; arms -> ARMS; eyes/pupils/mouth -> FACE.
    let mut bands: Vec<Vec<String>> = vec![Vec::new(), Vec::new(), Vec::new()]; // body, arms, face
    let arm_set: std::collections::BTreeSet<&String> =
        rig.arm_l.values().chain(rig.arm_r.values()).collect();
    let face_set: std::collections::BTreeSet<String> = rig.mouths.values().cloned()
        .chain(rig.eyes.values().flat_map(|lr| [lr.l.clone(), lr.r.clone()]))
        .chain(rig.pupils.values().flat_map(|lr| [lr.l.clone(), lr.r.clone()]))
        .collect();
    for name in &layers {
        if arm_set.contains(name) { bands[1].push(name.clone()); }
        else if face_set.contains(name) { bands[2].push(name.clone()); }
        else { bands[0].push(name.clone()); }
    }
    // NOTE: this preserves global order only if bands don't interleave. If the full
    // vs channel diff is nonzero, that interleaving is the seam the spike surfaces.
    let mut canvas = RgbaImage::new(rig.canvas, rig.canvas);
    for band in &bands {
        let b = composite_named(rig, band, rig_dir)?;
        imageops::overlay(&mut canvas, &b, 0, 0);
    }
    Ok(canvas)
}

/// Max absolute per-channel (R,G,B,A) difference between two equal-size images.
pub fn max_channel_diff(a: &RgbaImage, b: &RgbaImage) -> u8 {
    let mut m = 0u8;
    for (pa, pb) in a.pixels().zip(b.pixels()) {
        for i in 0..4 {
            let d = pa.0[i].abs_diff(pb.0[i]);
            if d > m { m = d; }
        }
    }
    m
}
```

- [ ] **Step 6: Run the spike test**

Run: `cd giftyc && GIFTYC_RIG=/Users/aap/Projects/Rory/mvp-ui/public/gifty/rig-final cargo test --test spike_fidelity -- --nocapture 2>&1 | tail -30`
Expected: PASS (diff == 0) if the body/arms/face bands do not interleave in `order`.

**If it FAILS with a nonzero diff:** the bands interleave (e.g. an arm draws between face layers, or eyebrow sits above eyes). This is the seam the spike exists to find. STOP. Record which layers interleave, and update the spec's §3 channel table to **co-bake** the interleaving layers into one band (e.g. arms+body together). Do not proceed to Task 2 until the diff is 0 with a band split the spec endorses.

- [ ] **Step 7: Write a visual artifact for human sign-off**

Add a binary `giftyc/src/bin/spike.rs` that writes both composites to PNG for eyeballing:
```rust
use anyhow::Result;
use std::path::PathBuf;

fn main() -> Result<()> {
    let rig_dir = PathBuf::from(std::env::var("GIFTYC_RIG")?);
    let out = PathBuf::from(std::env::var("GIFTYC_OUT").unwrap_or_else(|_| "spike-out".into()));
    std::fs::create_dir_all(&out)?;
    let rig = giftyc::rig::Rig::load(&rig_dir)?;
    let sel = giftyc::composite::Selection {
        mouth: "smile".into(), eyes: "normal".into(), pupils: "normal".into(),
        arm_r: "wave".into(), arm_l: "down".into(), legs: "stand".into(),
    };
    giftyc::composite::composite_rig(&rig, &sel, &rig_dir)?.save(out.join("full.png"))?;
    giftyc::composite::composite_by_channels(&rig, &sel, &rig_dir)?.save(out.join("channels.png"))?;
    println!("wrote {}/full.png and {}/channels.png", out.display(), out.display());
    Ok(())
}
```

Run: `cd giftyc && GIFTYC_RIG=/Users/aap/Projects/Rory/mvp-ui/public/gifty/rig-final cargo run --bin spike`
Expected: writes `spike-out/full.png` and `spike-out/channels.png`. Open both; confirm Gifty looks correct (waving, smiling) and the two are visually indistinguishable.

- [ ] **Step 8: Commit**

```bash
cd giftyc && git init -q 2>/dev/null; git add Cargo.toml src tests
git commit -m "feat(giftyc): fidelity spike — channels stack identical to full composite

Co-Authored-By: Claude Opus 4.8 <noreply@anthropic.com>"
```

---

### Task 2: Tier crop + resize, deterministic WebP encode

**Files:**
- Create: `giftyc/src/tier.rs`
- Modify: `giftyc/src/lib.rs` (add `pub mod tier;`)
- Test: `giftyc/tests/tier.rs`

**Interfaces:**
- Consumes: `composite_named`-style `RgbaImage` outputs from Task 1.
- Produces: `crop_to_alpha(img: &RgbaImage) -> (RgbaImage, Bbox)` where `Bbox { x: u32, y: u32, w: u32, h: u32 }`.
- Produces: `resize_to_tier(img: &RgbaImage, tier: u32, canvas: u32) -> RgbaImage` (scales by `tier/canvas`, Lanczos3).
- Produces: `encode_webp(img: &RgbaImage, quality: f32) -> anyhow::Result<Vec<u8>>`.

- [ ] **Step 1: Write the failing tier tests**

`giftyc/tests/tier.rs`:
```rust
use image::RgbaImage;
use giftyc::tier::{crop_to_alpha, resize_to_tier, Bbox};

fn dot(w: u32, h: u32, px: u32, py: u32) -> RgbaImage {
    let mut img = RgbaImage::new(w, h);
    img.put_pixel(px, py, image::Rgba([255,0,0,255]));
    img
}

#[test]
fn crop_finds_alpha_bbox() {
    let img = dot(100, 100, 40, 60);
    let (cropped, bbox) = crop_to_alpha(&img);
    assert_eq!(bbox, Bbox { x: 40, y: 60, w: 1, h: 1 });
    assert_eq!(cropped.dimensions(), (1, 1));
}

#[test]
fn resize_scales_by_tier_over_canvas() {
    let img = RgbaImage::new(1024, 1024);
    let out = resize_to_tier(&img, 256, 1024);
    assert_eq!(out.dimensions(), (256, 256));
}

#[test]
fn empty_image_crops_to_zero() {
    let img = RgbaImage::new(10, 10);
    let (_c, bbox) = crop_to_alpha(&img);
    assert_eq!(bbox, Bbox { x: 0, y: 0, w: 0, h: 0 });
}
```

- [ ] **Step 2: Run to verify failure**

Run: `cd giftyc && cargo test --test tier 2>&1 | head -20`
Expected: FAIL — `giftyc::tier` unresolved.

- [ ] **Step 3: Implement tier.rs**

```rust
use anyhow::Result;
use image::{RgbaImage, imageops::{self, FilterType}};

#[derive(Debug, Clone, Copy, PartialEq, Eq)]
pub struct Bbox { pub x: u32, pub y: u32, pub w: u32, pub h: u32 }

/// Tight alpha bounding box (alpha threshold > 8, matching the legacy pipeline).
pub fn crop_to_alpha(img: &RgbaImage) -> (RgbaImage, Bbox) {
    let (w, h) = img.dimensions();
    let (mut min_x, mut min_y, mut max_x, mut max_y) = (w, h, 0u32, 0u32);
    let mut found = false;
    for y in 0..h {
        for x in 0..w {
            if img.get_pixel(x, y).0[3] > 8 {
                found = true;
                if x < min_x { min_x = x; }
                if y < min_y { min_y = y; }
                if x > max_x { max_x = x; }
                if y > max_y { max_y = y; }
            }
        }
    }
    if !found {
        return (RgbaImage::new(0, 0), Bbox { x: 0, y: 0, w: 0, h: 0 });
    }
    let bb = Bbox { x: min_x, y: min_y, w: max_x - min_x + 1, h: max_y - min_y + 1 };
    let cropped = imageops::crop_imm(img, bb.x, bb.y, bb.w, bb.h).to_image();
    (cropped, bb)
}

/// Deterministic resize: Lanczos3, dimensions = round(dim * tier / canvas).
pub fn resize_to_tier(img: &RgbaImage, tier: u32, canvas: u32) -> RgbaImage {
    let scale = tier as f32 / canvas as f32;
    let (w, h) = img.dimensions();
    let nw = ((w as f32 * scale).round() as u32).max(1);
    let nh = ((h as f32 * scale).round() as u32).max(1);
    imageops::resize(img, nw, nh, FilterType::Lanczos3)
}

/// WebP encode. Uses the `image` crate's lossless path for determinism; if lossy
/// is required for size, shell out to `cwebp` (see Task 5 note). q is informational here.
pub fn encode_webp(img: &RgbaImage, _quality: f32) -> Result<Vec<u8>> {
    use image::codecs::webp::WebPEncoder;
    let mut buf = Vec::new();
    let enc = WebPEncoder::new_lossless(&mut buf);
    enc.encode(img.as_raw(), img.width(), img.height(), image::ExtendedColorType::Rgba8)?;
    Ok(buf)
}
```

Add `pub mod tier;` to `giftyc/src/lib.rs`. Enable the WebP feature in `Cargo.toml`:
```toml
image = { version = "0.25", default-features = false, features = ["png", "webp"] }
```

- [ ] **Step 4: Run to verify pass**

Run: `cd giftyc && cargo test --test tier 2>&1 | tail -15`
Expected: PASS (3 tests).

- [ ] **Step 5: Commit**

```bash
cd giftyc && git add Cargo.toml src/tier.rs src/lib.rs tests/tier.rs
git commit -m "feat(giftyc): tier crop/resize + deterministic lossless WebP encode

Co-Authored-By: Claude Opus 4.8 <noreply@anthropic.com>"
```

---

### Task 3: Shelf-packing channel frames into one atlas

**Files:**
- Create: `giftyc/src/pack.rs`
- Modify: `giftyc/src/lib.rs` (add `pub mod pack;`)
- Test: `giftyc/tests/pack.rs`

**Interfaces:**
- Consumes: `Bbox` from Task 2.
- Produces: `shelf_pack(sizes: &[(u32, u32)], max_w: u32, pad: u32) -> PackResult` where `PackResult { atlas_w: u32, atlas_h: u32, cells: Vec<Cell> }`, `Cell { sx: u32, sy: u32, sw: u32, sh: u32 }`. Cells align 1:1 with input `sizes` by index.

- [ ] **Step 1: Write the failing pack tests**

`giftyc/tests/pack.rs`:
```rust
use giftyc::pack::{shelf_pack, Cell};

#[test]
fn packs_single_cell_at_pad_offset() {
    let r = shelf_pack(&[(10, 20)], 100, 2);
    assert_eq!(r.cells.len(), 1);
    assert_eq!(r.cells[0], Cell { sx: 2, sy: 2, sw: 10, sh: 20 });
    assert!(r.atlas_w >= 12 && r.atlas_h >= 22);
}

#[test]
fn wraps_to_new_shelf_when_row_full() {
    // two 60-wide cells cannot share a 100-wide row (with padding)
    let r = shelf_pack(&[(60, 10), (60, 10)], 100, 2);
    assert_eq!(r.cells.len(), 2);
    assert_ne!(r.cells[0].sy, r.cells[1].sy, "second cell must drop to a new shelf");
}

#[test]
fn deterministic_same_input_same_layout() {
    let a = shelf_pack(&[(10,10),(20,5),(5,30)], 100, 1);
    let b = shelf_pack(&[(10,10),(20,5),(5,30)], 100, 1);
    assert_eq!(a.cells, b.cells);
    assert_eq!((a.atlas_w, a.atlas_h), (b.atlas_w, b.atlas_h));
}
```

- [ ] **Step 2: Run to verify failure**

Run: `cd giftyc && cargo test --test pack 2>&1 | head -20`
Expected: FAIL — `giftyc::pack` unresolved.

- [ ] **Step 3: Implement pack.rs**

```rust
#[derive(Debug, Clone, Copy, PartialEq, Eq)]
pub struct Cell { pub sx: u32, pub sy: u32, pub sw: u32, pub sh: u32 }

#[derive(Debug, Clone)]
pub struct PackResult { pub atlas_w: u32, pub atlas_h: u32, pub cells: Vec<Cell> }

/// Shelf/row packer. Preserves INPUT ORDER (cells[i] corresponds to sizes[i]) so the
/// manifest can index frames positionally and output stays deterministic.
pub fn shelf_pack(sizes: &[(u32, u32)], max_w: u32, pad: u32) -> PackResult {
    let mut cells = Vec::with_capacity(sizes.len());
    let (mut cx, mut cy, mut shelf_h, mut atlas_w) = (pad, pad, 0u32, 0u32);
    for &(w, h) in sizes {
        if cx + w + pad > max_w && cx > pad {
            // new shelf
            cy += shelf_h + pad;
            cx = pad;
            shelf_h = 0;
        }
        cells.push(Cell { sx: cx, sy: cy, sw: w, sh: h });
        cx += w + pad;
        if cx > atlas_w { atlas_w = cx; }
        if h > shelf_h { shelf_h = h; }
    }
    let atlas_h = cy + shelf_h + pad;
    PackResult { atlas_w, atlas_h, cells }
}
```

Add `pub mod pack;` to `giftyc/src/lib.rs`.

- [ ] **Step 4: Run to verify pass**

Run: `cd giftyc && cargo test --test pack 2>&1 | tail -15`
Expected: PASS (3 tests).

- [ ] **Step 5: Commit**

```bash
cd giftyc && git add src/pack.rs src/lib.rs tests/pack.rs
git commit -m "feat(giftyc): order-preserving deterministic shelf packer

Co-Authored-By: Claude Opus 4.8 <noreply@anthropic.com>"
```

---

### Task 4: Manifest model + serialization

**Files:**
- Create: `giftyc/src/manifest.rs`
- Modify: `giftyc/src/lib.rs` (add `pub mod manifest;`)
- Test: `giftyc/tests/manifest.rs`

**Interfaces:**
- Consumes: `Cell` from Task 3.
- Produces: `Manifest`, `ChannelEntry`, `Frame`, `TransitionClip` (serde-serializable). `Manifest::to_json_pretty(&self) -> String` emitting deterministic (sorted-key) JSON with `version: 1`.

- [ ] **Step 1: Write the failing manifest test**

`giftyc/tests/manifest.rs`:
```rust
use giftyc::manifest::{Manifest, ChannelEntry, Frame};
use giftyc::pack::Cell;

#[test]
fn serializes_versioned_deterministic_json() {
    let m = Manifest {
        version: 1,
        canvas: 1024,
        tier: 256,
        hero: Frame { name: "hero".into(), cell: Cell { sx:0, sy:0, sw:64, sh:64 }, ms: 0 },
        channels: vec![
            ChannelEntry {
                name: "face".into(),
                sheet: "face.webp".into(),
                frames: vec![Frame { name: "smile".into(), cell: Cell { sx:2, sy:2, sw:30, sh:20 }, ms: 0 }],
                transitions: vec![],
            },
        ],
    };
    let a = m.to_json_pretty();
    let b = m.to_json_pretty();
    assert_eq!(a, b, "serialization must be deterministic");
    assert!(a.contains("\"version\": 1"));
    assert!(a.contains("\"sheet\": \"face.webp\""));
}
```

- [ ] **Step 2: Run to verify failure**

Run: `cd giftyc && cargo test --test manifest 2>&1 | head -20`
Expected: FAIL — `giftyc::manifest` unresolved.

- [ ] **Step 3: Implement manifest.rs**

```rust
use crate::pack::Cell;
use serde::Serialize;

#[derive(Debug, Clone, Serialize)]
pub struct Frame {
    pub name: String,
    pub cell: Cell,
    #[serde(skip_serializing_if = "is_zero")] pub ms: u32,
}

#[derive(Debug, Clone, Serialize)]
pub struct TransitionClip {
    pub from: String,
    pub to: String,
    pub frames: Vec<Frame>,
    pub ms: u32,
}

#[derive(Debug, Clone, Serialize)]
pub struct ChannelEntry {
    pub name: String,
    pub sheet: String,
    pub frames: Vec<Frame>,
    #[serde(skip_serializing_if = "Vec::is_empty")] pub transitions: Vec<TransitionClip>,
}

#[derive(Debug, Clone, Serialize)]
pub struct Manifest {
    pub version: u32,
    pub canvas: u32,
    pub tier: u32,
    pub hero: Frame,
    pub channels: Vec<ChannelEntry>,
}

fn is_zero(n: &u32) -> bool { *n == 0 }

// serde derive on Cell needs Serialize; add it in pack.rs:
//   #[derive(Debug, Clone, Copy, PartialEq, Eq, serde::Serialize)] pub struct Cell {...}

impl Manifest {
    pub fn to_json_pretty(&self) -> String {
        // serde_json preserves struct field declaration order, which is fixed at
        // compile time -> deterministic. Vecs are caller-sorted before construction.
        serde_json::to_string_pretty(self).expect("manifest serialization")
    }
}
```

Update `giftyc/src/pack.rs` `Cell` to derive `serde::Serialize` (add `serde::Serialize` to its derive list). Add `serde` to imports if needed. Add `pub mod manifest;` to `lib.rs`.

- [ ] **Step 4: Run to verify pass**

Run: `cd giftyc && cargo test --test manifest 2>&1 | tail -15`
Expected: PASS.

- [ ] **Step 5: Commit**

```bash
cd giftyc && git add src/manifest.rs src/pack.rs src/lib.rs tests/manifest.rs
git commit -m "feat(giftyc): versioned deterministic spritepack manifest model

Co-Authored-By: Claude Opus 4.8 <noreply@anthropic.com>"
```

---

### Task 5: `build` command — wire channels → sheets → manifest end to end

**Files:**
- Create: `giftyc/src/build.rs`
- Modify: `giftyc/src/lib.rs` (add `pub mod build;`)
- Modify: `giftyc/src/main.rs` (clap CLI: `build`, `verify`)
- Test: `giftyc/tests/build_e2e.rs`

**Interfaces:**
- Consumes: everything from Tasks 1–4.
- Produces: `build_pack(rig_dir: &Path, out_dir: &Path, tier: u32) -> anyhow::Result<()>` — writes `<out>/face.webp`, `arms.webp`, `body.webp`, `hero.webp`, and `manifest.json`.

- [ ] **Step 1: Write the failing e2e test**

`giftyc/tests/build_e2e.rs`:
```rust
use std::path::PathBuf;

#[test]
fn build_emits_manifest_and_sheets_deterministically() {
    let rig_dir = PathBuf::from(std::env::var("GIFTYC_RIG").expect("set GIFTYC_RIG"));
    let tmp = std::env::temp_dir().join("giftyc_e2e");
    let _ = std::fs::remove_dir_all(&tmp);

    giftyc::build::build_pack(&rig_dir, &tmp.join("a"), 256).expect("build a");
    giftyc::build::build_pack(&rig_dir, &tmp.join("b"), 256).expect("build b");

    for f in ["manifest.json", "face.webp", "arms.webp", "body.webp", "hero.webp"] {
        assert!(tmp.join("a").join(f).exists(), "missing {f}");
    }
    // Determinism: identical bytes across two builds.
    for f in ["manifest.json", "face.webp", "arms.webp", "body.webp", "hero.webp"] {
        let a = std::fs::read(tmp.join("a").join(f)).unwrap();
        let b = std::fs::read(tmp.join("b").join(f)).unwrap();
        assert_eq!(a, b, "{f} differs between builds — nondeterministic");
    }
}
```

- [ ] **Step 2: Run to verify failure**

Run: `cd giftyc && cargo test --test build_e2e 2>&1 | head -20`
Expected: FAIL — `giftyc::build` unresolved.

- [ ] **Step 3: Implement build.rs**

```rust
use crate::{composite, manifest::*, pack, rig::Rig, tier};
use anyhow::Result;
use image::{RgbaImage, imageops};
use std::path::Path;

/// One frame's source: a flat-composited, alpha-cropped RGBA image + its name.
struct Baked { name: String, img: RgbaImage }

/// Bake every state of one channel into cropped, tier-resized frames.
/// `band` selects which layers belong to this channel for a given Selection.
fn bake_channel(
    rig: &Rig, rig_dir: &Path, t: u32,
    states: &[(String, composite::Selection)],
    keep: &dyn Fn(&Rig, &composite::Selection) -> Vec<String>,
) -> Result<Vec<Baked>> {
    let mut out = Vec::new();
    for (name, sel) in states {
        let names = keep(rig, sel);
        let mut canvas = RgbaImage::new(rig.canvas, rig.canvas);
        for n in &names {
            let layer = image::open(rig_dir.join(format!("{n}.png")))?.to_rgba8();
            imageops::overlay(&mut canvas, &layer, 0, 0);
        }
        let resized = tier::resize_to_tier(&canvas, t, rig.canvas);
        let (cropped, _bb) = tier::crop_to_alpha(&resized);
        out.push(Baked { name: name.clone(), img: cropped });
    }
    Ok(out)
}

fn pack_and_write(out_dir: &Path, sheet: &str, baked: &[Baked]) -> Result<Vec<Frame>> {
    let sizes: Vec<(u32,u32)> = baked.iter().map(|b| b.img.dimensions()).collect();
    let pr = pack::shelf_pack(&sizes, 4096, 2);
    let mut atlas = RgbaImage::new(pr.atlas_w.max(1), pr.atlas_h.max(1));
    let mut frames = Vec::new();
    for (b, cell) in baked.iter().zip(pr.cells.iter()) {
        imageops::overlay(&mut atlas, &b.img, cell.sx as i64, cell.sy as i64);
        frames.push(Frame { name: b.name.clone(), cell: *cell, ms: 0 });
    }
    let bytes = tier::encode_webp(&atlas, 90.0)?;
    std::fs::write(out_dir.join(sheet), bytes)?;
    Ok(frames)
}

pub fn build_pack(rig_dir: &Path, out_dir: &Path, t: u32) -> Result<()> {
    std::fs::create_dir_all(out_dir)?;
    let rig = Rig::load(rig_dir)?;
    let d = &rig.defaults;

    // FACE states: each mouth with default eyes; each eyes variant with default mouth.
    let mut face_states = Vec::new();
    let mut mouths: Vec<_> = rig.mouths.keys().cloned().collect(); mouths.sort();
    for m in &mouths {
        face_states.push((format!("mouth_{m}"), sel_with(d, Some(m), None)));
    }
    let mut eyes: Vec<_> = rig.eyes.keys().cloned().collect(); eyes.sort();
    for e in &eyes {
        face_states.push((format!("eyes_{e}"), sel_with(d, None, Some(e))));
    }
    let face = bake_channel(&rig, rig_dir, t, &face_states, &face_layers)?;

    // ARMS states: each armR and armL pose (default opposite arm).
    let mut arm_states = Vec::new();
    let mut ar: Vec<_> = rig.arm_r.keys().cloned().collect(); ar.sort();
    for a in &ar { arm_states.push((format!("armR_{a}"), sel_arm(d, Some(a), None))); }
    let mut al: Vec<_> = rig.arm_l.keys().cloned().collect(); al.sort();
    for a in &al { arm_states.push((format!("armL_{a}"), sel_arm(d, None, Some(a)))); }
    let arms = bake_channel(&rig, rig_dir, t, &arm_states, &arm_layers)?;

    // BODY: single default state (body+legs+bow+eyebrows). Breathe loop is runtime transform.
    let body_states = vec![("body".to_string(), sel_with(d, None, None))];
    let body = bake_channel(&rig, rig_dir, t, &body_states, &body_layers)?;

    // HERO: full default composite, pre-flattened for instant cold-load.
    let hero_sel = sel_with(d, None, None);
    let full = composite::composite_rig(&rig, &hero_sel, rig_dir)?;
    let full_t = tier::resize_to_tier(&full, t, rig.canvas);
    let (hero_img, _bb) = tier::crop_to_alpha(&full_t);
    let hero_baked = vec![Baked { name: "hero".into(), img: hero_img }];
    let hero_frames = pack_and_write(out_dir, "hero.webp", &hero_baked)?;

    let face_frames = pack_and_write(out_dir, "face.webp", &face)?;
    let arm_frames  = pack_and_write(out_dir, "arms.webp", &arms)?;
    let body_frames = pack_and_write(out_dir, "body.webp", &body)?;

    let manifest = Manifest {
        version: 1, canvas: rig.canvas, tier: t,
        hero: hero_frames.into_iter().next().unwrap(),
        channels: vec![
            ChannelEntry { name: "face".into(), sheet: "face.webp".into(), frames: face_frames, transitions: vec![] },
            ChannelEntry { name: "arms".into(), sheet: "arms.webp".into(), frames: arm_frames, transitions: vec![] },
            ChannelEntry { name: "body".into(), sheet: "body.webp".into(), frames: body_frames, transitions: vec![] },
        ],
    };
    std::fs::write(out_dir.join("manifest.json"), manifest.to_json_pretty())?;
    Ok(())
}

// --- selection + band helpers ---
use composite::Selection;
fn sel_with(d: &crate::rig::Defaults, mouth: Option<&str>, eyes: Option<&str>) -> Selection {
    Selection {
        mouth: mouth.unwrap_or(&d.mouth).to_string(),
        eyes: eyes.unwrap_or(&d.eyes).to_string(),
        pupils: d.pupils.clone(), arm_r: d.arm_r.clone(), arm_l: d.arm_l.clone(), legs: d.legs.clone(),
    }
}
fn sel_arm(d: &crate::rig::Defaults, ar: Option<&str>, al: Option<&str>) -> Selection {
    Selection {
        mouth: d.mouth.clone(), eyes: d.eyes.clone(), pupils: d.pupils.clone(),
        arm_r: ar.unwrap_or(&d.arm_r).to_string(),
        arm_l: al.unwrap_or(&d.arm_l).to_string(),
        legs: d.legs.clone(),
    }
}
// Band filters: which resolved layers belong to each channel.
fn face_layers(rig: &Rig, sel: &Selection) -> Vec<String> {
    let mut v = Vec::new();
    let e = &rig.eyes[&sel.eyes]; v.push(e.l.clone()); v.push(e.r.clone());
    if let Some(p) = rig.pupils.get(&sel.pupils) { v.push(p.l.clone()); v.push(p.r.clone()); }
    v.push(rig.mouths[&sel.mouth].clone());
    v
}
fn arm_layers(rig: &Rig, sel: &Selection) -> Vec<String> {
    vec![rig.arm_l[&sel.arm_l].clone(), rig.arm_r[&sel.arm_r].clone()]
}
fn body_layers(rig: &Rig, sel: &Selection) -> Vec<String> {
    let lr = &rig.legs[&sel.legs];
    vec![lr.l.clone(), lr.r.clone(), "body".into(), "bow".into(), "eyebrow_l".into(), "eyebrow_r".into()]
}
```

Add `pub mod build;` to `lib.rs`. Wire the CLI in `main.rs`:
```rust
use anyhow::Result;
use clap::{Parser, Subcommand};
use std::path::PathBuf;

#[derive(Parser)]
#[command(name = "giftyc")]
struct Cli { #[command(subcommand)] cmd: Cmd }

#[derive(Subcommand)]
enum Cmd {
    /// Bake a sprite pack from a rig-final dir into an output dir.
    Build {
        #[arg(long)] rig: PathBuf,
        #[arg(long)] out: PathBuf,
        #[arg(long, default_value_t = 256)] tier: u32,
    },
}

fn main() -> Result<()> {
    match Cli::parse().cmd {
        Cmd::Build { rig, out, tier } => giftyc::build::build_pack(&rig, &out, tier),
    }
}
```

- [ ] **Step 4: Run e2e to verify pass**

Run: `cd giftyc && GIFTYC_RIG=/Users/aap/Projects/Rory/mvp-ui/public/gifty/rig-final cargo test --test build_e2e 2>&1 | tail -20`
Expected: PASS — sheets + manifest emitted, byte-identical across two builds.

- [ ] **Step 5: Smoke-run the CLI and check sizes against budget**

Run: `cd giftyc && cargo run -- build --rig /Users/aap/Projects/Rory/mvp-ui/public/gifty/rig-final --out /tmp/giftypack256 --tier 256 && ls -la /tmp/giftypack256`
Expected: `face.webp + arms.webp + body.webp + hero.webp + manifest.json`. **Record total bytes.** Spec §4 predicts ~110KB for the full catalog at 256px; if the sum is wildly over (e.g. >300KB), note it — lossless WebP is larger than lossy; Task 6 addresses encoding if needed.

- [ ] **Step 6: Commit**

```bash
cd giftyc && git add src/build.rs src/main.rs src/lib.rs tests/build_e2e.rs
git commit -m "feat(giftyc): build command — channels to sheets to manifest, deterministic

Co-Authored-By: Claude Opus 4.8 <noreply@anthropic.com>"
```

---

### Task 6: `verify` command — golden-image determinism gate for CI

**Files:**
- Modify: `giftyc/src/main.rs` (add `verify` subcommand)
- Modify: `giftyc/src/build.rs` (add `verify_pack`)
- Test: `giftyc/tests/verify.rs`

**Interfaces:**
- Consumes: `build_pack` from Task 5.
- Produces: `verify_pack(rig_dir: &Path, golden_dir: &Path, tier: u32) -> anyhow::Result<bool>` — rebuilds into a temp dir and byte-compares every file against `golden_dir`; returns `true` iff identical.

- [ ] **Step 1: Write the failing verify test**

`giftyc/tests/verify.rs`:
```rust
use std::path::PathBuf;

#[test]
fn verify_passes_against_freshly_built_golden() {
    let rig_dir = PathBuf::from(std::env::var("GIFTYC_RIG").expect("set GIFTYC_RIG"));
    let golden = std::env::temp_dir().join("giftyc_golden");
    let _ = std::fs::remove_dir_all(&golden);
    giftyc::build::build_pack(&rig_dir, &golden, 256).expect("build golden");

    let ok = giftyc::build::verify_pack(&rig_dir, &golden, 256).expect("verify");
    assert!(ok, "freshly built pack must verify byte-identical against itself");
}
```

- [ ] **Step 2: Run to verify failure**

Run: `cd giftyc && cargo test --test verify 2>&1 | head -20`
Expected: FAIL — `verify_pack` unresolved.

- [ ] **Step 3: Implement verify_pack**

Append to `giftyc/src/build.rs`:
```rust
/// Rebuild into a temp dir and byte-compare every output file against `golden_dir`.
pub fn verify_pack(rig_dir: &Path, golden_dir: &Path, t: u32) -> Result<bool> {
    let tmp = std::env::temp_dir().join(format!("giftyc_verify_{t}"));
    let _ = std::fs::remove_dir_all(&tmp);
    build_pack(rig_dir, &tmp, t)?;
    for f in ["manifest.json", "face.webp", "arms.webp", "body.webp", "hero.webp"] {
        let a = std::fs::read(tmp.join(f))?;
        let b = std::fs::read(golden_dir.join(f))?;
        if a != b { return Ok(false); }
    }
    Ok(true)
}
```

Add the `Verify` subcommand to `main.rs`:
```rust
    /// Rebuild and assert byte-identity against a golden dir (CI gate).
    Verify {
        #[arg(long)] rig: PathBuf,
        #[arg(long)] golden: PathBuf,
        #[arg(long, default_value_t = 256)] tier: u32,
    },
```
and in `main()`:
```rust
        Cmd::Verify { rig, golden, tier } => {
            if giftyc::build::verify_pack(&rig, &golden, tier)? {
                println!("verify OK");
                Ok(())
            } else {
                anyhow::bail!("verify FAILED — output differs from golden");
            }
        }
```

- [ ] **Step 4: Run to verify pass**

Run: `cd giftyc && GIFTYC_RIG=/Users/aap/Projects/Rory/mvp-ui/public/gifty/rig-final cargo test --test verify 2>&1 | tail -15`
Expected: PASS.

- [ ] **Step 5: Commit**

```bash
cd giftyc && git add src/build.rs src/main.rs tests/verify.rs
git commit -m "feat(giftyc): verify command — golden-image determinism gate

Co-Authored-By: Claude Opus 4.8 <noreply@anthropic.com>"
```

---

### Task 7: Generate golden pack + wire mvp-ui build script

**Files:**
- Create: `mvp-ui/public/gifty/packs/256/` (golden output, committed)
- Modify: `mvp-ui/package.json` (add `rig:build` script)
- Create: `giftyc/README.md`

**Interfaces:**
- Consumes: the `giftyc` binary from Tasks 5–6.
- Produces: committed golden pack at `public/gifty/packs/256/` that Plan 2's runtime consumes.

- [ ] **Step 1: Build and commit the golden 256 pack**

Run:
```bash
cd giftyc && cargo build --release
./target/release/giftyc build \
  --rig /Users/aap/Projects/Rory/mvp-ui/public/gifty/rig-final \
  --out /Users/aap/Projects/Rory/mvp-ui/public/gifty/packs/256 --tier 256
ls -la /Users/aap/Projects/Rory/mvp-ui/public/gifty/packs/256
```
Expected: 5 files written. Visually open `hero.webp` to confirm it's recognizably Gifty.

- [ ] **Step 2: Add the mvp-ui build script**

In `mvp-ui/package.json` `"scripts"`, add (assumes `giftyc` installed on PATH or built at a known path — document in README):
```json
"rig:build": "giftyc build --rig public/gifty/rig-final --out public/gifty/packs/256 --tier 256",
"rig:verify": "giftyc verify --rig public/gifty/rig-final --golden public/gifty/packs/256 --tier 256"
```

- [ ] **Step 3: Write giftyc/README.md**

```markdown
# giftyc — Gifty sprite-pack compiler

Standalone Rust CLI. Bakes the layered Gifty rig (`rig-final/`) into channel
sprite packs (manifest + WebP sheets) for the mobile runtime.

## Build
    cargo build --release

## Use
    giftyc build  --rig <path>/rig-final --out <path>/public/gifty/packs/256 --tier 256
    giftyc verify --rig <path>/rig-final --golden <path>/public/gifty/packs/256 --tier 256

`build` is deterministic: same rig in → byte-identical pack out. `verify` is the
CI gate; it rebuilds and asserts byte-identity against the committed golden pack.

Channels: face / arms / body (legs fold into body). The rig is the read-only
source of truth; giftyc never writes to it.
```

- [ ] **Step 4: Verify the committed golden passes the gate**

Run: `cd mvp-ui && npm run rig:verify` (or the direct `giftyc verify` command if not yet on PATH)
Expected: `verify OK`.

- [ ] **Step 5: Commit (mvp-ui side)**

```bash
cd /Users/aap/Projects/Rory/mvp-ui
git add public/gifty/packs/256 package.json
git commit -m "feat(gifty): committed golden 256px sprite pack + rig:build/verify scripts

Co-Authored-By: Claude Opus 4.8 <noreply@anthropic.com>"
```

- [ ] **Step 6: Commit (giftyc side)**

```bash
cd giftyc && git add README.md
git commit -m "docs(giftyc): usage + determinism contract

Co-Authored-By: Claude Opus 4.8 <noreply@anthropic.com>"
```

---

## Notes for Plan 2 (runtime — written after this plan completes)

- Plan 2 builds `SpritePackPlayer` (React) consuming `public/gifty/packs/256/manifest.json` + sheets.
- **Hub-and-spoke arm transitions and face crossfades are deferred to Plan 2** — they are runtime playback concerns. This plan bakes the *frames*; Plan 2 sequences them. (The manifest's `transitions` array is in place but emitted empty by v1 `giftyc`; if baked transition frames prove necessary, a follow-up giftyc task adds them.)
- The body breathe/bob loop is a runtime CSS transform on the single body frame, not baked frames.
- If the Task 5 size check shows lossless WebP is too heavy, add a giftyc task to shell out to `cwebp -q 90` (lossy) — but re-establish determinism by pinning the `cwebp` version and asserting in `verify`.
