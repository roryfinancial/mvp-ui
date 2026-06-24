import { prisma } from "@/lib/prisma";
import { ok, unauthorized, getSessionUser } from "@/lib/api-helpers";
import { mapPosts } from "../../../_shared";

// GET /api/feed/posts/my/unlinked — current user's posts with no linked project (array).
export async function GET() {
  const me = await getSessionUser();
  if (!me) return unauthorized();

  const posts = await prisma.post.findMany({
    where: { authorId: me.id, linkedProjectId: null },
    orderBy: { createdAt: "desc" },
  });
  const content = await mapPosts(posts, me.id);
  return ok(content);
}
