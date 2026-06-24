import { NextRequest } from "next/server";
import { ok, unauthorized, getSessionUser } from "@/lib/api-helpers";
import { getDailyQuests } from "../../../../lib/gamification";

export async function GET(_req: NextRequest) {
  const me = await getSessionUser();
  if (!me) return unauthorized();
  const quests = await getDailyQuests(me.id);
  return ok(quests);
}
