// Shared helpers for the migrated Next.js API routes (ported from the Java
// backend's ApiResponse/PagedResponse envelopes + common service utilities).
//
// Every route returns the ApiResponse<T> envelope that lib/api.ts's apiFetch/
// nextFetch expects: { success, data, error }.

import { NextResponse } from "next/server";
import { headers } from "next/headers";
import { auth } from "@/lib/auth.server";

// ─── Response envelopes ──────────────────────────────────────────────────────

export type ApiError = { code: string; message: string; details?: unknown };

export function ok<T>(data: T, status = 200) {
  return NextResponse.json({ success: true, data, error: null }, { status });
}

export function fail(code: string, message: string, status = 400, details?: unknown) {
  return NextResponse.json(
    { success: false, data: null, error: { code, message, details } },
    { status }
  );
}

export const notFound = (message = "Not found") => fail("NOT_FOUND", message, 404);
export const unauthorized = (message = "Not authenticated") => fail("UNAUTHORIZED", message, 401);
export const forbidden = (message = "Forbidden") => fail("FORBIDDEN", message, 403);
export const badRequest = (message: string) => fail("BAD_REQUEST", message, 400);

// ─── Auth ────────────────────────────────────────────────────────────────────

/** Returns the authenticated session user, or null. */
export async function getSessionUser() {
  const session = await auth.api.getSession({ headers: await headers() });
  return session?.user ?? null;
}

// ─── Pagination (mirrors Java PagedResponse<T>) ──────────────────────────────

export interface PagedResponse<T> {
  content: T[];
  page: number;
  size: number;
  totalElements: number;
  totalPages: number;
  last: boolean;
  first: boolean;
}

export function paged<T>(content: T[], page: number, size: number, totalElements: number): PagedResponse<T> {
  const totalPages = size > 0 ? Math.ceil(totalElements / size) : 0;
  return {
    content,
    page,
    size,
    totalElements,
    totalPages,
    last: page >= totalPages - 1,
    first: page === 0,
  };
}

/** Parse ?page= / ?size= query params with defaults matching the Java backend. */
export function pageParams(url: URL, defaultSize = 20): { page: number; size: number; skip: number } {
  const page = Math.max(0, parseInt(url.searchParams.get("page") ?? "0", 10) || 0);
  const size = Math.max(1, parseInt(url.searchParams.get("size") ?? String(defaultSize), 10) || defaultSize);
  return { page, size, skip: page * size };
}

// ─── communities (stored as a JSON string; SQLite has no String[]) ───────────

export function parseCommunities(raw: string | null | undefined): string[] {
  if (!raw) return [];
  try {
    const v = JSON.parse(raw);
    return Array.isArray(v) ? v.filter((x): x is string => typeof x === "string") : [];
  } catch {
    return [];
  }
}

export function stringifyCommunities(list: string[] | null | undefined): string {
  return JSON.stringify(Array.isArray(list) ? list : []);
}

// ─── Display helpers (ported from Java services) ─────────────────────────────

/** Initials from a display name: 'Ada Lovelace' -> 'AL', 'madonna' -> 'MA', '' -> '??'. */
export function getInitials(name: string | null | undefined): string {
  if (!name || !name.trim()) return "??";
  const parts = name.trim().split(/\s+/);
  if (parts.length === 1) return parts[0].slice(0, 2).toUpperCase();
  return (parts[0][0] + parts[parts.length - 1][0]).toUpperCase();
}

/** Relative time string: 'just now', '5m ago', '3h ago', '2d ago', '4mo ago'. */
export function formatTimeAgo(date: Date | string): string {
  const then = typeof date === "string" ? new Date(date) : date;
  const t = then.getTime();
  if (Number.isNaN(t)) return "just now"; // guard unparseable dates
  const ms = Math.max(0, Date.now() - t); // clamp future timestamps (clock skew)
  const min = Math.floor(ms / 60000);
  if (min < 1) return "just now";
  if (min < 60) return `${min}m ago`;
  const hrs = Math.floor(min / 60);
  if (hrs < 24) return `${hrs}h ago`;
  const days = Math.floor(hrs / 24);
  if (days < 30) return `${days}d ago`;
  return `${Math.floor(days / 30)}mo ago`;
}

/** Progress percent toward a goal, matching the Java HALF_UP rounding shape. */
export function progressPct(raised: number, goal: number): number {
  if (!goal || goal <= 0) return 0;
  return (raised / goal) * 100;
}

/** Today's date as 'YYYY-MM-DD' (date-only fields are stored as strings). */
export function todayISODate(): string {
  return new Date().toISOString().slice(0, 10);
}

// ─── Demo mode ───────────────────────────────────────────────────────────────

export const IS_DEMO = process.env.DEMO_MODE === "true";
