import { NextRequest } from "next/server";
import { prisma } from "@/lib/prisma";
import { ok, notFound, getInitials } from "@/lib/api-helpers";
import type { TopSupporterResponse } from "@/src/lib/api";

export async function GET(
  req: NextRequest,
  { params }: { params: Promise<{ username: string }> }
) {
  const { username } = await params;
  const limit = Math.max(1, parseInt(new URL(req.url).searchParams.get("limit") ?? "10", 10) || 10);

  const creator = await prisma.user.findUnique({ where: { username }, select: { id: true } });
  if (!creator) return notFound("Creator not found");

  // Aggregate gifts grouped by supporter: SUM(amount), COUNT(*), ORDER BY total DESC.
  const grouped = await prisma.gift.groupBy({
    by: ["supporterId"],
    where: { creatorId: creator.id, status: "COMPLETED" },
    _sum: { amount: true },
    _count: { id: true },
    orderBy: { _sum: { amount: "desc" } },
    take: limit,
  });

  const data: TopSupporterResponse[] = [];
  let rank = 1;
  for (const g of grouped) {
    const supporter = await prisma.user.findUnique({
      where: { id: g.supporterId },
      select: { username: true, displayName: true, name: true, avatarUrl: true, image: true },
    });
    const displayName = supporter?.displayName ?? supporter?.name ?? "";
    data.push({
      rank: rank++,
      supporterUsername: supporter?.username ?? "",
      supporterDisplayName: displayName,
      supporterInitials: getInitials(displayName),
      supporterAvatarUrl: supporter?.avatarUrl ?? supporter?.image ?? null,
      totalAmount: g._sum.amount ?? 0,
      contributionCount: g._count.id,
    });
  }

  return ok(data);
}
