// Gifty voice-over playback — plays the recorded ElevenLabs greeting/reaction
// clips (mp3s in /public/gifty/voice). Respects the SAME mute toggle as the
// procedural Sounds (localStorage "rory_sounds"), never autoplays, and rate-limits
// so rapid clicks don't stack overlapping audio.
import { isSoundMuted } from "./sounds";

const BASE = "/gifty/voice";

// Pools of interchangeable clips. The face-icon click picks one at random from
// `greetings`. Fill `greetings` with the chosen short reaction clips once selected
// (e.g. greetings/gifty-1.mp3, hey-1.mp3, …). Single-purpose lines below are 1:1.
const POOLS = {
  greetings: [
    // populated from public/gifty/voice/greetings/ once the keepers are chosen
  ] as string[],
};

// Single-purpose lines for specific app moments (1:1, not a random pool).
const LINES = {
  welcome: `${BASE}/01_welcome.mp3`,
  goalSet: `${BASE}/02_goal_set.mp3`,
  giftIn: `${BASE}/03_gift_in.mp3`,
  milestone: `${BASE}/04_milestone.mp3`,
  empty: `${BASE}/05_empty.mp3`,
  lowFees: `${BASE}/06_lowfees.mp3`,
} as const;

export type GiftyLine = keyof typeof LINES;

const COOLDOWN_MS = 1200;        // ignore re-triggers within this window
let lastPlayed = 0;
let current: HTMLAudioElement | null = null;
let lastGreetingSrc: string | null = null;   // avoid repeating the same greeting twice

function canPlay(): boolean {
  if (typeof window === "undefined") return false;
  if (isSoundMuted()) return false;
  const now = Date.now();
  if (now - lastPlayed < COOLDOWN_MS) return false;
  lastPlayed = now;
  return true;
}

function play(src: string): void {
  // stop any clip still playing so they never overlap
  if (current) { current.pause(); current = null; }
  const a = new Audio(src);
  a.volume = 0.9;
  current = a;
  // play() returns a promise that rejects if the browser blocks it — swallow it;
  // this is always user-gesture-initiated (a click), so it normally succeeds.
  a.play().catch(() => {});
  a.addEventListener("ended", () => { if (current === a) current = null; });
}

/** Play one random greeting from the pool (for the click-to-greet face icon). */
export function playGiftyGreeting(): void {
  if (!canPlay() || POOLS.greetings.length === 0) return;
  let pool = POOLS.greetings;
  if (pool.length > 1 && lastGreetingSrc) pool = pool.filter((s) => s !== lastGreetingSrc);
  const src = pool[Math.floor(Math.random() * pool.length)];
  lastGreetingSrc = src;
  play(src);
}

/** Play a specific named line for an app moment (welcome, giftIn, …). */
export function playGiftyLine(line: GiftyLine): void {
  if (!canPlay()) return;
  play(LINES[line]);
}

/** Register the greeting pool (call once with the chosen clip filenames). */
export function setGiftyGreetings(files: string[]): void {
  POOLS.greetings = files.map((f) => (f.startsWith("/") ? f : `${BASE}/greetings/${f}`));
}
