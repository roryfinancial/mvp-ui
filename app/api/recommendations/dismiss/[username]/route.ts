import { NextRequest } from "next/server";
import { ok, unauthorized, getSessionUser } from "@/lib/api-helpers";

// NOTE: The original Java backend does NOT implement a dismiss endpoint; the TS
// client (recommendationApi.dismiss) calls it but RecommendationController only
// exposes the GET. This is a minimal-fidelity no-op stub that accepts the request
// and returns void, satisfying the client contract without persistence.
export async function POST(
  _req: NextRequest,
  _ctx: { params: Promise<{ username: string }> }
) {
  const me = await getSessionUser();
  if (!me) return unauthorized();
  return ok(null);
}
