// All sounds procedurally generated via Web Audio API — zero bundle size.
// Mute state stored in localStorage key "tipflow_sounds".

let _ctx: AudioContext | null = null;

function ctx(): AudioContext {
  if (!_ctx) _ctx = new AudioContext();
  if (_ctx.state === "suspended") _ctx.resume();
  return _ctx;
}

function isMuted(): boolean {
  return localStorage.getItem("tipflow_sounds") === "muted";
}

export function toggleMute(): boolean {
  const nowMuted = !isMuted();
  localStorage.setItem("tipflow_sounds", nowMuted ? "muted" : "on");
  return nowMuted;
}

export function isSoundMuted(): boolean {
  return isMuted();
}

function tone(
  freq: number,
  duration: number,
  type: OscillatorType = "sine",
  gainPeak = 0.3,
  startOffset = 0,
): void {
  const c = ctx();
  const osc = c.createOscillator();
  const gain = c.createGain();
  osc.connect(gain);
  gain.connect(c.destination);
  osc.type = type;
  osc.frequency.setValueAtTime(freq, c.currentTime + startOffset);
  gain.gain.setValueAtTime(0, c.currentTime + startOffset);
  gain.gain.linearRampToValueAtTime(gainPeak, c.currentTime + startOffset + 0.01);
  gain.gain.exponentialRampToValueAtTime(0.001, c.currentTime + startOffset + duration);
  osc.start(c.currentTime + startOffset);
  osc.stop(c.currentTime + startOffset + duration + 0.05);
}

function noise(duration: number, gainPeak = 0.15, startOffset = 0): void {
  const c = ctx();
  const bufLen = Math.ceil(c.sampleRate * duration);
  const buf = c.createBuffer(1, bufLen, c.sampleRate);
  const data = buf.getChannelData(0);
  for (let i = 0; i < bufLen; i++) data[i] = Math.random() * 2 - 1;
  const src = c.createBufferSource();
  src.buffer = buf;
  const gain = c.createGain();
  src.connect(gain);
  gain.connect(c.destination);
  gain.gain.setValueAtTime(gainPeak, c.currentTime + startOffset);
  gain.gain.exponentialRampToValueAtTime(0.001, c.currentTime + startOffset + duration);
  src.start(c.currentTime + startOffset);
  src.stop(c.currentTime + startOffset + duration + 0.05);
}

export const Sounds = {
  click() {
    if (isMuted()) return;
    tone(800, 0.08, "square", 0.15);
  },

  // Softer click for tabs and toggles
  softClick() {
    if (isMuted()) return;
    tone(600, 0.07, "sine", 0.1);
  },

  // Subtle hover — very quiet whoosh
  hover() {
    if (isMuted()) return;
    tone(1200, 0.05, "sine", 0.05);
  },

  // Positive success chime
  success() {
    if (isMuted()) return;
    tone(659, 0.1, "sine", 0.2, 0);
    tone(880, 0.15, "sine", 0.25, 0.08);
  },

  // Subtle error buzz
  error() {
    if (isMuted()) return;
    tone(220, 0.12, "sawtooth", 0.12, 0);
    tone(180, 0.1, "sawtooth", 0.1, 0.08);
  },

  // Pop — for toasts/popups appearing
  pop() {
    if (isMuted()) return;
    tone(1000, 0.06, "sine", 0.18, 0);
    tone(1300, 0.06, "sine", 0.12, 0.04);
  },

  // Page/route transition whoosh
  pageTransition() {
    if (isMuted()) return;
    const c = ctx();
    const osc = c.createOscillator();
    const gain = c.createGain();
    osc.connect(gain);
    gain.connect(c.destination);
    osc.type = "sine";
    osc.frequency.setValueAtTime(400, c.currentTime);
    osc.frequency.exponentialRampToValueAtTime(800, c.currentTime + 0.12);
    gain.gain.setValueAtTime(0.12, c.currentTime);
    gain.gain.exponentialRampToValueAtTime(0.001, c.currentTime + 0.15);
    osc.start(c.currentTime);
    osc.stop(c.currentTime + 0.18);
  },

  // Soft achievement sound for creator dashboard (less aggressive)
  achievement() {
    if (isMuted()) return;
    tone(523, 0.15, "sine", 0.18, 0);
    tone(659, 0.15, "sine", 0.15, 0.12);
    tone(784, 0.2,  "sine", 0.2,  0.22);
  },

  gift() {
    if (isMuted()) return;
    const c = ctx();
    const osc = c.createOscillator();
    const gain = c.createGain();
    osc.connect(gain);
    gain.connect(c.destination);
    osc.type = "sine";
    osc.frequency.setValueAtTime(300, c.currentTime);
    osc.frequency.exponentialRampToValueAtTime(1200, c.currentTime + 0.25);
    gain.gain.setValueAtTime(0.2, c.currentTime);
    gain.gain.exponentialRampToValueAtTime(0.001, c.currentTime + 0.35);
    osc.start(c.currentTime);
    osc.stop(c.currentTime + 0.4);
    tone(2200, 0.12, "triangle", 0.25, 0.28);
    tone(1800, 0.1,  "triangle", 0.2,  0.35);
  },

  xp() {
    if (isMuted()) return;
    tone(523, 0.12, "sine", 0.25, 0);
    tone(659, 0.12, "sine", 0.25, 0.1);
    tone(784, 0.18, "sine", 0.3,  0.2);
  },

  levelup() {
    if (isMuted()) return;
    tone(523,  0.5,  "triangle", 0.3,  0);
    tone(659,  0.5,  "triangle", 0.25, 0);
    tone(784,  0.5,  "triangle", 0.2,  0);
    tone(1046, 0.3,  "sine",     0.35, 0.3);
    tone(1568, 0.25, "sine",     0.3,  0.45);
    tone(2093, 0.2,  "sine",     0.25, 0.55);
  },

  streak() {
    if (isMuted()) return;
    noise(0.15, 0.2,  0);
    noise(0.1,  0.15, 0.08);
    noise(0.12, 0.18, 0.15);
  },

  quest() {
    if (isMuted()) return;
    tone(659, 0.15, "sine", 0.3,  0);
    tone(880, 0.25, "sine", 0.35, 0.12);
  },

  badge() {
    if (isMuted()) return;
    tone(523,  0.12, "triangle", 0.3,  0);
    tone(659,  0.12, "triangle", 0.3,  0.1);
    tone(784,  0.12, "triangle", 0.3,  0.2);
    tone(1046, 0.35, "triangle", 0.35, 0.3);
  },

  funded() {
    if (isMuted()) return;
    tone(1046, 0.4, "sine", 0.4,  0);
    tone(1318, 0.4, "sine", 0.35, 0.18);
    tone(1568, 0.5, "sine", 0.45, 0.36);
  },

  promotion() {
    if (isMuted()) return;
    const c = ctx();
    const osc = c.createOscillator();
    const gain = c.createGain();
    osc.connect(gain);
    gain.connect(c.destination);
    osc.type = "sawtooth";
    osc.frequency.setValueAtTime(200, c.currentTime);
    osc.frequency.exponentialRampToValueAtTime(1600, c.currentTime + 0.6);
    gain.gain.setValueAtTime(0.25, c.currentTime);
    gain.gain.exponentialRampToValueAtTime(0.001, c.currentTime + 0.7);
    osc.start(c.currentTime);
    osc.stop(c.currentTime + 0.75);
  },
};
