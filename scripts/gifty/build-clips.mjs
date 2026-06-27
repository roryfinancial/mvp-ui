#!/usr/bin/env node
/**
 * build-clips.mjs — Gifty sprite pipeline.
 *
 * Turns raw Ludo sprite-pack zips (public/gifty/*.zip) into aligned, named
 * clip sheets + a pose-graph manifest the runtime <Gifty> engine consumes.
 *
 *   zips ──unzip──▶ frames ──normalize 128px──▶ align(trim+center+scale)
 *        ──arm-weighted pose graph──▶ pick idle hub + per-spoke doorways
 *        ──bake──▶ public/gifty/clips/<name>.png  +  clips.json
 *
 * Why each step exists is documented inline. Re-run anytime the source packs
 * change:  node scripts/gifty/build-clips.mjs
 *
 * The idle hub and clip names are CONFIG below (a creative call, not auto-
 * guessed — the auto-picker chooses a wave frame as "calmest", which is wrong).
 */

import fs from "node:fs";
import path from "node:path";
import os from "node:os";
import { fileURLToPath } from "node:url";
import { execSync } from "node:child_process";
import sharp from "sharp";

const __dirname = path.dirname(fileURLToPath(import.meta.url));
const ROOT = path.resolve(__dirname, "..", "..");
const RAW = path.join(ROOT, "public", "gifty");          // source zips live here
const OUT = path.join(RAW, "clips");                     // baked output
const TILE = 128;                                        // runtime frame size
const G = 16;                                            // pose-signature grid

// ── CONFIG: map each source pack (by its zip basename) to a semantic clip name,
//    and designate the idle hub. Packs not listed are still baked under their id.
const NAMES = {
  "sprite-128px-frames-25-rows-5-cols-5":      "wave",      // p1
  "sprite-128px-frames-25-rows-5-cols-5 (1)":  "idle",      // p2  ← arm-down neutral
  "sprite-128px-frames-25-rows-5-cols-5 (2)":  "think",     // p3
  "sprite-128px-frames-36-rows-6-cols-6":      "sleep",     // p4
  "sprite-max-px-frames-16-rows-4-cols-4":     "wave_hd",   // m1
  "sprite-max-px-frames-16-rows-4-cols-4 (1)": "cheer_hd",  // m2
  "sprite-max-px-frames-36-rows-6-cols-6":     "wave_hd2",  // m3
};
const IDLE = "idle";

// arm-weighted signature: lower-left/right quadrants (where arms swing) weigh 3x,
// so the doorway picker won't accept a mid-wave frame as "neutral".
const W = [];
for (let gy = 0; gy < G; gy++)
  for (let gx = 0; gx < G; gx++) {
    const lowSide = gy >= Math.floor(G * 0.45) && (gx < Math.floor(G * 0.32) || gx >= Math.floor(G * 0.68));
    W.push(lowSide ? 3.0 : 1.0);
  }

async function sig(buf) {
  const { data } = await sharp(buf).resize(G, G, { fit: "fill" }).raw().toBuffer({ resolveWithObject: true });
  const v = new Float64Array(G * G * 2);
  for (let i = 0; i < G * G; i++) {
    const r = data[i * 4], g = data[i * 4 + 1], b = data[i * 4 + 2], a = data[i * 4 + 3];
    v[i * 2] = (0.299 * r + 0.587 * g + 0.114 * b) * (a / 255) * W[i];
    v[i * 2 + 1] = (a / 255) * 255 * W[i];
  }
  return v;
}
const dist = (a, b) => { let d = 0; for (let i = 0; i < a.length; i++) { const e = a[i] - b[i]; d += e * e; } return Math.sqrt(d / a.length); };

// align a raw frame: trim to alpha bbox, scale content to a common height, center on 128.
// This is THE step that makes cross-pack doorways line up (packs are framed differently).
async function align(buf) {
  let t;
  try { t = await sharp(buf).trim({ threshold: 10 }).toBuffer(); }
  catch { t = buf; }
  const scaled = await sharp(t).resize({ height: 104, fit: "inside" }).toBuffer();
  return sharp(scaled).resize(TILE, TILE, { fit: "contain", background: { r: 0, g: 0, b: 0, alpha: 0 }, position: "centre" }).png().toBuffer();
}

function unzipAll(tmp) {
  const zips = fs.readdirSync(RAW).filter((f) => f.endsWith(".zip"));
  const packs = [];
  for (const z of zips) {
    const base = z.replace(/\.zip$/, "");
    const dir = path.join(tmp, base);
    fs.mkdirSync(dir, { recursive: true });
    execSync(`unzip -o ${JSON.stringify(path.join(RAW, z))} -d ${JSON.stringify(dir)}`, { stdio: "ignore" });
    const json = fs.readdirSync(dir).find((f) => f.endsWith(".json"));
    if (!json) continue;
    const j = JSON.parse(fs.readFileSync(path.join(dir, json)));
    packs.push({ base, dir, j, img: path.join(dir, j.meta.image), name: NAMES[base] || base.replace(/[^a-z0-9]+/gi, "_") });
  }
  return packs;
}

async function main() {
  if (!fs.existsSync(RAW)) throw new Error(`no source dir ${RAW}`);
  const tmp = fs.mkdtempSync(path.join(os.tmpdir(), "gifty-"));
  const packs = unzipAll(tmp);
  if (!packs.length) throw new Error("no sprite zips found in public/gifty/");

  // 1) extract + align every frame; keep aligned buffers + durations + signatures
  for (const p of packs) {
    const frames = Object.values(p.j.frames);
    p.aligned = []; p.durs = []; p.sigs = [];
    for (const f of frames) {
      const raw = await sharp(p.img).extract({ left: f.frame.x, top: f.frame.y, width: f.frame.w, height: f.frame.h })
        .resize(TILE, TILE, { fit: "contain", background: { r: 0, g: 0, b: 0, alpha: 0 } }).png().toBuffer();
      const a = await align(raw);
      p.aligned.push(a); p.durs.push(f.duration); p.sigs.push(await sig(a));
    }
  }

  // 2) idle rest frame = arm-weighted medoid of the idle pack
  const idlePack = packs.find((p) => p.name === IDLE);
  if (!idlePack) throw new Error(`idle pack "${IDLE}" not found`);
  let best = Infinity, idleRest = 0;
  idlePack.sigs.forEach((s, i) => {
    let sum = 0; idlePack.sigs.forEach((t) => (sum += dist(s, t)));
    if (sum < best) { best = sum; idleRest = i; }
  });

  // 3) per-spoke doorway: frame in each clip closest to idle rest; classify by gap
  const TH_GREEN = 26, TH_YELLOW = 50;
  const clips = {};
  for (const p of packs) {
    let cls = "hub", doorIn = idleRest;
    if (p.name !== IDLE) {
      let bg = Infinity, ci = 0;
      p.sigs.forEach((s, i) => { const d = dist(s, idlePack.sigs[idleRest]); if (d < bg) { bg = d; ci = i; } });
      doorIn = ci;
      cls = bg < TH_GREEN ? "GREEN" : bg < TH_YELLOW ? "YELLOW" : "RED";
    }
    clips[p.name] = { id: p.base, frames: p.aligned.length, tile: TILE, durations: p.durs, doorIn, spokeClass: cls };
  }

  // 4) bake one horizontal strip sheet per clip
  fs.rmSync(OUT, { recursive: true, force: true });
  fs.mkdirSync(OUT, { recursive: true });
  for (const p of packs) {
    const sheet = sharp({ create: { width: TILE * p.aligned.length, height: TILE, channels: 4, background: { r: 0, g: 0, b: 0, alpha: 0 } } });
    await sheet.composite(p.aligned.map((b, i) => ({ input: b, left: i * TILE, top: 0 }))).png().toFile(path.join(OUT, p.name + ".png"));
  }

  fs.writeFileSync(path.join(OUT, "clips.json"), JSON.stringify({ idle: IDLE, idleRest, tile: TILE, clips }, null, 2));
  fs.rmSync(tmp, { recursive: true, force: true });

  const summary = Object.entries(clips).map(([k, v]) => `${k}(${v.frames}f,${v.spokeClass})`).join("  ");
  console.log("✓ baked", Object.keys(clips).length, "clips ->", path.relative(ROOT, OUT));
  console.log("  idle hub:", IDLE, "rest f" + idleRest);
  console.log("  " + summary);
}

main().catch((e) => { console.error(e); process.exit(1); });
