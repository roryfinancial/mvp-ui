"use client";

import { useEffect, useRef, useState } from "react";
import { useWebRig } from "./useWebRig";
import { spriteCss } from "./spriteStyle";

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
  lashline?: { l?: string; r?: string };// crisp lighter border on the lid bottom edge
  eyerim?: { l?: string; r?: string };  // dark eye-white border, drawn ABOVE the lid so the lid/lash stay inside it
  lidRest?: { l?: number; r?: number }; // per-eye rest nudge (frac) to even the lids
  eyeMask?: Record<string, { l?: string; r?: string }>; // white-only clip per mood
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
  armR, armL, legs, tier = "web",
}: { size?: number; mood?: Mood; talking?: boolean; wave?: boolean;
     armR?: string; armL?: string; legs?: string; tier?: "web" | "hq" }) {
  const [rig, setRig] = useState<Rig | null>(null);
  const [t, setT] = useState(0);
  const [blink, setBlink] = useState(0);
  const [viseme, setViseme] = useState(0);
  const raf = useRef(0);
  const web = useWebRig();

  useEffect(() => {
    if (tier !== "hq") return;          // web path loads its rig via useWebRig
    let live = true;
    fetch(`${URL}/rig.json`).then((r) => r.json()).then((r) => { if (live) setRig(r); }).catch(() => {});
    return () => { live = false; };
  }, [tier]);

  const loaded = tier === "web" ? !!web.data : !!rig;
  useEffect(() => {
    if (!loaded || reduced()) return;
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
  }, [loaded, talking]);

  if (tier === "web") {
    if (!web.data || !web.atlasUrl) return <div style={{ width: size, height: size }} aria-label="Gifty" />;
  } else if (!rig) {
    return <div style={{ width: size, height: size }} aria-label="Gifty" />;
  }

  // active rig source: HQ uses the fetched `rig`; web uses the atlas tier JSON.
  // Both expose identical behavioral keys (order/eyes/pupils/eyelid/…).
  const SRC = (tier === "web" ? web.data : rig) as Rig;

  const isStatic = reduced();
  const ph = t * 1.7;
  const bob = isStatic ? 0 : Math.sin(ph) * (size * 0.012);
  const breathe = isStatic ? 0 : Math.sin(ph) * 0.014;
  const bowBob = isStatic ? 0 : Math.sin(ph + 0.7) * (size * 0.01);
  const waveAng = wave && !isStatic ? 8 + Math.sin(t * 8) * 14 : 0;
  // pupils drift slowly (a small wandering gaze). They must NOT rise as the eye
  // closes — rising pushed the pupil up into the lid's top corners and peeked out
  // past the cap during a blink. The lid now sweeps down over a still pupil.
  const dartX = isStatic ? 0 : Math.sin(t * 0.6) * (size * 0.010);
  const dartY = isStatic ? 0 : Math.cos(t * 0.45) * (size * 0.006);
  const pupilRise = 0;

  // resolve active swap layers
  const eyeMood = MOOD_EYES[mood] in SRC.eyes ? MOOD_EYES[mood] : SRC.defaults.eyes;
  const pupilMood = SRC.defaults.pupils;
  const mouthName = talking ? TALK_CYCLE[viseme] : (MOOD_MOUTH[mood] || SRC.defaults.mouth);
  const mouthLayer = SRC.mouths[mouthName] || SRC.mouths[SRC.defaults.mouth];
  const happyEyesClosed = eyeMood === "happy";

  // Per-kind animation transform — SHARED by the HQ `img()` and the web `webImg()`
  // so both paths get byte-identical motion (bob/breathe/bow/wave/sniffle). The
  // HQ path can pass the layer's `cx,cy` for a precise pivot; the web path uses the
  // sprite's own box center ("center"), which coincides with the layer center.
  const kindTransform = (kind: string, b?: Box): { transform: string; pivot: string } => {
    let pivot = b ? `${b.cx * 100}% ${b.cy * 100}%` : "center";
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
      pivot = b ? `${b.cx * 100}% ${(b.y + b.h) * 100}%` : "center bottom";   // stretch from the bottom
    }
    return { transform, pivot };
  };

  const img = (layer: string, kind: string) => {
    const b = rig!.meta[layer];
    if (!b) return null;
    const { transform, pivot } = kindTransform(kind, b);
    return (
      <img key={layer} src={`${URL}/${layer}.png`} alt="" draggable={false}
        style={{ position: "absolute", inset: 0, width: size, height: size, transform, transformOrigin: pivot, willChange: "transform" }} />
    );
  };

  // ── Web sprite helpers (tier === "web"): emit positioned <div>s backed by the
  //    atlas instead of full-canvas <img>s. Each div is sized/positioned by its
  //    place box; motion comes from the SAME kindTransform as HQ.
  const wd = web.data;
  const atlasUrl = web.atlasUrl;
  const placeStyle = (layer: string) => {
    const L = wd.layers[layer];
    if (!L) return null;
    return {
      ...spriteCss({ place: L.place, cell: L.cell, atlas: wd.atlas, size }),
      position: "absolute" as const,
      left: L.place.x * size, top: L.place.y * size,
      backgroundImage: `url(${atlasUrl})`,
    };
  };
  const webImg = (layer: string, kind: string) => {
    const base = placeStyle(layer);
    if (!base) return null;
    const { transform, pivot } = kindTransform(kind);   // place-box pivot
    return (
      <div key={layer} aria-hidden
        style={{ ...base, transform, transformOrigin: pivot, willChange: "transform" }} />
    );
  };

  // ── Eye assembly: static pupil that darts/rises + box-blue eyelids that sweep
  //    over the socket (top 75% down, bottom 25% up). Pupils sit at the per-mood
  //    rest position; lids are clipped to the socket so they only cover the eye.
  const moodSockets = SRC.socketsByMood?.[eyeMood] || SRC.sockets;
  const restFor = (side: "l" | "r") =>
    (SRC.pupilRest[eyeMood]?.[side]) || SRC.pupilRest.normal[side];
  const isPuppy = mood === "puppy" && SRC.puppy;

  // pupil center in face-fraction coords. HQ reads the full-canvas bbox center
  // (`meta.cx/cy`); web derives the same center from the atlas place box
  // (place.x + place.w/2). Both feed the identical dart/rest math below.
  const pupilCenter = (pupilLayer: string): { cx: number; cy: number } | null => {
    if (tier === "web") {
      const L = wd.layers[pupilLayer];
      if (!L) return null;
      return { cx: L.place.x + L.place.w / 2, cy: L.place.y + L.place.h / 2 };
    }
    const pm = rig!.meta[pupilLayer];
    if (!pm) return null;
    return { cx: pm.cx, cy: pm.cy };
  };

  // pupil layer (darts/rises). returns the <img> or null.
  const pupilEl = (side: "l" | "r", pupilLayer: string) => {
    if (happyEyesClosed) return null;
    const pc = pupilCenter(pupilLayer);
    if (!pc) return null;
    const rest = restFor(side);
    const dx = (rest.x - pc.cx) * size + dartX;
    const dy = (rest.y - pc.cy) * size + dartY - pupilRise;
    if (tier === "web") {
      const base = placeStyle(pupilLayer)!;
      return (
        <div key={`pup-${side}`} aria-hidden
          style={{ ...base, transform: `translate(${dx}px, ${bob + dy}px)`, willChange: "transform" }} />
      );
    }
    return (
      <img key={`pup-${side}`} src={`${URL}/${pupilLayer}.png`} alt="" draggable={false}
        style={{ position: "absolute", inset: 0, width: size, height: size,
                 transform: `translate(${dx}px, ${bob + dy}px)`, willChange: "transform" }} />
    );
  };

  // Cut eyelid at its NATURAL baked position (rest = half-way down the eye, from
  // smug). `blink` nudges it further down to close. Clipped to the EYE-WHITE shape
  // (CSS mask) so the lid only ever shows over the eye — no bbox math.
  const LID_CLOSE = 0.14;    // downward travel (frac of size) on full blink — clears the eye bottom

  // Web mask CSS: place an atlas cell within a FULL-CANVAS (size×size) box at the
  // layer's place coords, scaling the atlas so the cell lands exactly where its
  // full-canvas PNG would. Mirrors `spriteCss` math but for the mask layer and a
  // size×size frame (so the masked wrapper shares the lid sprite's coord space —
  // exactly as the HQ full-canvas mask does).
  const webMaskStyle = (maskLayer: string): React.CSSProperties | null => {
    const L = wd.layers[maskLayer];
    if (!L) return null;
    const divW = L.place.w * size, divH = L.place.h * size;
    const scaleX = divW / L.cell.sw, scaleY = divH / L.cell.sh;
    const maskUrl = `url(${atlasUrl})`;
    const bgW = wd.atlas.w * scaleX, bgH = wd.atlas.h * scaleY;
    const posX = L.place.x * size - L.cell.sx * scaleX;
    const posY = L.place.y * size - L.cell.sy * scaleY;
    return {
      WebkitMaskImage: maskUrl, maskImage: maskUrl,
      WebkitMaskSize: `${bgW}px ${bgH}px`, maskSize: `${bgW}px ${bgH}px`,
      WebkitMaskPosition: `${posX}px ${posY}px`, maskPosition: `${posX}px ${posY}px`,
      WebkitMaskRepeat: "no-repeat", maskRepeat: "no-repeat",
    };
  };

  // Full-canvas sprite style for the MASKED eye layers (eyelid + lashline).
  // Unlike `placeStyle` (which sizes the div to its TIGHT place box), this paints
  // the atlas cell into a FULL-CANVAS (size×size) div at the layer's place coords —
  // the SAME background mapping `webMaskStyle` uses for the mask. The masked
  // wrapper and these layers then share one coord space, so the eye-white mask
  // clips the lid exactly like the HQ full-canvas <img> path does.
  const fullCanvasSpriteStyle = (layer: string): React.CSSProperties | null => {
    const L = wd.layers[layer];
    if (!L) return null;
    const divW = L.place.w * size, divH = L.place.h * size;
    const scaleX = divW / L.cell.sw, scaleY = divH / L.cell.sh;
    const bgW = wd.atlas.w * scaleX, bgH = wd.atlas.h * scaleY;
    const posX = L.place.x * size - L.cell.sx * scaleX;
    const posY = L.place.y * size - L.cell.sy * scaleY;
    return {
      position: "absolute", inset: 0, width: size, height: size,
      backgroundImage: `url(${atlasUrl})`,
      backgroundRepeat: "no-repeat",
      backgroundSize: `${bgW}px ${bgH}px`,
      backgroundPosition: `${posX}px ${posY}px`,
    };
  };

  const eyelidEl = (side: "l" | "r") => {
    const lid = SRC.eyelid?.[side];
    if (!lid || happyEyesClosed) return null;
    // clip to the white-only mask (bright interior, no navy outline); fall back to
    // the full eye-white if a mask isn't present.
    const maskLayer = SRC.eyeMask?.[eyeMood]?.[side] || SRC.eyes[eyeMood][side];
    const restNudge = (SRC.lidRest?.[side] ?? 0) * size;   // even the two lids
    const drop = restNudge + blink * LID_CLOSE * size;

    if (tier === "web") {
      const lidBase = fullCanvasSpriteStyle(lid);
      const mask = webMaskStyle(maskLayer);
      if (!lidBase || !mask) return null;
      const lashLayer = SRC.lashline?.[side];
      const lashBase = lashLayer ? fullCanvasSpriteStyle(lashLayer) : null;
      // mask sits on the STATIC full-canvas wrapper (fixed to the eye); the lid +
      // lash sprites slide INSIDE it by `drop`, revealed only within the eye-white.
      return (
        <div key={`lid-${side}`} aria-hidden
          style={{ position: "absolute", inset: 0, width: size, height: size,
                   transform: `translateY(${bob}px)`, ...mask, pointerEvents: "none" }}>
          <div style={{ ...lidBase, transform: `translateY(${drop}px)`, willChange: "transform" }} />
          {lashBase && (
            <div style={{ ...lashBase, transform: `translateY(${drop}px)`, willChange: "transform" }} />
          )}
        </div>
      );
    }

    if (!rig!.meta[lid]) return null;
    const maskUrl = `url(${URL}/${maskLayer}.png)`;
    // mask sits on the STATIC parent (fixed to the eye); the lid <img> slides
    // INSIDE it, so the lid is revealed only within the eye-white shape.
    return (
      <div key={`lid-${side}`} aria-hidden
        style={{ position: "absolute", inset: 0, width: size, height: size,
                 transform: `translateY(${bob}px)`,
                 WebkitMaskImage: maskUrl, maskImage: maskUrl,
                 WebkitMaskSize: "100% 100%", maskSize: "100% 100%",
                 WebkitMaskRepeat: "no-repeat", maskRepeat: "no-repeat",
                 pointerEvents: "none" }}>
        <img src={`${URL}/${lid}.png`} alt="" draggable={false}
          style={{ position: "absolute", inset: 0, width: size, height: size,
                   transform: `translateY(${drop}px)`, willChange: "transform" }} />
        {rig!.lashline?.[side] && (
          <img src={`${URL}/${rig!.lashline[side]}.png`} alt="" draggable={false}
            style={{ position: "absolute", inset: 0, width: size, height: size,
                     transform: `translateY(${drop}px)`, willChange: "transform" }} />
        )}
      </div>
    );
  };

  // Dark eye-white border, drawn ABOVE the lid+lash so they're always visually
  // contained inside the eye outline (the lash can never bleed past the rim).
  // Static layer fixed to the eye (bob only) — does NOT slide with the blink.
  const eyerimEl = (side: "l" | "r") => {
    const rim = SRC.eyerim?.[side];
    if (!rim || happyEyesClosed) return null;
    if (tier === "web") {
      const base = placeStyle(rim);
      if (!base) return null;
      return (
        <div key={`rim-${side}`} aria-hidden
          style={{ ...base, transform: `translateY(${bob}px)`, willChange: "transform" }} />
      );
    }
    if (!rig!.meta[rim]) return null;
    return (
      <img key={`rim-${side}`} src={`${URL}/${rim}.png`} alt="" draggable={false}
        style={{ position: "absolute", inset: 0, width: size, height: size,
                 transform: `translateY(${bob}px)`, willChange: "transform" }} />
    );
  };

  // shared emit helper for plain layers (body/arms/legs/mouth/brows/bow/puppy)
  const emit = tier === "web" ? webImg : img;

  // resolve limb variants (fall back to defaults)
  const armRName = (armR && SRC.armR[armR]) ? armR : SRC.defaults.armR;
  const armLName = (armL && SRC.armL[armL]) ? armL : SRC.defaults.armL;
  const legsName = (legs && SRC.legs[legs]) ? legs : SRC.defaults.legs;
  // "wave" prop animates the right arm only if it's actually a waving pose
  const canWave = wave && armRName === "wave";

  // build the ordered stack, expanding swap slots
  const stack: React.ReactNode[] = [];
  for (const slot of SRC.order) {
    if (slot === "__legs__") {
      const l = SRC.legs[legsName];
      stack.push(emit(l.l, "leg"), emit(l.r, "leg"));
    } else if (slot === "__armL__") {
      stack.push(emit(SRC.armL[armLName], "arm_l"));
    } else if (slot === "__armR__") {
      stack.push(emit(SRC.armR[armRName], canWave ? "arm_r" : "arm_static"));
    } else if (slot === "__eyes__") {
      if (isPuppy) continue;                  // puppy replaces all eye features
      const e = SRC.eyes[eyeMood];            // static eye-whites, swap by mood
      stack.push(emit(e.l, "eye"), emit(e.r, "eye"));
    } else if (slot === "__pupils__") {
      if (isPuppy) continue;
      const p = SRC.pupils[pupilMood] || SRC.pupils.normal;
      stack.push(pupilEl("l", p.l), pupilEl("r", p.r));
    } else if (slot === "__eyelid__") {
      if (isPuppy) continue;
      stack.push(eyelidEl("l"), eyelidEl("r"));    // cut lids slide down to blink
      stack.push(eyerimEl("l"), eyerimEl("r"));    // dark eye border ON TOP of the lid
    } else if (slot === "__puppy__") {
      if (isPuppy && SRC.puppy) stack.push(emit(SRC.puppy, "puppy"));
    } else if (slot === "__mouth__") {
      stack.push(emit(mouthLayer, "mouth"));
    } else if ((slot === "eyebrow_l" || slot === "eyebrow_r") && isPuppy) {
      continue;                               // puppy has its own baked brows
    } else {
      stack.push(emit(slot, slot));
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
