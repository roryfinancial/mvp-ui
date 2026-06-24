import { prisma } from "@/lib/prisma";
import { ok, getSessionUser } from "@/lib/api-helpers";

interface FeedCreatorStory {
  username: string;
  displayName: string;
  avatarUrl: string | null;
  hasNewPosts: boolean;
  platforms: string[];
}

// GET /api/feed/stories — distinct posting creators, followed-first then alphabetical.
export async function GET() {
  const me = await getSessionUser();

  // (1) creators the current user follows
  let followedIds = new Set<string>();
  if (me) {
    const follows = await prisma.follow.findMany({
      where: { supporterId: me.id },
      select: { creatorId: true },
    });
    followedIds = new Set(follows.map((f) => f.creatorId));
  }

  // (2) distinct author ids from posts
  const distinct = await prisma.post.findMany({
    distinct: ["authorId"],
    select: { authorId: true },
  });
  const authorIds = distinct.map((d) => d.authorId);
  if (authorIds.length === 0) return ok([] as FeedCreatorStory[]);

  // (3) load each author
  const users = await prisma.user.findMany({
    where: { id: { in: authorIds } },
    select: { id: true, username: true, displayName: true, name: true, avatarUrl: true, image: true },
  });

  // (4) build stories
  const stories: (FeedCreatorStory & { _followed: boolean })[] = users.map((u) => ({
    username: u.username ?? "",
    displayName: u.displayName ?? u.name ?? "",
    avatarUrl: u.avatarUrl ?? u.image ?? null,
    hasNewPosts: true,
    platforms: [],
    _followed: followedIds.has(u.id),
  }));

  // (5) sort: followed first, then displayName alphabetical ascending
  stories.sort((a, b) => {
    if (a._followed !== b._followed) return a._followed ? -1 : 1;
    return a.displayName.localeCompare(b.displayName);
  });

  const result: FeedCreatorStory[] = stories.map(({ _followed, ...s }) => s);
  return ok(result);
}
