import { test } from "node:test";
import assert from "node:assert/strict";
import { moodToFace } from "./moodMap.ts";

test("known moods map to baked eyes+mouth keys", () => {
  assert.deepEqual(moodToFace("normal"), { eyes: "normal", mouth: "smile" });
  assert.deepEqual(moodToFace("happy"),  { eyes: "happy",  mouth: "smile" });
  assert.deepEqual(moodToFace("smug"),   { eyes: "smug",   mouth: "hmm" });
  assert.deepEqual(moodToFace("proud"),  { eyes: "normal", mouth: "proud" });
  assert.deepEqual(moodToFace("shy"),    { eyes: "normal", mouth: "shy" });
});

test("unknown/unbaked mood falls back to normal+smile", () => {
  assert.deepEqual(moodToFace("thinking"), { eyes: "normal", mouth: "hmm" });
  assert.deepEqual(moodToFace("nonsense"), { eyes: "normal", mouth: "smile" });
});
