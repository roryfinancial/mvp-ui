// Copy the rig's behavioral (non-image) fields into the per-tier web JSON.

const CARRY_KEYS = [
  "order", "base", "mouths", "eyes", "pupils", "eyelid", "lashline", "eyerim",
  "eyeMask", "puppy", "puppyRest", "legRise", "armBehind",
  "armR", "armL", "legs", "defaults", "sockets",
  "socketsByMood", "pupilRest", "lidRest", "faceBlue", "lidBlue", "faceQuad",
];

export function carryRigData(rig) {
  const out = {};
  for (const k of CARRY_KEYS) {
    if (rig[k] !== undefined) out[k] = rig[k];
  }
  return out;
}
