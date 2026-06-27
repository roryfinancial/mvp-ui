import { NextRequest } from "next/server";
import { prisma } from "@/lib/prisma";
import { okCached, CACHE, notFound, getInitials, formatTimeAgo } from "@/lib/api-helpers";
import type { RecentSupporterResponse } from "@/src/lib/api";

export async function GET(
  req: NextRequest,
  { params }: { params: Promise<{ itemId: string }> }
) {
  const { itemId } = await params;
  const limit = Math.max(1, parseInt(new URL(req.url).searchParams.get("limit") ?? "10", 10) || 10);

  // Gift stores only projectId, so resolve item -> its project first.
  const item = await prisma.projectItem.findUnique({
    where: { id: itemId },
    select: { projectId: true, title: true },
  });
  if (!item) return notFound("Item not found");

  const gifts = await prisma.gift.findMany({
    where: { projectId: item.projectId, status: "COMPLETED" },
    orderBy: { createdAt: "desc" },
    take: limit,
  });

  // Batch-load supporters in one query instead of one per gift.
  const supporterIds = [...new Set(gifts.map((g) => g.supporterId))];
  const supporters = await prisma.user.findMany({
    where: { id: { in: supporterIds } },
    select: { id: true, username: true, displayName: true, name: true, avatarUrl: true, image: true },
  });
  const supporterById = new Map(supporters.map((s) => [s.id, s]));

  const data: RecentSupporterResponse[] = gifts.map((gift) => {
    const supporter = supporterById.get(gift.supporterId);
    const displayName = supporter?.displayName ?? supporter?.name ?? "";
    return {
      supporterUsername: supporter?.username ?? "",
      supporterDisplayName: displayName,
      supporterInitials: getInitials(displayName),
      supporterAvatarUrl: supporter?.avatarUrl ?? supporter?.image ?? null,
      amount: gift.amount,
      itemTitle: item.title,
      message: gift.message ?? null,
      timeAgo: formatTimeAgo(gift.createdAt),
    };
  });

  return okCached(data, CACHE.short);
}
