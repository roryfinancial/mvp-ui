"use client";

import { useEffect, useRef, useState } from "react";

/**
 * RigGifty — a layered (VTuber-style) Gifty rig.
 *
 * 13 transparent layers (body, legs, arms, bow, eyebrows, eyes, pupils, mouth)
 * cut from the thumbsup render are stacked and animated by CSS transforms — the
 * art stays full-quality (no downscaling/jitter), motion is real per-part:
 *   body    – breathe (scale) + bob (translateY)
 *   eyes    – blink (scaleY → ~0)
 *   pupils  – subtle dart
 *   eyebrows– lift on a "happy" beat
 *   bow     – springy counter-bob
 *   arm_r   – wave (rotate) when state==="wave"
 *
 * Driven by `state`. Honors prefers-reduced-motion (static).
 */

export type RigState = "idle" | "wave" | "happy" | "blinkonly";

interface Box { cx: number; cy: number; x: number; y: number; w: number; h: number; }
interface Manifest { canvas: number; order: string[]; layers: Record<string, Box>; }

const URL = "/gifty/rig-layers";

function reduced() {
  return typeof window !== "undefined" && window.matchMedia?.("(prefers-reduced-motion: reduce)").matches;
}

export function RigGifty({ size = 300, state = "idle" }: { size?: number; state?: RigState }) {
  const [man, setMan] = useState<Manifest | null>(null);
  const [t, setT] = useState(0);
  const [blink, setBlink] = useState(0);
  const raf = useRef(0);

  useEffect(() => {
    let live = true;
    fetch(`${URL}/layers.json`).then((r) => r.json()).then((m) => { if (live) setMan(m); }).catch(() => {});
    return () => { live = false; };
  }, []);

  useEffect(() => {
    if (!man || reduced()) return;
    const start = performance.now();
    let nextBlink = 1800 + Math.random() * 3000;
    let blinkT = -1;
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
      raf.current = requestAnimationFrame(loop);
    };
    raf.current = requestAnimationFrame(loop);
    return () => cancelAnimationFrame(raf.current);
  }, [man, state]);

  if (!man) return <div style={{ width: size, height: size }} aria-label="Gifty" />;

  const isStatic = reduced();
  const ph = t * 1.7;
  const breathe = isStatic ? 0 : Math.sin(ph) * 0.015;
  const bob = isStatic ? 0 : Math.sin(ph) * (size * 0.012);
  const bowBob = isStatic ? 0 : Math.sin(ph + 0.7) * (size * 0.01);
  const browLift = state === "happy" && !isStatic ? -(size * 0.012) : 0;
  const waveAng = state === "wave" && !isStatic ? Math.sin(t * 9) * 16 : 0;
  const pupilDart = isStatic ? 0 : Math.sin(t * 0.7) * (size * 0.004);

  // per-layer transform; pivot = the layer's own center (so rotate/scale look right)
  const layerStyle = (name: string): React.CSSProperties => {
    const b = man.layers[name];
    if (!b) return { display: "none" };
    const pivot = `${b.cx * 100}% ${b.cy * 100}%`;
    let transform = `translateY(${bob}px)`;            // everyone bobs with the body
    if (name === "body") transform = `translateY(${bob}px) scale(${1 + breathe})`;
    else if (name === "bow") transform = `translateY(${bob + bowBob}px)`;
    else if (name.startsWith("eyebrow")) transform = `translateY(${bob + browLift}px)`;
    else if (name.startsWith("eye_")) transform = `translateY(${bob}px) scaleY(${1 - blink})`;
    else if (name.startsWith("pupil")) transform = `translate(${pupilDart}px, ${bob}px) scaleY(${1 - blink})`;
    else if (name === "arm_r") transform = `translateY(${bob}px) rotate(${waveAng}deg)`;
    return {
      position: "absolute", inset: 0, width: size, height: size,
      transform, transformOrigin: pivot, willChange: "transform",
    };
  };

  return (
    <div role="img" aria-label="Gifty mascot"
         style={{ position: "relative", width: size, height: size, overflow: "visible" }}>
      {man.order.map((name) => (
        <img key={name} src={`${URL}/${name}.png`} alt="" draggable={false} style={layerStyle(name)} />
      ))}
    </div>
  );
}

export default RigGifty;
