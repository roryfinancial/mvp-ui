import { NextRequest } from "next/server";
import { ok } from "@/lib/api-helpers";

/**
 * Public no-op endpoint (matches the Java backend, which ignores the body and
 * returns ApiResponse.ok(null)). Accepts { referralCode } and returns success.
 */
export async function POST(req: NextRequest) {
  try {
    await req.json();
  } catch {
    // body is optional / ignored
  }
  return ok(null);
}
