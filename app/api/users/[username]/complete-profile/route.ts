import { NextRequest, NextResponse } from "next/server";
import { auth } from "@/lib/auth.server";
import { prisma } from "@/lib/prisma";
import { headers } from "next/headers";
import { parseCommunities, stringifyCommunities } from "@/lib/api-helpers";

export async function POST(req: NextRequest) {
  const session = await auth.api.getSession({ headers: await headers() });
  if (!session?.user) {
    return NextResponse.json(
      { success: false, error: { code: "UNAUTHORIZED", message: "Not authenticated" } },
      { status: 401 }
    );
  }
  const body = await req.json();
  const { username, displayName, userType, referralCode, communities } = body;

  // Validate required fields so we never write a "complete" profile with a
  // missing username or an invalid type.
  if (!username || typeof username !== "string" || username.trim().length < 2) {
    return NextResponse.json(
      { success: false, error: { code: "BAD_REQUEST", message: "A valid username is required" } },
      { status: 400 }
    );
  }
  if (userType !== "CREATOR" && userType !== "SUPPORTER") {
    return NextResponse.json(
      { success: false, error: { code: "BAD_REQUEST", message: "userType must be CREATOR or SUPPORTER" } },
      { status: 400 }
    );
  }

  const existing = await prisma.user.findUnique({ where: { username } });
  if (existing && existing.id !== session.user.id) {
    return NextResponse.json(
      { success: false, error: { code: "CONFLICT", message: "Username already taken" } },
      { status: 409 }
    );
  }

  const user = await prisma.user.update({
    where: { id: session.user.id },
    data: {
      username,
      displayName,
      userType: userType,
      referralCode: referralCode ?? null,
      communities: stringifyCommunities(communities ?? []),
      isProfileComplete: true,
    },
    include: { connectedPlatforms: true },
  });

  return NextResponse.json({
    success: true,
    data: {
      id: user.id,
      email: user.email,
      username: user.username,
      displayName: user.displayName ?? "",
      bio: user.bio ?? "",
      avatarUrl: user.avatarUrl ?? null,
      userType: user.userType,
      creditBalance: Number(user.creditBalance),
      stripeOnboardingComplete: user.stripeOnboardingComplete,
      referralCode: user.referralCode ?? null,
      communities: parseCommunities(user.communities),
      isProfileComplete: user.isProfileComplete,
      settings: {
        emailNotifications: user.emailNotifications,
        giftNotifications: user.giftNotifications,
        milestoneNotifications: user.milestoneNotifications,
        marketingNotifications: user.marketingNotifications,
        profileVisible: user.profileVisible,
        showOnLeaderboard: user.showOnLeaderboard,
        showGiftAmounts: user.showGiftAmounts,
      },
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
