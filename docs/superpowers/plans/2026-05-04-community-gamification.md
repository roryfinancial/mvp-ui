# Community Gamification Implementation Plan

> **For agentic workers:** REQUIRED SUB-SKILL: Use superpowers:subagent-driven-development (recommended) or superpowers:executing-plans to implement this plan task-by-task. Steps use checkbox (`- [ ]`) syntax for tracking.

**Goal:** Replace the supporter dashboard with a full Duolingo/casino community hub featuring XP, streaks, leagues, daily quests, badges, a live ticker feed, and a recommendation engine — while adding milestone celebration sounds to the creator workspace.

**Architecture:** Seeded in-memory data (no backend). Gamification state lives in `gamification.ts`, feed/event seed data in `store.ts`. A new `CommunityHub.tsx` replaces `SupporterDashboard.tsx` at `/supporter`. Sound effects are Web Audio API procedural (zero bundle size). Gamification state flows App → Navbar → XPBar as props.

**Tech Stack:** React 19, TypeScript, Tailwind CSS v4, motion/react, Web Audio API, react-router-dom v7

---

## File Map

**Create:**
- `src/lib/gamification.ts` — XP/level/streak/league logic + seeded demo state
- `src/lib/sounds.ts` — Web Audio API sound engine (procedural, no files)
- `src/app/components/XPBar.tsx` — Inline navbar XP progress bar + league pill + streak pill
- `src/app/components/LiveTicker.tsx` — Scrolling casino-floor event feed
- `src/app/components/DailyQuests.tsx` — 3 daily quests card
- `src/app/components/CreatorCard.tsx` — Single creator feed card
- `src/app/components/CommunityFeed.tsx` — Tabbed feed (Following/Hot/Explore/Rising)
- `src/app/components/GamificationSidebar.tsx` — XP block + streak + league + leaderboard + badges
- `src/app/components/CommunityHub.tsx` — Top-level supporter page

**Modify:**
- `src/lib/types.ts` — Add `GamificationState`, `FeedEvent`, `DailyQuest`, `CreatorFeedItem`, `LeagueTier`, `BadgeId`
- `src/lib/store.ts` — Add seed data + `getGamificationState()`, `getFeedEvents()`, `getRecommendedCreators()`, `getDailyQuests()`
- `src/app/components/Navbar.tsx` — Add optional `gamification` prop, render XPBar for supporters, add click sounds
- `src/app/App.tsx` — Import/route `CommunityHub`, pass `gamification` state to Navbar
- `src/app/components/CreatorDashboard.tsx` — Add milestone celebration (funded sound + confetti) when item hits 100%

---

### Task 1: Extend types.ts with gamification types

**Files:**
- Modify: `src/lib/types.ts`

- [ ] **Step 1: Add gamification types**

Append to the bottom of `src/lib/types.ts`:

```ts
// ─── Gamification ─────────────────────────────────────────────────────────────

export type LeagueTier = "bronze" | "silver" | "gold" | "diamond";

export type BadgeId =
  | "early_adopter"
  | "streak_lord"
  | "big_spender"
  | "first_gift"
  | "league_leader"
  | "jackpot"
  | "speed_gifter"
  | "century_club"
  | "diamond_gifter"
  | "variety_pack"
  | "mystery_1"
  | "mystery_2";

export interface GamificationState {
  xp: number;
  level: number;
  streakDays: number;
  lastActivityDate: string; // ISO date YYYY-MM-DD
  leagueTier: LeagueTier;
  weeklyGifted: number;
  badges: BadgeId[];
  questsCompletedToday: string[]; // quest IDs
}

export interface FeedEvent {
  id: string;
  type: "gift" | "follow" | "milestone" | "new_item" | "league_up" | "streak";
  actorName: string;
  targetName: string;
  amount?: number;
  timestamp: string; // ISO
}

export interface DailyQuest {
  id: string;
  difficulty: "easy" | "medium" | "hard";
  label: string;
  xpReward: number;
  completed: boolean;
  locked: boolean; // hard is locked until easy done
}

export interface CreatorFeedItem {
  id: string;
  creatorName: string;
  username: string;
  avatarInitials: string;
  avatarColor: string; // tailwind bg class
  itemTitle: string;
  itemDescription: string;
  goalAmount: number;
  raisedAmount: number;
  gifterCount: number;
  giftsToday: number;
  daysLeft: number;
  createdAt: string; // ISO
  giftsLast24h: number;
  tags: string[]; // "following" | "trending" | "new" | "rising"
}
```

- [ ] **Step 2: Verify TypeScript compiles**

```bash
cd /Users/aap/Desktop/startup-scratchpad/apr21 && npx tsc --noEmit 2>&1 | head -20
```

Expected: no errors (or only pre-existing ones unrelated to types.ts).

- [ ] **Step 3: Commit**

```bash
git add src/lib/types.ts
git commit -m "feat: add gamification types (GamificationState, FeedEvent, DailyQuest, CreatorFeedItem)"
```

---

### Task 2: Create gamification.ts — logic + seeded state

**Files:**
- Create: `src/lib/gamification.ts`

- [ ] **Step 1: Create the file**

Create `src/lib/gamification.ts`:

```ts
import type { GamificationState, LeagueTier, BadgeId } from "./types";

// XP required to reach a level: 100 * level^2
export function xpForLevel(level: number): number {
  return 100 * level * level;
}

// Total XP accumulated to reach the START of a level
export function totalXpAtLevel(level: number): number {
  let total = 0;
  for (let l = 1; l < level; l++) total += xpForLevel(l);
  return total;
}

// Derive level from total XP
export function levelFromXp(xp: number): number {
  let level = 1;
  let accumulated = 0;
  while (level < 50) {
    const needed = xpForLevel(level);
    if (accumulated + needed > xp) break;
    accumulated += needed;
    level++;
  }
  return level;
}

// XP progress within the current level (0 to xpForLevel(level)-1)
export function xpProgress(xp: number): { current: number; needed: number; pct: number } {
  const level = levelFromXp(xp);
  const base = totalXpAtLevel(level);
  const current = xp - base;
  const needed = xpForLevel(level);
  return { current, needed, pct: Math.min(current / needed, 1) };
}

export function leagueBadgeColor(tier: LeagueTier): string {
  const map: Record<LeagueTier, string> = {
    bronze: "text-amber-600",
    silver: "text-slate-400",
    gold: "text-yellow-400",
    diamond: "text-cyan-400",
  };
  return map[tier];
}

export function leagueLabel(tier: LeagueTier): string {
  return tier.charAt(0).toUpperCase() + tier.slice(1);
}

// Seeded demo gamification state for the supporter account
export const DEMO_GAMIFICATION: GamificationState = {
  xp: 3200,
  level: levelFromXp(3200), // will be 5
  streakDays: 7,
  lastActivityDate: "2026-05-02",
  leagueTier: "gold",
  weeklyGifted: 185,
  badges: ["early_adopter", "first_gift", "variety_pack"] as BadgeId[],
  questsCompletedToday: ["quest-easy"],
};
```

- [ ] **Step 2: Verify TypeScript compiles**

```bash
cd /Users/aap/Desktop/startup-scratchpad/apr21 && npx tsc --noEmit 2>&1 | head -20
```

Expected: no errors.

- [ ] **Step 3: Commit**

```bash
git add src/lib/gamification.ts
git commit -m "feat: add gamification logic (XP/level/streak/league utilities + demo seed state)"
```

---

### Task 3: Create sounds.ts — Web Audio API sound engine

**Files:**
- Create: `src/lib/sounds.ts`

- [ ] **Step 1: Create the file**

Create `src/lib/sounds.ts`:

```ts
// All sounds procedurally generated — zero bundle size.
// Mute toggle stored in localStorage key "tipflow_sounds".

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
  const muted = !isMuted();
  localStorage.setItem("tipflow_sounds", muted ? "muted" : "on");
  return muted;
}

export function isSoundMuted(): boolean {
  return isMuted();
}

function tone(
  freq: number,
  duration: number,
  type: OscillatorType = "sine",
  gainPeak = 0.3,
  startTime = 0,
): void {
  const c = ctx();
  const osc = c.createOscillator();
  const gain = c.createGain();
  osc.connect(gain);
  gain.connect(c.destination);
  osc.type = type;
  osc.frequency.setValueAtTime(freq, c.currentTime + startTime);
  gain.gain.setValueAtTime(0, c.currentTime + startTime);
  gain.gain.linearRampToValueAtTime(gainPeak, c.currentTime + startTime + 0.01);
  gain.gain.exponentialRampToValueAtTime(0.001, c.currentTime + startTime + duration);
  osc.start(c.currentTime + startTime);
  osc.stop(c.currentTime + startTime + duration + 0.05);
}

function noise(duration: number, gainPeak = 0.15, startTime = 0): void {
  const c = ctx();
  const bufLen = c.sampleRate * duration;
  const buf = c.createBuffer(1, bufLen, c.sampleRate);
  const data = buf.getChannelData(0);
  for (let i = 0; i < bufLen; i++) data[i] = Math.random() * 2 - 1;
  const src = c.createBufferSource();
  src.buffer = buf;
  const gain = c.createGain();
  src.connect(gain);
  gain.connect(c.destination);
  gain.gain.setValueAtTime(gainPeak, c.currentTime + startTime);
  gain.gain.exponentialRampToValueAtTime(0.001, c.currentTime + startTime + duration);
  src.start(c.currentTime + startTime);
  src.stop(c.currentTime + startTime + duration + 0.05);
}

export const Sounds = {
  click() {
    if (isMuted()) return;
    tone(800, 0.08, "square", 0.15);
  },

  gift() {
    if (isMuted()) return;
    // ascending whoosh
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
    // coin clink
    tone(2200, 0.12, "triangle", 0.25, 0.28);
    tone(1800, 0.1, "triangle", 0.2, 0.35);
  },

  xp() {
    if (isMuted()) return;
    // ascending 3-note ding C5-E5-G5
    tone(523, 0.12, "sine", 0.25, 0);
    tone(659, 0.12, "sine", 0.25, 0.1);
    tone(784, 0.18, "sine", 0.3, 0.2);
  },

  levelup() {
    if (isMuted()) return;
    // Fanfare chord C-E-G + sparkle
    tone(523, 0.5, "triangle", 0.3, 0);
    tone(659, 0.5, "triangle", 0.25, 0);
    tone(784, 0.5, "triangle", 0.2, 0);
    tone(1046, 0.3, "sine", 0.35, 0.3);
    tone(1568, 0.25, "sine", 0.3, 0.45);
    tone(2093, 0.2, "sine", 0.25, 0.55);
  },

  streak() {
    if (isMuted()) return;
    noise(0.15, 0.2);
    noise(0.1, 0.15, 0.08);
    noise(0.12, 0.18, 0.15);
  },

  quest() {
    if (isMuted()) return;
    tone(659, 0.15, "sine", 0.3, 0);
    tone(880, 0.25, "sine", 0.35, 0.12);
  },

  badge() {
    if (isMuted()) return;
    // Triumphant 4-note
    tone(523, 0.12, "triangle", 0.3, 0);
    tone(659, 0.12, "triangle", 0.3, 0.1);
    tone(784, 0.12, "triangle", 0.3, 0.2);
    tone(1046, 0.35, "triangle", 0.35, 0.3);
  },

  funded() {
    if (isMuted()) return;
    // Jackpot 3-ring bell cascade
    tone(1046, 0.4, "sine", 0.4, 0);
    tone(1318, 0.4, "sine", 0.35, 0.18);
    tone(1568, 0.5, "sine", 0.45, 0.36);
  },

  promotion() {
    if (isMuted()) return;
    // Rising synth sweep
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
```

- [ ] **Step 2: Verify TypeScript compiles**

```bash
cd /Users/aap/Desktop/startup-scratchpad/apr21 && npx tsc --noEmit 2>&1 | head -20
```

Expected: no errors.

- [ ] **Step 3: Commit**

```bash
git add src/lib/sounds.ts
git commit -m "feat: add Web Audio procedural sound engine (9 sounds, mute toggle)"
```

---

### Task 4: Extend store.ts with feed seed data + gamification methods

**Files:**
- Modify: `src/lib/store.ts`

- [ ] **Step 1: Add imports and seed data**

At the top of `src/lib/store.ts`, add `CreatorFeedItem`, `FeedEvent`, `DailyQuest`, `GamificationState` to the type import line:

```ts
import type { User, Wishlist, GiftEvent, CreatorFeedItem, FeedEvent, DailyQuest, GamificationState } from "./types";
```

Then add this seed data block after the `RECENT_GIFTS` array (before the `_users` map):

```ts
// ─── Seed feed creators ───────────────────────────────────────────────────────

const FEED_CREATORS: CreatorFeedItem[] = [
  {
    id: "fc-1", creatorName: "Pixel Witch", username: "pixelwitch",
    avatarInitials: "PW", avatarColor: "bg-purple-600",
    itemTitle: "Pro Drawing Tablet", itemDescription: "Upgrading to a Wacom Cintiq for better streams",
    goalAmount: 1200, raisedAmount: 1080, gifterCount: 34, giftsToday: 8, daysLeft: 3,
    createdAt: "2026-04-30T10:00:00.000Z", giftsLast24h: 8, tags: ["following", "trending"],
  },
  {
    id: "fc-2", creatorName: "Bass Drop Benny", username: "bassdropbenny",
    avatarInitials: "BB", avatarColor: "bg-blue-600",
    itemTitle: "Studio Monitors", itemDescription: "KRK Rokit 8s for mixing my beats properly",
    goalAmount: 800, raisedAmount: 210, gifterCount: 12, giftsToday: 2, daysLeft: 21,
    createdAt: "2026-05-01T09:00:00.000Z", giftsLast24h: 2, tags: ["new"],
  },
  {
    id: "fc-3", creatorName: "Neon Sculptor", username: "neonsculptor",
    avatarInitials: "NS", avatarColor: "bg-pink-600",
    itemTitle: "Resin Casting Kit", itemDescription: "UV resin and molds for my sculpture series",
    goalAmount: 450, raisedAmount: 390, gifterCount: 28, giftsToday: 11, daysLeft: 5,
    createdAt: "2026-04-29T14:00:00.000Z", giftsLast24h: 11, tags: ["trending", "following"],
  },
  {
    id: "fc-4", creatorName: "Code Witch Kim", username: "codewitchkim",
    avatarInitials: "CK", avatarColor: "bg-green-600",
    itemTitle: "Mechanical Keyboard", itemDescription: "A proper clicky keyboard for my coding streams",
    goalAmount: 300, raisedAmount: 45, gifterCount: 5, giftsToday: 5, daysLeft: 14,
    createdAt: "2026-05-02T06:00:00.000Z", giftsLast24h: 5, tags: ["new", "rising"],
  },
  {
    id: "fc-5", creatorName: "Synth Lord", username: "synthlord",
    avatarInitials: "SL", avatarColor: "bg-orange-600",
    itemTitle: "Roland Synthesizer", itemDescription: "Roland JUNO-X for my ambient music project",
    goalAmount: 1800, raisedAmount: 540, gifterCount: 19, giftsToday: 6, daysLeft: 18,
    createdAt: "2026-04-28T11:00:00.000Z", giftsLast24h: 6, tags: ["rising"],
  },
  {
    id: "fc-6", creatorName: "VR Dev Vance", username: "vrdevvance",
    avatarInitials: "VV", avatarColor: "bg-teal-600",
    itemTitle: "Meta Quest Pro", itemDescription: "Building immersive VR experiences and need the hardware",
    goalAmount: 1500, raisedAmount: 900, gifterCount: 41, giftsToday: 9, daysLeft: 7,
    createdAt: "2026-04-27T12:00:00.000Z", giftsLast24h: 9, tags: ["trending", "following"],
  },
];

// ─── Seed feed events (live ticker) ──────────────────────────────────────────

const FEED_EVENTS: FeedEvent[] = [
  { id: "ev-1",  type: "gift",      actorName: "Sarah J.",    targetName: "Pixel Witch",     amount: 50,  timestamp: "2026-05-02T11:45:00.000Z" },
  { id: "ev-2",  type: "milestone", actorName: "Neon Sculptor", targetName: "Resin Casting Kit", timestamp: "2026-05-02T11:30:00.000Z" },
  { id: "ev-3",  type: "league_up", actorName: "Mike C.",     targetName: "Gold",              timestamp: "2026-05-02T11:00:00.000Z" },
  { id: "ev-4",  type: "gift",      actorName: "Emily R.",    targetName: "VR Dev Vance",    amount: 100, timestamp: "2026-05-02T10:50:00.000Z" },
  { id: "ev-5",  type: "streak",    actorName: "Fanatic99",   targetName: "14",                timestamp: "2026-05-02T10:30:00.000Z" },
  { id: "ev-6",  type: "new_item",  actorName: "Code Witch Kim", targetName: "Mechanical Keyboard", timestamp: "2026-05-02T10:00:00.000Z" },
  { id: "ev-7",  type: "gift",      actorName: "Jordan T.",   targetName: "Bass Drop Benny", amount: 25,  timestamp: "2026-05-02T09:45:00.000Z" },
  { id: "ev-8",  type: "gift",      actorName: "Alex M.",     targetName: "Synth Lord",      amount: 75,  timestamp: "2026-05-02T09:20:00.000Z" },
  { id: "ev-9",  type: "league_up", actorName: "CryptoCarlos", targetName: "Diamond",          timestamp: "2026-05-02T08:55:00.000Z" },
  { id: "ev-10", type: "gift",      actorName: "TurboTina",   targetName: "Pixel Witch",     amount: 200, timestamp: "2026-05-02T08:30:00.000Z" },
];

// ─── Seed daily quests ────────────────────────────────────────────────────────

const DAILY_QUESTS: DailyQuest[] = [
  { id: "quest-easy",   difficulty: "easy",   label: "Gift any creator",        xpReward: 50,  completed: true,  locked: false },
  { id: "quest-medium", difficulty: "medium", label: "Follow a new creator",    xpReward: 30,  completed: false, locked: false },
  { id: "quest-hard",   difficulty: "hard",   label: "Gift $25+ in one gift",   xpReward: 100, completed: false, locked: false },
];
```

- [ ] **Step 2: Add store methods**

Add the following methods to the `Store` object (before `} as const`):

```ts
  getRecommendedCreators(userId: string): CreatorFeedItem[] {
    const followingIds = new Set(["fc-1", "fc-3", "fc-6"]);
    return [...FEED_CREATORS]
      .map((c) => {
        const progress = c.raisedAmount / c.goalAmount;
        const velocity = c.giftsToday / Math.max(c.gifterCount, 1);
        const followingBonus = followingIds.has(c.id) ? 0.25 : 0;
        const ageHours = (Date.now() - new Date(c.createdAt).getTime()) / 3_600_000;
        const recency = Math.max(0, 1 - ageHours / 168); // 168h = 1 week
        const score = progress * 0.3 + velocity * 0.3 + followingBonus + recency * 0.15;
        return { ...c, _score: score };
      })
      .sort((a, b) => (b as CreatorFeedItem & { _score: number })._score - (a as CreatorFeedItem & { _score: number })._score)
      .map(({ ...rest }) => rest as CreatorFeedItem);
  },

  getFeedCreators(tab: "following" | "hot" | "explore" | "rising"): CreatorFeedItem[] {
    if (tab === "following") return FEED_CREATORS.filter((c) => c.tags.includes("following"));
    if (tab === "hot") return [...FEED_CREATORS].sort((a, b) => b.giftsLast24h - a.giftsLast24h);
    if (tab === "explore") return Store.getRecommendedCreators("demo-supporter");
    if (tab === "rising") return FEED_CREATORS.filter((c) => c.tags.includes("rising") || c.tags.includes("new"));
    return FEED_CREATORS;
  },

  getFeedEvents(): FeedEvent[] {
    return [...FEED_EVENTS];
  },

  getDailyQuests(): DailyQuest[] {
    return [...DAILY_QUESTS];
  },

  getGamificationState(): GamificationState {
    const { DEMO_GAMIFICATION } = require("./gamification");
    return { ...DEMO_GAMIFICATION };
  },
```

Wait — `require` is not idiomatic in ESM. Instead, import at the top of store.ts:

Add this import after the existing imports:
```ts
import { DEMO_GAMIFICATION } from "./gamification";
```

And use `DEMO_GAMIFICATION` directly in `getGamificationState()`:
```ts
  getGamificationState(): GamificationState {
    return { ...DEMO_GAMIFICATION };
  },
```

- [ ] **Step 3: Verify TypeScript compiles**

```bash
cd /Users/aap/Desktop/startup-scratchpad/apr21 && npx tsc --noEmit 2>&1 | head -30
```

Expected: no errors.

- [ ] **Step 4: Commit**

```bash
git add src/lib/store.ts
git commit -m "feat: add feed/event/quest seed data and gamification store methods"
```

---

### Task 5: Create XPBar.tsx — inline navbar gamification widget

**Files:**
- Create: `src/app/components/XPBar.tsx`

- [ ] **Step 1: Create the component**

Create `src/app/components/XPBar.tsx`:

```tsx
import { motion } from "motion/react";
import type { GamificationState } from "../../lib/types";
import { xpProgress, leagueBadgeColor, leagueLabel } from "../../lib/gamification";

interface XPBarProps {
  gamification: GamificationState;
}

const LEAGUE_BG: Record<string, string> = {
  bronze: "bg-amber-600/20 border-amber-600/40",
  silver: "bg-slate-400/20 border-slate-400/40",
  gold: "bg-yellow-400/20 border-yellow-400/40",
  diamond: "bg-cyan-400/20 border-cyan-400/40",
};

export default function XPBar({ gamification }: XPBarProps) {
  const { current, needed, pct } = xpProgress(gamification.xp);

  return (
    <div className="flex items-center gap-3">
      {/* Streak pill */}
      <div className="flex items-center gap-1 px-2 py-1 bg-orange-500/20 border border-orange-500/40 text-orange-400 text-xs font-bold">
        🔥 {gamification.streakDays}d
      </div>

      {/* XP bar + level */}
      <div className="flex items-center gap-2">
        <span className="text-xs font-black text-accent">Lv.{gamification.level}</span>
        <div className="w-24 h-2 bg-white/10 overflow-hidden">
          <motion.div
            className="h-full bg-accent"
            initial={{ width: 0 }}
            animate={{ width: `${pct * 100}%` }}
            transition={{ duration: 0.6, ease: "easeOut" }}
          />
        </div>
        <span className="text-[10px] text-white/40">{current}/{needed}</span>
      </div>

      {/* League pill */}
      <div className={`flex items-center gap-1 px-2 py-1 border text-xs font-bold ${LEAGUE_BG[gamification.leagueTier]}`}>
        <span className={leagueBadgeColor(gamification.leagueTier)}>
          {gamification.leagueTier === "diamond" ? "💎" : gamification.leagueTier === "gold" ? "🥇" : gamification.leagueTier === "silver" ? "🥈" : "🥉"}
        </span>
        {leagueLabel(gamification.leagueTier)}
      </div>
    </div>
  );
}
```

- [ ] **Step 2: Verify TypeScript compiles**

```bash
cd /Users/aap/Desktop/startup-scratchpad/apr21 && npx tsc --noEmit 2>&1 | head -20
```

- [ ] **Step 3: Commit**

```bash
git add src/app/components/XPBar.tsx
git commit -m "feat: add XPBar component with level, XP progress bar, streak pill, and league pill"
```

---

### Task 6: Update Navbar.tsx — add gamification props + click sounds

**Files:**
- Modify: `src/app/components/Navbar.tsx`

- [ ] **Step 1: Update Navbar to accept gamification and show XPBar**

Replace the full content of `src/app/components/Navbar.tsx`:

```tsx
import { motion } from "motion/react";
import { useState } from "react";
import { useLocation, useNavigate } from "react-router-dom";
import { Search, LogOut, LayoutDashboard, BarChart3, Settings as SettingsIcon, DollarSign, Link2, Trophy } from "lucide-react";
import ThemeToggle from "./ThemeToggle";
import XPBar from "./XPBar";
import { useAuth } from "../../contexts/AuthContext";
import { Sounds } from "../../lib/sounds";
import type { GamificationState } from "../../lib/types";

interface NavbarProps {
  creditBalance: number;
  userType: "creator" | "supporter";
  gamification?: GamificationState;
}

export default function Navbar({ creditBalance, userType, gamification }: NavbarProps) {
  const [searchQuery, setSearchQuery] = useState("");
  const [showSearchDropdown, setShowSearchDropdown] = useState(false);
  const navigate = useNavigate();
  const location = useLocation();
  const { logout } = useAuth();

  function nav(path: string) {
    Sounds.click();
    navigate(path);
  }

  const searchResults = searchQuery.length > 0 ? {
    creators: [
      { name: "Alex Creative", username: "@alexcreative", initials: "AC" },
      { name: "Sarah Designs", username: "@sarahdesigns", initials: "SD" },
    ],
    supporters: [
      { name: "Mike Chen", username: "@mikechen", initials: "MC" },
      { name: "Emily Rodriguez", username: "@emilyrodriguez", initials: "ER" },
    ],
  } : { creators: [], supporters: [] };

  const path = location.pathname;

  const creatorLinks = [
    { label: "Dashboard", icon: LayoutDashboard, path: "/dashboard" },
    { label: "Analytics", icon: BarChart3, path: "/analytics" },
    { label: "Referrals", icon: Link2, path: "/referrals" },
    { label: "Leaderboard", icon: Trophy, path: "/leaderboard" },
    { label: "Settings", icon: SettingsIcon, path: "/settings" },
  ];

  const supporterLinks = [
    { label: "Community", icon: LayoutDashboard, path: "/supporter" },
    { label: "Leaderboard", icon: Trophy, path: "/leaderboard" },
    { label: "Settings", icon: SettingsIcon, path: "/settings" },
  ];

  const navLinks = userType === "creator" ? creatorLinks : supporterLinks;

  return (
    <nav className="fixed top-0 left-0 right-0 z-50 bg-[#0e0e0e] border-b border-accent/40">
      <div className="max-w-full mx-auto px-6 py-4 flex items-center justify-between">
        <div className="flex items-center gap-8">
          <div className="text-xl font-black text-white tracking-tight">TipFlow</div>
          <div className="hidden md:flex items-center gap-1">
            {navLinks.map((link) => {
              const isActive = path === link.path || (link.path === "/dashboard" && path.startsWith("/dashboard")) || (link.path === "/supporter" && path.startsWith("/supporter"));
              const Icon = link.icon;
              return (
                <button
                  key={link.path}
                  onClick={() => nav(link.path)}
                  className={
                    isActive
                      ? "flex items-center gap-2 px-4 py-2 bg-accent text-white font-medium text-sm transition-all"
                      : "flex items-center gap-2 px-4 py-2 text-gray-300 hover:text-white hover:bg-white/5 font-medium text-sm transition-all"
                  }
                >
                  <Icon className="w-4 h-4" />
                  {link.label}
                </button>
              );
            })}
          </div>
        </div>
        <div className="flex items-center gap-4">
          {/* Gamification widgets — supporter only */}
          {userType === "supporter" && gamification && (
            <XPBar gamification={gamification} />
          )}

          <button
            onClick={() => { Sounds.click(); navigate("/settings?section=balance"); }}
            className="flex items-center gap-2 px-3 py-2 border border-white/20 text-white hover:bg-white/10 transition-colors text-sm font-medium"
          >
            <DollarSign className="w-4 h-4 text-accent" />
            <span className="hidden sm:inline">${creditBalance.toLocaleString("en-US", { minimumFractionDigits: 2, maximumFractionDigits: 2 })}</span>
          </button>
          <div className="relative hidden sm:block">
            <Search className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-white/40 z-10" />
            <input
              type="text"
              placeholder="Search creators & supporters"
              value={searchQuery}
              onChange={(e) => { setSearchQuery(e.target.value); setShowSearchDropdown(true); }}
              onFocus={() => setShowSearchDropdown(true)}
              onBlur={() => setTimeout(() => setShowSearchDropdown(false), 200)}
              className="pl-10 pr-4 py-2 bg-white/10 border border-white/20 text-white placeholder-white/30 text-sm focus:outline-none focus:ring-2 focus:ring-accent transition-all w-56"
            />
            {showSearchDropdown && searchQuery.length > 0 && (
              <motion.div
                initial={{ opacity: 0, y: -10 }}
                animate={{ opacity: 1, y: 0 }}
                className="absolute top-full mt-2 left-0 w-72 bg-background border border-border shadow-lg overflow-hidden z-50"
              >
                {searchResults.creators.length > 0 && (
                  <div className="p-3">
                    <h3 className="text-[10px] font-black uppercase tracking-widest text-subtle mb-2 px-2">Creators</h3>
                    {searchResults.creators.map((creator, index) => (
                      <div
                        key={index}
                        onClick={() => { nav(`/creator/${creator.username.replace("@", "")}`); setSearchQuery(""); setShowSearchDropdown(false); }}
                        className="flex items-center gap-3 p-2 hover:bg-muted cursor-pointer transition-colors"
                      >
                        <div className="w-8 h-8 bg-muted border border-border flex items-center justify-center text-foreground font-bold text-xs">{creator.initials}</div>
                        <div className="flex-1">
                          <p className="text-foreground font-medium text-sm">{creator.name}</p>
                          <p className="text-subtle text-xs">{creator.username}</p>
                        </div>
                      </div>
                    ))}
                  </div>
                )}
                {searchResults.supporters.length > 0 && (
                  <div className="p-3 border-t border-border">
                    <h3 className="text-[10px] font-black uppercase tracking-widest text-subtle mb-2 px-2">Supporters</h3>
                    {searchResults.supporters.map((supporter, index) => (
                      <div
                        key={index}
                        onClick={() => { nav(`/supporter/${supporter.username.replace("@", "")}`); setSearchQuery(""); setShowSearchDropdown(false); }}
                        className="flex items-center gap-3 p-2 hover:bg-muted cursor-pointer transition-colors"
                      >
                        <div className="w-8 h-8 bg-muted border border-border flex items-center justify-center text-foreground font-bold text-xs">{supporter.initials}</div>
                        <div className="flex-1">
                          <p className="text-foreground font-medium text-sm">{supporter.name}</p>
                          <p className="text-subtle text-xs">{supporter.username}</p>
                        </div>
                      </div>
                    ))}
                  </div>
                )}
                {searchResults.creators.length === 0 && searchResults.supporters.length === 0 && (
                  <div className="p-6 text-center text-subtle text-sm">No results for "{searchQuery}"</div>
                )}
              </motion.div>
            )}
          </div>
          <ThemeToggle />
          <button
            onClick={async () => { Sounds.click(); await logout(); navigate("/"); }}
            className="flex items-center gap-2 px-4 py-2 border border-white/20 text-white hover:bg-white/10 text-sm font-medium transition-colors"
          >
            <LogOut className="w-4 h-4" />
            <span className="hidden sm:inline">Logout</span>
          </button>
        </div>
      </div>
    </nav>
  );
}
```

- [ ] **Step 2: Verify TypeScript compiles**

```bash
cd /Users/aap/Desktop/startup-scratchpad/apr21 && npx tsc --noEmit 2>&1 | head -20
```

- [ ] **Step 3: Commit**

```bash
git add src/app/components/Navbar.tsx
git commit -m "feat: add gamification props to Navbar (XPBar for supporters), click sounds on nav buttons"
```

---

### Task 7: Create LiveTicker.tsx — scrolling casino feed

**Files:**
- Create: `src/app/components/LiveTicker.tsx`

- [ ] **Step 1: Create the component**

Create `src/app/components/LiveTicker.tsx`:

```tsx
import { useEffect, useRef, useState } from "react";
import type { FeedEvent } from "../../lib/types";

interface LiveTickerProps {
  events: FeedEvent[];
}

function formatEvent(e: FeedEvent): string {
  switch (e.type) {
    case "gift":       return `${e.actorName} gifted $${e.amount} to ${e.targetName}`;
    case "milestone":  return `🎰 FUNDED — ${e.actorName}'s ${e.targetName} hit its goal!`;
    case "league_up":  return `${e.actorName} reached ${e.targetName} tier 🏆`;
    case "new_item":   return `${e.actorName} added a new item: ${e.targetName}`;
    case "streak":     return `${e.actorName} is on a ${e.targetName}-day streak 🔥`;
    case "follow":     return `${e.actorName} started following ${e.targetName}`;
    default:           return `${e.actorName} → ${e.targetName}`;
  }
}

function eventColor(type: FeedEvent["type"]): string {
  const map: Record<FeedEvent["type"], string> = {
    gift:      "text-accent",
    milestone: "text-yellow-400",
    league_up: "text-cyan-400",
    new_item:  "text-green-400",
    streak:    "text-orange-400",
    follow:    "text-white/60",
  };
  return map[type] ?? "text-white/60";
}

export default function LiveTicker({ events }: LiveTickerProps) {
  const trackRef = useRef<HTMLDivElement>(null);
  const [offset, setOffset] = useState(0);
  const speedRef = useRef(0.6); // px per frame

  useEffect(() => {
    let raf: number;
    function tick() {
      setOffset((prev) => {
        const track = trackRef.current;
        if (!track) return prev;
        const halfWidth = track.scrollWidth / 2;
        const next = prev + speedRef.current;
        return next >= halfWidth ? 0 : next;
      });
      raf = requestAnimationFrame(tick);
    }
    raf = requestAnimationFrame(tick);
    return () => cancelAnimationFrame(raf);
  }, []);

  // Duplicate events so marquee loops seamlessly
  const doubled = [...events, ...events];

  return (
    <div className="w-full bg-white/5 border-b border-accent/20 overflow-hidden py-2">
      <div
        ref={trackRef}
        className="flex gap-8 whitespace-nowrap will-change-transform"
        style={{ transform: `translateX(-${offset}px)` }}
      >
        {doubled.map((event, i) => (
          <span key={`${event.id}-${i}`} className="flex items-center gap-2 text-xs font-medium px-4">
            <span className="text-white/30">•</span>
            <span className={eventColor(event.type)}>{formatEvent(event)}</span>
          </span>
        ))}
      </div>
    </div>
  );
}
```

- [ ] **Step 2: Verify TypeScript compiles**

```bash
cd /Users/aap/Desktop/startup-scratchpad/apr21 && npx tsc --noEmit 2>&1 | head -20
```

- [ ] **Step 3: Commit**

```bash
git add src/app/components/LiveTicker.tsx
git commit -m "feat: add LiveTicker scrolling casino-floor feed banner"
```

---

### Task 8: Create DailyQuests.tsx — quest card

**Files:**
- Create: `src/app/components/DailyQuests.tsx`

- [ ] **Step 1: Create the component**

Create `src/app/components/DailyQuests.tsx`:

```tsx
import { motion } from "motion/react";
import type { DailyQuest } from "../../lib/types";
import { Sounds } from "../../lib/sounds";

interface DailyQuestsProps {
  quests: DailyQuest[];
  onQuestComplete?: (questId: string) => void;
}

const DIFFICULTY_COLORS: Record<DailyQuest["difficulty"], string> = {
  easy:   "text-green-400 border-green-400/30 bg-green-400/10",
  medium: "text-yellow-400 border-yellow-400/30 bg-yellow-400/10",
  hard:   "text-red-400 border-red-400/30 bg-red-400/10",
};

const DIFFICULTY_LABELS: Record<DailyQuest["difficulty"], string> = {
  easy: "Easy", medium: "Medium", hard: "Hard",
};

export default function DailyQuests({ quests, onQuestComplete }: DailyQuestsProps) {
  const completedCount = quests.filter((q) => q.completed).length;
  const bonusEarned = completedCount === 3;

  return (
    <div className="bg-white/5 border border-white/10 p-4 space-y-3">
      <div className="flex items-center justify-between">
        <h3 className="text-sm font-black uppercase tracking-widest text-white">Daily Quests</h3>
        <span className="text-xs text-white/40">{completedCount}/3 complete</span>
      </div>

      {/* Progress bar */}
      <div className="h-1.5 bg-white/10">
        <motion.div
          className="h-full bg-accent"
          animate={{ width: `${(completedCount / 3) * 100}%` }}
          transition={{ duration: 0.4 }}
        />
      </div>

      {/* Quest list */}
      <div className="space-y-2">
        {quests.map((quest) => (
          <div
            key={quest.id}
            className={`flex items-center gap-3 p-3 border transition-all ${
              quest.locked
                ? "opacity-40 border-white/10 bg-white/5 cursor-not-allowed"
                : quest.completed
                ? "border-green-400/30 bg-green-400/5"
                : "border-white/10 bg-white/5 cursor-pointer hover:bg-white/10"
            }`}
            onClick={() => {
              if (!quest.locked && !quest.completed && onQuestComplete) {
                Sounds.quest();
                onQuestComplete(quest.id);
              }
            }}
          >
            <div className={`w-5 h-5 border-2 flex items-center justify-center flex-shrink-0 ${quest.completed ? "border-green-400 bg-green-400" : "border-white/30"}`}>
              {quest.completed && <span className="text-black text-xs font-black">✓</span>}
            </div>
            <div className="flex-1 min-w-0">
              <p className={`text-sm font-medium ${quest.locked ? "text-white/30" : "text-white"}`}>
                {quest.locked ? "🔒 " : ""}{quest.label}
              </p>
            </div>
            <div className={`text-xs font-bold px-2 py-0.5 border ${DIFFICULTY_COLORS[quest.difficulty]}`}>
              {DIFFICULTY_LABELS[quest.difficulty]}
            </div>
            <div className="text-xs font-black text-accent">+{quest.xpReward} XP</div>
          </div>
        ))}
      </div>

      {bonusEarned && (
        <div className="text-center text-xs font-black text-yellow-400 py-2 border border-yellow-400/30 bg-yellow-400/5">
          🏆 All quests complete! +50 XP bonus earned
        </div>
      )}
    </div>
  );
}
```

- [ ] **Step 2: Verify TypeScript compiles**

```bash
cd /Users/aap/Desktop/startup-scratchpad/apr21 && npx tsc --noEmit 2>&1 | head -20
```

- [ ] **Step 3: Commit**

```bash
git add src/app/components/DailyQuests.tsx
git commit -m "feat: add DailyQuests card component with progress bar and completion handler"
```

---

### Task 9: Create CreatorCard.tsx — individual feed card

**Files:**
- Create: `src/app/components/CreatorCard.tsx`

- [ ] **Step 1: Create the component**

Create `src/app/components/CreatorCard.tsx`:

```tsx
import { motion } from "motion/react";
import type { CreatorFeedItem } from "../../lib/types";
import { Sounds } from "../../lib/sounds";

interface CreatorCardProps {
  creator: CreatorFeedItem;
  recommendationReason?: string;
  onGift?: (creatorId: string) => void;
}

function urgencyChip(c: CreatorFeedItem): { label: string; color: string } | null {
  const progress = c.raisedAmount / c.goalAmount;
  if (progress >= 0.9) return { label: "⏰ Almost Funded", color: "bg-yellow-400/20 text-yellow-400 border-yellow-400/40" };
  if (c.giftsLast24h >= 5) return { label: "🔥 On a Roll", color: "bg-orange-400/20 text-orange-400 border-orange-400/40" };
  const ageHours = (Date.now() - new Date(c.createdAt).getTime()) / 3_600_000;
  if (ageHours < 48) return { label: "✨ New Item", color: "bg-purple-400/20 text-purple-400 border-purple-400/40" };
  return null;
}

function progressColor(pct: number): string {
  if (pct >= 1) return "bg-green-500";
  if (pct >= 0.9) return "bg-yellow-400";
  return "bg-accent";
}

export default function CreatorCard({ creator, recommendationReason, onGift }: CreatorCardProps) {
  const pct = Math.min(creator.raisedAmount / creator.goalAmount, 1);
  const chip = urgencyChip(creator);

  return (
    <motion.div
      initial={{ opacity: 0, y: 16 }}
      animate={{ opacity: 1, y: 0 }}
      className="bg-white/5 border border-white/10 p-4 space-y-3 hover:border-accent/40 transition-all group"
    >
      {/* Header */}
      <div className="flex items-start justify-between gap-3">
        <div className="flex items-center gap-3">
          <div className={`w-10 h-10 ${creator.avatarColor} flex items-center justify-center font-black text-white text-sm flex-shrink-0`}>
            {creator.avatarInitials}
          </div>
          <div>
            <p className="text-white font-bold text-sm">{creator.creatorName}</p>
            <p className="text-white/40 text-xs">@{creator.username}</p>
          </div>
        </div>
        {chip && (
          <span className={`text-xs font-bold px-2 py-1 border flex-shrink-0 ${chip.color}`}>{chip.label}</span>
        )}
      </div>

      {/* Item info */}
      <div>
        <p className="text-white font-semibold text-sm">{creator.itemTitle}</p>
        <p className="text-white/50 text-xs mt-0.5 line-clamp-2">{creator.itemDescription}</p>
      </div>

      {/* Progress bar */}
      <div>
        <div className="flex justify-between text-xs mb-1">
          <span className="text-white/60">${creator.raisedAmount.toLocaleString()} raised</span>
          <span className="text-white/40">of ${creator.goalAmount.toLocaleString()}</span>
        </div>
        <div className="h-2 bg-white/10">
          <motion.div
            className={`h-full ${progressColor(pct)}`}
            initial={{ width: 0 }}
            animate={{ width: `${pct * 100}%` }}
            transition={{ duration: 0.6, ease: "easeOut" }}
          />
        </div>
      </div>

      {/* Stats row */}
      <div className="flex items-center gap-4 text-xs text-white/40">
        <span>{creator.gifterCount} gifters</span>
        <span>•</span>
        <span>{creator.giftsToday} gifts today</span>
        <span>•</span>
        <span>{creator.daysLeft}d left</span>
      </div>

      {/* Recommendation reason */}
      {recommendationReason && (
        <p className="text-xs text-accent/70 italic">{recommendationReason}</p>
      )}

      {/* Gift button */}
      <button
        onClick={() => { Sounds.gift(); onGift?.(creator.id); }}
        className="w-full py-2 bg-accent text-white font-black text-sm uppercase tracking-wider hover:brightness-110 active:scale-95 transition-all"
      >
        Gift Now 🎁
      </button>
    </motion.div>
  );
}
```

- [ ] **Step 2: Verify TypeScript compiles**

```bash
cd /Users/aap/Desktop/startup-scratchpad/apr21 && npx tsc --noEmit 2>&1 | head -20
```

- [ ] **Step 3: Commit**

```bash
git add src/app/components/CreatorCard.tsx
git commit -m "feat: add CreatorCard with urgency chips, progress bar, recommendation label, and gift sound"
```

---

### Task 10: Create CommunityFeed.tsx — tabbed creator feed

**Files:**
- Create: `src/app/components/CommunityFeed.tsx`

- [ ] **Step 1: Create the component**

Create `src/app/components/CommunityFeed.tsx`:

```tsx
import { useState } from "react";
import { motion, AnimatePresence } from "motion/react";
import type { CreatorFeedItem } from "../../lib/types";
import { Store } from "../../lib/store";
import { Sounds } from "../../lib/sounds";
import CreatorCard from "./CreatorCard";

type FeedTab = "following" | "hot" | "explore" | "rising";

const TABS: { id: FeedTab; label: string }[] = [
  { id: "following", label: "Following" },
  { id: "hot",       label: "🔥 Hot Now" },
  { id: "explore",   label: "✨ Explore" },
  { id: "rising",    label: "📈 Rising" },
];

const RECOMMENDATION_REASONS: Record<string, string> = {
  "fc-1": "Because you gifted Neon Sculptor",
  "fc-3": "Because you follow Pixel Witch",
  "fc-6": "Trending in your network",
  "fc-2": "New creator worth watching",
  "fc-4": "Rising fast this week",
  "fc-5": "Matches your gifting style",
};

export default function CommunityFeed() {
  const [activeTab, setActiveTab] = useState<FeedTab>("following");
  const creators = Store.getFeedCreators(activeTab);

  return (
    <div className="space-y-4">
      {/* Tab bar */}
      <div className="flex gap-1 border-b border-white/10">
        {TABS.map((tab) => (
          <button
            key={tab.id}
            onClick={() => { Sounds.click(); setActiveTab(tab.id); }}
            className={`px-4 py-2.5 text-sm font-bold transition-all relative ${
              activeTab === tab.id ? "text-white" : "text-white/40 hover:text-white/70"
            }`}
          >
            {tab.label}
            {activeTab === tab.id && (
              <motion.div
                layoutId="feed-tab-indicator"
                className="absolute bottom-0 left-0 right-0 h-0.5 bg-accent"
              />
            )}
          </button>
        ))}
      </div>

      {/* Feed cards */}
      <AnimatePresence mode="wait">
        <motion.div
          key={activeTab}
          initial={{ opacity: 0, y: 8 }}
          animate={{ opacity: 1, y: 0 }}
          exit={{ opacity: 0, y: -8 }}
          transition={{ duration: 0.2 }}
          className="grid gap-4"
        >
          {creators.length === 0 ? (
            <div className="text-center py-12 text-white/30 text-sm">Nothing here yet — follow some creators!</div>
          ) : (
            creators.map((creator) => (
              <CreatorCard
                key={creator.id}
                creator={creator}
                recommendationReason={activeTab === "explore" ? RECOMMENDATION_REASONS[creator.id] : undefined}
                onGift={() => {}}
              />
            ))
          )}
        </motion.div>
      </AnimatePresence>
    </div>
  );
}
```

- [ ] **Step 2: Verify TypeScript compiles**

```bash
cd /Users/aap/Desktop/startup-scratchpad/apr21 && npx tsc --noEmit 2>&1 | head -20
```

- [ ] **Step 3: Commit**

```bash
git add src/app/components/CommunityFeed.tsx
git commit -m "feat: add CommunityFeed with Following/Hot/Explore/Rising tabs and animated transitions"
```

---

### Task 11: Create GamificationSidebar.tsx — XP, streak, league, leaderboard, badges

**Files:**
- Create: `src/app/components/GamificationSidebar.tsx`

- [ ] **Step 1: Create the component**

Create `src/app/components/GamificationSidebar.tsx`:

```tsx
import { motion } from "motion/react";
import type { GamificationState, BadgeId } from "../../lib/types";
import { xpProgress, leagueBadgeColor, leagueLabel } from "../../lib/gamification";

interface GamificationSidebarProps {
  gamification: GamificationState;
}

const BADGE_META: Record<BadgeId, { emoji: string; label: string; description: string }> = {
  early_adopter:  { emoji: "🌟", label: "Early Adopter",   description: "Joined in the first month" },
  streak_lord:    { emoji: "🔥", label: "Streak Lord",     description: "30-day streak" },
  big_spender:    { emoji: "💎", label: "Big Spender",     description: "$500 total gifted" },
  first_gift:     { emoji: "🎁", label: "First Gift",      description: "Sent your first gift" },
  league_leader:  { emoji: "👑", label: "League Leader",   description: "Reached #1 in weekly leaderboard" },
  jackpot:        { emoji: "🎰", label: "Jackpot",         description: "Gifted to a creator who hit goal same day" },
  speed_gifter:   { emoji: "⚡", label: "Speed Gifter",    description: "Gifted within 1 hour of creator posting" },
  century_club:   { emoji: "💰", label: "Century Club",    description: "$100 to a single creator" },
  diamond_gifter: { emoji: "🏆", label: "Diamond Gifter",  description: "Reached Diamond league" },
  variety_pack:   { emoji: "🌈", label: "Variety Pack",    description: "Gifted to 10 different creators" },
  mystery_1:      { emoji: "❓", label: "???",             description: "Keep gifting to unlock" },
  mystery_2:      { emoji: "❓", label: "???",             description: "Keep gifting to unlock" },
};

const ALL_BADGE_IDS: BadgeId[] = Object.keys(BADGE_META) as BadgeId[];

const MOCK_LEADERBOARD = [
  { rank: 1, name: "CryptoCarlos",   amount: 520, tier: "diamond" as const },
  { rank: 2, name: "TurboTina",      amount: 410, tier: "gold" as const },
  { rank: 3, name: "Fanatic99",      amount: 185, tier: "gold" as const },
  { rank: 4, name: "Mike C.",        amount: 140, tier: "silver" as const },
  { rank: 5, name: "Sarah J.",       amount: 95,  tier: "silver" as const },
];

export default function GamificationSidebar({ gamification }: GamificationSidebarProps) {
  const { current, needed, pct } = xpProgress(gamification.xp);

  return (
    <div className="w-52 flex-shrink-0 space-y-4">
      {/* XP / Level */}
      <div className="bg-white/5 border border-white/10 p-4 space-y-3">
        <h3 className="text-xs font-black uppercase tracking-widest text-white/60">Your Level</h3>
        <div className="text-center">
          <div className="text-4xl font-black text-accent">{gamification.level}</div>
          <div className="text-xs text-white/40 mt-1">{current} / {needed} XP</div>
        </div>
        <div className="h-2 bg-white/10">
          <motion.div
            className="h-full bg-accent"
            animate={{ width: `${pct * 100}%` }}
            transition={{ duration: 0.6, ease: "easeOut" }}
          />
        </div>
        <div className="text-xs text-white/40 text-center">{gamification.xp} total XP</div>
      </div>

      {/* Streak */}
      <div className="bg-white/5 border border-white/10 p-4 space-y-2">
        <h3 className="text-xs font-black uppercase tracking-widest text-white/60">Streak</h3>
        <div className="flex items-center gap-2">
          <span className="text-2xl">🔥</span>
          <div>
            <div className="text-xl font-black text-orange-400">{gamification.streakDays} days</div>
            <div className="text-xs text-white/40">2× XP on all gifts</div>
          </div>
        </div>
        {gamification.streakDays > 0 && (
          <div className="text-xs text-green-400 py-1 border border-green-400/30 bg-green-400/5 text-center">
            ✅ Active today
          </div>
        )}
      </div>

      {/* League */}
      <div className="bg-white/5 border border-white/10 p-4 space-y-2">
        <h3 className="text-xs font-black uppercase tracking-widest text-white/60">League</h3>
        <div className="text-center">
          <div className={`text-2xl font-black ${leagueBadgeColor(gamification.leagueTier)}`}>
            {gamification.leagueTier === "diamond" ? "💎" : gamification.leagueTier === "gold" ? "🥇" : gamification.leagueTier === "silver" ? "🥈" : "🥉"}
          </div>
          <div className={`text-lg font-black ${leagueBadgeColor(gamification.leagueTier)}`}>{leagueLabel(gamification.leagueTier)}</div>
          <div className="text-xs text-white/40 mt-1">${gamification.weeklyGifted} this week</div>
        </div>
      </div>

      {/* Weekly Leaderboard */}
      <div className="bg-white/5 border border-white/10 p-4 space-y-3">
        <h3 className="text-xs font-black uppercase tracking-widest text-white/60">This Week</h3>
        <div className="space-y-2">
          {MOCK_LEADERBOARD.map((entry) => (
            <div
              key={entry.rank}
              className={`flex items-center gap-2 text-xs ${entry.name === "Fanatic99" ? "text-accent font-bold" : "text-white/60"}`}
            >
              <span className="w-4 text-center font-black">{entry.rank}</span>
              <span className="flex-1 truncate">{entry.name}</span>
              <span className="font-bold">${entry.amount}</span>
            </div>
          ))}
        </div>
      </div>

      {/* Badges */}
      <div className="bg-white/5 border border-white/10 p-4 space-y-3">
        <h3 className="text-xs font-black uppercase tracking-widest text-white/60">Badges</h3>
        <div className="grid grid-cols-4 gap-2">
          {ALL_BADGE_IDS.map((id) => {
            const earned = gamification.badges.includes(id);
            const meta = BADGE_META[id];
            const isMystery = id.startsWith("mystery");
            return (
              <div
                key={id}
                title={earned ? `${meta.label}: ${meta.description}` : isMystery ? "Mystery badge — keep gifting!" : `Locked: ${meta.description}`}
                className={`w-10 h-10 flex items-center justify-center text-xl border transition-all ${
                  earned
                    ? "border-accent/40 bg-accent/10 cursor-help"
                    : "border-white/10 opacity-30 grayscale"
                }`}
              >
                {earned || !isMystery ? meta.emoji : "❓"}
              </div>
            );
          })}
        </div>
        <div className="text-xs text-white/30 text-center">{gamification.badges.length}/12 earned</div>
      </div>
    </div>
  );
}
```

- [ ] **Step 2: Verify TypeScript compiles**

```bash
cd /Users/aap/Desktop/startup-scratchpad/apr21 && npx tsc --noEmit 2>&1 | head -20
```

- [ ] **Step 3: Commit**

```bash
git add src/app/components/GamificationSidebar.tsx
git commit -m "feat: add GamificationSidebar (XP/level, streak, league, weekly leaderboard, badges grid)"
```

---

### Task 12: Create CommunityHub.tsx — top-level supporter page

**Files:**
- Create: `src/app/components/CommunityHub.tsx`

- [ ] **Step 1: Create the component**

Create `src/app/components/CommunityHub.tsx`:

```tsx
import { useState } from "react";
import type { GamificationState, DailyQuest } from "../../lib/types";
import { Store } from "../../lib/store";
import { Sounds } from "../../lib/sounds";
import LiveTicker from "./LiveTicker";
import DailyQuests from "./DailyQuests";
import CommunityFeed from "./CommunityFeed";
import GamificationSidebar from "./GamificationSidebar";

interface CommunityHubProps {
  gamification: GamificationState;
  onGamificationUpdate: (updated: GamificationState) => void;
}

export default function CommunityHub({ gamification, onGamificationUpdate }: CommunityHubProps) {
  const feedEvents = Store.getFeedEvents();
  const [quests, setQuests] = useState<DailyQuest[]>(Store.getDailyQuests());

  function handleQuestComplete(questId: string) {
    const quest = quests.find((q) => q.id === questId);
    if (!quest || quest.completed || quest.locked) return;

    // Mark quest complete + unlock hard if easy just completed
    const updated = quests.map((q) => {
      if (q.id === questId) return { ...q, completed: true };
      if (q.difficulty === "hard" && questId === "quest-easy") return { ...q, locked: false };
      return q;
    });
    setQuests(updated);

    // Award XP
    const allDone = updated.every((q) => q.completed);
    const xpGained = quest.xpReward + (allDone ? 50 : 0);
    const newXp = gamification.xp + xpGained;
    onGamificationUpdate({
      ...gamification,
      xp: newXp,
      questsCompletedToday: [...gamification.questsCompletedToday, questId],
    });

    Sounds.xp();
    if (allDone) setTimeout(() => Sounds.badge(), 400);
  }

  return (
    <div className="min-h-screen bg-background pt-16">
      {/* Live Ticker */}
      <LiveTicker events={feedEvents} />

      {/* Body */}
      <div className="max-w-6xl mx-auto px-6 py-6 flex gap-6">
        {/* Main feed area */}
        <div className="flex-1 min-w-0 space-y-6">
          {/* Daily quests */}
          <DailyQuests quests={quests} onQuestComplete={handleQuestComplete} />

          {/* Community feed */}
          <CommunityFeed />
        </div>

        {/* Sidebar */}
        <GamificationSidebar gamification={gamification} />
      </div>
    </div>
  );
}
```

- [ ] **Step 2: Verify TypeScript compiles**

```bash
cd /Users/aap/Desktop/startup-scratchpad/apr21 && npx tsc --noEmit 2>&1 | head -20
```

- [ ] **Step 3: Commit**

```bash
git add src/app/components/CommunityHub.tsx
git commit -m "feat: add CommunityHub top-level supporter page (LiveTicker + DailyQuests + Feed + Sidebar)"
```

---

### Task 13: Update App.tsx — wire CommunityHub to /supporter route

**Files:**
- Modify: `src/app/App.tsx`

- [ ] **Step 1: Add gamification state to App.tsx and update the supporter route**

In `src/app/App.tsx`:

1. Add import at the top (with other lib imports):
```tsx
import { useState } from "react";
import { Store } from "../lib/store";
import type { GamificationState } from "../lib/types";
import CommunityHub from "./components/CommunityHub";
```

Note: `useEffect` is already imported. Add `useState` to the existing react import line: change `import { type ReactNode, useEffect }` to `import { type ReactNode, useEffect, useState }`.

2. In the `App()` function body, add after the existing `const creditBalance` line:
```tsx
const [gamification, setGamification] = useState<GamificationState>(
  () => Store.getGamificationState()
);
```

3. Replace the `AuthenticatedLayout` call's `creditBalance` and `userType` props to also pass `gamification` — update `AuthenticatedLayout` in App.tsx to accept and forward `gamification`:

Change:
```tsx
function AuthenticatedLayout({ creditBalance, userType }: { creditBalance: number; userType: UserType }) {
  const { isAuthenticated, loading } = useAuth();
  if (loading) return <AuthLoading />;
  if (!isAuthenticated) return <Navigate to="/login" replace />;
  return (
    <>
      <Navbar creditBalance={creditBalance} userType={userType} />
      <Outlet />
    </>
  );
}
```

To:
```tsx
function AuthenticatedLayout({ creditBalance, userType, gamification }: { creditBalance: number; userType: UserType; gamification?: GamificationState }) {
  const { isAuthenticated, loading } = useAuth();
  if (loading) return <AuthLoading />;
  if (!isAuthenticated) return <Navigate to="/login" replace />;
  return (
    <>
      <Navbar creditBalance={creditBalance} userType={userType} gamification={gamification} />
      <Outlet />
    </>
  );
}
```

4. Change the `PublicLayout` similarly:
```tsx
function PublicLayout({ creditBalance, userType, gamification }: { creditBalance: number; userType: UserType; gamification?: GamificationState }) {
  const { isAuthenticated } = useAuth();
  return (
    <>
      {isAuthenticated && <Navbar creditBalance={creditBalance} userType={userType} gamification={gamification} />}
      <Outlet />
    </>
  );
}
```

5. Replace `SupporterDashboardRoute` with `CommunityHubRoute`:
```tsx
function CommunityHubRoute({ gamification, onGamificationUpdate }: { gamification: GamificationState; onGamificationUpdate: (g: GamificationState) => void }) {
  return (
    <>
      <Helmet>
        <title>Community — TipFlow</title>
        <meta name="robots" content="noindex" />
      </Helmet>
      <CommunityHub gamification={gamification} onGamificationUpdate={onGamificationUpdate} />
    </>
  );
}
```

6. In the `<Routes>` JSX, update both layout components to pass `gamification`:

```tsx
<Route element={<PublicLayout creditBalance={creditBalance} userType={userType} gamification={userType === "supporter" ? gamification : undefined} />}>
```

```tsx
<Route element={<AuthenticatedLayout creditBalance={creditBalance} userType={userType} gamification={userType === "supporter" ? gamification : undefined} />}>
```

7. Replace the `/supporter` route:
```tsx
<Route path="/supporter" element={<CommunityHubRoute gamification={gamification} onGamificationUpdate={setGamification} />} />
```

8. Remove the `SupporterDashboard` import line:
```tsx
import SupporterDashboard from "./components/SupporterDashboard";
```

- [ ] **Step 2: Verify TypeScript compiles**

```bash
cd /Users/aap/Desktop/startup-scratchpad/apr21 && npx tsc --noEmit 2>&1 | head -40
```

Expected: no errors.

- [ ] **Step 3: Commit**

```bash
git add src/app/App.tsx
git commit -m "feat: route /supporter to CommunityHub, wire gamification state through App → Navbar"
```

---

### Task 14: Creator milestone celebration (funded sound + confetti)

**Files:**
- Modify: `src/app/components/CreatorDashboard.tsx`

- [ ] **Step 1: Read CreatorDashboard.tsx to find where wishlists/items are rendered**

Read `src/app/components/CreatorDashboard.tsx` and find the section where items are listed and where `raisedAmount >= goalAmount` (100% funded) would be visible.

- [ ] **Step 2: Add funded sound + confetti animation**

At the top of `CreatorDashboard.tsx`, add the imports:
```tsx
import { useEffect, useRef } from "react";
import { Sounds } from "../../lib/sounds";
```

If `useEffect` is already imported, just add `useRef`.

Find where wishlists and items are loaded (likely from `Store.getWishlistsByCreator`). After loading, add this effect that fires when any item transitions to funded:

```tsx
const firedFunded = useRef<Set<string>>(new Set());

useEffect(() => {
  const funded = wishlists
    .flatMap((w) => w.items)
    .filter((item) => item.raisedAmount >= item.goalAmount && item.status === "active");
  
  for (const item of funded) {
    if (!firedFunded.current.has(item.id)) {
      firedFunded.current.add(item.id);
      Sounds.funded();
      setConfettiItemId(item.id);
      setTimeout(() => setConfettiItemId(null), 3000);
    }
  }
}, [wishlists]);
```

Add `const [confettiItemId, setConfettiItemId] = useState<string | null>(null)` to state.

In the item rendering, when `item.id === confettiItemId`, overlay a brief confetti burst animation:
```tsx
{confettiItemId === item.id && (
  <motion.div
    initial={{ opacity: 1 }}
    animate={{ opacity: 0 }}
    transition={{ duration: 2.5 }}
    className="absolute inset-0 pointer-events-none overflow-hidden"
  >
    {Array.from({ length: 20 }).map((_, i) => (
      <motion.div
        key={i}
        className="absolute w-2 h-2 rounded-full"
        style={{
          backgroundColor: ["#f59e0b", "#10b981", "#3b82f6", "#ec4899", "#8b5cf6"][i % 5],
          left: `${Math.random() * 100}%`,
          top: "0%",
        }}
        animate={{
          y: ["0%", "100%"],
          x: [`${(Math.random() - 0.5) * 80}px`],
          opacity: [1, 0],
          rotate: [0, Math.random() * 360],
        }}
        transition={{ duration: 1.5 + Math.random(), delay: Math.random() * 0.5 }}
      />
    ))}
  </motion.div>
)}
```

The item container needs `relative` positioning for this to work. Verify the item card div has `relative` class.

- [ ] **Step 3: Verify TypeScript compiles**

```bash
cd /Users/aap/Desktop/startup-scratchpad/apr21 && npx tsc --noEmit 2>&1 | head -30
```

- [ ] **Step 4: Commit**

```bash
git add src/app/components/CreatorDashboard.tsx
git commit -m "feat: add funded sound + confetti burst animation when wishlist item hits 100%"
```

---

### Task 15: Fix store.ts circular import (gamification.ts → types.ts → store.ts)

**Note:** `gamification.ts` imports from `types.ts` and `store.ts` imports from `gamification.ts`. As long as `types.ts` does NOT import from `store.ts` or `gamification.ts`, there is no circular dependency. Verify this is the case:

- [ ] **Step 1: Verify no circular import**

```bash
grep -n "import" /Users/aap/Desktop/startup-scratchpad/apr21/src/lib/types.ts
```

Expected: no imports from `store.ts` or `gamification.ts`.

If circular imports exist, move `DEMO_GAMIFICATION` inline into `store.ts` instead of importing it from `gamification.ts`, and remove the import. The `gamification.ts` exported functions (`levelFromXp`, `xpProgress`, etc.) are used only in components, not in `store.ts`.

- [ ] **Step 2: Run full build check**

```bash
cd /Users/aap/Desktop/startup-scratchpad/apr21 && npm run build 2>&1 | tail -20
```

Expected: build succeeds with no errors.

- [ ] **Step 3: If build clean, commit**

```bash
git add -A
git commit -m "fix: verify no circular imports in lib/ data layer"
```

---

## Acceptance Checklist

After all tasks complete, verify:

- [ ] `/supporter` route loads `CommunityHub` (not old `SupporterDashboard`)
- [ ] Navbar shows XP bar + streak pill + league pill for supporter accounts
- [ ] Live Ticker scrolls continuously with casino-floor feed events
- [ ] Daily Quests card shows 3 quests; completing easy unlocks hard
- [ ] Completing a quest plays `quest` sound and awards XP (sidebar level/bar updates)
- [ ] Feed tabs switch between Following / Hot Now / Explore / Rising
- [ ] Explore tab shows "Because you gifted X" recommendation labels
- [ ] Gift Now button plays `gift` sound
- [ ] Nav link clicks play `click` sound
- [ ] Gamification sidebar shows level, streak, league, weekly leaderboard, badges grid
- [ ] Creator dashboard plays `funded` sound + confetti when item at 100%
- [ ] `npm run build` passes with zero TypeScript errors
