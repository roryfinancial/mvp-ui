import { NextRequest } from "next/server";
import { prisma } from "@/lib/prisma";
import { ok, notFound, getInitials, formatTimeAgo } from "@/lib/api-helpers";
import type { RecentSupporterResponse } from "@/src/lib/api";

export async function GET(
  req: NextRequest,
  { params }: { params: Promise<{ username: string }> }
) {
  const { username } = await params;
  const limit = Math.max(1, parseInt(new URL(req.url).searchParams.get("limit") ?? "10", 10) || 10);

  const creator = await prisma.user.findUnique({ where: { username }, select: { id: true } });
  if (!creator) return notFound("Creator not found");

  const gifts = await prisma.gift.findMany({
    where: { creatorId: creator.id, status: "COMPLETED" },
    orderBy: { createdAt: "desc" },
    take: limit,
  });

  const data: RecentSupporterResponse[] = [];
  for (const gift of gifts) {
    const supporter = await prisma.user.findUnique({
      where: { id: gift.supporterId },
      select: { username: true, displayName: true, name: true, avatarUrl: true, image: true },
    });
    const project = await prisma.project.findUnique({
      where: { id: gift.projectId },
      select: { name: true },
    });
    const displayName = supporter?.displayName ?? supporter?.name ?? "";
    data.push({
      supporterUsername: supporter?.username ?? "",
      supporterDisplayName: displayName,
      supporterInitials: getInitials(displayName),
      supporterAvatarUrl: supporter?.avatarUrl ?? supporter?.image ?? null,
      amount: gift.amount,
      itemTitle: project?.name ?? "Unknown Project",
      message: gift.message ?? null,
      timeAgo: formatTimeAgo(gift.createdAt),
    });
  }

  return ok(data);
}
