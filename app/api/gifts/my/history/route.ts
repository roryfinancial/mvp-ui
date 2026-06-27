import { NextRequest } from "next/server";
import { prisma } from "@/lib/prisma";
import { ok, unauthorized, getSessionUser, paged, pageParams } from "@/lib/api-helpers";
import type { GiftHistoryResponse } from "@/src/lib/api";

export async function GET(req: NextRequest) {
  const me = await getSessionUser();
  if (!me) return unauthorized();

  const url = new URL(req.url);
  const { page, size, skip } = pageParams(url, 20);

  const where = { supporterId: me.id };
  const [gifts, totalElements] = await Promise.all([
    prisma.gift.findMany({
      where,
      orderBy: { createdAt: "desc" },
      skip,
      take: size,
    }),
    prisma.gift.count({ where }),
  ]);

  // Batch-load every referenced user and project in two queries (instead of
  // three findUnique calls per gift) and resolve from in-memory maps.
  const userIds = [...new Set(gifts.flatMap((g) => [g.supporterId, g.creatorId]))];
  const projectIds = [...new Set(gifts.map((g) => g.projectId))];
  const [users, projects] = await Promise.all([
    prisma.user.findMany({ where: { id: { in: userIds } }, select: { id: true, username: true } }),
    prisma.project.findMany({ where: { id: { in: projectIds } }, select: { id: true, name: true } }),
  ]);
  const usernameById = new Map(users.map((u) => [u.id, u.username ?? ""]));
  const projectNameById = new Map(projects.map((p) => [p.id, p.name]));

  const content: GiftHistoryResponse[] = gifts.map((gift) => ({
    id: gift.id,
    supporterUsername: usernameById.get(gift.supporterId) ?? "",
    creatorUsername: usernameById.get(gift.creatorId) ?? "",
    itemTitle: projectNameById.get(gift.projectId) ?? "Unknown Project",
    amount: gift.amount,
    status: gift.status as GiftHistoryResponse["status"],
    createdAt: gift.createdAt.toISOString(),
  }));

  return ok(paged(content, page, size, totalElements));
}
