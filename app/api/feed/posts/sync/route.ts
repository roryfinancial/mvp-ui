import { prisma } from "@/lib/prisma";
import { ok, unauthorized, getSessionUser } from "@/lib/api-helpers";
import { deterministicThumbnail } from "../../_shared";

// POST /api/feed/posts/sync — DEMO STUB. No real platform APIs are called.
// Inserts a deterministic set of fake Post rows for the current creator, skipping
// duplicates by platformPostId. Returns {newPosts, skipped, errors:[]}.
const SEED = [
  { platform: "YOUTUBE", contentType: "VIDEO", caption: "New devlog is up!", likes: 1240, comments: 86, views: 24500 },
  { platform: "TWITCH", contentType: "STREAM", caption: "Live now — building in public", likes: 430, comments: 52, views: 8900 },
  { platform: "TWITTER", contentType: "TEXT", caption: "Shipping something big this week.", likes: 320, comments: 41, views: 12000 },
  { platform: "INSTAGRAM", contentType: "REEL", caption: "Behind the scenes 🎬", likes: 2100, comments: 130, views: 41000 },
  { platform: "TIKTOK", contentType: "SHORT", caption: "How I made this in 60s", likes: 5400, comments: 210, views: 98000 },
];

export async function POST() {
  const me = await getSessionUser();
  if (!me) return unauthorized();

  let newPosts = 0;
  let skipped = 0;
  const errors: string[] = [];

  for (let i = 0; i < SEED.length; i++) {
    const s = SEED[i];
    const platformPostId = `sync-${s.platform.toLowerCase()}-${i}`;
    const existing = await prisma.post.findFirst({
      where: { authorId: me.id, platformPostId },
      select: { id: true },
    });
    if (existing) {
      skipped++;
      continue;
    }
    await prisma.post.create({
      data: {
        authorId: me.id,
        platform: s.platform,
        platformPostId,
        platformUrl: `https://${s.platform.toLowerCase()}.example/${platformPostId}`,
        caption: s.caption,
        thumbnailUrl: deterministicThumbnail(platformPostId),
        contentType: s.contentType,
        platformLikes: s.likes,
        platformComments: s.comments,
        platformViews: s.views,
        platformCreatedAt: new Date(),
      },
    });
    newPosts++;
  }

  return ok({ newPosts, skipped, errors });
}
