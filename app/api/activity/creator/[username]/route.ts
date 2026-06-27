import { NextRequest } from "next/server";
import { prisma } from "@/lib/prisma";
import { okCached, CACHE, notFound, pageParams, progressPct } from "@/lib/api-helpers";
import type { ActivityItemResponse } from "@/lib/api";

// GET /api/activity/creator/{username}
// Synthesized activity feed: merges a creator's posts, completed gifts received,
// projects created, and items fully gifted into one reverse-chronological list.
export async function GET(
  req: NextRequest,
  { params }: { params: Promise<{ username: string }> }
) {
  const { username } = await params;
  const url = new URL(req.url);
  const { page, size, skip } = pageParams(url, 20);

  const creator = await prisma.user.findUnique({
    where: { username },
    select: { id: true },
  });
  if (!creator) return notFound("Creator not found");
  const creatorId = creator.id;

  // ─── Gather source rows ────────────────────────────────────────────────────
  const [posts, gifts, projects, giftedItems] = await Promise.all([
    prisma.post.findMany({ where: { authorId: creatorId } }),
    prisma.gift.findMany({ where: { creatorId, status: "COMPLETED" } }),
    prisma.project.findMany({ where: { creatorId }, include: { items: true } }),
    prisma.projectItem.findMany({
      where: { status: "GIFTED", project: { creatorId } },
      include: { project: true },
    }),
  ]);

  // ─── Resolve cross-domain lookups (linked projects, supporters) ────────────
  const linkedProjectIds = Array.from(
    new Set(posts.map((p) => p.linkedProjectId).filter((x): x is string => !!x))
  );
  const giftProjectIds = Array.from(new Set(gifts.map((g) => g.projectId)));
  const projectIds = Array.from(new Set([...linkedProjectIds, ...giftProjectIds]));

  const supporterIds = Array.from(new Set(gifts.map((g) => g.supporterId)));

  const [projectRows, supporterRows] = await Promise.all([
    projectIds.length
      ? prisma.project.findMany({
          where: { id: { in: projectIds } },
          include: { items: true },
        })
      : Promise.resolve([]),
    supporterIds.length
      ? prisma.user.findMany({
          where: { id: { in: supporterIds } },
          select: { id: true, username: true, displayName: true, name: true },
        })
      : Promise.resolve([]),
  ]);

  const projectById = new Map(projectRows.map((p) => [p.id, p]));
  const supporterById = new Map(supporterRows.map((u) => [u.id, u]));

  const projectRaised = (projectId: string): { goal: number; raised: number } => {
    const proj = projectById.get(projectId);
    if (!proj) return { goal: 0, raised: 0 };
    let goal = 0;
    let raised = 0;
    for (const it of proj.items) {
      goal += it.goalAmount;
      raised += it.raisedAmount;
    }
    return { goal, raised };
  };

  // ─── Build the tagged-union items ──────────────────────────────────────────
  type Built = { item: ActivityItemResponse; at: number };
  const built: Built[] = [];

  // POST
  for (const p of posts) {
    let linkedProject: NonNullable<ActivityItemResponse["post"]>["linkedProject"] = null;
    if (p.linkedProjectId) {
      const proj = projectById.get(p.linkedProjectId);
      if (proj) {
        const { goal, raised } = projectRaised(proj.id);
        linkedProject = {
          projectId: proj.id,
          projectName: proj.name,
          progress: progressPct(raised, goal),
        };
      }
    }
    built.push({
      at: p.createdAt.getTime(),
      item: {
        id: p.id,
        type: "POST",
        timestamp: p.createdAt.toISOString(),
        title: null,
        description: p.caption,
        thumbnailUrl: p.thumbnailUrl ?? p.imageUrl ?? null,
        post: {
          platform: p.platform,
          platformUrl: p.platformUrl,
          contentType: p.contentType,
          caption: p.caption,
          imageUrl: p.imageUrl,
          platformViews: p.platformViews,
          platformLikes: p.platformLikes,
          linkedProject,
        },
        gift: null,
        project: null,
      },
    });
  }

  // GIFT
  for (const g of gifts) {
    const supporter = supporterById.get(g.supporterId);
    const supporterDisplayName = supporter?.displayName ?? supporter?.name ?? "";
    const proj = projectById.get(g.projectId);
    built.push({
      at: g.createdAt.getTime(),
      item: {
        id: g.id,
        type: "GIFT",
        timestamp: g.createdAt.toISOString(),
        title: null,
        description: g.message,
        thumbnailUrl: null,
        post: null,
        gift: {
          supporterUsername: supporter?.username ?? "",
          supporterDisplayName,
          amount: g.amount,
          projectName: proj?.name ?? null,
          message: g.message,
        },
        project: null,
      },
    });
  }

  // PROJECT_CREATED
  for (const proj of projects) {
    let goalAmount = 0;
    let raisedAmount = 0;
    for (const it of proj.items) {
      goalAmount += it.goalAmount;
      raisedAmount += it.raisedAmount;
    }
    built.push({
      at: proj.createdAt.getTime(),
      item: {
        id: proj.id,
        type: "PROJECT_CREATED",
        timestamp: proj.createdAt.toISOString(),
        title: proj.name,
        description: proj.description,
        thumbnailUrl: proj.coverImageUrl,
        post: null,
        gift: null,
        project: {
          projectId: proj.id,
          projectName: proj.name,
          itemTitle: null,
          goalAmount,
          raisedAmount,
        },
      },
    });
  }

  // ITEM_GIFTED
  for (const it of giftedItems) {
    built.push({
      at: it.createdAt.getTime(),
      item: {
        id: it.id,
        type: "ITEM_GIFTED",
        timestamp: it.createdAt.toISOString(),
        title: it.title,
        description: it.description,
        thumbnailUrl: it.thumbnailUrl,
        post: null,
        gift: null,
        project: {
          projectId: it.projectId,
          projectName: it.project.name,
          itemTitle: it.title,
          goalAmount: it.goalAmount,
          raisedAmount: it.raisedAmount,
        },
      },
    });
  }

  // ─── Sort DESC, paginate by slice ──────────────────────────────────────────
  built.sort((a, b) => b.at - a.at);
  const sliced = built.slice(skip, skip + size).map((b) => b.item);
  void page;

  return okCached<ActivityItemResponse[]>(sliced, CACHE.short);
}
