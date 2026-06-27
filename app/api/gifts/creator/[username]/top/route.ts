import { NextRequest } from "next/server";
import { prisma } from "@/lib/prisma";
import { ok, notFound, getInitials } from "@/lib/api-helpers";
import type { TopSupporterResponse } from "@/src/lib/api";

export async function GET(
  req: NextRequest,
  { params }: { params: Promise<{ username: string }> }
) {
  const { username } = await params;
  const sp = new URL(req.url).searchParams;
  const limit = Math.max(1, parseInt(sp.get("limit") ?? "10", 10) || 10);
  // period=week restricts the leaderboard to the trailing 7 days (used by the
  // dashboard "top gifter this week" spotlight); default is all-time.
  const period = sp.get("period");

  const creator = await prisma.user.findUnique({ where: { username }, select: { id: true } });
  if (!creator) return notFound("Creator not found");

  const where: { creatorId: string; status: string; createdAt?: { gte: Date } } = {
    creatorId: creator.id,
    status: "COMPLETED",
  };
  if (period === "week") {
    where.createdAt = { gte: new Date(Date.now() - 7 * 24 * 60 * 60 * 1000) };
  }

  // Aggregate gifts grouped by supporter: SUM(amount), COUNT(*), ORDER BY total DESC.
  const grouped = await prisma.gift.groupBy({
    by: ["supporterId"],
    where,
    _sum: { amount: true },
    _count: { id: true },
    orderBy: { _sum: { amount: "desc" } },
    take: limit,
  });

  // Batch-load the grouped supporters in one query instead of one per row.
  const supporterIds = grouped.map((g) => g.supporterId);
  const supporters = await prisma.user.findMany({
    where: { id: { in: supporterIds } },
    select: { id: true, username: true, displayName: true, name: true, avatarUrl: true, image: true },
  });
  const supporterById = new Map(supporters.map((s) => [s.id, s]));

  const data: TopSupporterResponse[] = grouped.map((g, i) => {
    const supporter = supporterById.get(g.supporterId);
    const displayName = supporter?.displayName ?? supporter?.name ?? "";
    return {
      rank: i + 1,
      supporterUsername: supporter?.username ?? "",
      supporterDisplayName: displayName,
      supporterInitials: getInitials(displayName),
      supporterAvatarUrl: supporter?.avatarUrl ?? supporter?.image ?? null,
      totalAmount: g._sum.amount ?? 0,
      contributionCount: g._count.id,
    };
  });

  return ok(data);
}
