import { NextRequest } from "next/server";
import { prisma } from "@/lib/prisma";
import { ok, getSessionUser, pageParams, paged } from "@/lib/api-helpers";
import { mapPosts } from "../_shared";

// GET /api/feed/trending?page&size — likeCount DESC, platformLikes DESC, createdAt DESC.
export async function GET(req: NextRequest) {
  const me = await getSessionUser();
  const { page, size, skip } = pageParams(new URL(req.url), 20);

  const [posts, total] = await Promise.all([
    prisma.post.findMany({
      orderBy: [{ likeCount: "desc" }, { platformLikes: "desc" }, { createdAt: "desc" }],
      skip,
      take: size,
    }),
    prisma.post.count(),
  ]);

  const content = await mapPosts(posts, me?.id ?? null);
  return ok(paged(content, page, size, total));
}
