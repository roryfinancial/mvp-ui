import { test } from "node:test";
import assert from "node:assert/strict";
import { placeBox, shelfPack } from "./atlas.mjs";

test("placeBox converts pixel bbox to 0..1 fractions", () => {
  const p = placeBox({ x: 256, y: 512, w: 128, h: 256 }, 1024);
  assert.deepEqual(p, { x: 0.25, y: 0.5, w: 0.125, h: 0.25 });
});

test("shelfPack places items and reports atlas size", () => {
  const { width, height, placements } = shelfPack(
    [{ name: "a", w: 100, h: 50 }, { name: "b", w: 40, h: 80 }],
    { padding: 0, maxWidth: 2048 },
  );
  // sorted by height desc: b(80) then a(50), same shelf
  const b = placements.find((p) => p.name === "b");
  const a = placements.find((p) => p.name === "a");
  assert.deepEqual({ sx: b.sx, sy: b.sy, sw: b.sw, sh: b.sh }, { sx: 0, sy: 0, sw: 40, sh: 80 });
  assert.deepEqual({ sx: a.sx, sy: a.sy, sw: a.sw, sh: a.sh }, { sx: 40, sy: 0, sw: 100, sh: 50 });
  assert.equal(width, 140);
  assert.equal(height, 80);
});

test("shelfPack wraps to a new shelf past maxWidth", () => {
  const { height, placements } = shelfPack(
    [{ name: "a", w: 80, h: 30 }, { name: "b", w: 80, h: 30 }],
    { padding: 0, maxWidth: 100 },
  );
  const a = placements.find((p) => p.name === "a");
  const b = placements.find((p) => p.name === "b");
  assert.equal(a.sy, 0);
  assert.equal(b.sy, 30); // wrapped below
  assert.equal(height, 60);
});
