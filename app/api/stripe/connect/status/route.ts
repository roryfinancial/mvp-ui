import { NextRequest } from "next/server";
import { prisma } from "@/lib/prisma";
import { ok, unauthorized, notFound, getSessionUser } from "@/lib/api-helpers";

// GET /api/stripe/connect/status
// DEMO STUB: derive status purely from DB. A non-null stripeAccountId means the
// account is fully enabled; onboarding is marked complete as a side effect.
export async function GET(_req: NextRequest) {
  const me = await getSessionUser();
  if (!me) return unauthorized();

  const user = await prisma.user.findUnique({ where: { id: me.id } });
  if (!user) return notFound("User not found");

  if (!user.stripeAccountId) {
    return ok({
      connected: false,
      chargesEnabled: false,
      payoutsEnabled: false,
      stripeAccountId: null,
    });
  }

  if (!user.stripeOnboardingComplete) {
    await prisma.user.update({
      where: { id: user.id },
      data: { stripeOnboardingComplete: true },
    });
  }

  return ok({
    connected: true,
    chargesEnabled: true,
    payoutsEnabled: true,
    stripeAccountId: user.stripeAccountId,
  });
}
