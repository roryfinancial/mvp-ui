import { NextRequest } from "next/server";
import { prisma } from "@/lib/prisma";
import { ok, unauthorized, getSessionUser, pageParams, paged } from "@/lib/api-helpers";
import { mapPosts } from "../../_shared";

// GET /api/feed/posts/my?page&size — current user's own posts, newest-first.
export async function GET(req: NextRequest) {
  const me = await getSessionUser();
  if (!me) return unauthorized();
  const { page, size, skip } = pageParams(new URL(req.url), 50);

  const where = { authorId: me.id };
  const [posts, total] = await Promise.all([
    prisma.post.findMany({ where, orderBy: { createdAt: "desc" }, skip, take: size }),
    prisma.post.count({ where }),
  ]);
  const content = await mapPosts(posts, me.id);
  return ok(paged(content, page, size, total));
}
