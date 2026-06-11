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

  const user = await prisma.user.findUnique({
    where: { id: session.user.id },
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
      email: user.email,
      username: user.username ?? `user_${user.id.slice(0, 8)}`,
      displayName: user.displayName ?? user.name ?? "",
      bio: user.bio ?? "",
      avatarUrl: user.avatarUrl ?? user.image ?? null,
      userType: user.userType ?? "CREATOR",
      creditBalance: Number(user.creditBalance),
      stripeOnboardingComplete: user.stripeOnboardingComplete,
      referralCode: user.referralCode ?? null,
      communities: user.communities,
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
