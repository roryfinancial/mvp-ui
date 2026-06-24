import { NextRequest } from "next/server";
import { prisma } from "@/lib/prisma";
import { ok, unauthorized, getSessionUser } from "@/lib/api-helpers";

function monthWindow(): { monthStart: Date; monthEnd: Date } {
  const now = new Date();
  const monthStart = new Date(Date.UTC(now.getUTCFullYear(), now.getUTCMonth(), 1));
  const monthEnd = new Date(Date.UTC(now.getUTCFullYear(), now.getUTCMonth() + 1, 1));
  return { monthStart, monthEnd };
}

/** Round HALF_UP to 2 decimals (matches Java BigDecimal rounding). */
function round2(n: number): number {
  return Math.round((n + Number.EPSILON) * 100) / 100;
}

export async function GET(_req: NextRequest) {
  const me = await getSessionUser();
  if (!me) return unauthorized();

  const referrals = await prisma.referral.findMany({ where: { referrerId: me.id } });

  const totalReferrals = referrals.length;
  const activeReferrals = referrals.filter((r) => r.status === "ACTIVE").length;
  const totalTipsGenerated = referrals.reduce((s, r) => s + r.totalTipsGenerated, 0);
  const totalCommissionEarned = referrals.reduce((s, r) => s + r.totalCommissionEarned, 0);

  const { monthStart, monthEnd } = monthWindow();
  let commissionThisMonth = 0;
  for (const r of referrals) {
    const sum = await prisma.gift.aggregate({
      _sum: { amount: true },
      where: {
        creatorId: r.referredId,
        status: "COMPLETED",
        createdAt: { gte: monthStart, lt: monthEnd },
      },
    });
    const tips = sum._sum.amount ?? 0;
    commissionThisMonth += round2(tips * (r.commissionRate / 100));
  }

  return ok({
    totalReferrals,
    activeReferrals,
    totalTipsGenerated,
    totalCommissionEarned,
    commissionThisMonth: round2(commissionThisMonth),
  });
}
