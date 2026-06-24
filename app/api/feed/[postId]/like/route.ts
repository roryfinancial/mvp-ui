import { prisma } from "@/lib/prisma";
import { ok, notFound, unauthorized, getSessionUser } from "@/lib/api-helpers";

// POST /api/feed/{postId}/like — toggle PostLike, adjust Post.likeCount; returns {liked}.
export async function POST(_req: Request, { params }: { params: Promise<{ postId: string }> }) {
  const me = await getSessionUser();
  if (!me) return unauthorized();
  const { postId } = await params;

  const post = await prisma.post.findUnique({ where: { id: postId } });
  if (!post) return notFound("Post not found");

  const existing = await prisma.postLike.findUnique({
    where: { postId_userId: { postId, userId: me.id } },
  });

  if (existing) {
    await prisma.postLike.delete({ where: { id: existing.id } });
    await prisma.post.update({
      where: { id: postId },
      data: { likeCount: Math.max(0, post.likeCount - 1) },
    });
    return ok({ liked: false });
  }

  await prisma.postLike.create({ data: { postId, userId: me.id } });
  await prisma.post.update({
    where: { id: postId },
    data: { likeCount: post.likeCount + 1 },
  });
  return ok({ liked: true });
}
