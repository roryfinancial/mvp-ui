import { NextRequest } from "next/server";
import { prisma } from "@/lib/prisma";
import { ok, getInitials } from "@/lib/api-helpers";
import type { LeaderboardEntryResponse } from "@/lib/api";

export async function GET(req: NextRequest) {
  const limit = Math.max(1, parseInt(req.nextUrl.searchParams.get("limit") ?? "10", 10) || 10);

  // SUM(amount) per supporter, plus raw gift-row count, ordered by total DESC.
  const grouped = await prisma.gift.groupBy({
    by: ["supporterId"],
    where: { status: "COMPLETED" },
    _sum: { amount: true },
    _count: { _all: true },
    orderBy: { _sum: { amount: "desc" } },
    take: limit,
  });

  const supporterIds = grouped.map((g) => g.supporterId);

  // Fetch gift rows to compute COUNT(DISTINCT projectId) per supporter.
  const gifts = await prisma.gift.findMany({
    where: { status: "COMPLETED", supporterId: { in: supporterIds } },
    select: { supporterId: true, projectId: true },
  });

  const projectsBySupporter = new Map<string, Set<string>>();
  for (const g of gifts) {
    if (!projectsBySupporter.has(g.supporterId)) projectsBySupporter.set(g.supporterId, new Set());
    projectsBySupporter.get(g.supporterId)!.add(g.projectId);
  }

  const users = await prisma.user.findMany({
    where: { id: { in: supporterIds } },
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
    const user = userById.get(g.supporterId);
    if (!user || user.showOnLeaderboard === false) continue;
    const displayName = user.displayName ?? user.name ?? "";
    entries.push({
      rank: rank++,
      username: user.username ?? "",
      displayName,
      initials: getInitials(displayName),
      avatarUrl: user.avatarUrl ?? user.image ?? null,
      userType: "SUPPORTER",
      totalAmount: g._sum.amount ?? 0,
      totalItems: projectsBySupporter.get(g.supporterId)?.size ?? 0,
      totalContributions: g._count._all,
    });
  }

  return ok(entries);
}
