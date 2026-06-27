"use client";

import { useEffect, useRef, useState } from "react";
import { GiftyEngine, type ClipsManifest, type RenderState, type BridgeStrategy } from "./engine";

/**
 * <Gifty /> — the animated Rory mascot.
 *
 * Plays sprite-clip sheets from public/gifty/clips/ and transitions between
 * states through the idle hub (see engine.ts). Reactive: change `state` and it
 * routes there seamlessly. Honors prefers-reduced-motion (renders a static
 * rest pose). v1 bridges gaps with crossfade; pass bridge="rife" once baked.
 */

export type GiftyState =
  | "idle" | "wave" | "think" | "sleep"
  | "wave_hd" | "cheer_hd" | "wave_hd2";

const CLIPS_URL = "/gifty/clips";

function useManifest() {
  const [man, setMan] = useState<ClipsManifest | null>(null);
  useEffect(() => {
    let live = true;
    fetch(`${CLIPS_URL}/clips.json`)
      .then((r) => r.json())
      .then((m) => { if (live) setMan(m); })
      .catch(() => {});
    return () => { live = false; };
  }, []);
  return man;
}

function prefersReducedMotion() {
  return typeof window !== "undefined" &&
    window.matchMedia?.("(prefers-reduced-motion: reduce)").matches;
}

/** One sprite-sheet layer rendered via background-position. */
function Layer({
  clip, frame, tile, size, opacity,
}: { clip: string; frame: number; tile: number; size: number; opacity: number }) {
  const scale = size / tile;
  return (
    <div
      aria-hidden
      style={{
        position: "absolute",
        inset: 0,
        width: size,
        height: size,
        opacity,
        backgroundImage: `url(${CLIPS_URL}/${clip}.png)`,
        backgroundRepeat: "no-repeat",
        // sheet is a horizontal strip of `tile`-wide frames, scaled to `size`
        backgroundSize: `auto ${size}px`,
        backgroundPositionX: `${-frame * tile * scale}px`,
        imageRendering: "auto",
      }}
    />
  );
}

export function Gifty({
  state = "idle",
  size = 128,
  bridge = "crossfade",
  className,
}: {
  state?: GiftyState;
  size?: number;
  bridge?: BridgeStrategy;
  className?: string;
}) {
  const man = useManifest();
  const engineRef = useRef<GiftyEngine | null>(null);
  const [rs, setRs] = useState<RenderState | null>(null);
  const reduced = prefersReducedMotion();

  // build engine once the manifest loads
  useEffect(() => {
    if (!man) return;
    engineRef.current = new GiftyEngine(man, { bridge, start: "idle" });
    setRs(engineRef.current.restState());
  }, [man, bridge]);

  // react to state changes
  useEffect(() => {
    engineRef.current?.setState(state);
  }, [state]);

  // animation loop
  useEffect(() => {
    if (!man || !engineRef.current) return;
    if (reduced) { setRs(engineRef.current.restState()); return; }
    let raf = 0, last = performance.now();
    const loop = (now: number) => {
      const dt = now - last; last = now;
      setRs(engineRef.current!.tick(dt));
      raf = requestAnimationFrame(loop);
    };
    raf = requestAnimationFrame(loop);
    return () => cancelAnimationFrame(raf);
  }, [man, reduced]);

  if (!man || !rs) {
    return <div className={className} style={{ width: size, height: size }} aria-label="Gifty mascot" />;
  }

  const tile = man.tile;
  return (
    <div
      className={className}
      role="img"
      aria-label="Gifty, the Rory gift-box mascot"
      style={{ position: "relative", width: size, height: size }}
    >
      <Layer clip={rs.clip} frame={rs.frame} tile={tile} size={size} opacity={rs.blend > 0 ? 1 - rs.blend : 1} />
      {rs.next != null && rs.blend > 0 && (
        <Layer clip={rs.next} frame={rs.nextFrame ?? 0} tile={tile} size={size} opacity={rs.blend} />
      )}
    </div>
  );
}

export default Gifty;
