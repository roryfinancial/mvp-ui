import { prisma } from "@/lib/prisma";
import { ok, unauthorized, getSessionUser } from "@/lib/api-helpers";
import { mapPosts } from "../../../_shared";

// GET /api/feed/posts/project/{projectId} — all posts linked to a project (array).
export async function GET(_req: Request, { params }: { params: Promise<{ projectId: string }> }) {
  const me = await getSessionUser();
  if (!me) return unauthorized();
  const { projectId } = await params;

  const posts = await prisma.post.findMany({
    where: { linkedProjectId: projectId },
    orderBy: { createdAt: "desc" },
  });
  const content = await mapPosts(posts, me.id);
  return ok(content);
}
