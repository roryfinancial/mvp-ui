import { NextRequest } from "next/server";
import { prisma } from "@/lib/prisma";
import { ok, unauthorized, getSessionUser } from "@/lib/api-helpers";

// GET /api/wallet/summary
export async function GET(_req: NextRequest) {
  const me = await getSessionUser();
  if (!me) return unauthorized();

  const user = await prisma.user.findUnique({ where: { id: me.id } });
  if (!user) return unauthorized();

  const [deposited, spent, received, giftsSentCount] = await Promise.all([
    prisma.creditTransaction.aggregate({
      _sum: { amount: true },
      where: { userId: me.id, type: "DEPOSIT" },
    }),
    prisma.creditTransaction.aggregate({
      _sum: { amount: true },
      where: { userId: me.id, type: "GIFT_SENT" },
    }),
    prisma.creditTransaction.aggregate({
      _sum: { amount: true },
      where: { userId: me.id, type: "GIFT_RECEIVED" },
    }),
    prisma.creditTransaction.count({
      where: { userId: me.id, type: "GIFT_SENT" },
    }),
  ]);

  return ok({
    creditBalance: user.creditBalance,
    totalDeposited: deposited._sum.amount ?? 0,
    totalSpent: spent._sum.amount ?? 0,
    totalReceived: received._sum.amount ?? 0,
    giftsSentCount,
  });
}
