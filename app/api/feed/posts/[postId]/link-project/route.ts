import { NextRequest } from "next/server";
import { prisma } from "@/lib/prisma";
import { ok, notFound, forbidden, unauthorized, getSessionUser } from "@/lib/api-helpers";
import { mapPost } from "../../../_shared";

// PUT /api/feed/posts/{postId}/link-project — set/clear Post.linkedProjectId.
// body {projectId}; empty string means unlink (null). Verifies post ownership.
export async function PUT(req: NextRequest, { params }: { params: Promise<{ postId: string }> }) {
  const me = await getSessionUser();
  if (!me) return unauthorized();
  const { postId } = await params;

  const post = await prisma.post.findUnique({ where: { id: postId } });
  if (!post) return notFound("Post not found");
  if (post.authorId !== me.id) return forbidden("Not your post");

  const body = await req.json().catch(() => ({}));
  const raw: string = typeof body?.projectId === "string" ? body.projectId : "";
  const linkedProjectId = raw.length > 0 ? raw : null;

  const updated = await prisma.post.update({
    where: { id: postId },
    data: { linkedProjectId },
  });

  const mapped = await mapPost(updated, me.id);
  return ok(mapped);
}
