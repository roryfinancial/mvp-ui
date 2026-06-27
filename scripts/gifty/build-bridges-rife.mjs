#!/usr/bin/env node
/**
 * build-bridges-rife.mjs — STUB (phase 2).
 *
 * Bakes neural in-between frames so the runtime engine can use bridge="rife"
 * instead of "crossfade" — replacing the ghost-dissolve at each clip↔idle
 * doorway with real interpolated motion.
 *
 * For each spoke (every non-idle clip), generate N frames between:
 *     A = clip.doorIn frame   (the clip's doorway pose)
 *     B = idle.idleRest frame (the hub rest pose)
 * …and write them as bridge-<clip>.png (a small sprite strip), plus extend
 * clips.json with `bridgeFrames` per clip. The engine then plays the real
 * bridge strip during transitions.
 *
 * ENGINE CONTRACT (already supported once data exists):
 *   clips.json -> clips[name].bridge = { frames: number, sheet: "bridge-<name>.png" }
 *   engine.ts  -> when bridge==="rife" and a bridge sheet exists, play it
 *                 instead of the crossfade; otherwise fall back to crossfade.
 *
 * SETUP (fill in when you come back to do RIFE):
 *   Option A — rife-ncnn-vulkan (no Python, macOS/Win/Linux binary + models):
 *     https://github.com/nihui/rife-ncnn-vulkan/releases
 *     download, unzip to scripts/gifty/.rife/, then this script shells out to it.
 *   Option B — onnxruntime-node + a RIFE ONNX export (no external binary).
 *
 * Honest expectation (from the pose-graph analysis):
 *   - GREEN/YELLOW spokes (small gaps): RIFE bridges look good.
 *   - RED spokes (big gaps, e.g. think/sleep): may be soft; those are the
 *     candidates for mint-real-bridge-frames (hosted i2v or Ludo) instead.
 *
 * Until implemented, the engine ships with bridge="crossfade" and this is a
 * no-op that prints the plan.
 */

import fs from "node:fs";
import path from "node:path";
import { fileURLToPath } from "node:url";

const __dirname = path.dirname(fileURLToPath(import.meta.url));
const OUT = path.resolve(__dirname, "..", "..", "public", "gifty", "clips");
const N_BRIDGE = 6; // frames to synthesize per doorway

function main() {
  const manifestPath = path.join(OUT, "clips.json");
  if (!fs.existsSync(manifestPath)) {
    console.error("Run build-clips.mjs first (no clips.json).");
    process.exit(1);
  }
  const man = JSON.parse(fs.readFileSync(manifestPath));
  const spokes = Object.entries(man.clips).filter(([name]) => name !== man.idle);

  console.log("RIFE bridge plan (stub — not yet implemented):");
  console.log(`  idle hub: ${man.idle} (rest f${man.idleRest})`);
  for (const [name, c] of spokes) {
    console.log(
      `  ${name}: bridge ${N_BRIDGE} frames  [clip f${c.doorIn} ↔ idle f${man.idleRest}]  (${c.spokeClass})`
    );
  }
  console.log("\nTo implement: install a RIFE runtime (see header), interpolate A↔B");
  console.log("per spoke, write bridge-<clip>.png, and set clips[name].bridge in clips.json.");
  console.log("Then render <Gifty bridge=\"rife\" /> — engine plays the baked bridges.");
}

main();
