import { NextRequest } from "next/server";
import { prisma } from "@/lib/prisma";
import { ok } from "@/lib/api-helpers";

// DELETE a suggestion (cleanup for this temporary tool).
export async function DELETE(
  _req: NextRequest,
  { params }: { params: Promise<{ id: string }> }
) {
  const { id } = await params;
  await prisma.founderSuggestion.deleteMany({ where: { id } });
  return ok(null);
}
