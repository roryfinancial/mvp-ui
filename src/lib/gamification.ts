import type { GamificationState, BadgeId } from "./types";

// XP required to complete a level: 100 * level^2
export function xpForLevel(level: number): number {
  return 100 * level * level;
}

// Total XP accumulated at the START of a level
export function totalXpAtLevel(level: number): number {
  let total = 0;
  for (let l = 1; l < level; l++) total += xpForLevel(l);
  return total;
}

// Derive current level from total XP
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

// XP progress within the current level
export function xpProgress(xp: number): { current: number; needed: number; pct: number } {
  const level = levelFromXp(xp);
  const base = totalXpAtLevel(level);
  const current = xp - base;
  const needed = xpForLevel(level);
  return { current, needed, pct: Math.min(current / needed, 1) };
}

export function leagueBadgeColor(tier: GamificationState["leagueTier"]): string {
  const map = {
    bronze:  "text-amber-600",
    silver:  "text-slate-400",
    gold:    "text-yellow-400",
    diamond: "text-cyan-400",
  } as const;
  return map[tier];
}

export function leagueLabel(tier: GamificationState["leagueTier"]): string {
  return tier.charAt(0).toUpperCase() + tier.slice(1);
}

// Seeded demo gamification state for the supporter account
export const DEMO_GAMIFICATION: GamificationState = {
  xp: 3200,
  level: levelFromXp(3200),
  streakDays: 7,
  lastActivityDate: "2026-05-02",
  leagueTier: "gold",
  weeklyGifted: 185,
  badges: ["early_adopter", "first_gift", "variety_pack"] as BadgeId[],
  questsCompletedToday: ["quest-easy"],
};
