import { NextResponse } from "next/server";
import { auth } from "@/lib/auth.server";
import { prisma } from "@/lib/prisma";
import { headers } from "next/headers";

export async function GET() {
  const session = await auth.api.getSession({ headers: await headers() });
  if (!session?.user) {
    return NextResponse.json(
      { success: false, error: { code: "UNAUTHORIZED", message: "Not authenticated" } },
      { status: 401 }
    );
  }
  const follows = await prisma.follow.findMany({
    where: { supporterId: session.user.id },
    include: {
      creator: {
        select: {
          username: true,
          displayName: true,
          name: true,
          avatarUrl: true,
          image: true,
        },
      },
    },
  });
  return NextResponse.json({
    success: true,
    data: follows.map((f) => ({
      creatorUsername: f.creator.username,
      creatorDisplayName: f.creator.displayName ?? f.creator.name ?? "",
      creatorInitials: (f.creator.displayName ?? f.creator.name ?? "U").slice(0, 2).toUpperCase(),
      creatorAvatarUrl: f.creator.avatarUrl ?? f.creator.image ?? null,
      totalContributed: 0,
      projectsSupported: 0,
      followedAt: f.createdAt.toISOString(),
    })),
    error: null,
  });
}
