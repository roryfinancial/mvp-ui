import { NextRequest } from "next/server";
import { prisma } from "@/lib/prisma";
import { ok, unauthorized, getSessionUser, getInitials } from "@/lib/api-helpers";

/** First day of current month / next month at 00:00:00 UTC. */
function monthWindow(): { monthStart: Date; monthEnd: Date } {
  const now = new Date();
  const monthStart = new Date(Date.UTC(now.getUTCFullYear(), now.getUTCMonth(), 1));
  const monthEnd = new Date(Date.UTC(now.getUTCFullYear(), now.getUTCMonth() + 1, 1));
  return { monthStart, monthEnd };
}

export async function GET(_req: NextRequest) {
  const me = await getSessionUser();
  if (!me) return unauthorized();

  const { monthStart, monthEnd } = monthWindow();

  const referrals = await prisma.referral.findMany({
    where: { referrerId: me.id },
    orderBy: { createdAt: "asc" },
  });

  const data = await Promise.all(
    referrals.map(async (r) => {
      const referred = await prisma.user.findUnique({ where: { id: r.referredId } });
      const sum = await prisma.gift.aggregate({
        _sum: { amount: true },
        where: {
          creatorId: r.referredId,
          status: "COMPLETED",
          createdAt: { gte: monthStart, lt: monthEnd },
        },
      });
      const displayName = referred?.displayName ?? referred?.name ?? "";
      return {
        referredUsername: referred?.username ?? "",
        referredDisplayName: displayName,
        referredInitials: getInitials(displayName),
        joinedDate: r.createdAt.toISOString(),
        status: r.status as "ACTIVE" | "INACTIVE" | "PENDING",
        commissionRate: r.commissionRate,
        totalTipsGenerated: r.totalTipsGenerated,
        yourCommission: r.totalCommissionEarned,
        tipsThisMonth: sum._sum.amount ?? 0,
      };
    })
  );

  return ok(data);
}
