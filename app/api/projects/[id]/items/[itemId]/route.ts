import { NextRequest } from "next/server";
import { prisma } from "@/lib/prisma";
import { ok, notFound, unauthorized, forbidden, badRequest, getSessionUser } from "@/lib/api-helpers";
import { toItemResponse } from "@/lib/project-mapper";

// PUT /api/projects/{id}/items/{itemId} — owner-only patch of an item.
export async function PUT(
  req: NextRequest,
  { params }: { params: Promise<{ id: string; itemId: string }> }
) {
  const me = await getSessionUser();
  if (!me) return unauthorized();
  const { id, itemId } = await params;
  const project = await prisma.project.findUnique({ where: { id } });
  if (!project) return notFound("Project not found");
  if (project.creatorId !== me.id) return forbidden();

  const item = await prisma.projectItem.findUnique({ where: { id: itemId } });
  if (!item) return notFound("Item not found");
  if (item.projectId !== id) return badRequest("Item does not belong to project");

  const body = (await req.json().catch(() => ({}))) ?? {};
  const data: Record<string, unknown> = {};
  if (body.title != null) data.title = body.title;
  if (body.description != null) data.description = body.description;
  if (body.thumbnailUrl != null) data.thumbnailUrl = body.thumbnailUrl;
  if (body.goalAmount != null) {
    const goalAmount = Number(body.goalAmount);
    if (!Number.isFinite(goalAmount) || goalAmount < 0.01) {
      return badRequest("goalAmount must be at least 0.01");
    }
    data.goalAmount = goalAmount;
  }
  if (body.pinned != null) data.pinned = Boolean(body.pinned);

  // Only one item may be pinned per project — pinning this one unpins siblings.
  if (data.pinned === true) {
    const [, updated] = await prisma.$transaction([
      prisma.projectItem.updateMany({
        where: { projectId: id, pinned: true, NOT: { id: itemId } },
        data: { pinned: false },
      }),
      prisma.projectItem.update({ where: { id: itemId }, data }),
    ]);
    return ok(await toItemResponse(updated));
  }

  const updated = await prisma.projectItem.update({ where: { id: itemId }, data });
  return ok(await toItemResponse(updated));
}

// DELETE /api/projects/{id}/items/{itemId} — owner-only delete. Returns 200 null.
export async function DELETE(
  _req: NextRequest,
  { params }: { params: Promise<{ id: string; itemId: string }> }
) {
  const me = await getSessionUser();
  if (!me) return unauthorized();
  const { id, itemId } = await params;
  const project = await prisma.project.findUnique({ where: { id } });
  if (!project) return notFound("Project not found");
  if (project.creatorId !== me.id) return forbidden();

  const item = await prisma.projectItem.findUnique({ where: { id: itemId } });
  if (!item) return notFound("Item not found");
  if (item.projectId !== id) return badRequest("Item does not belong to project");

  await prisma.projectItem.delete({ where: { id: itemId } });
  return ok(null);
}
