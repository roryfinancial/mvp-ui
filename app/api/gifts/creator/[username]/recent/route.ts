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

  // Batch-load supporters and projects (two queries) instead of two per gift.
  const supporterIds = [...new Set(gifts.map((g) => g.supporterId))];
  const projectIds = [...new Set(gifts.map((g) => g.projectId))];
  const [supporters, projects] = await Promise.all([
    prisma.user.findMany({
      where: { id: { in: supporterIds } },
      select: { id: true, username: true, displayName: true, name: true, avatarUrl: true, image: true },
    }),
    prisma.project.findMany({ where: { id: { in: projectIds } }, select: { id: true, name: true } }),
  ]);
  const supporterById = new Map(supporters.map((s) => [s.id, s]));
  const projectNameById = new Map(projects.map((p) => [p.id, p.name]));

  const data: RecentSupporterResponse[] = gifts.map((gift) => {
    const supporter = supporterById.get(gift.supporterId);
    const displayName = supporter?.displayName ?? supporter?.name ?? "";
    return {
      supporterUsername: supporter?.username ?? "",
      supporterDisplayName: displayName,
      supporterInitials: getInitials(displayName),
      supporterAvatarUrl: supporter?.avatarUrl ?? supporter?.image ?? null,
      amount: gift.amount,
      itemTitle: projectNameById.get(gift.projectId) ?? "Unknown Project",
      message: gift.message ?? null,
      timeAgo: formatTimeAgo(gift.createdAt),
    };
  });

  return ok(data);
}
