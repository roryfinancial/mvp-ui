#!/usr/bin/env node
/**
 * clean-parts.mjs — aggressive (but highlight-safe) cleanup for rig-layer PNGs.
 *
 * Per layer (skipping eyemask_*):
 *   1) speck removal   — drop disconnected alpha islands < threshold of the main blob
 *   2) de-fringe       — fade near-white semi-transparent OUTER-edge pixels (white halo)
 *   3) edge tighten    — harden the soft alpha ramp at the very edge (kills mushy fuzz)
 * Interior highlights/catchlights are preserved (only edge-adjacent pixels are touched).
 *
 *   node scripts/gifty/clean-parts.mjs --dry           # report only
 *   node scripts/gifty/clean-parts.mjs                 # apply (backs up first)
 *   node scripts/gifty/clean-parts.mjs --src DIR --out DIR
 *   flags: --speck=0.005 --fringe --tighten --gamma=1.6
 */
import sharp from "sharp";
import fs from "node:fs";
import path from "node:path";
import { fileURLToPath } from "node:url";

const __dirname = path.dirname(fileURLToPath(import.meta.url));
const ROOT = path.resolve(__dirname, "..", "..");
const args = process.argv.slice(2);
const flag = (n, d) => {
  // supports both --name=value and --name value
  const eq = args.find((x) => x.startsWith(`--${n}=`));
  if (eq) return eq.split("=").slice(1).join("=");
  const idx = args.indexOf(`--${n}`);
  if (idx >= 0 && args[idx + 1] && !args[idx + 1].startsWith("--")) return args[idx + 1];
  return d;
};
const has = (n) => args.includes(`--${n}`);

const SRC = path.resolve(flag("src", path.join(ROOT, "public/gifty/rig-layers")));
const OUT = path.resolve(flag("out", SRC));
const DRY = has("dry");
const SPECK = parseFloat(flag("speck", "0.005"));
const DO_FRINGE = has("fringe") || (!has("tighten") && !has("fringe"));   // default on
const DO_TIGHTEN = has("tighten") || (!has("tighten") && !has("fringe")); // default on
const GAMMA = parseFloat(flag("gamma", "1.5"));
const SKIP = /^eyemask_/;
const BACKUP = path.join(SRC, ".clean-backup");

function labelComponents(alpha, W, H, thr) {
  const labels = new Int32Array(W * H);
  const sizes = [0]; const stack = []; let next = 1;
  for (let i = 0; i < W * H; i++) {
    if (alpha[i] > thr && labels[i] === 0) {
      labels[i] = next; let size = 0; stack.push(i);
      while (stack.length) {
        const p = stack.pop(); size++;
        const x = p % W, y = (p / W) | 0;
        if (x > 0 && alpha[p - 1] > thr && !labels[p - 1]) { labels[p - 1] = next; stack.push(p - 1); }
        if (x < W - 1 && alpha[p + 1] > thr && !labels[p + 1]) { labels[p + 1] = next; stack.push(p + 1); }
        if (y > 0 && alpha[p - W] > thr && !labels[p - W]) { labels[p - W] = next; stack.push(p - W); }
        if (y < H - 1 && alpha[p + W] > thr && !labels[p + W]) { labels[p + W] = next; stack.push(p + W); }
      }
      sizes.push(size); next++;
    }
  }
  return { labels, sizes };
}

async function clean(file) {
  const { data, info } = await sharp(path.join(SRC, file)).ensureAlpha().raw().toBuffer({ resolveWithObject: true });
  const { width: W, height: H } = info, N = W * H;
  const alpha = new Uint8Array(N);
  for (let i = 0; i < N; i++) alpha[i] = data[i * 4 + 3];
  const stats = { file, speck: 0, fringe: 0, tighten: 0 };

  // 1) speck removal
  const { labels, sizes } = labelComponents(alpha, W, H, 30);
  let big = 0; for (let i = 1; i < sizes.length; i++) big = Math.max(big, sizes[i]);
  const minKeep = Math.max(8, big * SPECK);
  for (let i = 0; i < N; i++) {
    if (labels[i] > 0 && sizes[labels[i]] < minKeep) { data[i * 4 + 3] = 0; alpha[i] = 0; stats.speck++; }
  }

  // helper: is pixel on the true outer edge (borders transparent)
  const outerEdge = (x, y, i) => {
    const l = x > 0 ? alpha[i - 1] : 0, r = x < W - 1 ? alpha[i + 1] : 0;
    const u = y > 0 ? alpha[i - W] : 0, d = y < H - 1 ? alpha[i + W] : 0;
    return Math.min(l, r, u, d) <= 20;
  };

  for (let y = 0; y < H; y++) {
    for (let x = 0; x < W; x++) {
      const i = y * W + x, a = alpha[i];
      if (a === 0 || a >= 250) continue;
      const edge = outerEdge(x, y, i);
      // 2) de-fringe near-white outer halo
      if (DO_FRINGE && a > 10 && a < 235 && edge) {
        const rr = data[i * 4], gg = data[i * 4 + 1], bb = data[i * 4 + 2];
        const mn = Math.min(rr, gg, bb), mx = Math.max(rr, gg, bb);
        if (mn > 195 && mx - mn < 50) { data[i * 4 + 3] = Math.round(a * 0.2); stats.fringe++; continue; }
      }
      // 3) edge tighten — gamma the soft alpha ramp at the edge so fuzz hardens
      if (DO_TIGHTEN && edge && a < 250) {
        const na = Math.round(255 * Math.pow(a / 255, GAMMA));
        if (na !== a) { data[i * 4 + 3] = na; stats.tighten++; }
      }
    }
  }

  if (!DRY && (stats.speck || stats.fringe || stats.tighten)) {
    fs.mkdirSync(BACKUP, { recursive: true });
    if (!fs.existsSync(path.join(BACKUP, file))) fs.copyFileSync(path.join(SRC, file), path.join(BACKUP, file));
    fs.mkdirSync(OUT, { recursive: true });
    await sharp(Buffer.from(data), { raw: { width: W, height: H, channels: 4 } }).png().toFile(path.join(OUT, file));
  }
  return stats;
}

const files = fs.readdirSync(SRC).filter((f) => f.endsWith(".png") && !SKIP.test(f));
const rows = [];
for (const f of files) rows.push(await clean(f));
rows.filter((r) => r.speck || r.fringe || r.tighten)
  .sort((a, b) => (b.speck + b.fringe + b.tighten) - (a.speck + a.fringe + a.tighten))
  .forEach((r) => console.log(`${r.file.padEnd(26)} speck ${String(r.speck).padStart(4)}  fringe ${String(r.fringe).padStart(5)}  tighten ${String(r.tighten).padStart(5)}`));
console.log(DRY ? "\n(dry run)" : `\napplied to ${OUT}; originals in .clean-backup/`);
