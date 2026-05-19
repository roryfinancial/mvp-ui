# Community Gamification — Design Spec
**Date:** 2026-05-04  
**Status:** Approved by user

---

## Overview

Replace the supporter dashboard with a full community hub that merges a Duolingo-style progression system with a casino-floor live feed. The creator workspace stays largely intact. Both spaces get sound design.

---

## 1. Dual Workspace Split

### Supporter Hub (`/supporter` → `CommunityHub.tsx`)
The logged-in supporter's home. Replaces `SupporterDashboard.tsx` entirely.

### Creator Workspace (`/dashboard` → `CreatorDashboard.tsx`)
Unchanged in structure. Gains milestone celebration animations and sound only.

---

## 2. Supporter Hub — Layout

```
┌─ Navbar (XP bar inline + League pill + Streak pill) ─────────────┐
├─ Live Ticker (scrolling casino-floor feed) ───────────────────────┤
├─ Body ─────────────────────────────────────────────────────────────┤
│  ┌─ Main (flex:1) ──────────────┐  ┌─ Sidebar (220px) ──────────┐ │
│  │  Daily Quests card           │  │  XP / Level block          │ │
│  │  Feed tabs: Following/Hot/   │  │  Streak block              │ │
│  │    Explore/Rising            │  │  League block              │ │
│  │  Creator cards (feed)        │  │  Weekly Leaderboard        │ │
│  │  Recommendation row          │  │  Badges grid               │ │
│  └──────────────────────────────┘  └────────────────────────────┘ │
└────────────────────────────────────────────────────────────────────┘
```

---

## 3. Gamification System

### XP & Levels
- Actions award XP: gift small (+25), gift medium (+50), gift large (+100), follow (+10), daily login (+5), quest complete (+varies)
- Levels 1–50 with increasing thresholds (100 XP × level²)
- Level displayed in navbar XP bar (always visible, Duolingo-style)

### Streak System
- Daily login or gift maintains streak
- Streak grants 2× XP multiplier on all gifts
- Warning: "⚠️ Gift today to keep it going" shown when streak is at risk (no action that day)
- Breaking streak resets multiplier, not level

### League Tiers (weekly reset)
- Bronze → Silver → Gold → Diamond Gifter
- Determined by weekly gifting amount relative to all users
- Bottom 20% of a tier gets demoted; top 20% promoted
- Demotion warning shown if at risk

### Daily Quests (3 per day, reset at midnight)
- Easy: "Gift any creator" (+50 XP) — keeps streak
- Medium: "Follow a new creator" (+30 XP)
- Hard: "Gift $25+ in one gift" (+100 XP) — locked until easy done
- Completing all 3: bonus +50 XP

### Badges (12 total, discoverable)
Earned, not bought. Examples:
- 🌟 Early Adopter (joined in first month)
- 🔥 Streak Lord (30-day streak)
- 💎 Big Spender ($500 total gifted)
- 🎁 First Gift
- 👑 League Leader (reach #1 weekly)
- 🎰 Jackpot (gift to a creator who hits goal same day)
- ⚡ Speed Gifter (gift within 1 hour of creator posting)
- 💰 Century Club ($100 to single creator)
- 🏆 Diamond Gifter (reach Diamond league)
- 🌈 Variety Pack (gift to 10 different creators)
- Others locked/mystery

---

## 4. Community Feed

### Feed Tabs
- **Following** — creators the user follows, sorted by activity recency
- **🔥 Hot Now** — trending by gift velocity (gifts/hour)
- **✨ Explore** — recommendation algorithm output
- **📈 Rising** — new creators with momentum

### Creator Cards
Each card shows:
- Avatar + name + urgency chip (🔥 On a roll / ⏰ Almost funded / ✨ New item)
- Item description with highlighted urgency text
- Progress bar (color-coded: pink=normal, gold=near goal, green=just funded)
- Stats: gifter count, today's gifts, days left
- Raised amount + Gift Now button

### Urgency Chips Logic
- "⏰ Almost funded" — progress ≥ 90%
- "🔥 On a roll" — 5+ gifts in last 24h
- "✨ New item" — item created < 48h ago
- "📈 Rising" — 3× average daily gift rate

### Recommendation Algorithm (seed-data scoring)
Score = (progress_pct × 0.3) + (gifts_today/total_gifts × 0.3) + (following_bonus × 0.25) + (recency × 0.15)
- Displayed in "Explore" tab
- "Because you gifted X" label on recommended cards

---

## 5. Live Ticker

Scrolling banner above the feed. Events:
- `[username] gifted $[amount] to [creator]`
- `🎰 FUNDED — [creator]'s [item] hit its goal!`
- `[username] hit [League] tier`
- `[creator] added a new item`
- `[username] is on a [N]-day streak`

Scrolls continuously. New events append to left. Casino-floor energy.

---

## 6. Sound System (`src/lib/sounds.ts`)

Web Audio API via a thin wrapper. All sounds are procedurally generated (no audio files needed — keeps bundle size zero).

| Trigger | Sound | Description |
|---|---|---|
| Any button click | `click` | Short 80ms tick, 800Hz |
| Gift sent | `gift` | Ascending whoosh + coin clink |
| XP gained | `xp` | Short ascending 3-note ding |
| Level up | `levelup` | Fanfare chord (C-E-G) + sparkle |
| Streak maintained | `streak` | Fire crackle burst |
| Quest complete | `quest` | Satisfying 2-note ding |
| Badge unlocked | `badge` | Triumphant 4-note sequence |
| Goal hit (creator) | `funded` | Jackpot 3-ring bell cascade |
| League promotion | `promotion` | Rising synth sweep |

User can mute via settings (stored in localStorage `tipflow_sounds`).

---

## 7. Data Layer Extensions (`src/lib/store.ts`)

New types in `types.ts`:
```ts
interface GamificationState {
  xp: number;
  level: number;
  streakDays: number;
  lastActivityDate: string; // ISO date
  leagueTier: "bronze" | "silver" | "gold" | "diamond";
  weeklyGifted: number;
  badges: string[]; // badge IDs earned
  questsCompletedToday: string[]; // quest IDs
}

interface FeedEvent {
  id: string;
  type: "gift" | "follow" | "milestone" | "new_item" | "league_up" | "streak";
  actorName: string;
  targetName: string;
  amount?: number;
  timestamp: string;
}
```

New store methods: `getGamificationState(userId)`, `updateGamificationState(userId, delta)`, `getFeedEvents(filter)`, `getRecommendedCreators(userId)`, `getDailyQuests(userId)`.

---

## 8. New Components

| Component | Location | Purpose |
|---|---|---|
| `CommunityHub` | `components/CommunityHub.tsx` | Top-level supporter page |
| `LiveTicker` | `components/LiveTicker.tsx` | Scrolling event banner |
| `DailyQuests` | `components/DailyQuests.tsx` | Quest card |
| `CommunityFeed` | `components/CommunityFeed.tsx` | Tabbed feed + creator cards |
| `CreatorCard` | `components/CreatorCard.tsx` | Individual creator feed card |
| `GamificationSidebar` | `components/GamificationSidebar.tsx` | XP/streak/league/badges |
| `XPBar` | `components/XPBar.tsx` | Navbar inline XP bar |

---

## 9. Creator Workspace Additions

- Milestone celebration: when any item hits 100%, fire a `funded` sound + confetti burst animation over the dashboard
- No structural changes to existing creator dashboard routes/components

---

## 10. What's Out of Scope

- Real backend/database (all seeded data)
- Real-time WebSocket feed (ticker loops over seed data)
- Actual algorithm ML (scoring formula on seed data)
- Push notifications
- Social DMs or chat
