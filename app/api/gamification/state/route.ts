import { NextRequest } from "next/server";
import { ok, unauthorized, getSessionUser } from "@/lib/api-helpers";
import { getState } from "../../../../lib/gamification";

export async function GET(_req: NextRequest) {
  const me = await getSessionUser();
  if (!me) return unauthorized();
  const state = await getState(me.id);
  return ok(state);
}
