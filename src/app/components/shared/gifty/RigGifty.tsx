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
  eyesClosed?: string[];                 // eye keys that are closed-arc (hide pupils/lid/rim)
  pupils: Record<string, { l: string; r: string }>;
  eyelid?: { l?: string; r?: string };  // cut eyelid layers (slide down to blink)
  lashline?: { l?: string; r?: string };// crisp lighter border on the lid bottom edge
  eyerim?: { l?: string; r?: string };  // dark eye-white border, drawn ABOVE the lid so the lid/lash stay inside it
  lidRest?: { l?: number; r?: number }; // per-eye rest nudge (frac) to even the lids
  eyeMask?: Record<string, { l?: string; r?: string }>; // white-only clip per mood
  puppy?: string | null;                // standalone baked bashful look
  puppyRest?: number;                   // frac nudge for the puppy layer (align to sockets)
  legRise?: number;                     // frac nudge legs UP so tops tuck under the breathing body
  armBehind?: { armR?: string[]; armL?: string[] }; // BEHIND allowlist (right arm: front-by-default)
  armFront?: { armR?: string[]; armL?: string[] };  // FRONT allowlist (left arm: behind-by-default)
  armNudge?: { armR?: Record<string, number>; armL?: Record<string, number> }; // per-pose x scootch (frac, + = away from body center)
  // poses split into a behind-body part + an in-front part (e.g. head-scratch: upper
  // arm behind the cube, forearm+hand in front)
  armSplit?: { armR?: Record<string, { behind: string; front: string }>;
               armL?: Record<string, { behind: string; front: string }> };
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
  proud: "normal", shy: "normal", thinking: "normal", puppy: "normal",
};
const MOOD_MOUTH: Record<Mood, string> = {
  // smug = half-lidded eyes + gentle smile (sly); proud = open eyes + big toothy grin
  normal: "smile", happy: "talk_oh", smug: "smile",
  proud: "proud", shy: "shy", thinking: "hmm", puppy: "shy",
};
const TALK_CYCLE = ["talk_ah", "smile", "talk_oh", "talk_eh", "smile"];

// Eyebrow POSITIONS (a primitive, like eyes/mouths). The single baked brow art is
// transformed at render time: dy = vertical raise/lower (frac of size, − is up),
// rot = inner-end angle in degrees (+ pulls the INNER end down = angry; − lifts the
// inner end = worried/sad). Per-side rot is mirrored so the pair reads symmetric.
export type BrowPos = "neutral" | "raised" | "lowered" | "angry" | "worried" | "skeptical";
const BROW_POS: Record<BrowPos, { dy: number; rot: number; skewOne?: boolean }> = {
  neutral:    { dy: 0,      rot: 0 },
  raised:     { dy: -0.030, rot: 0 },      // both up — surprise/attention
  lowered:    { dy: 0.022,  rot: 0 },      // both down — focus/serious
  angry:      { dy: 0.010,  rot: 12 },     // inner ends down — anger/determination
  worried:    { dy: -0.006, rot: -12 },    // inner ends up — worry/sad/plead
  skeptical:  { dy: -0.018, rot: 0, skewOne: true }, // one raised — doubt/smirk
};

const URL = "/gifty/rig-layers";
const reduced = () =>
  typeof window !== "undefined" && window.matchMedia?.("(prefers-reduced-motion: reduce)").matches;

export function RigGifty({
  size = 320, mood = "normal", talking = false, wave = false,
  armR, armL, legs, brow = "neutral", eyes, mouth, tier = "web",
}: { size?: number; mood?: Mood; talking?: boolean; wave?: boolean;
     armR?: string; armL?: string; legs?: string; brow?: BrowPos;
     // direct primitive overrides (take precedence over `mood`) — for the tester/AI
     eyes?: string; mouth?: string; tier?: "web" | "hq" }) {
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
  // attention pulse for thumbsup/wave arms: a subtle periodic scale bump every ~2.5s
  // (always-on idle), stronger when the `wave` gesture prop is active.
  const pulsePhase = isStatic ? 0 : Math.max(0, Math.sin(t * (2 * Math.PI / 2.5)));
  const idlePulse = isStatic ? 0 : pulsePhase * pulsePhase * 0.05;   // ≤5% scale
  const wavePulse = isStatic ? 0 : pulsePhase * pulsePhase * 0.09;   // stronger when waving

  // resolve active swap layers. Direct `eyes`/`mouth` props override the mood map
  // (the AI/tester drives primitives directly; `mood` is just a convenience preset).
  const eyeMood = (eyes && eyes in SRC.eyes) ? eyes
    : (MOOD_EYES[mood] in SRC.eyes ? MOOD_EYES[mood] : SRC.defaults.eyes);
  const pupilMood = SRC.defaults.pupils;
  const mouthName = talking ? TALK_CYCLE[viseme]
    : (mouth && mouth in SRC.mouths) ? mouth
    : (MOOD_MOUTH[mood] || SRC.defaults.mouth);
  const mouthLayer = SRC.mouths[mouthName] || SRC.mouths[SRC.defaults.mouth];
  // a "closed-arc" eye set (hides pupils + lid + rim). Data-driven so it follows the
  // art, not the key name (the smug/happy art was relabeled to match its shape).
  const happyEyesClosed = (SRC.eyesClosed ?? ["happy"]).includes(eyeMood);

  // Per-kind animation transform — SHARED by the HQ `img()` and the web `webImg()`
  // so both paths get byte-identical motion (bob/breathe/bow/wave/sniffle). The
  // HQ path can pass the layer's `cx,cy` for a precise pivot; the web path uses the
  // sprite's own box center ("center"), which coincides with the layer center.
  const legRise = (SRC.legRise ?? 0) * size;    // nudge legs UP so tops tuck under body
  const puppyRise = (SRC.puppyRest ?? 0) * size; // align puppy to the normal sockets (negative = up)
  const kindTransform = (kind: string, b?: Box): { transform: string; pivot: string } => {
    let pivot = b ? `${b.cx * 100}% ${b.cy * 100}%` : "center";
    let transform = `translateY(${bob}px)`;
    if (kind === "body") transform = `translateY(${bob}px) scale(${1 + breathe})`;
    else if (kind === "bow") transform = `translateY(${bob + bowBob}px)`;
    else if (kind === "eyebrow_l" || kind === "eyebrow_r") {
      const bp = BROW_POS[brow] ?? BROW_POS.neutral;
      const isL = kind === "eyebrow_l";
      // mirror the inner-end angle per side; skeptical raises only the LEFT brow
      const rot = bp.rot * (isL ? -1 : 1);
      const dy = bp.dy + (bp.skewOne && !isL ? 0.026 : 0);   // right brow stays low for skeptical
      transform = `translateY(${bob + dy * size}px) rotate(${rot}deg)`;
      pivot = b ? `${(isL ? b.x + b.w : b.x) * 100}% ${b.cy * 100}%` : "center"; // rotate from the OUTER end
    }
    else if (kind === "leg") transform = `translateY(${bob - legRise}px)`;   // tuck under the body
    else if (kind === "arm_wave") {
      // active wave gesture: swing from the shoulder + a stronger attention pulse
      transform = `translateY(${bob}px) rotate(${waveAng}deg) scale(${1 + wavePulse})`;
      pivot = b ? `${b.cx * 100}% ${(b.y + b.h) * 100}%` : "center bottom";
    }
    else if (kind === "arm_pulse") {
      // thumbsup/wave at rest: subtle always-on attention pulse from the shoulder
      transform = `translateY(${bob}px) scale(${1 + idlePulse})`;
      pivot = b ? `${b.cx * 100}% ${(b.y + b.h) * 100}%` : "center bottom";
    }
    else if (kind === "eye") {
      transform = `translateY(${bob}px)`;       // eye-whites are STATIC (no blink scale)
    }
    else if (kind === "puppy") {
      // subtle sniffle: tiny vertical stretch + faster bob (barely noticeable)
      const sniff = isStatic ? 1 : 1 + Math.sin(t * 4.2) * 0.012;
      transform = `translateY(${bob + puppyRise}px) scaleY(${sniff})`;
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
  const isPuppy = (mood === "puppy" || eyes === "puppy") && SRC.puppy;

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
      if (!lidBase) return null;
      const lashLayer = SRC.lashline?.[side];
      const lashBase = lashLayer ? fullCanvasSpriteStyle(lashLayer) : null;
      // Mask with the INDIVIDUAL eye-white PNG at 100% 100% — the SAME mask the HQ
      // path uses (atlas-based CSS masking did not clip reliably across browsers).
      // The lid + lash are full-canvas atlas divs sliding INSIDE the mask by `drop`,
      // so they're revealed only within the eye-white shape.
      const maskUrl = `url(${URL}/${maskLayer}.png)`;
      return (
        <div key={`lid-${side}`} aria-hidden
          style={{ position: "absolute", inset: 0, width: size, height: size,
                   transform: `translateY(${bob}px)`,
                   WebkitMaskImage: maskUrl, maskImage: maskUrl,
                   WebkitMaskSize: "100% 100%", maskSize: "100% 100%",
                   WebkitMaskRepeat: "no-repeat", maskRepeat: "no-repeat",
                   pointerEvents: "none" }}>
          <div style={{ ...lidBase, transform: `translateY(${drop}px)`, willChange: "transform" }} />
          {lashBase && (
            // the lash is a resting-edge accent; fade it out as the eye closes so it
            // never reads as a hard light band sliding across the shut lid.
            <div style={{ ...lashBase, transform: `translateY(${drop}px)`, opacity: 1 - blink, willChange: "transform, opacity" }} />
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
          // fade the lash out as the eye closes (matches the web path) so it never
          // reads as a hard light band sliding across the shut lid.
          <img src={`${URL}/${rig!.lashline[side]}.png`} alt="" draggable={false}
            style={{ position: "absolute", inset: 0, width: size, height: size,
                     transform: `translateY(${drop}px)`, opacity: 1 - blink, willChange: "transform, opacity" }} />
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
  // the `wave` gesture drives whichever arm is actually in the wave pose (L and/or R)
  const waveR = wave && armRName === "wave";
  const waveL = wave && armLName === "wave";
  // a thumbsup/wave arm gets the attention pulse even without the wave prop
  const pulses = (name: string) => name === "thumbsup" || name === "wave";
  const armKind = (side: "l" | "r", name: string) =>
    (side === "r" ? waveR : waveL) ? "arm_wave" : (pulses(name) ? "arm_pulse" : `arm_${side}`);
  // Z-class: an arm tucks BEHIND the body unless it's a cross-front pose.
  // - armFront[side] = explicit FRONT allowlist (used for the LEFT arm, which is
  //   behind-by-default since it attaches at the side).
  // - armBehind[side] = explicit BEHIND allowlist (used for the RIGHT arm, which
  //   extends outward and is front-by-default).
  // If a side has neither list it stays front. armFront wins if both name it.
  const behind = (side: "armR" | "armL", name: string) => {
    const front = SRC.armFront?.[side];
    const back = SRC.armBehind?.[side];
    if (front && front.includes(name)) return false;
    if (front && !back) return true;          // front-list present → behind by default
    return (back ?? []).includes(name);       // behind-list semantics
  };
  const armLBehind = behind("armL", armLName);
  const armRBehind = behind("armR", armRName);
  // per-pose x scootch so buried arms clear the body (R nudges right +x, L left −x)
  const nudgeX = (side: "armR" | "armL", name: string) => {
    const n = (SRC.armNudge?.[side]?.[name] ?? 0) * size;
    return side === "armR" ? n : -n;
  };
  const withNudge = (node: React.ReactNode, dx: number, key: string) =>
    dx === 0 ? node : (
      <div key={key} style={{ position: "absolute", inset: 0, transform: `translateX(${dx}px)` }}>{node}</div>
    );
  const splitL = SRC.armSplit?.armL?.[armLName];
  const splitR = SRC.armSplit?.armR?.[armRName];
  // emit one part of an arm (a layer name) with the pose's kind + nudge
  const emitArmPart = (side: "l" | "r", name: string, layer: string, key: string) =>
    withNudge(emit(layer, armKind(side, name)), nudgeX(side === "l" ? "armL" : "armR", name), key);
  const emitArmL = () => splitL ? emitArmPart("l", armLName, splitL.front, `aLf-${armLName}`)
    : emitArmPart("l", armLName, SRC.armL[armLName], `aL-${armLName}`);
  const emitArmR = () => splitR ? emitArmPart("r", armRName, splitR.front, `aRf-${armRName}`)
    : emitArmPart("r", armRName, SRC.armR[armRName], `aR-${armRName}`);

  // build the ordered stack, expanding swap slots
  const stack: React.ReactNode[] = [];
  for (const slot of SRC.order) {
    if (slot === "body") {
      // Before the body: split poses' BEHIND part (upper arm tucks behind the cube);
      // and whole non-split arms whose pose is classified behind-body.
      if (splitL) stack.push(emitArmPart("l", armLName, splitL.behind, `aLb-${armLName}`));
      else if (armLBehind) stack.push(emitArmL());
      if (splitR) stack.push(emitArmPart("r", armRName, splitR.behind, `aRb-${armRName}`));
      else if (armRBehind) stack.push(emitArmR());
      stack.push(emit("body", "body"));
    } else if (slot === "__legs__") {
      const l = SRC.legs[legsName];
      stack.push(emit(l.l, "leg"), emit(l.r, "leg"));
    } else if (slot === "__armL__") {
      // split poses always render their FRONT part here; non-split front arms too
      if (splitL || !armLBehind) stack.push(emitArmL());
    } else if (slot === "__armR__") {
      if (splitR || !armRBehind) stack.push(emitArmR());
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
