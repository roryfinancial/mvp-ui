import { NextRequest } from "next/server";
import { prisma } from "@/lib/prisma";
import { okCached, CACHE, getInitials } from "@/lib/api-helpers";
import type { LeaderboardEntryResponse } from "@/lib/api";

export async function GET(req: NextRequest) {
  const limit = Math.max(1, parseInt(req.nextUrl.searchParams.get("limit") ?? "10", 10) || 10);

  // SUM(amount) per creator, ordered by total DESC, limited.
  const grouped = await prisma.gift.groupBy({
    by: ["creatorId"],
    where: { status: "COMPLETED" },
    _sum: { amount: true },
    orderBy: { _sum: { amount: "desc" } },
    take: limit,
  });

  const creatorIds = grouped.map((g) => g.creatorId);

  // Fetch the underlying gift rows to compute COUNT(DISTINCT supporterId) and
  // COUNT(DISTINCT projectId) per creator (Prisma groupBy can't do distinct counts).
  const gifts = await prisma.gift.findMany({
    where: { status: "COMPLETED", creatorId: { in: creatorIds } },
    select: { creatorId: true, supporterId: true, projectId: true },
  });

  const supportersByCreator = new Map<string, Set<string>>();
  const projectsByCreator = new Map<string, Set<string>>();
  for (const g of gifts) {
    if (!supportersByCreator.has(g.creatorId)) supportersByCreator.set(g.creatorId, new Set());
    if (!projectsByCreator.has(g.creatorId)) projectsByCreator.set(g.creatorId, new Set());
    supportersByCreator.get(g.creatorId)!.add(g.supporterId);
    projectsByCreator.get(g.creatorId)!.add(g.projectId);
  }

  const users = await prisma.user.findMany({
    where: { id: { in: creatorIds } },
    select: {
      id: true,
      username: true,
      displayName: true,
      name: true,
      avatarUrl: true,
      image: true,
      showOnLeaderboard: true,
    },
  });
  const userById = new Map(users.map((u) => [u.id, u]));

  const entries: LeaderboardEntryResponse[] = [];
  let rank = 1;
  for (const g of grouped) {
    const user = userById.get(g.creatorId);
    if (!user || user.showOnLeaderboard === false) continue;
    const displayName = user.displayName ?? user.name ?? "";
    entries.push({
      rank: rank++,
      username: user.username ?? "",
      displayName,
      initials: getInitials(displayName),
      avatarUrl: user.avatarUrl ?? user.image ?? null,
      userType: "CREATOR",
      totalAmount: g._sum.amount ?? 0,
      totalItems: projectsByCreator.get(g.creatorId)?.size ?? 0,
      totalContributions: supportersByCreator.get(g.creatorId)?.size ?? 0,
    });
  }

  return okCached(entries, CACHE.long);
}
