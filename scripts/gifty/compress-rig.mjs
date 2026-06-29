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
  const layersDir = path.join(root, "public/gifty/rig-final");
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
