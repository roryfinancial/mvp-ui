// Verify the web eyelid fix by replicating RigGifty's web composite with sharp.
// Renders the GiftyDemo default stack (mood normal, armR/armL thumbsup-ish defaults,
// legs stand) at size~680, and crucially APPLIES the eye-white mask to the
// eyelid+lashline IN FULL-CANVAS SPACE (the same mapping webMaskStyle/
// fullCanvasSpriteStyle use) before compositing. The eye-white alpha must clip the
// lid so it appears only as a thin domed cap over the eye — no blue bar at top.
import sharp from "sharp";
import fs from "node:fs";

const SIZE = 680;
const OUT = "/private/tmp/claude-501/-Users-aap-Projects-Rory-mvp-ui/c06f73dc-568c-43e4-88b6-9f986117ca31/scratchpad/eyelid-fix.png";

const rig = JSON.parse(fs.readFileSync("public/gifty/rig-web/rig-512.json", "utf8"));
const atlasBuf = fs.readFileSync("public/gifty/rig-web/rig-512.png");
const atlasMeta = await sharp(atlasBuf).metadata();
const atlas = { w: atlasMeta.width, h: atlasMeta.height };

// Extract one atlas cell and return a {buffer,width,height} placed at its place box
// within a SIZE×SIZE canvas. left/top = where the cell's top-left lands (px).
async function placeBox(layerName) {
  const L = rig.layers[layerName];
  const c = L.cell;
  const divW = Math.round(L.place.w * SIZE);
  const divH = Math.round(L.place.h * SIZE);
  const cell = await sharp(atlasBuf)
    .extract({ left: c.sx, top: c.sy, width: c.sw, height: c.sh })
    .resize(divW, divH)
    .png().toBuffer();
  return { buffer: cell, width: divW, height: divH,
           left: Math.round(L.place.x * SIZE), top: Math.round(L.place.y * SIZE) };
}

// Full-canvas placement: composite the placed cell onto a SIZE×SIZE transparent
// canvas at its place coords. translateY adds a vertical px offset (the lid drop).
async function fullCanvas(layerName, translateY = 0) {
  const p = await placeBox(layerName);
  return sharp({ create: { width: SIZE, height: SIZE, channels: 4, background: { r: 0, g: 0, b: 0, alpha: 0 } } })
    .composite([{ input: p.buffer, left: p.left, top: p.top + Math.round(translateY) }])
    .png().toBuffer();
}

// Apply mask (eye-white alpha, full-canvas) to a full-canvas layer: keep only the
// pixels where the mask is opaque. This is what the CSS mask does in the browser.
async function applyMask(layerCanvasBuf, maskLayerName) {
  const maskCanvas = await fullCanvas(maskLayerName, 0); // full-canvas mask, static
  // use mask's alpha channel as the alpha of the layer
  const maskAlpha = await sharp(maskCanvas).extractChannel(3).toBuffer();
  const { data, info } = await sharp(layerCanvasBuf).ensureAlpha().raw().toBuffer({ resolveWithObject: true });
  const maskData = await sharp(maskAlpha).raw().toBuffer();
  for (let i = 0; i < info.width * info.height; i++) {
    const m = maskData[i] / 255;
    data[i * 4 + 3] = Math.round(data[i * 4 + 3] * m);
  }
  return sharp(data, { raw: { width: info.width, height: info.height, channels: 4 } }).png().toBuffer();
}

// Build the stack honoring rig.order, swapping defaults like RigGifty does.
async function render(drop) {
  const layers = [];
  const D = rig.defaults;
  for (const slot of rig.order) {
    if (slot === "__legs__") { const l = rig.legs[D.legs]; layers.push(l.l, l.r); }
    else if (slot === "__armL__") layers.push(rig.armL[D.armL]);
    else if (slot === "__armR__") layers.push(rig.armR[D.armR]);
    else if (slot === "__eyes__") { const e = rig.eyes[D.eyes]; layers.push(e.l, e.r); }
    else if (slot === "__pupils__") { const p = rig.pupils[D.pupils]; layers.push(p.l, p.r); }
    else if (slot === "__eyelid__") layers.push("__LID__");
    else if (slot === "__puppy__") {}
    else if (slot === "__mouth__") layers.push(rig.mouths[D.mouth]);
    else layers.push(slot);
  }

  const comps = [];
  for (const name of layers) {
    if (name === "__LID__") {
      // eyelid + lashline per side, masked by eye-white in full-canvas space, then eyerim on top
      for (const side of ["l", "r"]) {
        const restNudge = (rig.lidRest?.[side] ?? 0) * SIZE;
        const d = restNudge + drop;
        const lidFC = await fullCanvas(rig.eyelid[side], d);
        const maskLayer = (rig.eyeMask?.normal?.[side]) || rig.eyes.normal[side];
        comps.push({ input: await applyMask(lidFC, maskLayer), left: 0, top: 0 });
        if (rig.lashline?.[side]) {
          const lashFC = await fullCanvas(rig.lashline[side], d);
          comps.push({ input: await applyMask(lashFC, maskLayer), left: 0, top: 0 });
        }
      }
      for (const side of ["l", "r"]) {
        const p = await placeBox(rig.eyerim[side]);
        comps.push({ input: p.buffer, left: p.left, top: p.top });
      }
    } else if (rig.layers[name]) {
      const p = await placeBox(name);
      comps.push({ input: p.buffer, left: p.left, top: p.top });
    }
  }
  return sharp({ create: { width: SIZE, height: SIZE, channels: 4, background: { r: 255, g: 255, b: 255, alpha: 1 } } })
    .composite(comps).png().toBuffer();
}

// Two states side by side: rest (drop=0, eyes open) and full close (drop=LID_CLOSE)
const LID_CLOSE = 0.14 * SIZE;
const rest = await render(0);
const closed = await render(LID_CLOSE);

const labelH = 0;
const combined = await sharp({ create: { width: SIZE * 2 + 20, height: SIZE, channels: 4, background: { r: 240, g: 240, b: 240, alpha: 1 } } })
  .composite([{ input: rest, left: 0, top: 0 }, { input: closed, left: SIZE + 20, top: 0 }])
  .png().toBuffer();

await sharp(combined).toFile(OUT);
console.log("wrote", OUT);

// Sanity check: count blue-ish pixels in the TOP 20% of the rest frame (where the
// bug bar appeared). lidBlue from rig:
console.log("lidBlue", rig.lidBlue, "faceBlue", rig.faceBlue);
const { data, info } = await sharp(rest).raw().toBuffer({ resolveWithObject: true });
let topBlue = 0;
const topRows = Math.round(SIZE * 0.18);
for (let y = 0; y < topRows; y++) {
  for (let x = 0; x < SIZE; x++) {
    const i = (y * SIZE + x) * 4;
    const r = data[i], g = data[i + 1], b = data[i + 2];
    // blue-bar-ish: clearly blue, not white background
    if (b > 120 && b > r + 30 && b > g + 20) topBlue++;
  }
}
console.log(`blue-ish pixels in top 18% of REST frame: ${topBlue} (was ~thousands when bug present)`);
