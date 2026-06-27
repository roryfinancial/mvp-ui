import { NextRequest } from "next/server";
import { prisma } from "@/lib/prisma";
import { ok, notFound } from "@/lib/api-helpers";
import { toResponse } from "@/lib/project-mapper";

// GET /api/projects/creator/{username} — public projects of a creator, ordered by sortOrder.
export async function GET(
  _req: NextRequest,
  { params }: { params: Promise<{ username: string }> }
) {
  const { username } = await params;
  const user = await prisma.user.findUnique({
    where: { username },
    select: { id: true },
  });
  if (!user) return notFound("Creator not found");
  const projects = await prisma.project.findMany({
    where: { creatorId: user.id, isPublic: true },
    orderBy: { sortOrder: "asc" },
    include: { items: true },
  });
  const data = await Promise.all(projects.map(toResponse));
  return ok(data);
}
