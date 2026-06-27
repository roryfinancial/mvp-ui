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

  const now = new Date();

  // Deposit + balance credit + ledger row are one atomic unit: either all land
  // or none do. Credit the balance with an atomic {increment} (no read-then-
  // absolute-write race) and read the resulting balance straight off the update.
  const deposit = await prisma.$transaction(async (tx) => {
    const deposit = await tx.deposit.create({
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

    const updated = await tx.user.update({
      where: { id: me.id },
      data: { creditBalance: { increment: amount } },
    });

    await tx.creditTransaction.create({
      data: {
        userId: me.id,
        type: "DEPOSIT",
        amount,
        balanceAfter: updated.creditBalance,
        referenceId: deposit.id,
        stripePaymentIntentId: "demo",
        description: "Credit deposit",
      },
    });

    return deposit;
  }, { maxWait: 10_000, timeout: 15_000 });

  return ok(
    {
      depositId: deposit.id,
      checkoutUrl: "/settings?section=balance&deposit=success",
      amount,
    },
    201
  );
}
