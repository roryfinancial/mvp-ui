#!/usr/bin/env node
/**
 * despeckle.mjs — careful artifact cleanup for the rig-layer PNGs.
 * Removes (a) tiny disconnected alpha islands (specks) and (b) thin near-white
 * semi-transparent edge halos (anti-alias fringe). Skips pure-mask layers and
 * preserves interior highlights/catchlights.
 *
 *   node scripts/gifty/despeckle.mjs --dry   # report only, write nothing
 *   node scripts/gifty/despeckle.mjs         # apply (backs up to .despeckle-backup/)
 */
import sharp from "sharp";
import fs from "node:fs";
import path from "node:path";
import { fileURLToPath } from "node:url";

const __dirname = path.dirname(fileURLToPath(import.meta.url));
const ROOT = path.resolve(__dirname, "..", "..");
const DIR = path.join(ROOT, "public/gifty/rig-layers");
const BACKUP = path.join(DIR, ".despeckle-backup");
const DRY = process.argv.includes("--dry");

// layers that are intentionally white masks — never touch
const SKIP = /^eyemask_/;

function labelComponents(alpha, W, H, thr) {
  // 4-connected CC labeling via flood fill; returns {labels, sizes}
  const labels = new Int32Array(W * H).fill(0);
  const sizes = [0];
  const stack = [];
  let next = 1;
  for (let i = 0; i < W * H; i++) {
    if (alpha[i] > thr && labels[i] === 0) {
      labels[i] = next; let size = 0; stack.push(i);
      while (stack.length) {
        const p = stack.pop(); size++;
        const x = p % W, y = (p / W) | 0;
        const nb = [];
        if (x > 0) nb.push(p - 1);
        if (x < W - 1) nb.push(p + 1);
        if (y > 0) nb.push(p - W);
        if (y < H - 1) nb.push(p + W);
        for (const q of nb) if (alpha[q] > thr && labels[q] === 0) { labels[q] = next; stack.push(q); }
      }
      sizes.push(size); next++;
    }
  }
  return { labels, sizes };
}

async function clean(file) {
  const { data, info } = await sharp(path.join(DIR, file)).ensureAlpha().raw().toBuffer({ resolveWithObject: true });
  const { width: W, height: H } = info;
  const N = W * H;
  const alpha = new Uint8Array(N);
  for (let i = 0; i < N; i++) alpha[i] = data[i * 4 + 3];

  // ── (a) speck removal: drop alpha islands smaller than 0.5% of the largest ──
  const { labels, sizes } = labelComponents(alpha, W, H, 30);
  let big = 0; for (let i = 1; i < sizes.length; i++) big = Math.max(big, sizes[i]);
  const minKeep = Math.max(8, big * 0.005);   // keep blobs ≥ 0.5% of main (or ≥8px)
  let speckPx = 0;
  for (let i = 0; i < N; i++) {
    const l = labels[i];
    if (l > 0 && sizes[l] < minKeep) { if (!DRY) data[i * 4 + 3] = 0; speckPx++; }
  }

  // ── (b) edge de-fringe: thin near-white semi-transparent rim → fade out ──
  // only the OUTER 1px alpha edge that is bright + low-saturation (a white halo),
  // never interior pixels (so catchlights/highlights survive).
  let fringePx = 0;
  for (let y = 0; y < H; y++) {
    for (let x = 0; x < W; x++) {
      const i = y * W + x, a = data[i * 4 + 3];
      if (a <= 10 || a >= 235) continue;          // only soft edge pixels
      // must border a transparent pixel (true outer edge)
      const left = x > 0 ? data[(i - 1) * 4 + 3] : 0;
      const right = x < W - 1 ? data[(i + 1) * 4 + 3] : 0;
      const up = y > 0 ? data[(i - W) * 4 + 3] : 0;
      const dn = y < H - 1 ? data[(i + W) * 4 + 3] : 0;
      if (Math.min(left, right, up, dn) > 20) continue;  // interior soft pixel — keep
      const r = data[i * 4], g = data[i * 4 + 1], b = data[i * 4 + 2];
      const mn = Math.min(r, g, b), mx = Math.max(r, g, b);
      if (mn > 200 && mx - mn < 45) {             // near-white halo
        if (!DRY) data[i * 4 + 3] = Math.round(a * 0.25);
        fringePx++;
      }
    }
  }

  if (!DRY && (speckPx > 0 || fringePx > 0)) {
    fs.mkdirSync(BACKUP, { recursive: true });
    if (!fs.existsSync(path.join(BACKUP, file))) fs.copyFileSync(path.join(DIR, file), path.join(BACKUP, file));
    await sharp(Buffer.from(data), { raw: { width: W, height: H, channels: 4 } }).png().toFile(path.join(DIR, file));
  }
  return { file, speckPx, fringePx };
}

const files = fs.readdirSync(DIR).filter((f) => f.endsWith(".png") && !SKIP.test(f));
const report = [];
for (const f of files) report.push(await clean(f));
report.filter((r) => r.speckPx || r.fringePx).sort((a, b) => (b.speckPx + b.fringePx) - (a.speckPx + a.fringePx))
  .forEach((r) => console.log(`${r.file.padEnd(26)} specks-removed ${String(r.speckPx).padStart(4)}  fringe-faded ${String(r.fringePx).padStart(5)}`));
console.log(DRY ? "\n(dry run — nothing written)" : "\napplied; originals backed up in .despeckle-backup/");
