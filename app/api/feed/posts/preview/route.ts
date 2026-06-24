import { NextRequest } from "next/server";
import { ok, badRequest, unauthorized, getSessionUser } from "@/lib/api-helpers";
import { inferPlatform, platformPostIdFromUrl, deterministicThumbnail } from "../../_shared";

// POST /api/feed/posts/preview — DEMO STUB. Does NOT fetch the URL.
// Infers platform/contentType from the host and returns deterministic metadata.
export async function POST(req: NextRequest) {
  const me = await getSessionUser();
  if (!me) return unauthorized();

  const body = await req.json().catch(() => ({}));
  const url: string = typeof body?.url === "string" ? body.url : "";
  if (!url) return badRequest("url is required");

  const { platform, contentType } = inferPlatform(url);
  const platformPostId = platformPostIdFromUrl(url);

  return ok({
    platform,
    platformPostId,
    platformUrl: url,
    title: `Post from ${platform}`,
    thumbnailUrl: deterministicThumbnail(platformPostId),
    contentType,
  });
}
