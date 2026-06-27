import { NextRequest } from "next/server";
import { prisma } from "@/lib/prisma";
import { ok } from "@/lib/api-helpers";

// PATCH { archived } — archive or restore a suggestion.
export async function PATCH(
  req: NextRequest,
  { params }: { params: Promise<{ id: string }> }
) {
  const { id } = await params;
  const body = await req.json().catch(() => ({}));
  const archived = Boolean(body?.archived);
  await prisma.founderSuggestion.updateMany({ where: { id }, data: { archived } });
  return ok(null);
}

// DELETE a suggestion (permanent cleanup for this temporary tool).
export async function DELETE(
  _req: NextRequest,
  { params }: { params: Promise<{ id: string }> }
) {
  const { id } = await params;
  await prisma.founderSuggestion.deleteMany({ where: { id } });
  return ok(null);
}
