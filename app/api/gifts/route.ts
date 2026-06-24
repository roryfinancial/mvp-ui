import { NextRequest } from "next/server";
import { prisma } from "@/lib/prisma";
import { ok, badRequest, notFound, unauthorized, getSessionUser } from "@/lib/api-helpers";
import { onGift } from "../../../lib/gamification";

export async function POST(req: NextRequest) {
  const me = await getSessionUser();
  if (!me) return unauthorized();

  const body = await req.json();
  const projectId: string | undefined = body?.projectId;
  const amount: number = Number(body?.amount);
  const message: string | null = body?.message ?? null;

  if (!projectId) return badRequest("projectId is required");
  if (!amount || isNaN(amount) || amount < 0.5) return badRequest("amount must be at least 0.50");

  // Load project -> creator (owner)
  const project = await prisma.project.findUnique({ where: { id: projectId } });
  if (!project) return notFound("Project not found");

  const creatorId = project.creatorId;
  if (creatorId === me.id) return badRequest("You cannot donate to your own project");

  // In DEMO: treat creator as Stripe-onboarded (skip the onboarding check).
  const creator = await prisma.user.findUnique({ where: { id: creatorId } });
  if (!creator) return notFound("Creator not found");

  const supporter = await prisma.user.findUnique({ where: { id: me.id } });
  if (!supporter) return notFound("Supporter not found");

  if (supporter.creditBalance < amount) {
    return badRequest("Insufficient credit balance. Please deposit funds first.");
  }

  const creatorUsername = creator.username ?? "";
  const supporterUsername = supporter.username ?? "";

  const INSUFFICIENT = "INSUFFICIENT_FUNDS";
  let result;
  try {
    result = await prisma.$transaction(async (tx) => {
      // 1+2. Insert Gift as COMPLETED (no Stripe ids)
      const gift = await tx.gift.create({
        data: {
          supporterId: supporter.id,
          creatorId: creator.id,
          projectId,
          amount,
          message,
          status: "COMPLETED",
        },
      });

      // 3. Wallet ledger inline. Debit ATOMICALLY with {decrement} and re-check the
      // post-debit balance inside the tx so concurrent/retried gifts cannot drive
      // the balance negative (a plain read-then-absolute-write would lose updates).
      const debited = await tx.user.update({
        where: { id: supporter.id },
        data: { creditBalance: { decrement: amount } },
      });
      if (debited.creditBalance < 0) throw new Error(INSUFFICIENT);
      const newSupporterBalance = debited.creditBalance;

      await tx.creditTransaction.create({
        data: {
          userId: supporter.id,
          type: "GIFT_SENT",
          amount,
          balanceAfter: newSupporterBalance,
          referenceId: gift.id,
          description: `Gift to ${creatorUsername}`,
        },
      });

      const priorReceived = await tx.creditTransaction.aggregate({
        where: { userId: creator.id, type: "GIFT_RECEIVED" },
        _sum: { amount: true },
      });
      const balanceAfter = (priorReceived._sum.amount ?? 0) + amount;
      await tx.creditTransaction.create({
        data: {
          userId: creator.id,
          type: "GIFT_RECEIVED",
          amount,
          balanceAfter,
          referenceId: gift.id,
          description: `Gift from ${supporterUsername}`,
        },
      });
      // NOTE: creator.creditBalance is intentionally NOT incremented (matches Java).

      // 4. Project raise: first ACTIVE item gets the amount
      const items = await tx.projectItem.findMany({
        where: { projectId },
        orderBy: { sortOrder: "asc" },
      });
      const firstActive = items.find((i) => i.status === "ACTIVE");
      if (firstActive) {
        const newRaised = firstActive.raisedAmount + amount;
        const newStatus = newRaised >= firstActive.goalAmount ? "GIFTED" : firstActive.status;
        await tx.projectItem.update({
          where: { id: firstActive.id },
          data: {
            raisedAmount: newRaised,
            status: newStatus,
            ...(newStatus === "GIFTED" ? { giftedById: supporter.id } : {}),
          },
        });
      }

      return gift;
    });
  } catch (e) {
    if (e instanceof Error && e.message === INSUFFICIENT) {
      return badRequest("Insufficient credit balance. Please deposit funds first.");
    }
    throw e;
  }

  // 5. Gamification (outside the gift tx, matching Java's separate service call).
  // The gift is already committed; a gamification hiccup must not 500 the request
  // (a retry would double-charge), so it's best-effort.
  try {
    await onGift(supporter.id, amount);
  } catch (e) {
    console.error("onGift failed after gift commit:", e);
  }

  // 6. Return PaymentIntent-shaped response
  return ok(
    {
      giftId: result.id,
      clientSecret: "",
      amount,
      creatorUsername,
      projectName: project.name,
    },
    201
  );
}
