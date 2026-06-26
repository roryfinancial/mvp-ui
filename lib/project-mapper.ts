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

/** Map a single ProjectItem; resolves giftedByUsername via a cross-domain user lookup. */
export async function toItemResponse(item: ProjectItem): Promise<ProjectItemResponse> {
  let giftedByUsername: string | null = null;
  if (item.giftedById) {
    const u = await prisma.user.findUnique({
      where: { id: item.giftedById },
      select: { username: true },
    });
    giftedByUsername = u?.username ?? null;
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
  const items = await Promise.all(sorted.map(toItemResponse));
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
