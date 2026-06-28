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
  armR: Record<string, string>;
  armL: Record<string, string>;
  legs: Record<string, { l: string; r: string }>;
  defaults: { mouth: string; eyes: string; pupils: string; armR: string; armL: string; legs: string };
  // eye sockets (clip region for lids) + per-mood pupil rest positions + face color
  sockets: { l: Socket; r: Socket };
  pupilRest: Record<string, { l: { x: number; y: number }; r: { x: number; y: number } }>;
  faceBlue?: string;
  // base render's face quad (0..1) — all parts are warped into this plane.
  // carried for future face-space re-projection (flat PFP view, head turns).
  faceQuad?: Quad;
  baseRender?: string;
}

export type Mood = "normal" | "happy" | "smug" | "proud" | "shy" | "thinking";
const MOOD_EYES: Record<Mood, string> = {
  normal: "normal", happy: "happy", smug: "smug",
  proud: "smug", shy: "normal", thinking: "normal",
};
const MOOD_MOUTH: Record<Mood, string> = {
  normal: "smile", happy: "talk_oh", smug: "proud",
  proud: "proud", shy: "shy", thinking: "hmm",
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
        const p = blinkT / 130;
        setBlink(p < 0.5 ? p * 2 : Math.max(0, 2 - p * 2));
        if (blinkT >= 130) { blinkT = -1; setBlink(0); nextBlink = e + 1800 + Math.random() * 3000; }
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
    return (
      <img key={layer} src={`${URL}/${layer}.png`} alt="" draggable={false}
        style={{ position: "absolute", inset: 0, width: size, height: size, transform, transformOrigin: pivot, willChange: "transform" }} />
    );
  };

  // ── Eye assembly: static pupil that darts/rises + box-blue eyelids that sweep
  //    over the socket (top 75% down, bottom 25% up). Pupils sit at the per-mood
  //    rest position; lids are clipped to the socket so they only cover the eye.
  const faceBlue = rig.faceBlue || "#2F6BF5";
  const restFor = (side: "l" | "r") =>
    (rig.pupilRest[eyeMood]?.[side]) || rig.pupilRest.normal[side];

  const eyeParts = (side: "l" | "r", pupilLayer: string) => {
    const sock = rig.sockets[side];
    const rest = restFor(side);
    const out: React.ReactNode[] = [];
    // pupil — positioned at rest, drifts with gaze, rises as the eye closes
    if (!happyEyesClosed && rig.meta[pupilLayer]) {
      const pm = rig.meta[pupilLayer];
      // shift pupil so its center lands on the mood rest point, + dart + rise
      const dx = (rest.x - pm.cx) * size + dartX;
      const dy = (rest.y - pm.cy) * size + dartY - pupilRise;
      out.push(
        <img key={`pup-${side}`} src={`${URL}/${pupilLayer}.png`} alt="" draggable={false}
          style={{ position: "absolute", inset: 0, width: size, height: size,
                   transform: `translate(${dx}px, ${bob + dy}px)`, willChange: "transform" }} />
      );
    }
    // eyelids — only over moods whose white is open (skip happy = already closed)
    if (!happyEyesClosed) {
      const L = sock.cx - sock.w / 2, T = sock.top, W = sock.w, H = sock.bot - sock.top;
      const lidStyle = (h: number, fromTop: boolean): React.CSSProperties => ({
        position: "absolute",
        left: `${L * 100}%`, width: `${W * 100}%`,
        top: fromTop ? `${T * 100}%` : `${(sock.bot - h) * 100}%`,
        height: `${h * 100}%`,
        background: faceBlue,
        borderRadius: fromTop ? `0 0 ${size * 0.04}px ${size * 0.04}px` : `${size * 0.04}px ${size * 0.04}px 0 0`,
        transform: `translateY(${bob}px)`,
      });
      // top lid sweeps to 75% of socket height, bottom lid to 25%
      const topH = H * 0.75 * blink;
      const botH = H * 0.25 * blink;
      out.push(<div key={`lidT-${side}`} aria-hidden style={lidStyle(topH, true)} />);
      out.push(<div key={`lidB-${side}`} aria-hidden style={lidStyle(botH, false)} />);
    }
    return out;
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
      // static eye-whites (swap by mood) — no blink scaling
      const e = rig.eyes[eyeMood];
      stack.push(img(e.l, "eye"), img(e.r, "eye"));
    } else if (slot === "__pupils__") {
      // pupils (darting/rising) + box-blue eyelids that sweep over each socket
      const p = rig.pupils[pupilMood];
      stack.push(...eyeParts("l", p.l), ...eyeParts("r", p.r));
    } else if (slot === "__mouth__") {
      stack.push(img(mouthLayer, "mouth"));
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
