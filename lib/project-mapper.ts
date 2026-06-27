// Shared mappers for the project domain (ported from Java ProjectService
// toResponse / toItemResponse). Reused by all /api/projects routes.

import { prisma } from "@/lib/prisma";
import { progressPct } from "@/lib/api-helpers";
import type { Project, ProjectItem } from "@prisma/client";

export type ProjectWithItems = Project & { items: ProjectItem[] };

export interface ProjectItemResponse {
  id: string;
  title: string;
  description: string;
  thumbnailUrl: string | null;
  goalAmount: number;
  raisedAmount: number;
  progress: number;
  status: "ACTIVE" | "COMPLETED" | "GIFTED";
  giftedByUsername: string | null;
  pinned: boolean;
}

export interface ProjectResponse {
  id: string;
  name: string;
  description: string;
  coverImageUrl: string | null;
  isPublic: boolean;
  goalAmount: number;
  raisedAmount: number;
  progress: number;
  items: ProjectItemResponse[];
  createdAt: string;
}

/**
 * Map a single ProjectItem; resolves giftedByUsername via a cross-domain user
 * lookup. Pass `giftedUsernames` (a userId -> username map) to skip the per-item
 * query when mapping a batch — see toResponse.
 */
export async function toItemResponse(
  item: ProjectItem,
  giftedUsernames?: Map<string, string | null>,
): Promise<ProjectItemResponse> {
  let giftedByUsername: string | null = null;
  if (item.giftedById) {
    if (giftedUsernames) {
      giftedByUsername = giftedUsernames.get(item.giftedById) ?? null;
    } else {
      const u = await prisma.user.findUnique({
        where: { id: item.giftedById },
        select: { username: true },
      });
      giftedByUsername = u?.username ?? null;
    }
  }
  return {
    id: item.id,
    title: item.title,
    description: item.description ?? "",
    thumbnailUrl: item.thumbnailUrl ?? null,
    goalAmount: item.goalAmount,
    raisedAmount: item.raisedAmount,
    progress: progressPct(item.raisedAmount, item.goalAmount),
    status: item.status as "ACTIVE" | "COMPLETED" | "GIFTED",
    giftedByUsername,
    pinned: item.pinned,
  };
}

/** Map a Project (with its items) to the full ProjectResponse with summed aggregates. */
export async function toResponse(project: ProjectWithItems): Promise<ProjectResponse> {
  // Pinned items first, then by sortOrder — keeps a creator's highlighted item
  // at the top of the list everywhere the project is rendered.
  const sorted = [...project.items].sort(
    (a, b) => Number(b.pinned) - Number(a.pinned) || a.sortOrder - b.sortOrder,
  );
  // Resolve all gifter usernames in one query, then map items against it.
  const giftedIds = [...new Set(sorted.map((i) => i.giftedById).filter((id): id is string => !!id))];
  const giftedUsernames = new Map<string, string | null>();
  if (giftedIds.length > 0) {
    const users = await prisma.user.findMany({
      where: { id: { in: giftedIds } },
      select: { id: true, username: true },
    });
    for (const u of users) giftedUsernames.set(u.id, u.username ?? null);
  }
  const items = await Promise.all(sorted.map((i) => toItemResponse(i, giftedUsernames)));
  const goalAmount = sorted.reduce((s, i) => s + i.goalAmount, 0);
  const raisedAmount = sorted.reduce((s, i) => s + i.raisedAmount, 0);
  return {
    id: project.id,
    name: project.name,
    description: project.description ?? "",
    coverImageUrl: project.coverImageUrl ?? null,
    isPublic: project.isPublic,
    goalAmount,
    raisedAmount,
    progress: progressPct(raisedAmount, goalAmount),
    items,
    createdAt: project.createdAt.toISOString(),
  };
}
