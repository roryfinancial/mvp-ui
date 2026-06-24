import { NextRequest } from "next/server";
import { prisma } from "@/lib/prisma";
import { ok, badRequest, unauthorized, getSessionUser } from "@/lib/api-helpers";
import { mapPost, inferPlatform, platformPostIdFromUrl, deterministicThumbnail } from "../_shared";

// POST /api/feed/posts — DEMO STUB metadata. Create a Post from a URL for the
// current user, optionally linking a project. Returns mapped FeedPostResponse.
export async function POST(req: NextRequest) {
  const me = await getSessionUser();
  if (!me) return unauthorized();

  const body = await req.json().catch(() => ({}));
  const url: string = typeof body?.url === "string" ? body.url : "";
  if (!url) return badRequest("url is required");
  const linkedProjectId: string | null =
    typeof body?.linkedProjectId === "string" && body.linkedProjectId.length > 0
      ? body.linkedProjectId
      : null;

  // If linking a project, it must belong to the author (prevents attaching your
  // post to someone else's fundraiser).
  if (linkedProjectId) {
    const proj = await prisma.project.findUnique({ where: { id: linkedProjectId }, select: { creatorId: true } });
    if (!proj || proj.creatorId !== me.id) {
      return badRequest("linkedProjectId must reference one of your own projects");
    }
  }

  const { platform, contentType } = inferPlatform(url);
  const platformPostId = platformPostIdFromUrl(url);

  const post = await prisma.post.create({
    data: {
      authorId: me.id,
      platform,
      platformPostId,
      platformUrl: url,
      caption: `Post from ${platform}`,
      thumbnailUrl: deterministicThumbnail(platformPostId),
      contentType,
      platformLikes: 0,
      platformComments: 0,
      platformViews: 0,
      likeCount: 0,
      commentCount: 0,
      linkedProjectId,
      platformCreatedAt: new Date(),
    },
  });

  const mapped = await mapPost(post, me.id);
  return ok(mapped, 201);
}
