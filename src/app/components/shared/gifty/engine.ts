/**
 * GiftyEngine — a tiny sprite-clip player with hub-and-spoke transitions.
 *
 * Frames live in per-clip horizontal sprite sheets (public/gifty/clips/<name>.png)
 * described by clips.json. The engine plays one clip on loop; on a state change it
 * routes through the idle hub so transitions never jump-cut:
 *
 *     current ──(door-out)──▶ idle ──(door-in)──▶ target
 *
 * "Bridging" the gap between a clip's doorway frame and idle's rest frame is
 * pluggable (BridgeStrategy): v1 ships "crossfade"; swap to "rife" once the
 * baked bridge frames exist — no engine changes, just a different strategy.
 *
 * Framework-agnostic: it computes which frame/clip/opacity to show at a given
 * time. The React layer (Gifty.tsx) just renders that.
 */

export type ClipName = string;

export interface ClipMeta {
  id: string;
  frames: number;
  tile: number;
  durations: number[]; // ms per frame
  doorIn: number;      // frame index closest to idle rest (the doorway)
  spokeClass: "hub" | "GREEN" | "YELLOW" | "RED";
}

export interface ClipsManifest {
  idle: ClipName;
  idleRest: number;
  tile: number;
  clips: Record<ClipName, ClipMeta>;
}

export type BridgeStrategy = "crossfade" | "rife" | "cut";

/** What the renderer should draw this tick. During a crossfade, `from` shows
 *  underneath at (1 - blend) and `to` on top at `blend`. */
export interface RenderState {
  clip: ClipName;
  frame: number;
  blend: number;        // 0 = no crossfade; >0 = crossfading into `next`
  next?: ClipName;
  nextFrame?: number;
}

const BRIDGE_MS = 180; // crossfade duration

type Phase =
  | { kind: "loop" }
  | { kind: "doorOut"; t: number }     // current clip → idle (crossfade)
  | { kind: "doorIn"; t: number };     // idle → target (crossfade)

export class GiftyEngine {
  private man: ClipsManifest;
  private bridge: BridgeStrategy;
  private cur: ClipName;
  private target: ClipName;
  private frame = 0;
  private frameClock = 0;     // ms accumulated on current frame
  private phase: Phase = { kind: "loop" };

  constructor(man: ClipsManifest, opts?: { bridge?: BridgeStrategy; start?: ClipName }) {
    this.man = man;
    this.bridge = opts?.bridge ?? "crossfade";
    this.cur = opts?.start ?? man.idle;
    this.target = this.cur;
  }

  /** Request a new state. Routes through idle unless already there/going there. */
  setState(next: ClipName) {
    if (!this.man.clips[next]) return;
    if (next === this.target) return;
    this.target = next;
    // begin leaving the current clip toward idle (or straight in if we ARE idle)
    if (this.cur === this.man.idle) {
      this.phase = { kind: "doorIn", t: 0 };
      this.frame = this.man.idleRest;
    } else {
      this.phase = { kind: "doorOut", t: 0 };
    }
  }

  private dur(clip: ClipName, frame: number) {
    const d = this.man.clips[clip].durations;
    return d[frame] ?? 60;
  }

  /** Advance by dtMs; returns what to render. */
  tick(dtMs: number): RenderState {
    if (this.bridge === "cut") return this.tickCut(dtMs);
    return this.tickCrossfade(dtMs);
  }

  private stepFrame(dtMs: number, clip: ClipName, loop: boolean): "looped" | "playing" {
    this.frameClock += dtMs;
    let looped: "looped" | "playing" = "playing";
    while (this.frameClock >= this.dur(clip, this.frame)) {
      this.frameClock -= this.dur(clip, this.frame);
      this.frame++;
      if (this.frame >= this.man.clips[clip].frames) {
        this.frame = loop ? 0 : this.man.clips[clip].frames - 1;
        looped = "looped";
        if (!loop) break;
      }
    }
    return looped;
  }

  private tickCrossfade(dtMs: number): RenderState {
    const idle = this.man.idle;
    switch (this.phase.kind) {
      case "loop": {
        this.stepFrame(dtMs, this.cur, true);
        return { clip: this.cur, frame: this.frame, blend: 0 };
      }
      case "doorOut": {
        // crossfade current(doorIn frame) → idle(rest)
        this.phase.t += dtMs;
        const blend = Math.min(1, this.phase.t / BRIDGE_MS);
        const fromFrame = this.man.clips[this.cur].doorIn;
        if (blend >= 1) {
          this.cur = idle;
          this.frame = this.man.idleRest;
          this.frameClock = 0;
          // if target is idle, settle; else continue inward
          this.phase = this.target === idle ? { kind: "loop" } : { kind: "doorIn", t: 0 };
          return { clip: idle, frame: this.man.idleRest, blend: 0 };
        }
        return { clip: this.cur, frame: fromFrame, blend, next: idle, nextFrame: this.man.idleRest };
      }
      case "doorIn": {
        // crossfade idle(rest) → target(doorIn frame), then play target
        this.phase.t += dtMs;
        const blend = Math.min(1, this.phase.t / BRIDGE_MS);
        const toFrame = this.man.clips[this.target].doorIn;
        if (blend >= 1) {
          this.cur = this.target;
          this.frame = toFrame;
          this.frameClock = 0;
          this.phase = { kind: "loop" };
          return { clip: this.cur, frame: toFrame, blend: 0 };
        }
        return { clip: idle, frame: this.man.idleRest, blend, next: this.target, nextFrame: toFrame };
      }
    }
  }

  /** Hard-cut variant (used when reduced-motion is off but we want zero blend,
   *  or as a debug mode). Jumps straight to target's doorway. */
  private tickCut(dtMs: number): RenderState {
    if (this.cur !== this.target) {
      this.cur = this.target;
      this.frame = this.man.clips[this.target].doorIn;
      this.frameClock = 0;
    }
    this.stepFrame(dtMs, this.cur, true);
    return { clip: this.cur, frame: this.frame, blend: 0 };
  }

  /** Static rest pose — for prefers-reduced-motion. */
  restState(): RenderState {
    return { clip: this.man.idle, frame: this.man.idleRest, blend: 0 };
  }

  get current() { return this.cur; }
}
