// Gifty audio playback — recorded ElevenLabs voice clips + chat-specific SFX
// (see /public/gifty/audio/manifest.json). General UI sounds stay procedural in
// ./sounds. Respects the SAME mute toggle ("rory_sounds"), never autoplays, and
// rate-limits voice so rapid clicks don't stack overlapping audio.
import { isSoundMuted } from "./sounds";

const BASE = "/gifty/audio";

// Random-pick voice pools (interchangeable clips for one event).
const POOLS = {
  greeting: [
    "voice/greetings/gifty-1.mp3", "voice/greetings/gifty-2.mp3", "voice/greetings/gifty-3.mp3",
    "voice/greetings/gifty-4.mp3", "voice/greetings/gifty-5.mp3", "voice/greetings/gifty-6.mp3",
    "voice/greetings/hey-1.mp3", "voice/greetings/hey-2.mp3", "voice/greetings/hey-3.mp3",
  ],
  backchannel: [
    "voice/backchannel/ack-1.mp3", "voice/backchannel/ack-2.mp3", "voice/backchannel/ack-3.mp3",
    "voice/backchannel/ack-4.mp3", "voice/backchannel/ack-5.mp3", "voice/backchannel/ack-6.mp3",
  ],
  onboarding: ["voice/onboarding/welcome-1.mp3", "voice/onboarding/welcome-2.mp3"],
} satisfies Record<string, string[]>;
type Pool = keyof typeof POOLS;

// 1:1 named catchphrase lines for specific app moments.
const LINES = {
  welcome: "voice/lines/welcome.mp3",
  goalSet: "voice/lines/goal-set.mp3",
  giftIn: "voice/lines/gift-received.mp3",
  milestone: "voice/lines/milestone.mp3",
  empty: "voice/lines/empty-state.mp3",
  lowFees: "voice/lines/tagline-lowfees.mp3",
} satisfies Record<string, string>;
export type GiftyLine = keyof typeof LINES;

// Chat-specific SFX (general UI sounds live in ./sounds, procedural).
const SFX = {
  msgSend: "sfx/msg-send.mp3",
  msgReceive: "sfx/msg-receive.mp3",
  typingTick: "sfx/typing-tick.mp3",
  typingEllipsis: "sfx/typing-ellipsis.mp3",
  panelOpen: "sfx/panel-open.mp3",
  panelClose: "sfx/panel-close.mp3",
} satisfies Record<string, string>;
export type GiftySfx = keyof typeof SFX;
const THINKING_SRC = "sfx/thinking-pulse.mp3";

const url = (rel: string) => `${BASE}/${rel}`;

const VOICE_COOLDOWN_MS = 1200;   // voice never stacks; UI SFX are exempt
let lastVoiceAt = 0;
let currentVoice: HTMLAudioElement | null = null;
const lastFromPool: Partial<Record<Pool, string>> = {};

function muted(): boolean {
  return typeof window === "undefined" || isSoundMuted();
}

function playVoice(rel: string): void {
  const now = Date.now();
  if (muted() || now - lastVoiceAt < VOICE_COOLDOWN_MS) return;
  lastVoiceAt = now;
  if (currentVoice) { currentVoice.pause(); currentVoice = null; }
  const a = new Audio(url(rel));
  a.volume = 0.9;
  currentVoice = a;
  a.play().catch(() => {});   // always user-gesture-initiated; swallow autoplay rejects
  a.addEventListener("ended", () => { if (currentVoice === a) currentVoice = null; });
}

function pick(pool: Pool): string {
  let list: string[] = POOLS[pool];
  const last = lastFromPool[pool];
  if (list.length > 1 && last) list = list.filter((s) => s !== last);
  const chosen = list[Math.floor(Math.random() * list.length)];
  lastFromPool[pool] = chosen;
  return chosen;
}

/** Random greeting (click-to-greet face icon). */
export function playGiftyGreeting(): void { playVoice(pick("greeting")); }
/** Occasional soft ack when Gifty starts replying. */
export function playGiftyBackchannel(): void { playVoice(pick("backchannel")); }
/** Onboarding welcome line (random of the two). */
export function playGiftyOnboarding(): void { playVoice(pick("onboarding")); }
/** A specific named catchphrase for an app moment. */
export function playGiftyLine(line: GiftyLine): void { playVoice(LINES[line]); }

/** Fire a short chat SFX (not rate-limited; respects mute). */
export function playGiftySfx(name: GiftySfx): void {
  if (muted()) return;
  const a = new Audio(url(SFX[name]));
  a.volume = 0.5;
  a.play().catch(() => {});
}

// Looping "thinking" cue — start while generating, stop on first token.
let thinking: HTMLAudioElement | null = null;
export function startGiftyThinking(): void {
  if (muted() || thinking) return;
  thinking = new Audio(url(THINKING_SRC));
  thinking.loop = true;
  thinking.volume = 0.35;
  thinking.play().catch(() => {});
}
export function stopGiftyThinking(): void {
  if (!thinking) return;
  thinking.pause();
  thinking = null;
}
