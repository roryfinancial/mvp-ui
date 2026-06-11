import { NextRequest, NextResponse } from "next/server";
import { auth } from "@/lib/auth.server";
import { prisma } from "@/lib/prisma";
import { headers } from "next/headers";
import type { PlatformType } from "@prisma/client";

export async function DELETE(
  _req: NextRequest,
  { params }: { params: Promise<{ username: string; platform: string }> }
) {
  const session = await auth.api.getSession({ headers: await headers() });
  if (!session?.user) {
    return NextResponse.json(
      { success: false, error: { code: "UNAUTHORIZED", message: "Not authenticated" } },
      { status: 401 }
    );
  }
  const { platform } = await params;
  await prisma.connectedPlatform.delete({
    where: {
      userId_platform: {
        userId: session.user.id,
        platform: platform.toUpperCase() as PlatformType,
      },
    },
  });
  return NextResponse.json({ success: true, data: null, error: null });
}
