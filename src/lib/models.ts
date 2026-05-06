// ─── Model factories ──────────────────────────────────────────────────────────
// Each factory sets all required defaults so callers only provide what differs.
// When switching to a real database, the server returns the same shape — these
// factories become response mappers/validators (e.g., Zod schemas).

import type { User, Wishlist, WishlistItem, GiftEvent, UserRole, ItemStatus } from "./types";

function uid(): string {
  return crypto.randomUUID();
}

function now(): string {
  return new Date().toISOString();
}

export function createUser(
  fields: Pick<User, "email" | "role"> & Partial<Omit<User, "email" | "role">>
): User {
  const username = fields.username ?? fields.email.split("@")[0].toLowerCase();
  return {
    id: fields.id ?? uid(),
    username,
    displayName: fields.displayName ?? username,
    bio: fields.bio ?? "",
    avatarUrl: fields.avatarUrl ?? null,
    creditBalance: fields.creditBalance ?? 0,
    referralCode: fields.referralCode ?? null,
    stripeOnboardingComplete: fields.stripeOnboardingComplete ?? false,
    isProfileComplete: fields.isProfileComplete ?? true,
    createdAt: fields.createdAt ?? now(),
    ...fields,
  };
}

export function createWishlistItem(
  fields: Pick<WishlistItem, "wishlistId" | "title"> & Partial<Omit<WishlistItem, "wishlistId" | "title">>
): WishlistItem {
  return {
    id: fields.id ?? uid(),
    description: fields.description ?? "",
    url: fields.url ?? "",
    goalAmount: fields.goalAmount ?? 0,
    raisedAmount: fields.raisedAmount ?? 0,
    status: (fields.status ?? "active") as ItemStatus,
    thumbnailUrl: fields.thumbnailUrl ?? null,
    createdAt: fields.createdAt ?? now(),
    ...fields,
  };
}

export function createWishlist(
  fields: Pick<Wishlist, "creatorId" | "name"> & Partial<Omit<Wishlist, "creatorId" | "name">>
): Wishlist {
  return {
    id: fields.id ?? uid(),
    description: fields.description ?? "",
    coverImageUrl: fields.coverImageUrl ?? null,
    items: fields.items ?? [],
    createdAt: fields.createdAt ?? now(),
    ...fields,
  };
}

export function createGiftEvent(
  fields: Pick<GiftEvent, "supporterId" | "supporterName" | "itemId" | "itemTitle" | "wishlistId" | "amount"> &
    Partial<Pick<GiftEvent, "id" | "createdAt">>
): GiftEvent {
  return {
    id: fields.id ?? uid(),
    createdAt: fields.createdAt ?? now(),
    ...fields,
  };
}
