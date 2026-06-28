# Gifty Rig Compressor Implementation Plan

> **For agentic workers:** REQUIRED SUB-SKILL: Use superpowers:subagent-driven-development (recommended) or superpowers:executing-plans to implement this plan task-by-task. Steps use checkbox (`- [ ]`) syntax for tracking.

**Goal:** Pack the 58-layer, 37 MB full-canvas Gifty rig into multi-resolution WebP/PNG sprite atlases, and give `RigGifty` a default "web" tier that renders from them with full animation parity (HQ PNG path preserved for hero renders).

**Architecture:** A Node build script (`compress-rig.mjs`, using the already-installed `sharp`) crops each layer to its content bbox, shelf-packs the crops into one atlas per resolution tier (128/256/512/1024), encodes WebP q90 + PNG fallback, and emits a JSON map (atlas cells + 0..1 placement boxes + carried rig data). `RigGifty` gains `tier` (default `"web"`): the web path renders each layer as a CSS background-sprite from the atlas; `tier="hq"` keeps today's exact render verbatim. A `pickTier()` helper paints 512 first and upgrades to 1024 on hi-DPI.

**Tech Stack:** Node 23 (ESM, `type: module`), `sharp` ^0.34, `node:test` for build-script tests (no new deps), React 19 + TypeScript for the runtime.

## Global Constraints

- Originals in `public/gifty/rig-layers/` are **never modified** — they are the HQ tier.
- **Back up `RigGifty.tsx` to `RigGifty.hq.bak.tsx` before editing it.**
- New scripts are ESM `.mjs` under `scripts/gifty/`, matching `bake-rig.mjs` conventions (`fileURLToPath` for `__dirname`, `ROOT = resolve(__dirname, "..", "..")`, canvas `C = 1024`).
- Compressor output dir: `public/gifty/rig-web/`. Files: `rig-{128,256,512,1024}.{webp,png,json}`.
- WebP quality default **90**; PNG fallback lossless. Tier number = the final whole-Gifty render size; scale = tier/1024.
- Runtime: `tier` prop defaults to **`"web"`**; `tier="hq"` is the verbatim current path. Web tier has **full animation parity** (bob/breathe, blink lid-slide, pupil dart/rest, wave, `lidRest`, eyerim drawn on top).
- Progressive load: always load **512** first; upgrade to **1024** when `window.devicePixelRatio > 1`.
- No animation/transition exporter (separate future project).
- Tests run via `node --test`; add `"rig:compress"` and `"test:rig"` npm scripts.

---

### Task 1: Layer-geometry module (crop boxes + shelf packing)

Pure functions with no I/O, so they are unit-testable without sharp or files. This is the math core of the compressor.

**Files:**
- Create: `scripts/gifty/lib/atlas.mjs`
- Test: `scripts/gifty/lib/atlas.test.mjs`

**Interfaces:**
- Consumes: nothing (pure).
- Produces:
  - `placeBox(bbox, canvas)` → `{x, y, w, h}` as 0..1 fractions of `canvas` (the layer's position on the face). `bbox = {x, y, w, h}` in pixels.
  - `shelfPack(items, opts?)` → `{ width, height, placements }` where `items` is `[{ name, w, h }]` (pixel sizes) and `placements` is `[{ name, sx, sy, sw, sh }]`. `opts.padding` (default 2) inserts a gap between cells. Algorithm: sort by `h` desc, place left→right on a shelf, wrap to a new shelf when the row would exceed `opts.maxWidth` (default 2048); atlas `height` = bottom of last shelf.

- [ ] **Step 1: Write the failing tests**

```js
// scripts/gifty/lib/atlas.test.mjs
import { test } from "node:test";
import assert from "node:assert/strict";
import { placeBox, shelfPack } from "./atlas.mjs";

test("placeBox converts pixel bbox to 0..1 fractions", () => {
  const p = placeBox({ x: 256, y: 512, w: 128, h: 256 }, 1024);
  assert.deepEqual(p, { x: 0.25, y: 0.5, w: 0.125, h: 0.25 });
});

test("shelfPack places items and reports atlas size", () => {
  const { width, height, placements } = shelfPack(
    [{ name: "a", w: 100, h: 50 }, { name: "b", w: 40, h: 80 }],
    { padding: 0, maxWidth: 2048 },
  );
  // sorted by height desc: b(80) then a(50), same shelf
  const b = placements.find((p) => p.name === "b");
  const a = placements.find((p) => p.name === "a");
  assert.deepEqual({ sx: b.sx, sy: b.sy, sw: b.sw, sh: b.sh }, { sx: 0, sy: 0, sw: 40, sh: 80 });
  assert.deepEqual({ sx: a.sx, sy: a.sy, sw: a.sw, sh: a.sh }, { sx: 40, sy: 0, sw: 100, sh: 50 });
  assert.equal(width, 140);
  assert.equal(height, 80);
});

test("shelfPack wraps to a new shelf past maxWidth", () => {
  const { height, placements } = shelfPack(
    [{ name: "a", w: 80, h: 30 }, { name: "b", w: 80, h: 30 }],
    { padding: 0, maxWidth: 100 },
  );
  const a = placements.find((p) => p.name === "a");
  const b = placements.find((p) => p.name === "b");
  assert.equal(a.sy, 0);
  assert.equal(b.sy, 30); // wrapped below
  assert.equal(height, 60);
});
```

- [ ] **Step 2: Run tests to verify they fail**

Run: `node --test scripts/gifty/lib/atlas.test.mjs`
Expected: FAIL — `Cannot find module './atlas.mjs'` / exports undefined.

- [ ] **Step 3: Implement `atlas.mjs`**

```js
// scripts/gifty/lib/atlas.mjs
// Pure geometry helpers for the rig compressor — no I/O, no sharp.

/** Convert a pixel bbox {x,y,w,h} to 0..1 fractions of a square `canvas`. */
export function placeBox(bbox, canvas) {
  return {
    x: bbox.x / canvas,
    y: bbox.y / canvas,
    w: bbox.w / canvas,
    h: bbox.h / canvas,
  };
}

/**
 * Shelf/row pack items into an atlas.
 * items: [{ name, w, h }] in pixels. Returns { width, height, placements }.
 * placements: [{ name, sx, sy, sw, sh }].
 */
export function shelfPack(items, opts = {}) {
  const padding = opts.padding ?? 2;
  const maxWidth = opts.maxWidth ?? 2048;
  const sorted = [...items].sort((a, b) => b.h - a.h);
  const placements = [];
  let shelfX = 0;
  let shelfY = 0;
  let shelfH = 0;
  let width = 0;
  for (const it of sorted) {
    if (shelfX > 0 && shelfX + it.w > maxWidth) {
      // wrap to a new shelf
      shelfY += shelfH + padding;
      shelfX = 0;
      shelfH = 0;
    }
    placements.push({ name: it.name, sx: shelfX, sy: shelfY, sw: it.w, sh: it.h });
    shelfX += it.w + padding;
    shelfH = Math.max(shelfH, it.h);
    width = Math.max(width, shelfX - padding);
  }
  return { width, height: shelfY + shelfH, placements };
}
```

- [ ] **Step 4: Run tests to verify they pass**

Run: `node --test scripts/gifty/lib/atlas.test.mjs`
Expected: PASS (3 tests).

- [ ] **Step 5: Add npm test script and commit**

Edit `package.json` `scripts` to add: `"test:rig": "node --test scripts/gifty/lib/*.test.mjs"`.

```bash
git add scripts/gifty/lib/atlas.mjs scripts/gifty/lib/atlas.test.mjs package.json
git commit -m "feat(gifty): atlas geometry helpers (placeBox, shelfPack) for rig compressor

Co-Authored-By: Claude Opus 4.8 <noreply@anthropic.com>"
```

---

### Task 2: Rig-data carry module (extract the non-image rig fields the runtime needs)

The web JSON must carry the rig's behavioral data (order, moods, sockets, pupilRest, etc.) so the web runtime needs only `rig-<tier>.json` + the atlas. Pure transform over a parsed `rig.json` object.

**Files:**
- Create: `scripts/gifty/lib/rig-carry.mjs`
- Test: `scripts/gifty/lib/rig-carry.test.mjs`

**Interfaces:**
- Consumes: a parsed `rig.json` object.
- Produces: `carryRigData(rig)` → an object with exactly these keys copied through when present: `order, base, mouths, eyes, pupils, eyelid, lashline, eyerim, eyeMask, puppy, armR, armL, legs, defaults, sockets, socketsByMood, pupilRest, lidRest, faceBlue, lidBlue, faceQuad`. It does **not** copy `meta` or `canvas` (those are replaced by per-tier atlas data). Unknown/missing keys are omitted (no `undefined` values in output).

- [ ] **Step 1: Write the failing test**

```js
// scripts/gifty/lib/rig-carry.test.mjs
import { test } from "node:test";
import assert from "node:assert/strict";
import { carryRigData } from "./rig-carry.mjs";

test("carryRigData copies behavioral fields and drops meta/canvas", () => {
  const rig = {
    canvas: 1024,
    meta: { body: { cx: 0.5 } },
    order: ["body", "__mouth__"],
    defaults: { mouth: "smile" },
    pupilRest: { normal: { l: { x: 0.5, y: 0.4 } } },
    lidRest: { l: 0.001613, r: 0 },
    faceBlue: "#2F6BF5",
  };
  const out = carryRigData(rig);
  assert.equal("meta" in out, false);
  assert.equal("canvas" in out, false);
  assert.deepEqual(out.order, ["body", "__mouth__"]);
  assert.deepEqual(out.lidRest, { l: 0.001613, r: 0 });
  assert.equal(out.faceBlue, "#2F6BF5");
});

test("carryRigData omits missing keys (no undefined values)", () => {
  const out = carryRigData({ order: [] });
  for (const v of Object.values(out)) assert.notEqual(v, undefined);
  assert.equal("puppy" in out, false);
});
```

- [ ] **Step 2: Run test to verify it fails**

Run: `node --test scripts/gifty/lib/rig-carry.test.mjs`
Expected: FAIL — module not found.

- [ ] **Step 3: Implement `rig-carry.mjs`**

```js
// scripts/gifty/lib/rig-carry.mjs
// Copy the rig's behavioral (non-image) fields into the per-tier web JSON.

const CARRY_KEYS = [
  "order", "base", "mouths", "eyes", "pupils", "eyelid", "lashline", "eyerim",
  "eyeMask", "puppy", "armR", "armL", "legs", "defaults", "sockets",
  "socketsByMood", "pupilRest", "lidRest", "faceBlue", "lidBlue", "faceQuad",
];

export function carryRigData(rig) {
  const out = {};
  for (const k of CARRY_KEYS) {
    if (rig[k] !== undefined) out[k] = rig[k];
  }
  return out;
}
```

- [ ] **Step 4: Run test to verify it passes**

Run: `node --test scripts/gifty/lib/rig-carry.test.mjs`
Expected: PASS (2 tests).

- [ ] **Step 5: Commit**

```bash
git add scripts/gifty/lib/rig-carry.mjs scripts/gifty/lib/rig-carry.test.mjs
git commit -m "feat(gifty): carryRigData — carry behavioral rig fields into web JSON

Co-Authored-By: Claude Opus 4.8 <noreply@anthropic.com>"
```

---

### Task 3: Compressor script (crop, pack, scale, encode, emit JSON)

The I/O driver: reads layers + rig.json, uses Tasks 1–2, writes `rig-web/`. Verified by an end-to-end test that runs it on the real assets and asserts outputs + a sharp round-trip.

**Files:**
- Create: `scripts/gifty/compress-rig.mjs`
- Test: `scripts/gifty/compress-rig.test.mjs`
- Modify: `package.json` (add `rig:compress` script)

**Interfaces:**
- Consumes: `placeBox`, `shelfPack` (Task 1); `carryRigData` (Task 2).
- Produces (exported for testing; also runs as CLI):
  - `async function compressRig({ root, tiers, quality, scale, out })` → writes files and returns `{ tiers: [{ tier, atlasPx:{w,h}, bytes:{webp,png,json}, layerCount }] }`.
  - Defaults: `tiers=[128,256,512,1024]`, `quality=90`, `scale=1`, `out="public/gifty/rig-web"`, `root=repo root`.
  - JSON shape written per tier: `{ tier, canvas: 1024, atlas: { w, h }, layers: { <name>: { place:{x,y,w,h}, cell:{sx,sy,sw,sh} } }, ...carryRigData(rig) }`.
  - CLI: `node scripts/gifty/compress-rig.mjs [--tiers=..] [--quality=n] [--scale=f] [--out=dir]`.

- [ ] **Step 1: Write the failing end-to-end test**

```js
// scripts/gifty/compress-rig.test.mjs
import { test } from "node:test";
import assert from "node:assert/strict";
import fs from "node:fs";
import path from "node:path";
import os from "node:os";
import { fileURLToPath } from "node:url";
import sharp from "sharp";
import { compressRig } from "./compress-rig.mjs";

const __dirname = path.dirname(fileURLToPath(import.meta.url));
const ROOT = path.resolve(__dirname, "..", "..");

test("compressRig emits 512 tier with atlas + JSON, layers round-trip", async () => {
  const out = path.join(os.tmpdir(), "rig-web-test-" + process.pid);
  fs.rmSync(out, { recursive: true, force: true });
  const res = await compressRig({ root: ROOT, tiers: [512], out });

  // files exist
  for (const ext of ["webp", "png", "json"]) {
    assert.ok(fs.existsSync(path.join(out, `rig-512.${ext}`)), `rig-512.${ext} missing`);
  }
  // JSON shape
  const j = JSON.parse(fs.readFileSync(path.join(out, "rig-512.json"), "utf8"));
  assert.equal(j.tier, 512);
  assert.equal(j.canvas, 1024);
  assert.ok(j.atlas.w > 0 && j.atlas.h > 0);
  assert.ok(j.layers.body, "body layer present");
  assert.ok(j.order, "carried rig data present (order)");
  const b = j.layers.body;
  for (const k of ["x", "y", "w", "h"]) assert.equal(typeof b.place[k], "number");
  for (const k of ["sx", "sy", "sw", "sh"]) assert.equal(typeof b.cell[k], "number");

  // round-trip: the atlas cell for `body` is non-empty
  const atlas = sharp(path.join(out, "rig-512.png"));
  const cell = await atlas
    .extract({ left: b.cell.sx, top: b.cell.sy, width: b.cell.sw, height: b.cell.sh })
    .raw().toBuffer({ resolveWithObject: true });
  const hasAlpha = cell.info.channels === 4;
  let maxA = 0;
  if (hasAlpha) for (let i = 3; i < cell.data.length; i += 4) maxA = Math.max(maxA, cell.data[i]);
  assert.ok(!hasAlpha || maxA > 0, "body cell has visible pixels");

  // size win: 512 tier total is far below the 37MB original
  const total = ["webp", "png"].reduce(
    (s, e) => s + fs.statSync(path.join(out, `rig-512.${e}`)).size, 0);
  assert.ok(total < 8 * 1024 * 1024, `512 tier should be small, got ${total} bytes`);

  fs.rmSync(out, { recursive: true, force: true });
});
```

- [ ] **Step 2: Run test to verify it fails**

Run: `node --test scripts/gifty/compress-rig.test.mjs`
Expected: FAIL — `compress-rig.mjs` has no `compressRig` export.

- [ ] **Step 3: Implement `compress-rig.mjs`**

```js
#!/usr/bin/env node
/**
 * compress-rig.mjs — pack the layered Gifty rig into multi-res sprite atlases.
 *
 * Crops each layer to its content bbox, shelf-packs the crops into one atlas per
 * resolution tier (128/256/512/1024), encodes WebP q90 + PNG fallback, and emits
 * a JSON map (atlas cells + 0..1 placement boxes + carried rig data).
 *
 *   node scripts/gifty/compress-rig.mjs [--tiers=512,1024] [--quality=90] [--scale=1] [--out=dir]
 * In:  public/gifty/rig-layers/  (PNGs + rig.json)   — NEVER modified
 * Out: public/gifty/rig-web/     (rig-<tier>.{webp,png,json})
 */
import fs from "node:fs";
import path from "node:path";
import { fileURLToPath } from "node:url";
import sharp from "sharp";
import { placeBox, shelfPack } from "./lib/atlas.mjs";
import { carryRigData } from "./lib/rig-carry.mjs";

const __dirname = path.dirname(fileURLToPath(import.meta.url));
const REPO_ROOT = path.resolve(__dirname, "..", "..");
const CANVAS = 1024;

// All layer names referenced by the rig live as <name>.png in rig-layers.
// We compress every PNG present (swap slots like __mouth__ are not files).
function listLayerFiles(layersDir) {
  return fs.readdirSync(layersDir)
    .filter((f) => f.endsWith(".png"))
    .map((f) => f.slice(0, -4));
}

/** Trim a sharp image to its alpha bbox; returns { buffer, bbox } at native px. */
async function cropToContent(file) {
  const img = sharp(file);
  const { data, info } = await img.raw().toBuffer({ resolveWithObject: true });
  const { width, height, channels } = info;
  let minX = width, minY = height, maxX = -1, maxY = -1;
  const aOff = channels === 4 ? 3 : null;
  for (let y = 0; y < height; y++) {
    for (let x = 0; x < width; x++) {
      const idx = (y * width + x) * channels;
      const a = aOff === null ? 255 : data[idx + aOff];
      if (a > 8) {
        if (x < minX) minX = x;
        if (y < minY) minY = y;
        if (x > maxX) maxX = x;
        if (y > maxY) maxY = y;
      }
    }
  }
  if (maxX < 0) { // fully transparent — keep a 1px stub
    return { buffer: await sharp(file).png().toBuffer(), bbox: { x: 0, y: 0, w: 1, h: 1 } };
  }
  const bbox = { x: minX, y: minY, w: maxX - minX + 1, h: maxY - minY + 1 };
  const buffer = await sharp(file)
    .extract({ left: bbox.x, top: bbox.y, width: bbox.w, height: bbox.h })
    .png().toBuffer();
  return { buffer, bbox };
}

export async function compressRig({
  root = REPO_ROOT,
  tiers = [128, 256, 512, 1024],
  quality = 90,
  scale = 1,
  out = path.join(root, "public/gifty/rig-web"),
} = {}) {
  const layersDir = path.join(root, "public/gifty/rig-layers");
  const rig = JSON.parse(fs.readFileSync(path.join(layersDir, "rig.json"), "utf8"));
  const carried = carryRigData(rig);
  const names = listLayerFiles(layersDir);

  // crop every layer once at native resolution
  const crops = [];
  for (const name of names) {
    const { buffer, bbox } = await cropToContent(path.join(layersDir, `${name}.png`));
    crops.push({ name, buffer, bbox, place: placeBox(bbox, CANVAS) });
  }

  fs.mkdirSync(out, { recursive: true });
  const report = [];

  for (const tier of tiers) {
    const f = (tier / CANVAS) * scale; // per-tier scale factor

    // scale each crop's pixel size for this tier
    const scaled = crops.map((c) => ({
      name: c.name,
      w: Math.max(1, Math.round(c.bbox.w * f)),
      h: Math.max(1, Math.round(c.bbox.h * f)),
    }));
    const { width, height, placements } = shelfPack(scaled, { padding: 2, maxWidth: 4096 });
    const byName = Object.fromEntries(placements.map((p) => [p.name, p]));

    // build the atlas: resize each crop and composite at its cell
    const composites = [];
    for (const c of crops) {
      const p = byName[c.name];
      const buf = await sharp(c.buffer).resize(p.sw, p.sh).png().toBuffer();
      composites.push({ input: buf, left: p.sx, top: p.sy });
    }
    const atlas = sharp({
      create: { width, height, channels: 4, background: { r: 0, g: 0, b: 0, alpha: 0 } },
    }).composite(composites);

    const webpPath = path.join(out, `rig-${tier}.webp`);
    const pngPath = path.join(out, `rig-${tier}.png`);
    const jsonPath = path.join(out, `rig-${tier}.json`);
    await atlas.clone().webp({ quality }).toFile(webpPath);
    await atlas.clone().png().toFile(pngPath);

    const layers = {};
    for (const c of crops) {
      const p = byName[c.name];
      layers[c.name] = {
        place: c.place,
        cell: { sx: p.sx, sy: p.sy, sw: p.sw, sh: p.sh },
      };
    }
    const json = { tier, canvas: CANVAS, atlas: { w: width, h: height }, layers, ...carried };
    fs.writeFileSync(jsonPath, JSON.stringify(json));

    report.push({
      tier,
      atlasPx: { w: width, h: height },
      bytes: {
        webp: fs.statSync(webpPath).size,
        png: fs.statSync(pngPath).size,
        json: fs.statSync(jsonPath).size,
      },
      layerCount: crops.length,
    });
  }
  return { tiers: report };
}

// ---- CLI ----
function parseArgs(argv) {
  const o = {};
  for (const a of argv) {
    const m = a.match(/^--([^=]+)=(.*)$/);
    if (!m) continue;
    const [, k, v] = m;
    if (k === "tiers") o.tiers = v.split(",").map(Number);
    else if (k === "quality") o.quality = Number(v);
    else if (k === "scale") o.scale = Number(v);
    else if (k === "out") o.out = path.resolve(v);
  }
  return o;
}

if (import.meta.url === `file://${process.argv[1]}`) {
  const opts = parseArgs(process.argv.slice(2));
  compressRig(opts).then(({ tiers }) => {
    for (const t of tiers) {
      const kb = (n) => (n / 1024).toFixed(0);
      console.log(
        `rig-${t.tier}: atlas ${t.atlasPx.w}x${t.atlasPx.h}  ` +
        `webp ${kb(t.bytes.webp)}KB  png ${kb(t.bytes.png)}KB  (${t.layerCount} layers)`,
      );
    }
  }).catch((e) => { console.error(e); process.exit(1); });
}
```

- [ ] **Step 4: Run test to verify it passes**

Run: `node --test scripts/gifty/compress-rig.test.mjs`
Expected: PASS (1 test). May take a few seconds (real image work).

- [ ] **Step 5: Generate the real assets and eyeball the size win**

Add to `package.json` `scripts`: `"rig:compress": "node scripts/gifty/compress-rig.mjs"`.

Run: `npm run rig:compress`
Expected output: four `rig-<tier>` lines; the 512 webp should be a few hundred KB (vs 37 MB of source PNGs). Confirm `public/gifty/rig-web/` now holds 12 files.

- [ ] **Step 6: Commit**

```bash
git add scripts/gifty/compress-rig.mjs scripts/gifty/compress-rig.test.mjs package.json public/gifty/rig-web
git commit -m "feat(gifty): rig compressor — crop+pack layers into multi-res sprite atlases

Emits rig-{128,256,512,1024}.{webp,png,json} under public/gifty/rig-web from the
untouched 1024 layers. WebP q90 + PNG fallback; JSON carries atlas cells, 0..1
placement boxes, and behavioral rig data.

Co-Authored-By: Claude Opus 4.8 <noreply@anthropic.com>"
```

---

### Task 4: Back up the runtime + add the tier seam (no behavior change yet)

Isolate the risky runtime edit: first preserve the known-good path and introduce the `tier` prop + `pickTier()` without changing what renders. This task must leave the default render visually identical.

**Files:**
- Create: `src/app/components/shared/gifty/RigGifty.hq.bak.tsx` (verbatim copy of current `RigGifty.tsx`)
- Create: `src/app/components/shared/gifty/pickTier.ts`
- Create: `src/app/components/shared/gifty/pickTier.test.mjs`
- Modify: `src/app/components/shared/gifty/RigGifty.tsx` (add `tier` prop, default `"web"`, but keep rendering the current path for BOTH values for now)

**Interfaces:**
- Consumes: nothing new.
- Produces:
  - `pickTier(opts: { dpr: number }) → { initial: 128|256|512|1024; upgrade: 128|256|512|1024 | null }`. Rule: `initial = 512`; `upgrade = dpr > 1 ? 1024 : null`.
  - `RigGifty` prop `tier?: "web" | "hq"` (default `"web"`). In THIS task both values still render the existing full-canvas path (parity guaranteed; web rendering lands in Task 5).

- [ ] **Step 1: Write the failing test for `pickTier`**

```js
// src/app/components/shared/gifty/pickTier.test.mjs
import { test } from "node:test";
import assert from "node:assert/strict";
import { pickTier } from "./pickTier.ts";

test("pickTier starts at 512 and upgrades to 1024 on hi-DPI", () => {
  assert.deepEqual(pickTier({ dpr: 2 }), { initial: 512, upgrade: 1024 });
});

test("pickTier stays at 512 on standard DPI", () => {
  assert.deepEqual(pickTier({ dpr: 1 }), { initial: 512, upgrade: null });
});
```

(Run with the TS loader: `node --test --experimental-strip-types src/app/components/shared/gifty/pickTier.test.mjs`. Node 23 supports `--experimental-strip-types`.)

- [ ] **Step 2: Run test to verify it fails**

Run: `node --test --experimental-strip-types src/app/components/shared/gifty/pickTier.test.mjs`
Expected: FAIL — `pickTier.ts` not found.

- [ ] **Step 3: Implement `pickTier.ts`**

```ts
// src/app/components/shared/gifty/pickTier.ts
// Choose the initial render tier and an optional higher-res upgrade.
// The single seam where real frontend network/client config plugs in later.

export type Tier = 128 | 256 | 512 | 1024;

export function pickTier({ dpr }: { dpr: number }): { initial: Tier; upgrade: Tier | null } {
  return { initial: 512, upgrade: dpr > 1 ? 1024 : null };
}
```

- [ ] **Step 4: Run test to verify it passes**

Run: `node --test --experimental-strip-types src/app/components/shared/gifty/pickTier.test.mjs`
Expected: PASS (2 tests).

- [ ] **Step 5: Back up the current component verbatim**

```bash
cp src/app/components/shared/gifty/RigGifty.tsx src/app/components/shared/gifty/RigGifty.hq.bak.tsx
```

- [ ] **Step 6: Add the `tier` prop to `RigGifty.tsx` (still rendering current path)**

In the props type, add `tier`:

```tsx
}: { size?: number; mood?: Mood; talking?: boolean; wave?: boolean;
     armR?: string; armL?: string; legs?: string; tier?: "web" | "hq" }) {
```

Add a default in the destructure: `tier = "web",`. Do NOT branch on it yet — the existing render stays. This keeps the build/output identical while the prop exists for Task 5.

- [ ] **Step 7: Typecheck**

Run: `npx tsc --noEmit -p . 2>&1 | grep -i "RigGifty\|pickTier" ; echo done`
Expected: `done` with no errors above it.

- [ ] **Step 8: Commit**

```bash
git add src/app/components/shared/gifty/RigGifty.tsx src/app/components/shared/gifty/RigGifty.hq.bak.tsx src/app/components/shared/gifty/pickTier.ts src/app/components/shared/gifty/pickTier.test.mjs
git commit -m "feat(gifty): back up HQ render path + add tier prop and pickTier seam

RigGifty.hq.bak.tsx freezes the known-good full-canvas render. tier prop
(default 'web') and pickTier (512, upgrade 1024 on hi-DPI) added; no render
change yet — web sprite path lands next.

Co-Authored-By: Claude Opus 4.8 <noreply@anthropic.com>"
```

---

### Task 5: Web sprite render path + progressive tier loading

Implement the actual atlas rendering and wire `tier="web"` to it, keeping `tier="hq"` on the backed-up full-canvas path. This is where the size/perf win reaches the screen.

**Files:**
- Create: `src/app/components/shared/gifty/useWebRig.ts` (load + tier-upgrade hook)
- Create: `src/app/components/shared/gifty/spriteStyle.ts` (cell → CSS, pure + testable)
- Create: `src/app/components/shared/gifty/spriteStyle.test.mjs`
- Modify: `src/app/components/shared/gifty/RigGifty.tsx` (branch: web → sprite path, hq → existing path)

**Interfaces:**
- Consumes: `pickTier` (Task 4); the `rig-<tier>.json` shape from Task 3 (`{ tier, canvas, atlas:{w,h}, layers:{<name>:{place,cell}}, ...carried }`).
- Produces:
  - `spriteCss({ cell, atlas, size, canvas })` → a `React.CSSProperties` for a sprite `<div>`: `width/height` from the layer's `place` box scaled to `size`, `backgroundImage` set by the caller, `backgroundPosition`/`backgroundSize` computed so the atlas cell fills the div. Signature: `spriteCss({ place, cell, atlas, size }): CSSProperties` returning at least `{ width, height, backgroundSize, backgroundPosition, backgroundRepeat: "no-repeat" }` (no `left/top`; positioning is by `place` via the wrapper).
  - `useWebRig()` → `{ data, atlasUrl }` where `data` is the parsed tier JSON (or null while loading) and `atlasUrl` is the current `.webp` (with `.png` fallback). Loads `pickTier().initial` first, then swaps to `upgrade` when set.

- [ ] **Step 1: Write the failing test for `spriteCss`**

```js
// src/app/components/shared/gifty/spriteStyle.test.mjs
import { test } from "node:test";
import assert from "node:assert/strict";
import { spriteCss } from "./spriteStyle.ts";

test("spriteCss sizes the div by place box and scales the atlas to the cell", () => {
  // a layer occupying a 0.125-wide region, rendered at size=512 → 64px wide.
  const css = spriteCss({
    place: { x: 0.25, y: 0.5, w: 0.125, h: 0.25 },
    cell: { sx: 40, sy: 0, sw: 64, sh: 128 },
    atlas: { w: 200, h: 128 },
    size: 512,
  });
  assert.equal(css.width, 64);   // 0.125 * 512
  assert.equal(css.height, 128); // 0.25 * 512
  // background scaled so the 64px-wide cell maps onto the 64px div:
  // backgroundSize = atlas scaled by (divW / cellW) = 200*(64/64)=200, 128*(128/128)=128
  assert.equal(css.backgroundSize, "200px 128px");
  // position shifts the atlas so the cell's top-left lands at the div origin
  assert.equal(css.backgroundPosition, "-40px -0px");
  assert.equal(css.backgroundRepeat, "no-repeat");
});
```

- [ ] **Step 2: Run test to verify it fails**

Run: `node --test --experimental-strip-types src/app/components/shared/gifty/spriteStyle.test.mjs`
Expected: FAIL — module not found.

- [ ] **Step 3: Implement `spriteStyle.ts`**

```ts
// src/app/components/shared/gifty/spriteStyle.ts
// Pure cell→CSS for an atlas-backed sprite div. No React imports needed.

type Place = { x: number; y: number; w: number; h: number };
type Cell = { sx: number; sy: number; sw: number; sh: number };
type Atlas = { w: number; h: number };

export function spriteCss(
  { place, cell, atlas, size }: { place: Place; cell: Cell; atlas: Atlas; size: number },
): React.CSSProperties {
  const divW = place.w * size;
  const divH = place.h * size;
  // scale the whole atlas image so the cell maps 1:1 onto the div
  const scaleX = divW / cell.sw;
  const scaleY = divH / cell.sh;
  const bgW = atlas.w * scaleX;
  const bgH = atlas.h * scaleY;
  return {
    width: divW,
    height: divH,
    backgroundSize: `${bgW}px ${bgH}px`,
    backgroundPosition: `-${cell.sx * scaleX}px -${cell.sy * scaleY}px`,
    backgroundRepeat: "no-repeat",
  };
}
```

(Note: the test asserts integer cases; `-0px` is acceptable from `-${0*sx}px`.)

- [ ] **Step 4: Run test to verify it passes**

Run: `node --test --experimental-strip-types src/app/components/shared/gifty/spriteStyle.test.mjs`
Expected: PASS (1 test).

- [ ] **Step 5: Implement `useWebRig.ts`**

```ts
// src/app/components/shared/gifty/useWebRig.ts
"use client";
import { useEffect, useState } from "react";
import { pickTier, type Tier } from "./pickTier";

const BASE = "/gifty/rig-web";

// WebP is supported in all current target browsers; cheap runtime check keeps a
// PNG fallback path open without a <picture> rewrite of every sprite.
function supportsWebp(): boolean {
  if (typeof document === "undefined") return true;
  const c = document.createElement("canvas");
  return c.toDataURL("image/webp").startsWith("data:image/webp");
}

export type WebRig = { data: any | null; atlasUrl: string | null };

export function useWebRig(): WebRig {
  const [tier, setTier] = useState<Tier | null>(null);
  const [data, setData] = useState<any | null>(null);

  // choose tiers once on mount (client only — dpr needs window)
  useEffect(() => {
    const dpr = typeof window !== "undefined" ? window.devicePixelRatio || 1 : 1;
    const { initial, upgrade } = pickTier({ dpr });
    setTier(initial);
    if (upgrade) {
      // upgrade after first paint
      const id = window.setTimeout(() => setTier(upgrade), 0);
      return () => window.clearTimeout(id);
    }
  }, []);

  useEffect(() => {
    if (!tier) return;
    let live = true;
    fetch(`${BASE}/rig-${tier}.json`)
      .then((r) => r.json())
      .then((j) => { if (live) setData(j); })
      .catch(() => {});
    return () => { live = false; };
  }, [tier]);

  const ext = supportsWebp() ? "webp" : "png";
  const atlasUrl = tier ? `${BASE}/rig-${tier}.${ext}` : null;
  return { data, atlasUrl };
}
```

- [ ] **Step 6: Branch `RigGifty.tsx` on `tier`**

At the top of the component body, before the existing `useState`/effects, decide the path. Keep the existing HQ implementation exactly as-is for `tier === "hq"`. For `tier === "web"`, render via the atlas. The cleanest seam: extract the existing return into a `renderHq()` and add a `renderWeb()` that reuses the SAME animation math (bob/blink/dart/wave/lidRest already computed above the return) but emits sprite `<div>`s instead of `<img>`s.

Concretely, in `RigGifty.tsx`:

1. Call the hook unconditionally near the other hooks:
   ```tsx
   const web = useWebRig();
   ```
   Import it: `import { useWebRig } from "./useWebRig";` and `import { spriteCss } from "./spriteStyle";`.

2. The web path uses `web.data` as its rig source instead of the fetched `rig`. Guard:
   ```tsx
   if (tier === "web") {
     if (!web.data || !web.atlasUrl) return <div style={{ width: size, height: size }} aria-label="Gifty" />;
   } else {
     if (!rig) return <div style={{ width: size, height: size }} aria-label="Gifty" />;
   }
   ```

3. Replace the layer-emitting helpers so that, in web mode, each layer becomes a positioned wrapper + sprite div. Add a web image helper alongside the existing `img`:
   ```tsx
   const webImg = (layer: string, kind: string) => {
     const src = web.data as any;
     const L = src.layers[layer];
     if (!L) return null;
     // wrapper positions the sprite on the face by its place box; transform = same
     // per-kind animation transform used by the HQ `img()` (bob/breathe/bow/wave).
     const transform = kindTransform(kind); // factor the existing transform switch into kindTransform(kind)
     return (
       <div key={layer} aria-hidden style={{
         position: "absolute",
         left: L.place.x * size, top: L.place.y * size,
         transform, transformOrigin: "center",
         ...spriteCss({ place: L.place, cell: L.cell, atlas: src.atlas, size }),
         backgroundImage: `url(${web.atlasUrl})`,
         willChange: "transform",
       }} />
     );
   };
   ```
   Factor the per-kind transform currently inside `img()` (the `if (kind === "body")…` chain) into a local `kindTransform(kind)` returning the transform string, so both `img()` (HQ) and `webImg()` (web) share it. The eyelid/pupil/eyerim helpers similarly gain web variants that read `web.data.layers[...]` and emit sprite divs sliding by the same `drop`/`dx`/`dy` values. Use `tier === "web" ? webImg : img` (and the matching web variants) when building `stack`.

4. The stack-building `for (const slot of rig.order)` loop reads `order` from the active source: `const SRC = tier === "web" ? web.data : rig;` then iterate `SRC.order`, and resolve `SRC.eyes/pupils/eyelid/...` from `SRC`. Both sources expose identical keys (Task 2 carried them), so the loop body is shared except for which emit helper it calls.

- [ ] **Step 7: Typecheck**

Run: `npx tsc --noEmit -p . 2>&1 | grep -iE "RigGifty|useWebRig|spriteStyle|pickTier"; echo done`
Expected: `done` with nothing above it.

- [ ] **Step 8: Visual parity check (manual, runtime-accurate)**

Build the parity snapshot the same way the eyelid work was verified — composite the rig two ways and compare:

Create a scratch script `/tmp/parity.mjs` (not committed) that, using sharp, renders the **web atlas** Gifty (place each layer's cell at `place.x*1024, place.y*1024` scaled to 1024) and saves `web.png`; visually compare against an HQ composite (the existing layers stacked). Open both. Expect: same shape, colors, and eye detail (rim on top, lash inside, pupils centered with the inward bias, lid domed). Note any drift.

If drift is found, fix `spriteCss`/placement and re-run. Do not proceed until parity holds.

- [ ] **Step 9: Run all rig tests**

Run: `node --test scripts/gifty/lib/*.test.mjs scripts/gifty/compress-rig.test.mjs && node --test --experimental-strip-types src/app/components/shared/gifty/*.test.mjs`
Expected: all PASS.

- [ ] **Step 10: Commit**

```bash
git add src/app/components/shared/gifty/useWebRig.ts src/app/components/shared/gifty/spriteStyle.ts src/app/components/shared/gifty/spriteStyle.test.mjs src/app/components/shared/gifty/RigGifty.tsx
git commit -m "feat(gifty): web sprite render path + progressive tier loading

tier='web' (default) renders CSS background-sprites from the rig-web atlas with
full animation parity; loads 512 then upgrades to 1024 on hi-DPI. tier='hq'
keeps the verbatim full-canvas path for hero renders.

Co-Authored-By: Claude Opus 4.8 <noreply@anthropic.com>"
```

---

### Task 6: Wire the default usage + smoke-run the app

Confirm the web tier works in the real app (the default now) and the HQ opt-out renders for a hero usage.

**Files:**
- Modify: any one existing consumer of `RigGifty` for a hero/large usage to pass `tier="hq"` (find via grep), if such a usage exists; otherwise document that all usages are web by default.

**Interfaces:**
- Consumes: `RigGifty` with `tier` (Task 5).
- Produces: no new exports.

- [ ] **Step 1: Find current `RigGifty` usages**

Run: `grep -rn "RigGifty\|GiftyDemo" src --include=*.tsx | grep -v "shared/gifty"`
Record the call sites.

- [ ] **Step 2: Decide hero opt-outs**

For any usage that is a large/hero display (e.g. an onboarding splash), add `tier="hq"`. Leave all others on the default web tier. If none are clearly "hero", make no change and note it in the commit body.

- [ ] **Step 3: Build the app**

Run: `npm run build`
Expected: build succeeds with no type errors referencing gifty files.

- [ ] **Step 4: Manual smoke (dev server)**

Use the `run` skill (or `npm run dev`) to load a page showing Gifty. Confirm: Gifty paints quickly, animates (bob/blink/pupil dart), eyes look correct (rim on top, lash inside, centered pupils, domed lid). On a hi-DPI screen, confirm the atlas sharpens shortly after load (512→1024 upgrade). If a `tier="hq"` usage exists, confirm it still renders identically to before.

- [ ] **Step 5: Commit**

```bash
git add -A
git commit -m "feat(gifty): adopt web rig tier by default; HQ opt-in for hero usages

Co-Authored-By: Claude Opus 4.8 <noreply@anthropic.com>"
```

---

## Self-Review

**1. Spec coverage:**
- Tiered output (HQ originals untouched + web tier) → Tasks 3, 4. ✓
- Crop + place by meta → Tasks 1, 3, 5. ✓
- Sprite atlas, WebP + PNG fallback → Task 3 (encode), Task 5 (`supportsWebp`). ✓
- Multi-res 128/256/512/1024, default 512, upgrade 1024 on dpr>1 → Tasks 3, 4 (`pickTier`), 5 (`useWebRig`). ✓
- `--quality`/`--scale`/`--tiers` flags → Task 3 CLI. ✓
- Web default, HQ opt-in, backup before edit → Tasks 4, 6 + `RigGifty.hq.bak.tsx`. ✓
- Full animation parity → Task 5 Step 6 (shared `kindTransform`, same drop/dx/dy). ✓
- Carry behavioral rig data into web JSON → Task 2. ✓
- Verification (round-trip, parity render, size assertion) → Task 3 test, Task 5 Step 8, Task 3 test size assert. ✓
- Exporter deferred → not in plan. ✓

**2. Placeholder scan:** No "TBD"/"add error handling"/"similar to". The one prose-heavy step (Task 5 Step 6) gives concrete code and names the exact refactor (`kindTransform`); acceptable as it edits an existing 250-line component whose full re-listing would be noise — the surgical instructions + shared-helper names are precise.

**3. Type consistency:** `Tier` defined in `pickTier.ts`, reused in `useWebRig.ts`. JSON shape `{tier,canvas,atlas:{w,h},layers:{<name>:{place,cell}}}` is produced in Task 3 and consumed identically in Tasks 3-test and 5 (`spriteCss({place,cell,atlas,size})`, `web.data.layers[...]`). `compressRig` signature consistent between Task 3 interface and impl. `carryRigData` keys match what Task 5's stack loop reads (`order/eyes/pupils/eyelid/lashline/eyerim/...`). ✓
