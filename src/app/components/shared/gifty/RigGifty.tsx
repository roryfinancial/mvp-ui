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
interface Rig {
  canvas: number;
  order: string[];
  base: string[];
  meta: Record<string, Box>;
  mouths: Record<string, string>;       // name -> layer file
  eyes: Record<string, { l: string; r: string }>;
  pupils: Record<string, { l: string; r: string }>;
  defaults: { mouth: string; eyes: string; pupils: string };
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
}: { size?: number; mood?: Mood; talking?: boolean; wave?: boolean }) {
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

  // resolve active swap layers
  const eyeMood = MOOD_EYES[mood] in rig.eyes ? MOOD_EYES[mood] : rig.defaults.eyes;
  const pupilMood = rig.defaults.pupils;
  const mouthName = talking ? TALK_CYCLE[viseme] : (MOOD_MOUTH[mood] || rig.defaults.mouth);
  const mouthLayer = rig.mouths[mouthName] || rig.mouths[rig.defaults.mouth];
  const happyEyesClosed = eyeMood === "happy";

  const img = (layer: string, kind: string) => {
    const b = rig.meta[layer];
    if (!b) return null;
    const pivot = `${b.cx * 100}% ${b.cy * 100}%`;
    let transform = `translateY(${bob}px)`;
    if (kind === "body") transform = `translateY(${bob}px) scale(${1 + breathe})`;
    else if (kind === "bow") transform = `translateY(${bob + bowBob}px)`;
    else if (kind === "arm_r" && wave) transform = `translateY(${bob}px) rotate(${waveAng}deg)`;
    else if (kind === "eye" && !happyEyesClosed) transform = `translateY(${bob}px) scaleY(${1 - blink})`;
    else if (kind === "pupil") transform = `translateY(${bob}px) scaleY(${1 - blink})`;
    return (
      <img key={layer} src={`${URL}/${layer}.png`} alt="" draggable={false}
        style={{ position: "absolute", inset: 0, width: size, height: size, transform, transformOrigin: pivot, willChange: "transform" }} />
    );
  };

  // build the ordered stack, expanding swap slots
  const stack: React.ReactNode[] = [];
  for (const slot of rig.order) {
    if (slot === "__eyes__") {
      const e = rig.eyes[eyeMood];
      stack.push(img(e.l, "eye"), img(e.r, "eye"));
    } else if (slot === "__pupils__") {
      if (!happyEyesClosed) { // closed-happy eyes hide pupils
        const p = rig.pupils[pupilMood];
        stack.push(img(p.l, "pupil"), img(p.r, "pupil"));
      }
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
