// Shared helpers for the feed (post) domain routes.
import { prisma } from "@/lib/prisma";
import type { Post } from "@prisma/client";

export interface LinkedProjectInfo {
  projectId: string;
  projectName: string;
  itemTitle: string | null;
  goalAmount: number;
  raisedAmount: number;
  progress: number;
}

export interface FeedPostResponse {
  id: string;
  authorUsername: string;
  authorDisplayName: string;
  authorAvatarUrl: string | null;
  platform: string;
  platformUrl: string | null;
  contentType: string;
  caption: string | null;
  imageUrl: string | null;
  videoUrl: string | null;
  thumbnailUrl: string | null;
  platformLikes: number;
  platformComments: number;
  platformViews: number;
  likeCount: number;
  commentCount: number;
  likedByMe: boolean;
  linkedProject: LinkedProjectInfo | null;
  platformCreatedAt: string | null;
  createdAt: string;
}

interface AuthorInfo {
  username: string | null;
  displayName: string | null;
  name: string | null;
  avatarUrl: string | null;
  image: string | null;
}

/** Batch-load author User rows for a set of posts, keyed by id. */
async function loadAuthors(authorIds: string[]): Promise<Map<string, AuthorInfo>> {
  if (authorIds.length === 0) return new Map();
  const users = await prisma.user.findMany({
    where: { id: { in: authorIds } },
    select: { id: true, username: true, displayName: true, name: true, avatarUrl: true, image: true },
  });
  const map = new Map<string, AuthorInfo>();
  for (const u of users) map.set(u.id, u);
  return map;
}

/** Batch-build LinkedProjectInfo for a set of linkedProjectIds. */
async function loadLinkedProjects(projectIds: string[]): Promise<Map<string, LinkedProjectInfo>> {
  const map = new Map<string, LinkedProjectInfo>();
  if (projectIds.length === 0) return map;
  const projects = await prisma.project.findMany({
    where: { id: { in: projectIds } },
    include: { items: { orderBy: { sortOrder: "asc" } } },
  });
  for (const project of projects) {
    const items = project.items;
    const topItem = items.find((i) => i.status === "ACTIVE") ?? items[0] ?? null;
    const goalAmount = items.reduce((s, i) => s + i.goalAmount, 0);
    const raisedAmount = items.reduce((s, i) => s + i.raisedAmount, 0);
    const progress = goalAmount > 0 ? Math.min(1.0, raisedAmount / goalAmount) : 0;
    map.set(project.id, {
      projectId: project.id,
      projectName: project.name,
      itemTitle: topItem?.title ?? null,
      goalAmount,
      raisedAmount,
      progress,
    });
  }
  return map;
}

/** Like getLikedPostIds: returns Set of postIds the user has liked among the given posts. */
export async function getLikedPostIds(userId: string | null, postIds: string[]): Promise<Set<string>> {
  if (!userId || postIds.length === 0) return new Set();
  const likes = await prisma.postLike.findMany({
    where: { userId, postId: { in: postIds } },
    select: { postId: true },
  });
  return new Set(likes.map((l) => l.postId));
}

/** Map a batch of Posts to FeedPostResponse, computing likedByMe per current user. */
export async function mapPosts(posts: Post[], userId: string | null): Promise<FeedPostResponse[]> {
  const authorIds = [...new Set(posts.map((p) => p.authorId))];
  const projectIds = [...new Set(posts.map((p) => p.linkedProjectId).filter((x): x is string => !!x))];
  const [authors, projects, likedSet] = await Promise.all([
    loadAuthors(authorIds),
    loadLinkedProjects(projectIds),
    getLikedPostIds(userId, posts.map((p) => p.id)),
  ]);

  return posts.map((post) => {
    const author = authors.get(post.authorId);
    const linkedProject = post.linkedProjectId ? projects.get(post.linkedProjectId) ?? null : null;
    return {
      id: post.id,
      authorUsername: author?.username ?? "",
      authorDisplayName: author?.displayName ?? author?.name ?? "",
      authorAvatarUrl: author?.avatarUrl ?? author?.image ?? null,
      platform: post.platform,
      platformUrl: post.platformUrl,
      contentType: post.contentType,
      caption: post.caption,
      imageUrl: post.imageUrl,
      videoUrl: post.videoUrl,
      thumbnailUrl: post.thumbnailUrl,
      platformLikes: post.platformLikes,
      platformComments: post.platformComments,
      platformViews: post.platformViews,
      likeCount: post.likeCount,
      commentCount: post.commentCount,
      likedByMe: likedSet.has(post.id),
      linkedProject,
      platformCreatedAt: post.platformCreatedAt ? post.platformCreatedAt.toISOString() : null,
      createdAt: post.createdAt.toISOString(),
    };
  });
}

/** Map a single Post to FeedPostResponse. */
export async function mapPost(post: Post, userId: string | null): Promise<FeedPostResponse> {
  const [mapped] = await mapPosts([post], userId);
  return mapped;
}

// ─── URL metadata inference (oEmbed/scraping stub) ───────────────────────────

interface InferredMeta {
  platform: string;
  contentType: string;
}

export function inferPlatform(url: string): InferredMeta {
  let host = "";
  try {
    host = new URL(url).host.toLowerCase().replace(/^www\./, "");
  } catch {
    host = "";
  }
  if (host.includes("youtube.com") || host.includes("youtu.be")) return { platform: "YOUTUBE", contentType: "VIDEO" };
  if (host.includes("twitch.tv")) return { platform: "TWITCH", contentType: "STREAM" };
  if (host.includes("twitter.com") || host.includes("x.com")) return { platform: "TWITTER", contentType: "TEXT" };
  if (host.includes("instagram.com")) return { platform: "INSTAGRAM", contentType: "REEL" };
  if (host.includes("tiktok.com")) return { platform: "TIKTOK", contentType: "SHORT" };
  // Default fallback.
  return { platform: "YOUTUBE", contentType: "VIDEO" };
}

/** Deterministic platformPostId from a URL: last non-empty path segment, else a hash. */
export function platformPostIdFromUrl(url: string): string {
  try {
    const u = new URL(url);
    const segs = u.pathname.split("/").filter(Boolean);
    if (segs.length > 0) return segs[segs.length - 1];
  } catch {
    // fall through to hash
  }
  let h = 0;
  for (let i = 0; i < url.length; i++) {
    h = (h * 31 + url.charCodeAt(i)) | 0;
  }
  return "post-" + Math.abs(h).toString(36);
}

export function deterministicThumbnail(seed: string): string {
  let h = 0;
  for (let i = 0; i < seed.length; i++) h = (h * 31 + seed.charCodeAt(i)) | 0;
  return `https://picsum.photos/seed/${Math.abs(h).toString(36)}/600/400`;
}
