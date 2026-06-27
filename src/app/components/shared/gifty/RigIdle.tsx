"use client";

import { useEffect, useRef, useState } from "react";

/**
 * RigIdle — the living idle Gifty. The full character (base.png) is kept whole
 * (pristine art, no fragile part-extraction) and brought to life purely with
 * transforms:
 *   - breathe: subtle scale from a bottom anchor (feet stay planted)
 *   - bob:     gentle vertical float
 *   - sway:    tiny rotation so it feels springy, not mechanical
 *
 * Eye-blink is intentionally omitted in v1 — auto eye-detection on the render
 * was unreliable (produced a blocky lid). Breathe+bob+sway already read as
 * "alive". A hand-placed blink can be added later (set eye centers in
 * layers.json) without touching this motion.
 *
 * Honors prefers-reduced-motion (renders the static base).
 */

interface Layers {
  canvas: number;
  base: { src: string };
}

const RIG_URL = "/gifty/rig";

function reduced() {
  return typeof window !== "undefined" && window.matchMedia?.("(prefers-reduced-motion: reduce)").matches;
}

export function RigIdle({ size = 256 }: { size?: number }) {
  const [layers, setLayers] = useState<Layers | null>(null);
  const [t, setT] = useState(0);
  const raf = useRef(0);

  useEffect(() => {
    let live = true;
    fetch(`${RIG_URL}/layers.json`).then((r) => r.json()).then((l) => { if (live) setLayers(l); }).catch(() => {});
    return () => { live = false; };
  }, []);

  useEffect(() => {
    if (!layers || reduced()) return;
    const start = performance.now();
    const loop = (now: number) => { setT((now - start) / 1000); raf.current = requestAnimationFrame(loop); };
    raf.current = requestAnimationFrame(loop);
    return () => cancelAnimationFrame(raf.current);
  }, [layers]);

  if (!layers) return <div style={{ width: size, height: size }} aria-label="Gifty" />;

  const isStatic = reduced();
  // one slow sine drives everything so breathe/bob/sway stay in phase
  const phase = t * 1.7;
  const breathe = isStatic ? 0 : Math.sin(phase) * 0.014;            // ±1.4% scale
  const bob = isStatic ? 0 : Math.sin(phase) * (size * 0.014);        // px
  const sway = isStatic ? 0 : Math.sin(phase * 0.5 + 0.5) * 0.8;      // deg

  const fileName = layers.base.src.split("/").pop();
  return (
    <div
      role="img"
      aria-label="Gifty, the Rory gift-box mascot"
      style={{ position: "relative", width: size, height: size, overflow: "visible" }}
    >
      <img
        src={`${RIG_URL}/${fileName}`}
        alt=""
        draggable={false}
        style={{
          position: "absolute", inset: 0, width: size, height: size,
          transform: `translateY(${bob}px) rotate(${sway}deg) scale(${1 + breathe})`,
          transformOrigin: "50% 92%",
          willChange: "transform",
        }}
      />
    </div>
  );
}

export default RigIdle;
