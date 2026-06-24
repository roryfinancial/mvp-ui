import { NextRequest } from "next/server";
import { ok, unauthorized, getSessionUser } from "@/lib/api-helpers";
import { getWeeklyLeaderboard } from "../../../../lib/gamification";

export async function GET(req: NextRequest) {
  const me = await getSessionUser();
  if (!me) return unauthorized();
  const url = new URL(req.url);
  const limit = Math.max(1, parseInt(url.searchParams.get("limit") ?? "5", 10) || 5);
  const entries = await getWeeklyLeaderboard(me.id, limit);
  return ok(entries);
}
