import { NextRequest, NextResponse } from "next/server";
import { auth } from "@/lib/auth.server";
import { prisma } from "@/lib/prisma";
import { headers } from "next/headers";

async function resolveCreatorId(username: string): Promise<string | null> {
  const user = await prisma.user.findUnique({ where: { username }, select: { id: true } });
  return user?.id ?? null;
}

export async function POST(
  _req: NextRequest,
  { params }: { params: Promise<{ username: string }> }
) {
  const session = await auth.api.getSession({ headers: await headers() });
  if (!session?.user) {
    return NextResponse.json(
      { success: false, error: { code: "UNAUTHORIZED", message: "Not authenticated" } },
      { status: 401 }
    );
  }
  const { username } = await params;
  const creatorId = await resolveCreatorId(username);
  if (!creatorId) {
    return NextResponse.json(
      { success: false, error: { code: "NOT_FOUND", message: "Creator not found" } },
      { status: 404 }
    );
  }
  await prisma.follow.upsert({
    where: { supporterId_creatorId: { supporterId: session.user.id, creatorId } },
    update: {},
    create: { supporterId: session.user.id, creatorId },
  });
  return NextResponse.json({ success: true, data: null, error: null });
}

export async function DELETE(
  _req: NextRequest,
  { params }: { params: Promise<{ username: string }> }
) {
  const session = await auth.api.getSession({ headers: await headers() });
  if (!session?.user) {
    return NextResponse.json(
      { success: false, error: { code: "UNAUTHORIZED", message: "Not authenticated" } },
      { status: 401 }
    );
  }
  const { username } = await params;
  const creatorId = await resolveCreatorId(username);
  if (!creatorId) {
    return NextResponse.json(
      { success: false, error: { code: "NOT_FOUND", message: "Creator not found" } },
      { status: 404 }
    );
  }
  await prisma.follow.deleteMany({ where: { supporterId: session.user.id, creatorId } });
  return NextResponse.json({ success: true, data: null, error: null });
}
