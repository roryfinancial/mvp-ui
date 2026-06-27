"use client";

import { useEffect, useRef, useState } from "react";
import { RigIdle } from "./RigIdle";

/**
 * <Gifty /> — the Rory mascot.
 *
 * idle  → the rigged, living idle (RigIdle: breathe + bob + blink).
 * other → cross-fade to the matching high-quality Gemini pose render, with a
 *         subtle whole-image breathe so it never reads as a dead PNG.
 *
 * `celebrate` is one-shot: it plays, then auto-returns to idle. The rest hold
 * until `state` changes. Honors prefers-reduced-motion (static).
 */

export type GiftyState =
  | "idle" | "wave" | "sad" | "celebrate" | "sleep"
  | "proud" | "think" | "present" | "thumbsup" | "salute";

const POSE_URL = "/gifty/poses";
const ONE_SHOT: Record<string, true> = { celebrate: true };
const ONE_SHOT_MS = 2200;

function reduced() {
  return typeof window !== "undefined" && window.matchMedia?.("(prefers-reduced-motion: reduce)").matches;
}

/** A pose render with a gentle idle breathe so it feels alive, not frozen. */
function Pose({ name, size, visible }: { name: string; size: number; visible: boolean }) {
  const [t, setT] = useState(0);
  const raf = useRef(0);
  useEffect(() => {
    if (reduced()) return;
    const start = performance.now();
    const loop = (now: number) => { setT((now - start) / 1000); raf.current = requestAnimationFrame(loop); };
    raf.current = requestAnimationFrame(loop);
    return () => cancelAnimationFrame(raf.current);
  }, []);
  const breathe = reduced() ? 0 : Math.sin(t * 1.7) * 0.012;
  const bob = reduced() ? 0 : Math.sin(t * 1.7) * (size * 0.01);
  return (
    <img
      src={`${POSE_URL}/${name}.png`}
      alt=""
      draggable={false}
      style={{
        position: "absolute", inset: 0, width: size, height: size,
        transform: `translateY(${bob}px) scale(${1 + breathe})`,
        transformOrigin: "50% 92%",
        opacity: visible ? 1 : 0,
        transition: "opacity 200ms ease",
      }}
    />
  );
}

export function Gifty({
  state = "idle",
  size = 256,
  className,
}: {
  state?: GiftyState;
  size?: number;
  className?: string;
}) {
  // `shown` is what's currently displayed; on change we keep the previous
  // mounted for one fade then drop it. `effective` handles one-shot auto-return.
  const [effective, setEffective] = useState<GiftyState>(state);

  useEffect(() => {
    setEffective(state);
    if (ONE_SHOT[state]) {
      const id = setTimeout(() => setEffective("idle"), ONE_SHOT_MS);
      return () => clearTimeout(id);
    }
  }, [state]);

  const showIdle = effective === "idle";

  return (
    <div
      className={className}
      role="img"
      aria-label={`Gifty mascot (${effective})`}
      style={{ position: "relative", width: size, height: size }}
    >
      {/* idle rig sits underneath; poses fade in over it */}
      <div style={{ position: "absolute", inset: 0, opacity: showIdle ? 1 : 0, transition: "opacity 200ms ease" }}>
        <RigIdle size={size} />
      </div>

      {/* mount only the active pose (plus a brief fade handled by opacity) */}
      {!showIdle && <Pose name={effective} size={size} visible />}
    </div>
  );
}

export default Gifty;
