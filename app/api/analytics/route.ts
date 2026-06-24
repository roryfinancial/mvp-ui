import { NextRequest } from "next/server";
import { prisma } from "@/lib/prisma";
import { ok, badRequest, unauthorized, getSessionUser, formatTimeAgo } from "@/lib/api-helpers";

// Platform fee config (env `stripe.platform-fee-percent`, default 10.0).
const PLATFORM_FEE_PERCENT = 10.0;
const FEE_MULTIPLIER = round(1 - PLATFORM_FEE_PERCENT / 100, 4); // 0.9

function round(n: number, dp: number): number {
  const f = Math.pow(10, dp);
  return Math.round((n + Number.EPSILON) * f) / f;
}

function money(n: number): number {
  return round(n, 2);
}

function netOf(gross: number): number {
  return money(gross * FEE_MULTIPLIER);
}

function calcChange(current: number, previous: number): number {
  if (previous === 0) return current > 0 ? 100.0 : 0.0;
  return ((current - previous) / previous) * 100;
}

interface Interval {
  start: Date;
  end: Date;
  label: string;
}

// ─── Date helpers (all UTC, start-of-day) ────────────────────────────────────

function todayUTCStartOfDay(): Date {
  const now = new Date();
  return new Date(Date.UTC(now.getUTCFullYear(), now.getUTCMonth(), now.getUTCDate()));
}

function addDays(d: Date, days: number): Date {
  return new Date(d.getTime() + days * 24 * 60 * 60 * 1000);
}

function addWeeks(d: Date, weeks: number): Date {
  return addDays(d, weeks * 7);
}

/** Monday of the week containing `d` (UTC start-of-day). */
function mondayOf(d: Date): Date {
  const dow = d.getUTCDay(); // 0=Sun..6=Sat
  const diff = dow === 0 ? -6 : 1 - dow; // shift back to Monday
  return addDays(d, diff);
}

function firstOfMonth(year: number, month: number): Date {
  return new Date(Date.UTC(year, month, 1));
}

const DAY_LABELS = ["Mon", "Tue", "Wed", "Thu", "Fri", "Sat", "Sun"];
const MONTH_LABELS = ["Jan", "Feb", "Mar", "Apr", "May", "Jun", "Jul", "Aug", "Sep", "Oct", "Nov", "Dec"];

function getIntervals(period: string, today: Date): Interval[] {
  if (period === "week") {
    const weekStart = mondayOf(today);
    return DAY_LABELS.map((label, i) => ({
      start: addDays(weekStart, i),
      end: addDays(weekStart, i + 1),
      label,
    }));
  }
  if (period === "month") {
    const monthStart = firstOfMonth(today.getUTCFullYear(), today.getUTCMonth());
    const tomorrow = addDays(today, 1);
    return [0, 1, 2, 3].map((i) => ({
      start: addWeeks(monthStart, i),
      end: i === 3 ? tomorrow : addWeeks(monthStart, i + 1),
      label: `Week ${i + 1}`,
    }));
  }
  if (period === "year") {
    const year = today.getUTCFullYear();
    return MONTH_LABELS.map((label, i) => ({
      start: firstOfMonth(year, i),
      end: firstOfMonth(year, i + 1),
      label,
    }));
  }
  throw new Error("Invalid period");
}

function getPreviousIntervals(period: string, today: Date): Interval[] {
  if (period === "week") {
    const prevWeekStart = addWeeks(mondayOf(today), -1);
    return DAY_LABELS.map((label, i) => ({
      start: addDays(prevWeekStart, i),
      end: addDays(prevWeekStart, i + 1),
      label,
    }));
  }
  if (period === "month") {
    // previous calendar month, 4 weekly buckets each exactly 1 week
    let year = today.getUTCFullYear();
    let month = today.getUTCMonth() - 1;
    if (month < 0) {
      month = 11;
      year -= 1;
    }
    const monthStart = firstOfMonth(year, month);
    return [0, 1, 2, 3].map((i) => ({
      start: addWeeks(monthStart, i),
      end: addWeeks(monthStart, i + 1),
      label: `Week ${i + 1}`,
    }));
  }
  if (period === "year") {
    const year = today.getUTCFullYear() - 1;
    return MONTH_LABELS.map((label, i) => ({
      start: firstOfMonth(year, i),
      end: firstOfMonth(year, i + 1),
      label,
    }));
  }
  return getIntervals(period, today);
}

async function getProjectName(projectId: string): Promise<string> {
  try {
    const p = await prisma.project.findUnique({ where: { id: projectId }, select: { name: true } });
    return p?.name ?? "Unknown Project";
  } catch {
    return "Unknown Project";
  }
}

// ─── Aggregation over a single [start,end) span for a creator ────────────────

async function aggregateSpan(
  creatorId: string,
  start: Date,
  end: Date
): Promise<{ revenue: number; supporters: number; gifts: number }> {
  const where = {
    creatorId,
    status: "COMPLETED",
    createdAt: { gte: start, lt: end },
  };
  const [agg, distinctSupporters] = await Promise.all([
    prisma.gift.aggregate({ where, _sum: { amount: true }, _count: { _all: true } }),
    prisma.gift.findMany({ where, select: { supporterId: true }, distinct: ["supporterId"] }),
  ]);
  return {
    revenue: agg._sum.amount ?? 0,
    supporters: distinctSupporters.length,
    gifts: agg._count._all,
  };
}

export async function GET(req: NextRequest) {
  const me = await getSessionUser();
  if (!me) return unauthorized();

  const period = req.nextUrl.searchParams.get("period") ?? "month";
  if (period !== "week" && period !== "month" && period !== "year") {
    return badRequest("Invalid period: must be 'week', 'month', or 'year'");
  }

  const today = todayUTCStartOfDay();
  const creatorId = me.id;

  const intervals = getIntervals(period, today);
  const prevIntervals = getPreviousIntervals(period, today);

  // STEP 3 - per-bucket chart series
  const labels: string[] = [];
  const revenue: number[] = [];
  const netRevenue: number[] = [];
  const supporters: number[] = [];
  const gifts: number[] = [];
  const avgContribution: number[] = [];
  const netAvgContribution: number[] = [];

  for (const iv of intervals) {
    const a = await aggregateSpan(creatorId, iv.start, iv.end);
    const net = netOf(a.revenue);
    labels.push(iv.label);
    revenue.push(money(a.revenue));
    netRevenue.push(net);
    supporters.push(a.supporters);
    gifts.push(a.gifts);
    avgContribution.push(a.gifts > 0 ? money(a.revenue / a.gifts) : 0);
    netAvgContribution.push(a.gifts > 0 ? money(net / a.gifts) : 0);
  }

  // STEP 4 - current-period totals (single re-query over full span)
  const curStart = intervals[0].start;
  const curEnd = intervals[intervals.length - 1].end;
  const cur = await aggregateSpan(creatorId, curStart, curEnd);
  const totalRevenue = money(cur.revenue);
  const totalSupporters = cur.supporters;
  const totalGifts = cur.gifts;
  const totalNetRevenue = netOf(cur.revenue);
  const totalAvg = totalGifts > 0 ? money(cur.revenue / totalGifts) : 0;
  const totalNetAvg = totalGifts > 0 ? money(totalNetRevenue / totalGifts) : 0;

  // STEP 5 - previous-period totals
  const prevStart = prevIntervals[0].start;
  const prevEnd = prevIntervals[prevIntervals.length - 1].end;
  const prev = await aggregateSpan(creatorId, prevStart, prevEnd);
  const prevNetRevenue = netOf(prev.revenue);
  const prevAvg = prev.gifts > 0 ? money(prevNetRevenue / prev.gifts) : 0;

  // STEP 6 - change percentages
  const revenueChange = calcChange(totalNetRevenue, prevNetRevenue);
  const supportersChange = calcChange(totalSupporters, prev.supporters);
  const giftsChange = calcChange(totalGifts, prev.gifts);
  const avgContributionChange = calcChange(totalNetAvg, prevAvg);

  // STEP 7 - recentActivity: 10 most recent COMPLETED gifts
  const recentGifts = await prisma.gift.findMany({
    where: { creatorId, status: "COMPLETED" },
    orderBy: { createdAt: "desc" },
    take: 10,
  });
  const recentActivity = await Promise.all(
    recentGifts.map(async (g) => {
      const supporter = await prisma.user.findUnique({
        where: { id: g.supporterId },
        select: { displayName: true, name: true },
      });
      return {
        supporterDisplayName: supporter?.displayName ?? supporter?.name ?? "",
        amount: money(g.amount),
        itemTitle: await getProjectName(g.projectId),
        timeAgo: formatTimeAgo(g.createdAt),
      };
    })
  );

  // STEP 8 - topProjects: group COMPLETED gifts in current span by projectId
  const spanWhere = {
    creatorId,
    status: "COMPLETED",
    createdAt: { gte: curStart, lt: curEnd },
  };
  const grouped = await prisma.gift.groupBy({
    by: ["projectId"],
    where: spanWhere,
    _sum: { amount: true },
    orderBy: { _sum: { amount: "desc" } },
    take: 3,
  });
  const topProjects = await Promise.all(
    grouped.map(async (grp) => {
      const distinct = await prisma.gift.findMany({
        where: { ...spanWhere, projectId: grp.projectId },
        select: { supporterId: true },
        distinct: ["supporterId"],
      });
      const total = grp._sum.amount ?? 0;
      return {
        projectId: grp.projectId,
        name: await getProjectName(grp.projectId),
        totalRevenue: money(total),
        netRevenue: netOf(total),
        supporterCount: distinct.length,
      };
    })
  );

  return ok({
    period,
    chartData: {
      labels,
      revenue,
      netRevenue,
      supporters,
      gifts,
      avgContribution,
      netAvgContribution,
    },
    stats: {
      totalRevenue,
      netRevenue: totalNetRevenue,
      revenueChange,
      totalSupporters,
      supportersChange,
      totalGifts,
      giftsChange,
      avgContribution: totalAvg,
      netAvgContribution: totalNetAvg,
      avgContributionChange,
    },
    recentActivity,
    topProjects,
  });
}
