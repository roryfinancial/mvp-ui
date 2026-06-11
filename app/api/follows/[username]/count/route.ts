import { NextRequest, NextResponse } from "next/server";
import { prisma } from "@/lib/prisma";

export async function GET(
  _req: NextRequest,
  { params }: { params: Promise<{ username: string }> }
) {
  const { username } = await params;
  const user = await prisma.user.findUnique({ where: { username }, select: { id: true } });
  if (!user) {
    return NextResponse.json(
      { success: false, error: { code: "NOT_FOUND", message: "User not found" } },
      { status: 404 }
    );
  }
  const count = await prisma.follow.count({ where: { creatorId: user.id } });
  return NextResponse.json({ success: true, data: { count }, error: null });
}
