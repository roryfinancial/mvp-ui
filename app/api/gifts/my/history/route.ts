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

  const content: GiftHistoryResponse[] = [];
  for (const gift of gifts) {
    const supporter = await prisma.user.findUnique({
      where: { id: gift.supporterId },
      select: { username: true },
    });
    const creator = await prisma.user.findUnique({
      where: { id: gift.creatorId },
      select: { username: true },
    });
    const project = await prisma.project.findUnique({
      where: { id: gift.projectId },
      select: { name: true },
    });
    content.push({
      id: gift.id,
      supporterUsername: supporter?.username ?? "",
      creatorUsername: creator?.username ?? "",
      itemTitle: project?.name ?? "Unknown Project",
      amount: gift.amount,
      status: gift.status as GiftHistoryResponse["status"],
      createdAt: gift.createdAt.toISOString(),
    });
  }

  return ok(paged(content, page, size, totalElements));
}
