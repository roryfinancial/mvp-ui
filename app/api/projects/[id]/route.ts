import { NextRequest } from "next/server";
import { prisma } from "@/lib/prisma";
import { ok, notFound, unauthorized, forbidden, getSessionUser } from "@/lib/api-helpers";
import { toResponse } from "@/lib/project-mapper";

// GET /api/projects/{id} — public, any project fetchable by id (no visibility check).
export async function GET(
  _req: NextRequest,
  { params }: { params: Promise<{ id: string }> }
) {
  const { id } = await params;
  const project = await prisma.project.findUnique({
    where: { id },
    include: { items: true },
  });
  if (!project) return notFound("Project not found");
  return ok(await toResponse(project));
}

// PUT /api/projects/{id} — owner-only patch. Only non-null fields applied.
export async function PUT(
  req: NextRequest,
  { params }: { params: Promise<{ id: string }> }
) {
  const me = await getSessionUser();
  if (!me) return unauthorized();
  const { id } = await params;
  const existing = await prisma.project.findUnique({ where: { id } });
  if (!existing) return notFound("Project not found");
  if (existing.creatorId !== me.id) return forbidden();

  const body = (await req.json().catch(() => ({}))) ?? {};
  const data: Record<string, unknown> = {};
  if (body.name != null) data.name = body.name;
  if (body.description != null) data.description = body.description;
  if (body.coverImageUrl != null) data.coverImageUrl = body.coverImageUrl;
  if (body.isPublic != null) data.isPublic = body.isPublic;

  const project = await prisma.project.update({
    where: { id },
    data,
    include: { items: true },
  });
  return ok(await toResponse(project));
}

// DELETE /api/projects/{id} — owner-only, cascades to items. Returns 200 null.
export async function DELETE(
  _req: NextRequest,
  { params }: { params: Promise<{ id: string }> }
) {
  const me = await getSessionUser();
  if (!me) return unauthorized();
  const { id } = await params;
  const existing = await prisma.project.findUnique({ where: { id } });
  if (!existing) return notFound("Project not found");
  if (existing.creatorId !== me.id) return forbidden();
  await prisma.project.delete({ where: { id } });
  return ok(null);
}
