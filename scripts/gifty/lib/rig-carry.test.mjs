import { test } from "node:test";
import assert from "node:assert/strict";
import { carryRigData } from "./rig-carry.mjs";

test("carryRigData copies behavioral fields and drops meta/canvas", () => {
  const rig = {
    canvas: 1024,
    meta: { body: { cx: 0.5 } },
    order: ["body", "__mouth__"],
    defaults: { mouth: "smile" },
    pupilRest: { normal: { l: { x: 0.5, y: 0.4 } } },
    lidRest: { l: 0.001613, r: 0 },
    faceBlue: "#2F6BF5",
  };
  const out = carryRigData(rig);
  assert.equal("meta" in out, false);
  assert.equal("canvas" in out, false);
  assert.deepEqual(out.order, ["body", "__mouth__"]);
  assert.deepEqual(out.lidRest, { l: 0.001613, r: 0 });
  assert.equal(out.faceBlue, "#2F6BF5");
});

test("carryRigData omits missing keys (no undefined values)", () => {
  const out = carryRigData({ order: [] });
  for (const v of Object.values(out)) assert.notEqual(v, undefined);
  assert.equal("puppy" in out, false);
});
