import { NextRequest } from "next/server";
import { prisma } from "@/lib/prisma";
import { ok, badRequest } from "@/lib/api-helpers";

// Temporary internal tool — no auth (cofounder feedback widget). Suggestions are
// listed newest-first; screenshots are optional compressed base64 JPEG data URLs.

const AUTHORS = ["Logan", "Kayden", "Annabella"] as const;
const MAX_SCREENSHOT_BYTES = 4_000_000; // ~4MB data-URL ceiling per shot

export interface FounderSuggestionResponse {
  id: string;
  author: string;
  comment: string;
  pageUrl: string;
  screenshot: string | null;
  createdAt: string;
}

export async function GET() {
  const rows = await prisma.founderSuggestion.findMany({
    orderBy: { createdAt: "desc" },
    take: 100,
  });
  const data: FounderSuggestionResponse[] = rows.map((r) => ({
    id: r.id,
    author: r.author,
    comment: r.comment,
    pageUrl: r.pageUrl,
    screenshot: r.screenshot ?? null,
    createdAt: r.createdAt.toISOString(),
  }));
  return ok(data);
}

export async function POST(req: NextRequest) {
  const body = await req.json().catch(() => null);
  if (!body) return badRequest("Invalid JSON body");

  const author = String(body.author ?? "");
  const comment = String(body.comment ?? "").trim();
  const pageUrl = String(body.pageUrl ?? "");
  const screenshot: string | null =
    typeof body.screenshot === "string" && body.screenshot.startsWith("data:image")
      ? body.screenshot
      : null;

  if (!AUTHORS.includes(author as (typeof AUTHORS)[number])) {
    return badRequest("author must be one of Logan, Kayden, Annabella");
  }
  if (!comment) return badRequest("comment is required");
  if (screenshot && screenshot.length > MAX_SCREENSHOT_BYTES) {
    return badRequest("screenshot too large — compress further before saving");
  }

  const row = await prisma.founderSuggestion.create({
    data: { author, comment, pageUrl, screenshot },
  });

  const data: FounderSuggestionResponse = {
    id: row.id,
    author: row.author,
    comment: row.comment,
    pageUrl: row.pageUrl,
    screenshot: row.screenshot ?? null,
    createdAt: row.createdAt.toISOString(),
  };
  return ok(data, 201);
}
