#!/usr/bin/env node
/**
 * build-catalog.mjs — render a labeled catalog of every Gifty expression primitive
 * (eyes, mouths excluding talk visemes, eyebrows, arms, legs) and emit:
 *   - public/gifty/catalog/<group>_<name>.png   contact-sheet images (in context)
 *   - public/gifty/catalog/catalog.json          machine manifest (for the tester)
 *   - public/gifty/catalog/catalog.html          plain HTML w/ filesystem image paths
 *
 * Labels describe WHAT each primitive depicts (not a mood) — the AI composes moods.
 *   node scripts/gifty/build-catalog.mjs
 */
import sharp from "sharp";
import fs from "node:fs";
import path from "node:path";
import { fileURLToPath } from "node:url";

const __dirname = path.dirname(fileURLToPath(import.meta.url));
const ROOT = path.resolve(__dirname, "..", "..");
const DIR = path.join(ROOT, "public/gifty/rig-layers");
const OUT = path.join(ROOT, "public/gifty/catalog");
const j = JSON.parse(fs.readFileSync(path.join(DIR, "rig.json"), "utf8"));
const C = 1024;
const L = (p) => path.join(DIR, `${p}.png`);

fs.mkdirSync(OUT, { recursive: true });

async function compose(layers, file, crop) {
  const comps = layers.filter(Boolean).map((n) => ({ input: L(n) }));
  let buf = await sharp({ create: { width: C, height: C, channels: 4, background: { r: 47, g: 107, b: 245, alpha: 1 } } })
    .composite(comps).png().toBuffer();
  if (crop) buf = await sharp(buf).extract(crop).png().toBuffer();
  await sharp(buf).resize({ width: 300 }).png().toFile(path.join(OUT, file));
}
const faceCrop = { left: 380, top: 240, width: 480, height: 380 };
const fullCrop = { left: 0, top: 120, width: 1024, height: 900 };

// ── Labels: what each primitive DEPICTS (action/appearance), not a mood. ──────
const EYE_LABELS = {
  normal: "Wide open round eyes, neutral forward gaze.",
  smug: "Closed upward-arc eyes (squint / smiling-shut); pupils hidden.",
  happy: "Half-lidded eyes — upper lid lowered (heavy-lidded / relaxed / sly).",
  puppy: "Big watery bashful eyes with tear-pools (standalone, replaces all eye parts).",
};
const MOUTH_LABELS = {
  smile: "Gentle closed upward curve (soft smile).",
  shy: "Small restrained closed curve (timid).",
  proud: "Big open toothy grin (broad).",
  hmm: "Small wavy/uncertain squiggle (unsure / thinking).",
};
// Brow POSITIONS are render-time transforms of the single brow art (dy raise/lower,
// rot inner-end angle). Mirror of BROW_POS in RigGifty.tsx — keep in sync.
const BROW_POS = {
  neutral:   { dy: 0,      rot: 0 },
  raised:    { dy: -0.030, rot: 0 },
  lowered:   { dy: 0.022,  rot: 0 },
  angry:     { dy: 0.010,  rot: 12 },
  worried:   { dy: -0.006, rot: -12 },
  skeptical: { dy: -0.018, rot: 0, skewOne: true },
};
const BROW_LABELS = {
  neutral: "Resting brow pair (the baked default).",
  raised: "Both brows lifted high — surprise / attention.",
  lowered: "Both brows pushed down — focus / serious.",
  angry: "Inner ends angled DOWN — anger / determination.",
  worried: "Inner ends lifted UP — worry / sad / pleading.",
  skeptical: "One brow raised, other low — doubt / smirk (asymmetric).",
};
// arm label: { do: hand action, rel: body relation / z + clipping notes }
const ARMR_LABELS = {
  thumbsup: { do: "Thumbs-up, hand at side.", rel: "Root at right side; tucks BEHIND body." },
  wave: { do: "Raised open hand waving.", rel: "Raised at right; tucks BEHIND body (animated by `wave`)." },
  fist: { do: "Raised fist.", rel: "Root at right side; tucks BEHIND body." },
  salute: { do: "Hand to brow (salute).", rel: "Reaches toward head; FRONT — see head-clip note." },
  down: { do: "Arm hanging straight down.", rel: "At right side; FRONT, nudged out so the hand clears the body." },
  sad: { do: "Limp arm, hand drooping.", rel: "At right side; FRONT, slight nudge so the hand peeks at the edge." },
  open: { do: "Open palm presented outward.", rel: "Extends out/up at right; tucks BEHIND body." },
  present: { do: "Hand holding/offering an item.", rel: "Fully outside body (z-order irrelevant)." },
  calm: { do: "Relaxed arm at side.", rel: "At right side; FRONT, slight nudge so the hand peeks at the edge." },
};
const ARML_LABELS = {
  thumbsup: { do: "Thumbs-up, hand at side.", rel: "Crosses toward body; tucks BEHIND." },
  down: { do: "Arm hanging straight down.", rel: "At left side; FRONT (across-body)." },
  wave: { do: "Raised open hand waving.", rel: "Raised at left; FRONT (art includes cross-body part)." },
  hip: { do: "Hand on hip (akimbo).", rel: "Bent to hip; tucks BEHIND." },
  salute: { do: "Hand up to head — scratching head / bashful (key still 'salute').", rel: "Whole arm IN FRONT of the body (hand reaches the head)." },
  sad: { do: "Limp arm, hand drooping.", rel: "Across body; FRONT." },
  open: { do: "Open palm presented outward.", rel: "Extends out/up at left; tucks BEHIND." },
  hold: { do: "Both-hands holding/cradling across front.", rel: "Crosses the whole front; FRONT (on purpose)." },
  calm: { do: "Relaxed arm at side.", rel: "At left side; FRONT." },
};
const LEG_LABELS = {
  stand: "Both legs straight, standing.",
  walk: "Mid-stride walking pose.",
  sit: "Legs folded/seated.",
};

const manifest = { eyes: [], mouths: [], brows: [], armR: [], armL: [], legs: [], puppy: null };

async function run() {
  // EYES
  for (const [k, v] of Object.entries(j.eyes)) {
    const pup = j.pupils[k] || j.pupils.normal;
    const file = `eye_${k}.png`;
    await compose(["body", "bow", "eyebrow_l", "eyebrow_r", v.l, v.r, pup.l, pup.r], file, faceCrop);
    manifest.eyes.push({ key: k, file, label: EYE_LABELS[k] || "" });
  }
  // PUPPY (standalone eye replacement)
  await compose(["body", "bow", j.puppy], "eye_puppy.png", faceCrop);
  manifest.puppy = { key: "puppy", file: "eye_puppy.png", label: EYE_LABELS.puppy };

  // MOUTHS (exclude talk_*)
  for (const m of Object.keys(j.mouths).filter((m) => !m.startsWith("talk_"))) {
    const file = `mouth_${m}.png`;
    await compose(["body", "bow", "eyebrow_l", "eyebrow_r", j.eyes.normal.l, j.eyes.normal.r,
      j.pupils.normal.l, j.pupils.normal.r, j.mouths[m]], file, faceCrop);
    manifest.mouths.push({ key: m, file, label: MOUTH_LABELS[m] || "" });
  }

  // BROWS — render each position by transforming the brow art (dy raise/lower + rot)
  for (const [k, bp] of Object.entries(BROW_POS)) {
    const file = `brow_${k}.png`;
    const base = ["body", "bow", j.eyes.normal.l, j.eyes.normal.r, j.pupils.normal.l, j.pupils.normal.r];
    const browImgs = [];
    for (const side of ["l", "r"]) {
      const name = `eyebrow_${side}`;
      const m = j.meta[name];
      const isL = side === "l";
      const rot = bp.rot * (isL ? -1 : 1);
      const dy = bp.dy + (bp.skewOne && !isL ? 0.026 : 0);
      // rotate the brow about its OUTER end, then shift by dy — matches RigGifty pivot
      const px = Math.round(m.cx * C);
      const py = Math.round(m.cy * C);
      // crop the brow to its bbox first (rotating the full 1024² canvas overflows)
      const bw = Math.round(m.w * C), bh = Math.round(m.h * C);
      const bx = Math.round(m.x * C), by = Math.round(m.y * C);
      const cropped = await sharp(L(name)).extract({ left: bx, top: by, width: bw, height: bh }).png().toBuffer();
      const buf = await sharp(cropped).rotate(rot, { background: { r: 0, g: 0, b: 0, alpha: 0 } }).png().toBuffer();
      const rm = await sharp(buf).metadata();
      const left = px - Math.round(rm.width / 2);
      const top = py - Math.round(rm.height / 2) + Math.round(dy * C);
      browImgs.push({ input: buf, left, top });
    }
    let canvas = sharp({ create: { width: C, height: C, channels: 4, background: { r: 47, g: 107, b: 245, alpha: 1 } } })
      .composite([...base.map((n) => ({ input: L(n) })), ...browImgs]);
    let buf = await canvas.png().toBuffer();
    buf = await sharp(buf).extract(faceCrop).png().toBuffer();
    await sharp(buf).resize({ width: 300 }).png().toFile(path.join(OUT, file));
    manifest.brows.push({ key: k, file, label: BROW_LABELS[k] });
  }

  // ARMS R / L
  for (const [k, v] of Object.entries(j.armR)) {
    const file = `armR_${k}.png`;
    await compose(["body", "bow", j.legs.stand.l, j.legs.stand.r, v, j.eyes.normal.l, j.eyes.normal.r,
      j.pupils.normal.l, j.pupils.normal.r, j.mouths.smile], file, fullCrop);
    manifest.armR.push({ key: k, file, ...ARMR_LABELS[k] });
  }
  for (const [k, v] of Object.entries(j.armL)) {
    const file = `armL_${k}.png`;
    await compose(["body", "bow", j.legs.stand.l, j.legs.stand.r, v, j.eyes.normal.l, j.eyes.normal.r,
      j.pupils.normal.l, j.pupils.normal.r, j.mouths.smile], file, fullCrop);
    manifest.armL.push({ key: k, file, ...ARML_LABELS[k] });
  }
  // LEGS
  for (const [k, v] of Object.entries(j.legs)) {
    const file = `legs_${k}.png`;
    await compose(["body", "bow", v.l, v.r, j.eyes.normal.l, j.eyes.normal.r,
      j.pupils.normal.l, j.pupils.normal.r, j.mouths.smile], file, fullCrop);
    manifest.legs.push({ key: k, file, label: LEG_LABELS[k] || "" });
  }

  fs.writeFileSync(path.join(OUT, "catalog.json"), JSON.stringify(manifest, null, 1));
  writeHtml(manifest);
  console.log("catalog: %d images + catalog.json + catalog.html", fs.readdirSync(OUT).filter((f) => f.endsWith(".png")).length);
}

function card(item, kind) {
  // filesystem absolute path so an AI/file viewer can perceive it without a web host
  const abs = path.join(OUT, item.file);
  const desc = kind === "arm"
    ? `<b>${item.do || ""}</b><br><i>${item.rel || ""}</i>`
    : (item.label || "");
  return `<figure>
    <img src="file://${abs}" alt="${item.key}">
    <figcaption><code>${item.key}</code><br>${desc}</figcaption>
  </figure>`;
}
function section(title, items, kind) {
  return `<section><h2>${title}</h2><div class="grid">${items.map((i) => card(i, kind)).join("")}</div></section>`;
}
function writeHtml(m) {
  const html = `<!doctype html><html><head><meta charset="utf-8">
<title>Gifty Expression Primitive Catalog</title>
<style>
  body{font:14px/1.5 system-ui,sans-serif;background:#0d1b3a;color:#eef;margin:0;padding:24px}
  h1{margin:0 0 4px} p.note{opacity:.7;margin:0 0 20px}
  h2{margin:28px 0 10px;border-bottom:1px solid #2a3a6a;padding-bottom:6px}
  .grid{display:flex;flex-wrap:wrap;gap:14px}
  figure{margin:0;width:200px;background:#14224a;border-radius:10px;padding:8px}
  figure img{width:100%;border-radius:6px;display:block;background:#1b2f63}
  figcaption{margin-top:6px;font-size:12px}
  code{background:#22305c;padding:1px 5px;border-radius:4px;color:#9fd}
</style></head><body>
<h1>Gifty Expression Primitive Catalog</h1>
<p class="note">Each primitive labeled by WHAT IT DEPICTS (not a mood). The AI character composes moods from these. Images are filesystem paths for realtime perception. Regenerate: <code>node scripts/gifty/build-catalog.mjs</code></p>
${section("Eyes", m.eyes, "eye")}
${section("Eyes — standalone", [m.puppy], "eye")}
${section("Mouths (talk visemes excluded)", m.mouths, "mouth")}
${section("Eyebrows", m.brows, "brow")}
${section("Arms — Right", m.armR, "arm")}
${section("Arms — Left", m.armL, "arm")}
${section("Legs", m.legs, "leg")}
</body></html>`;
  fs.writeFileSync(path.join(OUT, "catalog.html"), html);
}

run().catch((e) => { console.error(e); process.exit(1); });
