import { NextRequest } from "next/server";
import { prisma } from "@/lib/prisma";
import { ok, unauthorized, notFound, getSessionUser } from "@/lib/api-helpers";

interface TierInfo {
  name: string;
  commissionRate: number;
  referralsNeeded: number;
}

/** Maps a referral count to a loyalty tier. */
function calculateTier(count: number): TierInfo {
  if (count >= 31) return { name: "Elite", commissionRate: 12.0, referralsNeeded: 0 };
  if (count >= 16) return { name: "Pro", commissionRate: 9.0, referralsNeeded: 31 - count };
  if (count >= 6) return { name: "Builder", commissionRate: 7.0, referralsNeeded: 16 - count };
  return { name: "Starter", commissionRate: 5.0, referralsNeeded: 6 - count };
}

export async function GET(req: NextRequest) {
  const me = await getSessionUser();
  if (!me) return unauthorized();

  const user = await prisma.user.findUnique({ where: { id: me.id } });
  if (!user) return notFound("User not found");

  const totalReferrals = await prisma.referral.count({ where: { referrerId: me.id } });
  const currentTier = calculateTier(totalReferrals);

  const referralCode = user.referralCode ?? "";
  const frontendUrl =
    process.env.NEXT_PUBLIC_APP_URL ?? req.nextUrl.origin ?? "http://localhost:3000";

  return ok({
    referralCode,
    referralLink: `${frontendUrl}/ref/${referralCode}`,
    totalReferrals,
    currentTier,
  });
}
