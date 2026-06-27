#!/usr/bin/env node
/**
 * extract-layers.mjs — Gifty layered-mascot asset pipeline.
 *
 * From the HQ Gemini renders, produce:
 *   public/gifty/rig/    — the idle cut into transform-able layers + layers.json
 *   public/gifty/poses/  — every state render, bg-removed + anchored + poses.json
 *
 * The idle rig only needs the parts that MOVE at rest (eyes blink/dart, bow bob,
 * body breathe). The body stays WHOLE underneath, so there's no occlusion/inpaint
 * problem — eye/pupil/bow layers just sit on top of the kept-whole base.
 *
 *   node scripts/gifty/extract-layers.mjs
 */

import fs from "node:fs";
import path from "node:path";
import { fileURLToPath } from "node:url";
import sharp from "sharp";

const __dirname = path.dirname(fileURLToPath(import.meta.url));
const ROOT = path.resolve(__dirname, "..", "..");
const SRC = path.join(ROOT, "docs", "design", "gifty");
const RIG = path.join(ROOT, "public", "gifty", "rig");
const POSES = path.join(ROOT, "public", "gifty", "poses");

// Gemini render → semantic name. idle is the rig base.
const RENDERS = {
  "Gemini_Generated_Image_cqmh61cqmh61cqmh.png": "idle",
  "Gemini_Generated_Image_kc9x3vkc9x3vkc9x.png": "wave",
  "Gemini_Generated_Image_1c2np91c2np91c2n.png": "thumbsup",
  "Gemini_Generated_Image_r9wewpr9wewpr9we.png": "salute",
  "Gemini_Generated_Image_u1b4qyu1b4qyu1b4.png": "proud",
  "Gemini_Generated_Image_ew4fcuew4fcuew4f.png": "celebrate",
  "Gemini_Generated_Image_bfzncmbfzncmbfzn.png": "sad",
  "Gemini_Generated_Image_vcp61avcp61avcp6.png": "sleep",
  "Gemini_Generated_Image_xzp7kcxzp7kcxzp7.png": "think",
  "Gemini_Generated_Image_wvymdawvymdawvym.png": "present",
};
const CANVAS = 1000; // normalized output canvas
const BODY_FRAC = 0.82; // character height as fraction of canvas (shared anchor)

const isBg = (r, g, b) => r > 215 && g > 215 && b > 215 && Math.abs(r - g) < 14 && Math.abs(g - b) < 14;

async function rgba(file) {
  const { data, info } = await sharp(file).ensureAlpha().raw().toBuffer({ resolveWithObject: true });
  return { d: data, W: info.width, H: info.height };
}

/** Set alpha=0 on background pixels; return a transparent-bg RGBA buffer. */
function cutBg({ d, W, H }) {
  const out = Buffer.from(d);
  for (let i = 0; i < W * H; i++) {
    const r = d[i * 4], g = d[i * 4 + 1], b = d[i * 4 + 2];
    if (isBg(r, g, b)) out[i * 4 + 3] = 0;
  }
  return { d: out, W, H };
}

/** alpha bounding box */
function bbox({ d, W, H }) {
  let minX = W, minY = H, maxX = -1, maxY = -1;
  for (let y = 0; y < H; y++)
    for (let x = 0; x < W; x++)
      if (d[(y * W + x) * 4 + 3] > 16) {
        if (x < minX) minX = x; if (x > maxX) maxX = x;
        if (y < minY) minY = y; if (y > maxY) maxY = y;
      }
  return { x: minX, y: minY, w: maxX - minX + 1, h: maxY - minY + 1 };
}

/** Normalize a cut character to the shared anchor: trim, scale body to BODY_FRAC
 *  of CANVAS, center X, feet near the bottom. Returns a CANVAS×CANVAS PNG buffer
 *  + the placement (for layer coords). */
async function anchor(cut) {
  const b = bbox(cut);
  const raw = sharp(Buffer.from(cut.d), { raw: { width: cut.W, height: cut.H, channels: 4 } });
  const cropped = await raw.extract({ left: b.x, top: b.y, width: b.w, height: b.h }).png().toBuffer();
  const targetH = Math.round(CANVAS * BODY_FRAC);
  const scale = targetH / b.h;
  const dw = Math.round(b.w * scale);
  const dh = targetH;
  const left = Math.round((CANVAS - dw) / 2);
  const top = CANVAS - dh - Math.round(CANVAS * 0.04); // small floor gap
  const placed = await sharp({ create: { width: CANVAS, height: CANVAS, channels: 4, background: { r: 0, g: 0, b: 0, alpha: 0 } } })
    .composite([{ input: await sharp(cropped).resize(dw, dh).toBuffer(), left, top }])
    .png().toBuffer();
  return { buf: placed, place: { left, top, dw, dh, srcBox: b, scale } };
}

/** crop a sub-region out of an anchored CANVAS buffer as its own layer */
async function sub(buf, region) {
  return sharp(buf).extract(region).png().toBuffer();
}

/** find white eye-blobs inside the anchored idle (interior-white in face zone),
 *  cluster into 2 by x, return bboxes in CANVAS space. */
function findEyes(d) {
  const W = CANVAS, H = CANVAS;
  const interiorWhite = (x, y) => {
    const i = (y * W + x) * 4;
    const r = d[i], g = d[i + 1], b = d[i + 2], a = d[i + 3];
    if (a < 200) return false;
    if (!(r > 205 && g > 205 && b > 205)) return false;
    for (const [dx, dy] of [[-5, 0], [5, 0], [0, -5], [0, 5]]) {
      const j = ((y + dy) * W + (x + dx)) * 4;
      if (d[j + 3] < 120) return false; // near an edge
    }
    return true;
  };
  const pts = [];
  for (let y = Math.floor(H * 0.18); y < Math.floor(H * 0.58); y++)
    for (let x = Math.floor(W * 0.18); x < Math.floor(W * 0.82); x++)
      if (interiorWhite(x, y)) pts.push([x, y]);
  if (pts.length < 20) return null;
  pts.sort((a, c) => a[0] - c[0]);
  const split = pts[Math.floor(pts.length / 2)][0];
  const grp = (arr) => {
    const X = arr.map((p) => p[0]), Y = arr.map((p) => p[1]);
    return { x: Math.min(...X), y: Math.min(...Y), w: Math.max(...X) - Math.min(...X) + 1, h: Math.max(...Y) - Math.min(...Y) + 1 };
  };
  let L = grp(pts.filter((p) => p[0] < split));
  let R = grp(pts.filter((p) => p[0] >= split));
  // pad a little so the whole eye + a margin is captured
  const pad = (bb) => ({ x: Math.max(0, bb.x - 12), y: Math.max(0, bb.y - 12), w: bb.w + 24, h: bb.h + 24 });
  return { L: pad(L), R: pad(R) };
}

async function main() {
  fs.mkdirSync(RIG, { recursive: true });
  fs.mkdirSync(POSES, { recursive: true });

  // ── POSES: bg-remove + anchor every render to the shared canvas ──
  const poses = {};
  let idleAnchored = null, idlePlace = null;
  for (const [file, name] of Object.entries(RENDERS)) {
    const p = path.join(SRC, file);
    if (!fs.existsSync(p)) { console.warn("missing", file); continue; }
    const cut = cutBg(await rgba(p));
    const { buf, place } = await anchor(cut);
    if (name === "idle") { idleAnchored = buf; idlePlace = place; }
    else { await sharp(buf).png().toFile(path.join(POSES, name + ".png")); poses[name] = { src: `poses/${name}.png` }; }
  }
  if (!idleAnchored) throw new Error("idle render not found");

  // ── RIG: base + eye-white/pupil/bow layers from the anchored idle ──
  await sharp(idleAnchored).png().toFile(path.join(RIG, "base.png"));
  const idleRaw = await sharp(idleAnchored).raw().toBuffer();
  const eyes = findEyes(idleRaw);
  const layers = { canvas: CANVAS, base: { src: "rig/base.png" } };

  if (eyes) {
    for (const [k, bb] of [["l", eyes.L], ["r", eyes.R]]) {
      const region = { left: bb.x, top: bb.y, width: bb.w, height: bb.h };
      // eye plate = white+pupil region as one layer (blink scales this);
      // pupil layer = dark pixels within it (darts independently)
      const eyeBuf = await sub(idleAnchored, region);
      await sharp(eyeBuf).png().toFile(path.join(RIG, `eye-${k}.png`));
      // pupil: keep only dark pixels of the eye region
      const er = await sharp(eyeBuf).ensureAlpha().raw().toBuffer({ resolveWithObject: true });
      const pd = Buffer.from(er.data);
      for (let i = 0; i < er.info.width * er.info.height; i++) {
        const r = pd[i * 4], g = pd[i * 4 + 1], b = pd[i * 4 + 2];
        if (!(r < 70 && g < 70 && b < 80)) pd[i * 4 + 3] = 0;
      }
      await sharp(pd, { raw: { width: er.info.width, height: er.info.height, channels: 4 } }).png().toFile(path.join(RIG, `pupil-${k}.png`));
      layers[`eye_${k}`] = { src: `rig/eye-${k}.png`, ...region };
      layers[`pupil_${k}`] = { src: `rig/pupil-${k}.png`, ...region };
    }
  } else {
    console.warn("eye detection failed — idle will rig body+bow only");
  }

  // bow: pink+gold pixels in the top 42% of the anchored idle
  {
    const er = await sharp(idleAnchored).ensureAlpha().raw().toBuffer({ resolveWithObject: true });
    const { width: W, height: H } = er.info; const bd = Buffer.from(er.data);
    for (let y = 0; y < H; y++) for (let x = 0; x < W; x++) {
      const i = (y * W + x) * 4; const r = bd[i], g = bd[i + 1], b = bd[i + 2];
      const pinkGold = (r > 150 && b > 60 && g < 130) || (r > 175 && g > 135 && b < 120);
      if (!(pinkGold && y < H * 0.42)) bd[i + 3] = 0;
    }
    const bowBuf = await sharp(bd, { raw: { width: W, height: H, channels: 4 } }).png().toBuffer();
    const bb = bbox({ d: (await sharp(bowBuf).ensureAlpha().raw().toBuffer()), W, H });
    await sharp(bowBuf).png().toFile(path.join(RIG, "bow.png"));
    layers.bow = { src: "rig/bow.png", x: bb.x, y: bb.y, w: bb.w, h: bb.h, full: true };
  }

  fs.writeFileSync(path.join(RIG, "layers.json"), JSON.stringify(layers, null, 2));
  fs.writeFileSync(path.join(POSES, "poses.json"), JSON.stringify({ canvas: CANVAS, poses }, null, 2));

  console.log("✓ rig layers ->", path.relative(ROOT, RIG));
  console.log("  layers:", Object.keys(layers).filter((k) => k !== "canvas").join(", "));
  console.log("✓ poses ->", path.relative(ROOT, POSES));
  console.log("  poses:", Object.keys(poses).join(", "));
}

main().catch((e) => { console.error(e); process.exit(1); });
