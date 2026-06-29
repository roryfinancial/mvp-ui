#!/usr/bin/env node
/**
 * strip-stray-white.mjs — remove trace background-catch white specks from parts
 * whose palette doesn't actually feature white (e.g. blue arms picking up a few
 * cyan-white pixels in finger gaps). Parts where white IS a feature (eyes, teeth,
 * pupils, puppy, the bow's warm highlights) are left untouched.
 *
 * Heuristic, per part:
 *   - count "neutral/cool white" pixels = bright + low-saturation + NOT warm-tinted
 *   - if that count is a trace fraction (< MAXPCT) of the opaque area, the white is
 *     noise → erase those pixels (alpha 0). Otherwise skip the whole part.
 * Warm highlights (R noticeably > B, like pink/gold) are never counted as strip-white.
 *
 *   node scripts/gifty/strip-stray-white.mjs --dry
 *   node scripts/gifty/strip-stray-white.mjs              # apply (backs up)
 *   flags: --maxpct=0.1   --src DIR
 */
import sharp from "sharp";
import fs from "node:fs";
import path from "node:path";
import process from "node:process";
import { fileURLToPath } from "node:url";

const __dirname = path.dirname(fileURLToPath(import.meta.url));
const ROOT = path.resolve(__dirname, "..", "..");
const args = process.argv.slice(2);
const flag = (n, d) => {
  const eq = args.find((x) => x.startsWith(`--${n}=`));
  if (eq) return eq.split("=").slice(1).join("=");
  const i = args.indexOf(`--${n}`);
  if (i >= 0 && args[i + 1] && !args[i + 1].startsWith("--")) return args[i + 1];
  return d;
};
const DRY = args.includes("--dry");
const SRC = path.resolve(flag("src", path.join(ROOT, "public/gifty/rig-final")));
const FEATUREPCT = parseFloat(flag("maxpct", "1.0")); // >1% white = a feature, skip whole part
const CLUSTER = parseInt(flag("cluster", "10"), 10);  // white blobs ≥ this = real highlight, spare
const MAXSTRAY = parseInt(flag("maxstray", "12"), 10); // only strip when total stray white ≤ this (trace)
const BACKUP = path.join(SRC, ".white-backup");
const SKIP = /^eyemask_/;

// A pixel is a background-catch "white" if it's bright and washed toward white —
// detected by an ELEVATED MIN-CHANNEL (mn>120) + decent brightness. A saturated
// feature color (deep blue arm, pink/gold bow) has a LOW min-channel, so it's safe.
// Warm-tinted highlights (R≫B) are always kept.
function isStripWhite(r, g, b) {
  const mx = Math.max(r, g, b), mn = Math.min(r, g, b);
  if (r - b > 14) return false;        // warm-tinted (pink/gold highlight) → keep
  if (mn >= 185 && mx - mn < 45) return true;       // pure-ish white core
  if (mn >= 120 && mx >= 210) return true;          // washed/cyan catch (mn lifted)
  return false;
}

async function stripFile(file) {
  const { data, info } = await sharp(path.join(SRC, file)).ensureAlpha().raw().toBuffer({ resolveWithObject: true });
  const { width: W, height: H } = info, N = W * H;
  let opaque = 0; let white = 0;
  const mark = new Uint8Array(N);
  for (let i = 0; i < N; i++) {
    if (data[i * 4 + 3] > 120) {
      opaque++;
      if (isStripWhite(data[i * 4], data[i * 4 + 1], data[i * 4 + 2])) { white++; mark[i] = 1; }
    }
  }
  const pct = opaque ? (100 * white) / opaque : 0;
  if (white === 0) return { file, white: 0, pct: 0, action: "clean" };
  // Skip parts where white is clearly a FEATURE (a lot of it): eyes/teeth/pupils/puppy.
  if (pct > FEATUREPCT) return { file, white, pct, action: "keep (feature white)" };

  // Otherwise white is sparse. Strip ONLY small isolated clusters (background
  // catches in concave corners); spare longer runs (legit edge highlights).
  // Re-label the marked pixels into components and unmark any component ≥ CLUSTER.
  const clab = new Int32Array(N); const csize = [0]; let cn = 1; const st = [];
  for (let i = 0; i < N; i++) {
    if (mark[i] && !clab[i]) {
      clab[i] = cn; let s = 0; st.push(i);
      while (st.length) {
        const p = st.pop(); s++;
        const x = p % W, y = (p / W) | 0;
        for (const q of [x > 0 ? p - 1 : -1, x < W - 1 ? p + 1 : -1, y > 0 ? p - W : -1, y < H - 1 ? p + W : -1])
          if (q >= 0 && mark[q] && !clab[q]) { clab[q] = cn; st.push(q); }
      }
      csize.push(s); cn++;
    }
  }
  // Spare components ≥ CLUSTER (real highlights). Of what remains, only act when the
  // TOTAL surviving stray white is genuinely trace (≤ MAXSTRAY px) — that's the
  // "0.001%, something's clearly wrong" case. Anything more is likely real shading.
  let stripped = 0;
  for (let i = 0; i < N; i++) {
    if (mark[i] && csize[clab[i]] >= CLUSTER) mark[i] = 0;
    else if (mark[i]) stripped++;
  }
  if (stripped === 0) return { file, white: 0, pct, action: "keep (highlights only)" };
  if (stripped > MAXSTRAY) {
    for (let i = 0; i < N; i++) mark[i] = 0;   // too much to be confident noise — leave it
    return { file, white: stripped, pct, action: `keep (>${MAXSTRAY}px, not confident noise)` };
  }
  white = stripped;

  // strip the marked white pixels + their light anti-alias halo. The halo isn't pure
  // white (it's a bright bluish-white blend), so we clear any RADIUS-2 neighbor that
  // is clearly LIGHTER than the part's median opaque luma — i.e. a background-catch
  // bleed — while leaving the normal mid-tone arm fill intact.
  if (!DRY) {
    // median-ish luma of the opaque fill (sample), as a brightness reference
    let sum = 0, cnt = 0;
    for (let i = 0; i < N; i += 7) if (data[i * 4 + 3] > 200) { sum += (data[i * 4] + data[i * 4 + 1] + data[i * 4 + 2]) / 3; cnt++; }
    const fillLuma = cnt ? sum / cnt : 128;
    const lightCut = fillLuma + 55;   // a halo pixel is meaningfully brighter than fill
    const R = 2;
    for (let y = 0; y < H; y++) for (let x = 0; x < W; x++) {
      const i = y * W + x;
      if (!mark[i]) continue;
      for (let dy = -R; dy <= R; dy++) for (let dx = -R; dx <= R; dx++) {
        const xx = x + dx, yy = y + dy;
        if (xx < 0 || yy < 0 || xx >= W || yy >= H) continue;
        const j = yy * W + xx, a = data[j * 4 + 3];
        if (a === 0) continue;
        const lum = (data[j * 4] + data[j * 4 + 1] + data[j * 4 + 2]) / 3;
        const mx = Math.max(data[j * 4], data[j * 4 + 1], data[j * 4 + 2]);
        const mn = Math.min(data[j * 4], data[j * 4 + 1], data[j * 4 + 2]);
        const warm = data[j * 4] - data[j * 4 + 2] > 14;
        // clear bright low/mid-sat bleed pixels around the catch; keep warm + normal fill
        if (!warm && lum > lightCut && mx - mn < 70) data[j * 4 + 3] = 0;
      }
      data[i * 4 + 3] = 0;
    }
    fs.mkdirSync(BACKUP, { recursive: true });
    if (!fs.existsSync(path.join(BACKUP, file))) fs.copyFileSync(path.join(SRC, file), path.join(BACKUP, file));
    await sharp(Buffer.from(data), { raw: { width: W, height: H, channels: 4 } }).png().toFile(path.join(SRC, file));
  }
  return { file, white, pct, action: DRY ? "would strip" : "stripped" };
}

const files = fs.readdirSync(SRC).filter((f) => f.endsWith(".png") && !SKIP.test(f));
const rows = [];
for (const f of files) rows.push(await stripFile(f));
rows.filter((r) => r.white > 0).sort((a, b) => a.pct - b.pct).forEach((r) =>
  console.log(`${r.file.padEnd(26)} white ${String(r.white).padStart(5)}  ${r.pct.toFixed(3)}%  → ${r.action}`));
console.log(DRY ? "\n(dry run)" : "\napplied; originals in .white-backup/");
