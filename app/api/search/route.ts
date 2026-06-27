import { NextRequest } from "next/server";
import { prisma } from "@/lib/prisma";
import { ok } from "@/lib/api-helpers";

type SearchUserType = "CREATOR" | "SUPPORTER";

interface SearchUserItem {
  username: string;
  displayName: string;
  avatarUrl: string | null;
  userType: SearchUserType;
  totalAmount: number;
}

async function searchUsers(query: string, userType: SearchUserType): Promise<SearchUserItem[]> {
  // Provider-portable case-insensitive search: Prisma's `mode: "insensitive"` is
  // Postgres-only (unsupported on SQLite), so we fetch the candidate set and filter
  // case-insensitively in JS. Fine at demo scale.
  const q = query.toLowerCase();
  const candidates = await prisma.user.findMany({
    where: { profileVisible: true, userType },
  });
  const users = candidates.filter(
    (u) =>
      (u.username?.toLowerCase().includes(q) ?? false) ||
      (u.displayName?.toLowerCase().includes(q) ?? false)
  );
  return users.map((u) => ({
    username: u.username ?? "",
    displayName: u.displayName ?? u.name ?? "",
    avatarUrl: u.avatarUrl ?? u.image ?? null,
    userType: (u.userType as SearchUserType) ?? "CREATOR",
    totalAmount: 0, // always 0 per service contract
  }));
}

export async function GET(req: NextRequest) {
  const url = new URL(req.url);
  const q = url.searchParams.get("q") ?? "";
  const type = url.searchParams.get("type");

  // Controller guard: min length 2, short-circuit without hitting the DB.
  if (q.length < 2) {
    return ok({ creators: [], supporters: [] });
  }

  const normalizedType = type?.toUpperCase();

  let creators: SearchUserItem[] = [];
  let supporters: SearchUserItem[] = [];

  if (normalizedType === "CREATOR") {
    creators = await searchUsers(q, "CREATOR");
  } else if (normalizedType === "SUPPORTER") {
    supporters = await searchUsers(q, "SUPPORTER");
  } else {
    [creators, supporters] = await Promise.all([
      searchUsers(q, "CREATOR"),
      searchUsers(q, "SUPPORTER"),
    ]);
  }

  return ok({ creators, supporters });
}
