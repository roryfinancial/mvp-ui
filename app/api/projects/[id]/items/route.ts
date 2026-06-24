import { NextRequest } from "next/server";
import { prisma } from "@/lib/prisma";
import { ok, notFound, unauthorized, forbidden, badRequest, getSessionUser } from "@/lib/api-helpers";
import { toItemResponse } from "@/lib/project-mapper";

// POST /api/projects/{id}/items — owner-only add item. raisedAmount=0, status=ACTIVE.
export async function POST(
  req: NextRequest,
  { params }: { params: Promise<{ id: string }> }
) {
  const me = await getSessionUser();
  if (!me) return unauthorized();
  const { id } = await params;
  const project = await prisma.project.findUnique({ where: { id } });
  if (!project) return notFound("Project not found");
  if (project.creatorId !== me.id) return forbidden();

  const body = await req.json().catch(() => null);
  if (!body || typeof body.title !== "string" || !body.title.trim()) {
    return badRequest("title is required");
  }
  const goalAmount = Number(body.goalAmount);
  if (!Number.isFinite(goalAmount) || goalAmount < 0.01) {
    return badRequest("goalAmount must be at least 0.01");
  }
  const item = await prisma.projectItem.create({
    data: {
      projectId: id,
      title: body.title,
      description: body.description ?? null,
      thumbnailUrl: body.thumbnailUrl ?? null,
      goalAmount,
    },
  });
  return ok(await toItemResponse(item), 201);
}
