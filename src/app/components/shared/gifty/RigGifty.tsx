"use client";

import { useEffect, useRef, useState } from "react";

/**
 * RigGifty — layered Gifty rig with talking + moods.
 *
 * Static layers (body/legs/arms/bow/eyebrows) + SWAP SLOTS for eyes, pupils and
 * mouth so we can change expression by swapping the layer, and "talk" by cycling
 * mouth visemes. All from real cut art; motion is CSS transforms.
 *
 * Props:
 *   mood:    drives eye set + resting mouth
 *   talking: cycle mouth visemes (lip-sync-ish)
 *   wave:    arm gesture
 */

type Box = { cx: number; cy: number; x: number; y: number; w: number; h: number };
type Quad = { TL: { x: number; y: number }; TR: { x: number; y: number }; BR: { x: number; y: number }; BL: { x: number; y: number } };
type Socket = { cx: number; cy: number; w: number; h: number; top: number; bot: number };
interface Rig {
  canvas: number;
  order: string[];
  base: string[];
  meta: Record<string, Box>;
  mouths: Record<string, string>;       // name -> layer file
  eyes: Record<string, { l: string; r: string }>;
  pupils: Record<string, { l: string; r: string }>;
  eyelid?: { l?: string; r?: string };  // cut eyelid layers (slide down to blink)
  puppy?: string | null;                // standalone baked bashful look
  armR: Record<string, string>;
  armL: Record<string, string>;
  legs: Record<string, { l: string; r: string }>;
  defaults: { mouth: string; eyes: string; pupils: string; armR: string; armL: string; legs: string };
  // eye sockets (clip region for lids) + per-mood pupil rest positions + face color
  sockets: { l: Socket; r: Socket };
  socketsByMood?: Record<string, { l: Socket; r: Socket }>;
  pupilRest: Record<string, { l: { x: number; y: number }; r: { x: number; y: number } }>;
  faceBlue?: string;
  lidBlue?: string;
  // base render's face quad (0..1) — all parts are warped into this plane.
  // carried for future face-space re-projection (flat PFP view, head turns).
  faceQuad?: Quad;
  baseRender?: string;
}

export type Mood = "normal" | "happy" | "smug" | "proud" | "shy" | "thinking" | "puppy";
const MOOD_EYES: Record<Mood, string> = {
  normal: "normal", happy: "happy", smug: "smug",
  proud: "smug", shy: "normal", thinking: "normal", puppy: "normal",
};
const MOOD_MOUTH: Record<Mood, string> = {
  normal: "smile", happy: "talk_oh", smug: "proud",
  proud: "proud", shy: "shy", thinking: "hmm", puppy: "shy",
};
const TALK_CYCLE = ["talk_ah", "smile", "talk_oh", "talk_eh", "smile"];

const URL = "/gifty/rig-layers";
const reduced = () =>
  typeof window !== "undefined" && window.matchMedia?.("(prefers-reduced-motion: reduce)").matches;

export function RigGifty({
  size = 320, mood = "normal", talking = false, wave = false,
  armR, armL, legs,
}: { size?: number; mood?: Mood; talking?: boolean; wave?: boolean;
     armR?: string; armL?: string; legs?: string }) {
  const [rig, setRig] = useState<Rig | null>(null);
  const [t, setT] = useState(0);
  const [blink, setBlink] = useState(0);
  const [viseme, setViseme] = useState(0);
  const raf = useRef(0);

  useEffect(() => {
    let live = true;
    fetch(`${URL}/rig.json`).then((r) => r.json()).then((r) => { if (live) setRig(r); }).catch(() => {});
    return () => { live = false; };
  }, []);

  useEffect(() => {
    if (!rig || reduced()) return;
    const start = performance.now();
    let nextBlink = 1800 + Math.random() * 3000, blinkT = -1;
    let lastViseme = 0;
    const loop = (now: number) => {
      const e = now - start;
      setT(e / 1000);
      if (blinkT < 0 && e > nextBlink) blinkT = 0;
      if (blinkT >= 0) {
        blinkT += 16;
        const DUR = 200;                       // a touch slower for a smoother sweep
        const p = Math.min(1, blinkT / DUR);
        // close faster than it opens, both eased (smoothstep) for soft motion
        const phase = p < 0.45 ? (p / 0.45) : (1 - (p - 0.45) / 0.55);
        const eased = phase * phase * (3 - 2 * phase);   // smoothstep
        setBlink(Math.max(0, eased));
        if (blinkT >= DUR) { blinkT = -1; setBlink(0); nextBlink = e + 1800 + Math.random() * 3000; }
      }
      if (talking && e - lastViseme > 110) { lastViseme = e; setViseme((v) => (v + 1) % TALK_CYCLE.length); }
      raf.current = requestAnimationFrame(loop);
    };
    raf.current = requestAnimationFrame(loop);
    return () => cancelAnimationFrame(raf.current);
  }, [rig, talking]);

  if (!rig) return <div style={{ width: size, height: size }} aria-label="Gifty" />;

  const isStatic = reduced();
  const ph = t * 1.7;
  const bob = isStatic ? 0 : Math.sin(ph) * (size * 0.012);
  const breathe = isStatic ? 0 : Math.sin(ph) * 0.014;
  const bowBob = isStatic ? 0 : Math.sin(ph + 0.7) * (size * 0.01);
  const waveAng = wave && !isStatic ? 8 + Math.sin(t * 8) * 14 : 0;
  // pupils drift slowly (a small wandering gaze) + rise as the eye closes
  const dartX = isStatic ? 0 : Math.sin(t * 0.6) * (size * 0.010);
  const dartY = isStatic ? 0 : Math.cos(t * 0.45) * (size * 0.006);
  const pupilRise = blink * (size * 0.05);   // pupils roll up under the closing lid

  // resolve active swap layers
  const eyeMood = MOOD_EYES[mood] in rig.eyes ? MOOD_EYES[mood] : rig.defaults.eyes;
  const pupilMood = rig.defaults.pupils;
  const mouthName = talking ? TALK_CYCLE[viseme] : (MOOD_MOUTH[mood] || rig.defaults.mouth);
  const mouthLayer = rig.mouths[mouthName] || rig.mouths[rig.defaults.mouth];
  const happyEyesClosed = eyeMood === "happy";

  const img = (layer: string, kind: string) => {
    const b = rig.meta[layer];
    if (!b) return null;
    let pivot = `${b.cx * 100}% ${b.cy * 100}%`;
    let transform = `translateY(${bob}px)`;
    if (kind === "body") transform = `translateY(${bob}px) scale(${1 + breathe})`;
    else if (kind === "bow") transform = `translateY(${bob + bowBob}px)`;
    else if (kind === "arm_r" && wave) transform = `translateY(${bob}px) rotate(${waveAng}deg)`;
    else if (kind === "eye") {
      transform = `translateY(${bob}px)`;       // eye-whites are STATIC (no blink scale)
    }
    else if (kind === "puppy") {
      // subtle sniffle: tiny vertical stretch + faster bob (barely noticeable)
      const sniff = isStatic ? 1 : 1 + Math.sin(t * 4.2) * 0.012;
      transform = `translateY(${bob}px) scaleY(${sniff})`;
      pivot = `${b.cx * 100}% ${(b.y + b.h) * 100}%`;   // stretch from the bottom
    }
    return (
      <img key={layer} src={`${URL}/${layer}.png`} alt="" draggable={false}
        style={{ position: "absolute", inset: 0, width: size, height: size, transform, transformOrigin: pivot, willChange: "transform" }} />
    );
  };

  // ── Eye assembly: static pupil that darts/rises + box-blue eyelids that sweep
  //    over the socket (top 75% down, bottom 25% up). Pupils sit at the per-mood
  //    rest position; lids are clipped to the socket so they only cover the eye.
  const moodSockets = rig.socketsByMood?.[eyeMood] || rig.sockets;
  const restFor = (side: "l" | "r") =>
    (rig.pupilRest[eyeMood]?.[side]) || rig.pupilRest.normal[side];
  const isPuppy = mood === "puppy" && rig.puppy;

  // pupil layer (darts/rises). returns the <img> or null.
  const pupilEl = (side: "l" | "r", pupilLayer: string) => {
    if (happyEyesClosed || !rig.meta[pupilLayer]) return null;
    const pm = rig.meta[pupilLayer];
    const rest = restFor(side);
    const dx = (rest.x - pm.cx) * size + dartX;
    const dy = (rest.y - pm.cy) * size + dartY - pupilRise;
    return (
      <img key={`pup-${side}`} src={`${URL}/${pupilLayer}.png`} alt="" draggable={false}
        style={{ position: "absolute", inset: 0, width: size, height: size,
                 transform: `translate(${dx}px, ${bob + dy}px)`, willChange: "transform" }} />
    );
  };

  // sliding cut eyelid. The lid art already sits resting just above/over the eye
  // top. On blink it slides DOWN by the socket height to cover the eye. The clip
  // box spans from above the eye to the eye bottom so only the descending lid is
  // visible (its resting position is hidden just above the clip top).
  const eyelidEl = (side: "l" | "r") => {
    const lid = rig.eyelid?.[side];
    const lm = lid ? rig.meta[lid] : null;
    if (!lid || !lm || happyEyesClosed) return null;
    const sock = moodSockets[side];
    // The lid art naturally sits over the eye top. To OPEN, slide it up out of the
    // eye (by the eye height); to CLOSE, return it to its natural spot (covers eye).
    //   blink 0 → fully up (open) · blink 1 → natural position (closed)
    const eyeH = (sock.bot - sock.top) * size;
    // CLOSED: push the lid down so its bottom reaches the eye bottom (fully covers).
    const lidBottom = lm.y + lm.h;
    const closed = (sock.bot - lidBottom) * size + size * 0.02;   // overshoot a hair
    // OPEN: lift the lid clear above the eye.
    const open = closed - (eyeH + size * 0.08);
    const drop = open + (closed - open) * blink; // blink 0 → open, 1 → closed
    // clip: tight to the socket, from just above the eye to the eye bottom, so the
    // lifted lid is hidden above the window and only the lowered lid shows.
    const padX = sock.w * 0.2;
    const clipTopFrac = sock.top - 0.02;
    const L = (sock.cx - sock.w / 2 - padX) * size;
    const Wpx = (sock.w + padX * 2) * size;
    const Tpx = clipTopFrac * size;
    const clipH = (sock.bot - clipTopFrac + 0.02) * size;
    return (
      <div key={`lid-${side}`} aria-hidden
        style={{ position: "absolute", left: L, top: Tpx + bob, width: Wpx, height: clipH,
                 overflow: "hidden", pointerEvents: "none" }}>
        <img src={`${URL}/${lid}.png`} alt="" draggable={false}
          style={{ position: "absolute", left: -L, top: -Tpx, width: size, height: size,
                   transform: `translateY(${drop}px)`, willChange: "transform" }} />
      </div>
    );
  };

  // resolve limb variants (fall back to defaults)
  const armRName = (armR && rig.armR[armR]) ? armR : rig.defaults.armR;
  const armLName = (armL && rig.armL[armL]) ? armL : rig.defaults.armL;
  const legsName = (legs && rig.legs[legs]) ? legs : rig.defaults.legs;
  // "wave" prop animates the right arm only if it's actually a waving pose
  const canWave = wave && armRName === "wave";

  // build the ordered stack, expanding swap slots
  const stack: React.ReactNode[] = [];
  for (const slot of rig.order) {
    if (slot === "__legs__") {
      const l = rig.legs[legsName];
      stack.push(img(l.l, "leg"), img(l.r, "leg"));
    } else if (slot === "__armL__") {
      stack.push(img(rig.armL[armLName], "arm_l"));
    } else if (slot === "__armR__") {
      stack.push(img(rig.armR[armRName], canWave ? "arm_r" : "arm_static"));
    } else if (slot === "__eyes__") {
      if (isPuppy) continue;                  // puppy replaces all eye features
      const e = rig.eyes[eyeMood];            // static eye-whites, swap by mood
      stack.push(img(e.l, "eye"), img(e.r, "eye"));
    } else if (slot === "__pupils__") {
      if (isPuppy) continue;
      const p = rig.pupils[pupilMood] || rig.pupils.normal;
      stack.push(pupilEl("l", p.l), pupilEl("r", p.r));
    } else if (slot === "__eyelid__") {
      if (isPuppy) continue;
      stack.push(eyelidEl("l"), eyelidEl("r"));   // cut lids slide down to blink
    } else if (slot === "__puppy__") {
      if (isPuppy && rig.puppy) stack.push(img(rig.puppy, "puppy"));
    } else if (slot === "__mouth__") {
      stack.push(img(mouthLayer, "mouth"));
    } else if ((slot === "eyebrow_l" || slot === "eyebrow_r") && isPuppy) {
      continue;                               // puppy has its own baked brows
    } else {
      stack.push(img(slot, slot));
    }
  }

  return (
    <div role="img" aria-label={`Gifty mascot (${mood}${talking ? ", talking" : ""})`}
         style={{ position: "relative", width: size, height: size, overflow: "visible" }}>
      {stack}
    </div>
  );
}

export default RigGifty;
