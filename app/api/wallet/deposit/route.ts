import { NextRequest } from "next/server";
import { prisma } from "@/lib/prisma";
import { ok, badRequest, unauthorized, getSessionUser } from "@/lib/api-helpers";

// POST /api/wallet/deposit
// DEMO: skip Stripe. Create a deposit, immediately complete it (credit the
// user's balance + write a DEPOSIT ledger row), and return a checkoutUrl that
// points back to the settings success redirect so the existing UX still works.
export async function POST(req: NextRequest) {
  const me = await getSessionUser();
  if (!me) return unauthorized();

  const body = await req.json().catch(() => null);
  const amount = typeof body?.amount === "number" ? body.amount : Number(body?.amount);
  if (!amount || isNaN(amount) || amount < 1.0) {
    return badRequest("Amount must be at least 1.00");
  }

  const user = await prisma.user.findUnique({ where: { id: me.id } });
  if (!user) return unauthorized();

  const now = new Date();

  // Create the deposit already completed (mirrors completeDepositById).
  const deposit = await prisma.deposit.create({
    data: {
      userId: me.id,
      amount,
      status: "COMPLETED",
      stripeCheckoutSessionId: `cs_demo_${crypto.randomUUID()}`,
      stripePaymentIntentId: "demo",
      createdAt: now,
      completedAt: now,
    },
  });

  const newBalance = user.creditBalance + amount;
  await prisma.user.update({
    where: { id: me.id },
    data: { creditBalance: newBalance },
  });

  await prisma.creditTransaction.create({
    data: {
      userId: me.id,
      type: "DEPOSIT",
      amount,
      balanceAfter: newBalance,
      referenceId: deposit.id,
      stripePaymentIntentId: "demo",
      description: "Credit deposit",
    },
  });

  return ok(
    {
      depositId: deposit.id,
      checkoutUrl: "/settings?section=balance&deposit=success",
      amount,
    },
    201
  );
}
