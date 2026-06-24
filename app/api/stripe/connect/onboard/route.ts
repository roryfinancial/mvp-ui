import { NextRequest } from "next/server";
import { prisma } from "@/lib/prisma";
import { ok, unauthorized, notFound, getSessionUser } from "@/lib/api-helpers";

// POST /api/stripe/connect/onboard
// DEMO STUB: no Stripe SDK. Generate a fake Express account id, mark onboarding
// complete immediately, and return a local success URL so the UI flow completes.
export async function POST(req: NextRequest) {
  const me = await getSessionUser();
  if (!me) return unauthorized();

  const user = await prisma.user.findUnique({ where: { id: me.id } });
  if (!user) return notFound("User not found");

  let stripeAccountId = user.stripeAccountId;
  if (!stripeAccountId) {
    stripeAccountId = `acct_demo_${Math.random().toString(36).slice(2, 12)}`;
  }

  await prisma.user.update({
    where: { id: user.id },
    data: { stripeAccountId, stripeOnboardingComplete: true },
  });

  const origin = req.nextUrl.origin;
  const onboardingUrl = `${origin}/settings?section=balance&stripe=success`;

  return ok({ onboardingUrl, stripeAccountId });
}
