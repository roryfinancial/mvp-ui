// Shared gamification engine — encapsulates all write logic so the gift and
// follow flows can call it. Ported faithfully from the Java GamificationService.
//
// All values (xp, level, streak, league, quests, leaderboard) are computed
// purely from local DB rows + server date. No external services.

import { prisma } from "@/lib/prisma";
import { todayISODate } from "@/lib/api-helpers";
import type {
  GamificationStateResponse,
  DailyQuestResponse,
  WeeklyLeaderboardEntry,
} from "@/src/lib/api";

export type LeagueTier = "bronze" | "silver" | "gold" | "diamond";

// ─── Quest pool (deterministic daily generation) ─────────────────────────────

type QuestDef = { label: string; xpReward: number };

const QUEST_POOL: Record<"easy" | "medium" | "hard", QuestDef[]> = {
  easy: [
    { label: "Gift any creator", xpReward: 50 },
    { label: "Browse 3 creator profiles", xpReward: 30 },
    { label: "Follow a creator", xpReward: 30 },
  ],
  medium: [
    { label: "Follow a new creator", xpReward: 30 },
    { label: "Gift 2 different creators", xpReward: 60 },
    { label: "Share a creator's page", xpReward: 40 },
  ],
  hard: [
    { label: "Gift $25+ in one gift", xpReward: 100 },
    { label: "Gift 3 creators in one day", xpReward: 120 },
    { label: "Gift $50+ total today", xpReward: 150 },
  ],
};

const GIFT_QUEST_LABELS = new Set<string>([
  "Gift any creator",
  "Gift 2 different creators",
  "Gift 3 creators in one day",
  "Gift $25+ in one gift",
  "Gift $50+ total today",
]);

const FOLLOW_QUEST_LABELS = new Set<string>([
  "Follow a creator",
  "Follow a new creator",
]);

// ─── XP / level formulas (mirror Java exactly) ──────────────────────────────

/** XP cost to advance THROUGH a given level (not cumulative). */
export function xpForLevel(level: number): number {
  return 100 * level * level;
}

/** Convert total accumulated XP to a level (capped at 50). */
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

/** League tier from cumulative weekly gifting. */
export function leagueFromWeeklyGifted(weeklyGifted: number): LeagueTier {
  if (weeklyGifted >= 500) return "diamond";
  if (weeklyGifted >= 200) return "gold";
  if (weeklyGifted >= 50) return "silver";
  return "bronze";
}

// ─── Day-of-year (matches Java LocalDate.getDayOfYear, Jan 1 = 1) ────────────

function dayOfYearFromISO(iso: string): number {
  const [y, m, d] = iso.split("-").map((n) => parseInt(n, 10));
  const start = Date.UTC(y, 0, 1);
  const cur = Date.UTC(y, m - 1, d);
  return Math.floor((cur - start) / 86400000) + 1;
}

// ─── Gamification row (lazy create) ──────────────────────────────────────────

async function getOrCreate(userId: string) {
  const existing = await prisma.userGamification.findUnique({ where: { userId } });
  if (existing) return existing;
  return prisma.userGamification.create({
    data: {
      userId,
      xp: 0,
      level: 1,
      streakDays: 0,
      lastActivityDate: null,
      leagueTier: "bronze",
      weeklyGifted: 0,
    },
  });
}

// ─── Daily quests ────────────────────────────────────────────────────────────

async function generateDailyQuests(userId: string, date: string) {
  const doy = dayOfYearFromISO(date);
  const idx = doy % 3;
  const picks: Array<{ difficulty: "easy" | "medium" | "hard"; def: QuestDef }> = [
    { difficulty: "easy", def: QUEST_POOL.easy[idx] },
    { difficulty: "medium", def: QUEST_POOL.medium[idx] },
    { difficulty: "hard", def: QUEST_POOL.hard[idx] },
  ];
  const created = [];
  for (const p of picks) {
    const row = await prisma.dailyQuest.create({
      data: {
        userId,
        questDate: date,
        difficulty: p.difficulty,
        label: p.def.label,
        xpReward: p.def.xpReward,
        completed: false,
        locked: false,
      },
    });
    created.push(row);
  }
  return created;
}

/** Generate the current-day quests if missing; return today's quests (ordered). */
export async function getOrCreateTodayQuests(userId: string) {
  const today = todayISODate();
  const existing = await prisma.dailyQuest.findMany({
    where: { userId, questDate: today },
    orderBy: { createdAt: "asc" },
  });
  if (existing.length > 0) return existing;
  return generateDailyQuests(userId, today);
}

// ─── Quest completion (awards XP, may level up) ──────────────────────────────

async function completeQuestInternal(userId: string, questId: string, questXp: number) {
  await prisma.dailyQuest.update({ where: { id: questId }, data: { completed: true } });

  const today = todayISODate();
  const todays = await prisma.dailyQuest.findMany({ where: { userId, questDate: today } });
  const allDone = todays.length > 0 && todays.every((q) => q.completed);

  const xpGained = questXp + (allDone ? 50 : 0);
  const ug = await getOrCreate(userId);
  const newXp = ug.xp + xpGained;
  await prisma.userGamification.update({
    where: { userId },
    data: { xp: newXp, level: levelFromXp(newXp) },
  });
}

// ─── Streak ──────────────────────────────────────────────────────────────────

function isoMinusDays(iso: string, days: number): string {
  const [y, m, d] = iso.split("-").map((n) => parseInt(n, 10));
  const t = Date.UTC(y, m - 1, d) - days * 86400000;
  return new Date(t).toISOString().slice(0, 10);
}

/** Returns the new streakDays value given the prior lastActivityDate. */
function computeStreak(lastActivityDate: string | null, streakDays: number, today: string): number {
  const yesterday = isoMinusDays(today, 1);
  if (!lastActivityDate || lastActivityDate < yesterday) return 1; // broken/first
  if (lastActivityDate === yesterday) return streakDays + 1; // continued
  return streakDays; // already active today (== today)
}

// ─── State ───────────────────────────────────────────────────────────────────

export async function getState(userId: string): Promise<GamificationStateResponse> {
  const ug = await getOrCreate(userId);
  const badges = await prisma.userBadge.findMany({
    where: { userId },
    orderBy: { earnedAt: "asc" },
  });
  const today = todayISODate();
  const todays = await prisma.dailyQuest.findMany({
    where: { userId, questDate: today, completed: true },
  });
  return {
    xp: ug.xp,
    // Derive level from xp so the read path always agrees with the write path
    // (completeQuestInternal recomputes level via levelFromXp); the stored
    // `level` column can otherwise lag and make the displayed level jump.
    level: levelFromXp(ug.xp),
    streakDays: ug.streakDays,
    lastActivityDate: ug.lastActivityDate ?? null,
    leagueTier: ug.leagueTier,
    weeklyGifted: ug.weeklyGifted,
    badges: badges.map((b) => b.badgeId),
    questsCompletedToday: todays.map((q) => q.id),
  };
}

export async function getDailyQuests(userId: string): Promise<DailyQuestResponse[]> {
  const quests = await getOrCreateTodayQuests(userId);
  return quests.map((q) => ({
    id: q.id,
    difficulty: q.difficulty as "easy" | "medium" | "hard",
    label: q.label,
    xpReward: q.xpReward,
    completed: q.completed,
    locked: q.locked,
  }));
}

// ─── Weekly leaderboard ──────────────────────────────────────────────────────

export async function getWeeklyLeaderboard(
  currentUserId: string,
  limit = 5
): Promise<WeeklyLeaderboardEntry[]> {
  const rows = await prisma.userGamification.findMany({
    orderBy: { weeklyGifted: "desc" },
  });
  const entries: WeeklyLeaderboardEntry[] = [];
  let rank = 1;
  for (const row of rows) {
    if (entries.length >= limit) break;
    const user = await prisma.user.findUnique({
      where: { id: row.userId },
      select: { id: true, username: true, displayName: true, name: true, showOnLeaderboard: true },
    });
    if (!user || !user.showOnLeaderboard) continue;
    entries.push({
      rank: rank++,
      username: user.username ?? "",
      displayName: user.displayName ?? user.name ?? "",
      amount: row.weeklyGifted,
      isCurrentUser: user.id === currentUserId,
    });
  }
  return entries;
}

// ─── Write hooks (called by gift/follow flows) ──────────────────────────────

/**
 * Complete the first incomplete unlocked gift-quest (the $25+ quest only if
 * amount>=25), update streak, add amount to weeklyGifted, recompute league,
 * upsert the gamification row.
 */
export async function onGift(userId: string, amount: number): Promise<void> {
  const today = todayISODate();
  const quests = await getOrCreateTodayQuests(userId);

  for (const q of quests) {
    if (q.completed || q.locked) continue;
    if (!GIFT_QUEST_LABELS.has(q.label)) continue;
    if (q.label === "Gift $25+ in one gift" && amount < 25) continue;
    await completeQuestInternal(userId, q.id, q.xpReward);
    break; // only ONE quest per gift action
  }

  const ug = await getOrCreate(userId);
  const newStreak = computeStreak(ug.lastActivityDate, ug.streakDays, today);
  const newWeekly = ug.weeklyGifted + amount;
  await prisma.userGamification.update({
    where: { userId },
    data: {
      streakDays: newStreak,
      lastActivityDate: today,
      weeklyGifted: newWeekly,
      leagueTier: leagueFromWeeklyGifted(newWeekly),
    },
  });
}

/**
 * Complete the first incomplete unlocked follow-quest, update streak.
 * Does NOT touch weeklyGifted or leagueTier.
 */
export async function onFollow(userId: string): Promise<void> {
  const today = todayISODate();
  const quests = await getOrCreateTodayQuests(userId);

  for (const q of quests) {
    if (q.completed || q.locked) continue;
    if (!FOLLOW_QUEST_LABELS.has(q.label)) continue;
    await completeQuestInternal(userId, q.id, q.xpReward);
    break;
  }

  const ug = await getOrCreate(userId);
  const newStreak = computeStreak(ug.lastActivityDate, ug.streakDays, today);
  await prisma.userGamification.update({
    where: { userId },
    data: { streakDays: newStreak, lastActivityDate: today },
  });
}
