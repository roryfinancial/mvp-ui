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
