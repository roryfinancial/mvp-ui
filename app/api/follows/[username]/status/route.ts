import { NextRequest, NextResponse } from "next/server";
import { auth } from "@/lib/auth.server";
import { prisma } from "@/lib/prisma";
import { headers } from "next/headers";

export async function GET(
  _req: NextRequest,
  { params }: { params: Promise<{ username: string }> }
) {
  const session = await auth.api.getSession({ headers: await headers() });
  const { username } = await params;
  if (!session?.user) {
    return NextResponse.json({ success: true, data: { following: false }, error: null });
  }
  const creator = await prisma.user.findUnique({ where: { username }, select: { id: true } });
  if (!creator) {
    return NextResponse.json(
      { success: false, error: { code: "NOT_FOUND", message: "User not found" } },
      { status: 404 }
    );
  }
  const follow = await prisma.follow.findUnique({
    where: { supporterId_creatorId: { supporterId: session.user.id, creatorId: creator.id } },
  });
  return NextResponse.json({ success: true, data: { following: follow !== null }, error: null });
}
