import { NextRequest, NextResponse } from "next/server";
import { auth } from "@/lib/auth.server";
import { prisma } from "@/lib/prisma";
import { headers } from "next/headers";
import { parseCommunities } from "@/lib/api-helpers";

export async function GET(
  _req: NextRequest,
  { params }: { params: Promise<{ username: string }> }
) {
  const { username } = await params;
  const user = await prisma.user.findUnique({
    where: { username },
    include: { connectedPlatforms: true },
  });
  if (!user) {
    return NextResponse.json(
      { success: false, error: { code: "NOT_FOUND", message: "User not found" } },
      { status: 404 }
    );
  }
  return NextResponse.json({
    success: true,
    data: {
      id: user.id,
      username: user.username,
      displayName: user.displayName ?? user.name ?? "",
      bio: user.bio ?? "",
      avatarUrl: user.avatarUrl ?? user.image ?? null,
      userType: user.userType ?? "CREATOR",
      rank: null,
      totalRaised: null,
      totalSupporters: null,
      totalItems: null,
      totalGifted: null,
      creatorsSupported: null,
      itemsSupported: null,
      communities: parseCommunities(user.communities),
      connectedPlatforms: user.connectedPlatforms.map((p) => ({
        platform: p.platform,
        handle: p.handle ?? "",
        url: p.url ?? "",
      })),
      createdAt: user.createdAt.toISOString(),
    },
    error: null,
  });
}

export async function PUT(
  req: NextRequest,
  { params }: { params: Promise<{ username: string }> }
) {
  const { username } = await params;
  const session = await auth.api.getSession({ headers: await headers() });
  if (!session?.user) {
    return NextResponse.json(
      { success: false, error: { code: "UNAUTHORIZED", message: "Not authenticated" } },
      { status: 401 }
    );
  }
  // Ownership: a user may only edit their OWN profile. The [username] path is
  // informational; we authoritatively update the session user's row so one
  // logged-in user can't overwrite another's profile via the path param.
  if (session.user.username && session.user.username !== username) {
    return NextResponse.json(
      { success: false, error: { code: "FORBIDDEN", message: "You can only edit your own profile" } },
      { status: 403 }
    );
  }
  const body = await req.json();
  const user = await prisma.user.update({
    where: { id: session.user.id },
    data: {
      displayName: body.displayName,
      bio: body.bio,
      avatarUrl: body.avatarUrl,
    },
  });
  return NextResponse.json({
    success: true,
    data: { id: user.id, username: user.username, displayName: user.displayName, bio: user.bio, avatarUrl: user.avatarUrl },
    error: null,
  });
}
