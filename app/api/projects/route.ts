import { NextRequest } from "next/server";
import { prisma } from "@/lib/prisma";
import { ok, unauthorized, badRequest, getSessionUser } from "@/lib/api-helpers";
import { toResponse } from "@/lib/project-mapper";

// GET /api/projects — authenticated user's own projects (public + private), ordered by sortOrder.
export async function GET() {
  const me = await getSessionUser();
  if (!me) return unauthorized();
  const projects = await prisma.project.findMany({
    where: { creatorId: me.id },
    orderBy: { sortOrder: "asc" },
    include: { items: true },
  });
  const data = await Promise.all(projects.map(toResponse));
  return ok(data);
}

// POST /api/projects — create a project owned by the authenticated user.
export async function POST(req: NextRequest) {
  const me = await getSessionUser();
  if (!me) return unauthorized();
  const body = await req.json().catch(() => null);
  if (!body || typeof body.name !== "string" || !body.name.trim()) {
    return badRequest("name is required");
  }
  const project = await prisma.project.create({
    data: {
      creatorId: me.id,
      name: body.name,
      description: body.description ?? null,
      coverImageUrl: body.coverImageUrl ?? null,
      isPublic: typeof body.isPublic === "boolean" ? body.isPublic : true,
    },
    include: { items: true },
  });
  return ok(await toResponse(project), 201);
}
