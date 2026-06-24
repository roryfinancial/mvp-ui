import { NextRequest } from "next/server";
import { prisma } from "@/lib/prisma";
import {
  ok,
  unauthorized,
  notFound,
  getSessionUser,
  getInitials,
  parseCommunities,
} from "@/lib/api-helpers";

type ReasonType =
  | "FOLLOW_GRAPH"
  | "COMMUNITY"
  | "TIPPING_ACTIVITY"
  | "COLLABORATIVE"
  | "TRENDING";

interface Candidate {
  creatorId: string;
  score: number;
  reason: string;
  reasonType: ReasonType;
}

/** Capitalizes only the first letter, e.g. 'gaming' -> 'Gaming'. */
function formatCommunityName(token: string): string {
  if (!token) return token;
  return token.charAt(0).toUpperCase() + token.slice(1);
}

export async function GET(req: NextRequest) {
  const me = await getSessionUser();
  if (!me) return unauthorized();

  const url = new URL(req.url);
  const limit = Math.max(1, parseInt(url.searchParams.get("limit") ?? "10", 10) || 10);

  const user = await prisma.user.findUnique({ where: { id: me.id } });
  if (!user) return notFound("User not found");

  // 2. excludeIds = already-followed creators + self
  const followed = await prisma.follow.findMany({
    where: { supporterId: user.id },
    select: { creatorId: true },
  });
  const followedIds = followed.map((f) => f.creatorId);
  const excludeIds = new Set<string>([user.id, ...followedIds]);

  // Insertion-ordered candidate map.
  const candidates = new Map<string, Candidate>();

  const merge = (c: Candidate) => {
    const existing = candidates.get(c.creatorId);
    if (!existing) {
      candidates.set(c.creatorId, c);
    } else if (c.score > existing.score) {
      // keep higher score, retain original insertion position
      candidates.set(c.creatorId, c);
    }
  };

  // 3. SIGNAL 1 — Follow graph (weight 10)
  if (followedIds.length > 0) {
    const fof = await prisma.follow.findMany({
      where: { supporterId: { in: followedIds } },
      select: { creatorId: true, supporterId: true },
    });
    // candidate creatorId -> set of distinct supporters (people you follow)
    const mutualMap = new Map<string, Set<string>>();
    for (const f of fof) {
      if (excludeIds.has(f.creatorId)) continue;
      let set = mutualMap.get(f.creatorId);
      if (!set) {
        set = new Set<string>();
        mutualMap.set(f.creatorId, set);
      }
      set.add(f.supporterId);
    }
    const ranked = [...mutualMap.entries()]
      .map(([creatorId, supporters]) => ({ creatorId, mutualCount: supporters.size }))
      .sort((a, b) => b.mutualCount - a.mutualCount)
      .slice(0, limit * 2);

    for (const r of ranked) {
      merge({
        creatorId: r.creatorId,
        score: r.mutualCount * 10.0,
        reasonType: "FOLLOW_GRAPH",
        reason:
          r.mutualCount === 1
            ? "Followed by 1 person you follow"
            : `Followed by ${r.mutualCount} people you follow`,
      });
    }
  }

  // 4. SIGNAL 2 — Community overlap (weight 5)
  // `communities` is stored as a JSON string, so we can't do a DB array/`contains`
  // match (that would be substring-based and case-divergent across SQLite/Postgres).
  // Instead fetch visible creators and test exact, case-insensitive token membership
  // on the parsed list in JS.
  const myCommunities = parseCommunities(user.communities)
    .map((t) => t.trim().toLowerCase())
    .filter(Boolean);
  if (myCommunities.length > 0) {
    const communityExclude = new Set<string>([...excludeIds, ...candidates.keys()]);
    const creators = await prisma.user.findMany({
      where: {
        profileVisible: true,
        userType: "CREATOR",
        id: { notIn: [...communityExclude] },
      },
      orderBy: { createdAt: "desc" },
      take: 200,
    });
    for (const c of creators) {
      if (communityExclude.has(c.id)) continue;
      const theirs = parseCommunities(c.communities).map((t) => t.trim().toLowerCase());
      const match = myCommunities.find((t) => theirs.includes(t));
      if (!match) continue;
      merge({
        creatorId: c.id,
        score: 5.0,
        reasonType: "COMMUNITY",
        reason: "Popular in " + formatCommunityName(match),
      });
    }
  }

  // 5. Defensive removal of excludeIds
  for (const id of excludeIds) candidates.delete(id);

  // 6. Sort by score desc, take top limit
  const top = [...candidates.values()]
    .sort((a, b) => b.score - a.score)
    .slice(0, limit);
  if (top.length === 0) return ok([]);

  const topIds = top.map((c) => c.creatorId);

  // 7. Batch-load profiles + follower counts
  const profiles = await prisma.user.findMany({ where: { id: { in: topIds } } });
  const profileMap = new Map(profiles.map((p) => [p.id, p]));

  const followerCounts = await prisma.follow.groupBy({
    by: ["creatorId"],
    where: { creatorId: { in: topIds } },
    _count: { _all: true },
  });
  const followerMap = new Map(followerCounts.map((f) => [f.creatorId, f._count._all]));

  // 8. Build response in ranked order
  const data = top
    .filter((c) => profileMap.has(c.creatorId))
    .map((c) => {
      const p = profileMap.get(c.creatorId)!;
      const displayName = p.displayName ?? p.name ?? "";
      return {
        username: p.username,
        displayName,
        initials: getInitials(displayName),
        avatarUrl: p.avatarUrl ?? p.image ?? null,
        bio: p.bio ?? null,
        followerCount: followerMap.get(c.creatorId) ?? 0,
        reason: c.reason,
        reasonType: c.reasonType,
        score: c.score,
      };
    });

  return ok(data);
}
