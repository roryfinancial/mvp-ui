import { NextRequest } from "next/server";
import { prisma } from "@/lib/prisma";
import { ok, notFound, getInitials, formatTimeAgo } from "@/lib/api-helpers";
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

  const data: RecentSupporterResponse[] = [];
  for (const gift of gifts) {
    const supporter = await prisma.user.findUnique({
      where: { id: gift.supporterId },
      select: { username: true, displayName: true, name: true, avatarUrl: true, image: true },
    });
    const displayName = supporter?.displayName ?? supporter?.name ?? "";
    data.push({
      supporterUsername: supporter?.username ?? "",
      supporterDisplayName: displayName,
      supporterInitials: getInitials(displayName),
      supporterAvatarUrl: supporter?.avatarUrl ?? supporter?.image ?? null,
      amount: gift.amount,
      itemTitle: item.title,
      message: gift.message ?? null,
      timeAgo: formatTimeAgo(gift.createdAt),
    });
  }

  return ok(data);
}
