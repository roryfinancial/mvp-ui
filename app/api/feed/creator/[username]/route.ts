import { NextRequest } from "next/server";
import { prisma } from "@/lib/prisma";
import { ok, notFound, getSessionUser, pageParams, paged } from "@/lib/api-helpers";
import { mapPosts } from "../../_shared";

// GET /api/feed/creator/{username}?page&size — posts by one creator, newest-first.
export async function GET(req: NextRequest, { params }: { params: Promise<{ username: string }> }) {
  const me = await getSessionUser();
  const { username } = await params;
  const { page, size, skip } = pageParams(new URL(req.url), 20);

  const creator = await prisma.user.findUnique({ where: { username }, select: { id: true } });
  if (!creator) return notFound("Creator not found");

  const where = { authorId: creator.id };
  const [posts, total] = await Promise.all([
    prisma.post.findMany({ where, orderBy: { createdAt: "desc" }, skip, take: size }),
    prisma.post.count({ where }),
  ]);

  const content = await mapPosts(posts, me?.id ?? null);
  return ok(paged(content, page, size, total));
}
