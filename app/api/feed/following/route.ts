import { NextRequest } from "next/server";
import { prisma } from "@/lib/prisma";
import { ok, getSessionUser, pageParams, paged } from "@/lib/api-helpers";
import { mapPosts } from "../_shared";

// GET /api/feed/following?page&size — posts only from followed creators, newest-first.
export async function GET(req: NextRequest) {
  const me = await getSessionUser();
  const { page, size, skip } = pageParams(new URL(req.url), 20);

  if (!me) return ok(paged([], page, size, 0));

  const follows = await prisma.follow.findMany({
    where: { supporterId: me.id },
    select: { creatorId: true },
  });
  const followedIds = follows.map((f) => f.creatorId);
  if (followedIds.length === 0) return ok(paged([], page, size, 0));

  const where = { authorId: { in: followedIds } };
  const [posts, total] = await Promise.all([
    prisma.post.findMany({ where, orderBy: { createdAt: "desc" }, skip, take: size }),
    prisma.post.count({ where }),
  ]);

  const content = await mapPosts(posts, me.id);
  return ok(paged(content, page, size, total));
}
