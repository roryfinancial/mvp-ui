import { test } from "node:test";
import assert from "node:assert/strict";
import { pickTier } from "./pickTier.ts";

test("pickTier starts at 512 and upgrades to 1024 on hi-DPI", () => {
  assert.deepEqual(pickTier({ dpr: 2 }), { initial: 512, upgrade: 1024 });
});

test("pickTier stays at 512 on standard DPI", () => {
  assert.deepEqual(pickTier({ dpr: 1 }), { initial: 512, upgrade: null });
});
