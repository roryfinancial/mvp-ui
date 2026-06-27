import { NextRequest, NextResponse } from "next/server";
import { auth } from "@/lib/auth.server";
import { prisma } from "@/lib/prisma";
import { headers } from "next/headers";
import { cacheHeaders, CACHE } from "@/lib/api-helpers";

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
  const platforms = await prisma.connectedPlatform.findMany({ where: { userId: user.id } });
  return NextResponse.json({
    success: true,
    data: platforms.map((p) => ({ platform: p.platform, handle: p.handle ?? "", url: p.url ?? "" })),
    error: null,
  }, { headers: cacheHeaders(CACHE.medium) });
}

export async function POST(req: NextRequest) {
  const session = await auth.api.getSession({ headers: await headers() });
  if (!session?.user) {
    return NextResponse.json(
      { success: false, error: { code: "UNAUTHORIZED", message: "Not authenticated" } },
      { status: 401 }
    );
  }
  const body = await req.json();
  const platform = await prisma.connectedPlatform.upsert({
    where: { userId_platform: { userId: session.user.id, platform: body.platform } },
    update: { handle: body.handle, url: body.url },
    create: { userId: session.user.id, platform: body.platform, handle: body.handle, url: body.url },
  });
  return NextResponse.json({
    success: true,
    data: { platform: platform.platform, handle: platform.handle, url: platform.url },
    error: null,
  });
}
