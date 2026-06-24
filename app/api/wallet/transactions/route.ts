import { NextRequest } from "next/server";
import { prisma } from "@/lib/prisma";
import { ok, unauthorized, getSessionUser, pageParams, paged } from "@/lib/api-helpers";

const VALID_TYPES = ["DEPOSIT", "GIFT_SENT", "GIFT_RECEIVED", "REFUND"];

// GET /api/wallet/transactions?type=&page=&size=
export async function GET(req: NextRequest) {
  const me = await getSessionUser();
  if (!me) return unauthorized();

  const url = new URL(req.url);
  const { page, size, skip } = pageParams(url, 20);
  const typeParam = url.searchParams.get("type");
  const type = typeParam && VALID_TYPES.includes(typeParam) ? typeParam : undefined;

  const where = { userId: me.id, ...(type ? { type } : {}) };

  const [rows, totalElements] = await Promise.all([
    prisma.creditTransaction.findMany({
      where,
      orderBy: { createdAt: "desc" },
      skip,
      take: size,
    }),
    prisma.creditTransaction.count({ where }),
  ]);

  const content = rows.map((t) => ({
    id: t.id,
    type: t.type,
    amount: t.amount,
    balanceAfter: t.balanceAfter,
    referenceId: t.referenceId ?? null,
    stripePaymentIntentId: t.stripePaymentIntentId ?? null,
    description: t.description ?? "",
    createdAt: t.createdAt.toISOString(),
  }));

  return ok(paged(content, page, size, totalElements));
}
