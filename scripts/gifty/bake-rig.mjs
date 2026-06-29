#!/usr/bin/env node
/**
 * ⚠️ OBSOLETE — DO NOT RUN. This would OVERWRITE public/gifty/rig-layers/rig.json
 * and the base PNGs, DESTROYING work this script knows nothing about:
 *   - eyelid / lashline / eyerim / eyemask layers (procedurally generated)
 *   - the puppy look, the mirrored pupil, the despeckle cleanup
 *   - all arm/leg POSE variants (armR_, armL_, legL_, legR_ …)
 *   - rig.json behavior: armBehind/armNudge/legRise/puppyRest/eyesClosed/socketsByMood,
 *     the corrected z-order (legs before body), pupilRest/lidRest tuning, etc.
 * `public/gifty/rig-layers/` + `rig.json` is now the SOURCE OF TRUTH; edit it directly
 * (and re-run `npm run rig:compress` to rebuild the web atlas). Clean base-layer art
 * has been propagated back to `public/gifty/parts/<BASE>/` for reference only.
 * Kept for historical reference of the original bake. The body is hard-disabled below.
 *
 * bake-rig.mjs — assemble the layered Gifty rig from cut parts.
 *
 * Base layers come from the most-complete render (thumbsup / 1c2np9). Mouth and
 * eye VARIANTS are pulled from other renders to give talking visemes + moods,
 * normalized to the same 1024 canvas so they swap in place.
 *
 *   node scripts/gifty/bake-rig.mjs   ← refuses to run (see guard below)
 * Out: public/gifty/rig-layers/  (PNGs + rig.json)
 */
import fs from "node:fs";
import path from "node:path";
import { fileURLToPath } from "node:url";
import sharp from "sharp";

if (!process.env.FORCE_BAKE_RIG_OVERWRITE) {
  console.error(
    "bake-rig.mjs is OBSOLETE and refuses to run: it would overwrite rig-layers/rig.json\n" +
    "and destroy the eyelid/eyerim/lashline/puppy/arm-pose work it knows nothing about.\n" +
    "rig-layers/ is now the source of truth. If you REALLY mean to re-bake from scratch,\n" +
    "set FORCE_BAKE_RIG_OVERWRITE=1 (you will lose the current rig).");
  process.exit(1);
}

const __dirname = path.dirname(fileURLToPath(import.meta.url));
const ROOT = path.resolve(__dirname, "..", "..");
const P = (r) => path.join(ROOT, "public/gifty/parts", "Gemini_Generated_Image_" + r);
const HERO = path.join(ROOT, "public/gifty/parts");
const OUT = path.join(ROOT, "public/gifty/rig-layers");
const C = 1024;

const BASE = "1c2np91c2np91c2n"; // thumbsup — most complete

// static base layers (single file each)
const BASE_LAYERS = ["body", "leg_l", "leg_r", "arm_l", "arm_r", "bow", "eyebrow_l", "eyebrow_r"];

// mouth variants → semantic name (talk visemes + moods), from various renders
const MOUTHS = {
  talk_ah:  ["1c2np91c2np91c2n", "mouth"],   // wide open grin
  talk_oh:  ["cqmh61cqmh61cqmh", "mouth"],   // open grin med
  talk_eh:  ["kc9x3vkc9x3vkc9x", "mouth"],   // open grin smaller
  smile:    ["vcp61avcp61avcp6", "mouth"],   // closed gentle smile
  shy:      ["bfzncmbfzncmbfzn", "mouth"],   // small closed curve
  proud:    ["u1b4qyu1b4qyu1b4", "mouth"],   // big toothy
  hmm:      ["xzp7kcxzp7kcxzp7", "mouth"],   // wavy thinking
};

// eye-white moods (l+r) from various renders
const EYES = {
  normal:  "1c2np91c2np91c2n",   // big round open
  smug:    "u1b4qyu1b4qyu1b4",   // half-lidded
  happy:   "vcp61avcp61avcp6",   // closed happy arcs
};

// pupil sets (l+r) — normal + an alt for expression
const PUPILS = {
  normal: "1c2np91c2np91c2n",
};

async function norm(file) {
  return sharp(file).resize(C, C, { fit: "fill" }).png().toBuffer();
}
async function bbox(buf) {
  const { data } = await sharp(buf).ensureAlpha().raw().toBuffer({ resolveWithObject: true });
  let mnx = C, mny = C, mxx = -1, mxy = -1;
  for (let y = 0; y < C; y++) for (let x = 0; x < C; x++)
    if (data[(y * C + x) * 4 + 3] > 40) { if (x < mnx) mnx = x; if (x > mxx) mxx = x; if (y < mny) mny = y; if (y > mxy) mxy = y; }
  if (mxx < 0) return null;
  return { cx: +(((mnx + mxx) / 2) / C).toFixed(4), cy: +(((mny + mxy) / 2) / C).toFixed(4),
           x: +(mnx / C).toFixed(4), y: +(mny / C).toFixed(4), w: +((mxx - mnx + 1) / C).toFixed(4), h: +((mxy - mny + 1) / C).toFixed(4) };
}

async function emit(name, srcFile, meta) {
  if (!fs.existsSync(srcFile)) { console.warn("missing", srcFile); return; }
  const buf = await norm(srcFile);
  await sharp(buf).toFile(path.join(OUT, name + ".png"));
  meta[name] = await bbox(buf);
}

async function main() {
  fs.rmSync(OUT, { recursive: true, force: true });
  fs.mkdirSync(OUT, { recursive: true });
  const meta = {};

  for (const l of BASE_LAYERS) await emit(l, path.join(P(BASE), l + ".png"), meta);

  const mouths = {};
  for (const [name, [render, part]] of Object.entries(MOUTHS)) {
    const layer = "mouth_" + name;
    await emit(layer, path.join(P(render), part + ".png"), meta);
    if (meta[layer]) mouths[name] = layer;
  }

  const eyes = {};
  for (const [mood, render] of Object.entries(EYES)) {
    for (const side of ["l", "r"]) {
      const layer = `eye_${mood}_${side}`;
      await emit(layer, path.join(P(render), `eye_${side}.png`), meta);
    }
    eyes[mood] = { l: `eye_${mood}_l`, r: `eye_${mood}_r` };
  }

  const pupils = {};
  for (const [mood, render] of Object.entries(PUPILS)) {
    for (const side of ["l", "r"]) {
      const layer = `pupil_${mood}_${side}`;
      await emit(layer, path.join(P(render), `pupil_${side}.png`), meta);
    }
    pupils[mood] = { l: `pupil_${mood}_l`, r: `pupil_${mood}_r` };
  }

  // z-order back→front (mouth/eyes/pupils are swap slots)
  const order = [
    "body", "leg_l", "leg_r", "arm_l", "arm_r", "bow",
    "eyebrow_l", "eyebrow_r",
    "__eyes__", "__pupils__", "__mouth__",
  ];

  fs.writeFileSync(path.join(OUT, "rig.json"), JSON.stringify({
    canvas: C, order, base: BASE_LAYERS, meta,
    mouths, eyes, pupils,
    defaults: { mouth: "smile", eyes: "normal", pupils: "normal" },
  }, null, 1));

  console.log("✓ baked rig ->", path.relative(ROOT, OUT));
  console.log("  mouths:", Object.keys(mouths).join(", "));
  console.log("  eye moods:", Object.keys(eyes).join(", "));
}

main().catch((e) => { console.error(e); process.exit(1); });
