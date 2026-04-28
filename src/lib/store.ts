// ─── In-memory data store ─────────────────────────────────────────────────────
// Seed data lives here so the whole app looks populated without a backend.
// Migration path: replace each Store method with a fetch() to the real API.
// The shapes returned must still match the types in types.ts.

import { createUser, createWishlist, createWishlistItem, createGiftEvent } from "./models";
import { hashPassword } from "./security";
import type { User, Wishlist, GiftEvent } from "./types";

interface UserRecord {
  user: User;
  passwordHash: string; // bcrypt hash on the server; btoa stub for demo
}

// ─── Seed users ───────────────────────────────────────────────────────────────

const CREATOR = createUser({
  id: "demo-creator",
  email: "creator@demo.com",
  username: "clavicular",
  displayName: "Clavicular",
  role: "creator",
  bio: "Streaming, tech reviews, and creative projects.",
  creditBalance: 1240,
  createdAt: "2026-01-01T00:00:00.000Z",
});

const SUPPORTER = createUser({
  id: "demo-supporter",
  email: "fan@demo.com",
  username: "fanatic99",
  displayName: "Fanatic99",
  role: "supporter",
  bio: "Supporting the creators I love.",
  creditBalance: 580,
  createdAt: "2026-01-15T00:00:00.000Z",
});

// ─── Seed wishlists ──────────────────────────────────────────────────────────

const WISHLIST_1 = createWishlist({
  id: "wishlist-studio",
  creatorId: CREATOR.id,
  name: "Creator Essentials",
  description: "Everything I need to level up my content",
  items: [
    createWishlistItem({
      id: "item-stream", wishlistId: "wishlist-studio",
      title: "New Streaming Setup", description: "Upgrading for better quality streams",
      goalAmount: 2500, raisedAmount: 1890, status: "active",
    }),
    createWishlistItem({
      id: "item-art", wishlistId: "wishlist-studio",
      title: "Art Supplies Collection", description: "Professional grade materials for commissions",
      goalAmount: 800, raisedAmount: 520, status: "active",
    }),
    createWishlistItem({
      id: "item-coffee", wishlistId: "wishlist-studio",
      title: "Coffee Fund", description: "Fuel the creative process",
      goalAmount: 200, raisedAmount: 340, status: "completed",
    }),
  ],
});

// ─── Seed gift events ────────────────────────────────────────────────────────

const RECENT_GIFTS: GiftEvent[] = [
  createGiftEvent({ supporterId: SUPPORTER.id, supporterName: "Sarah J.", itemId: "item-stream", itemTitle: "New Streaming Setup", wishlistId: "wishlist-studio", amount: 250, createdAt: "2026-04-28T10:00:00.000Z" }),
  createGiftEvent({ supporterId: "u2", supporterName: "Mike C.", itemId: "item-stream", itemTitle: "New Streaming Setup", wishlistId: "wishlist-studio", amount: 180, createdAt: "2026-04-28T05:00:00.000Z" }),
  createGiftEvent({ supporterId: "u3", supporterName: "Emily R.", itemId: "item-art",  itemTitle: "Art Supplies Collection", wishlistId: "wishlist-studio", amount: 120, createdAt: "2026-04-27T12:00:00.000Z" }),
];

// ─── Internal maps ────────────────────────────────────────────────────────────

const _users = new Map<string, UserRecord>([
  [CREATOR.email,   { user: CREATOR,   passwordHash: hashPassword("demo1234") }],
  [SUPPORTER.email, { user: SUPPORTER, passwordHash: hashPassword("demo1234") }],
]);

const _wishlists = new Map<string, Wishlist>([
  [WISHLIST_1.id, WISHLIST_1],
]);

// ─── Store API ────────────────────────────────────────────────────────────────
// Methods are intentionally synchronous here. When backed by a real API, each
// becomes async and returns Promise<T> — callers already await them via
// AuthService.login(), so the swap is mechanical.

export const Store = {
  findUserByEmail(email: string): UserRecord | undefined {
    return _users.get(email.toLowerCase().trim());
  },

  getUserById(id: string): User | undefined {
    for (const { user } of _users.values()) {
      if (user.id === id) return user;
    }
    return undefined;
  },

  getWishlistsByCreator(creatorId: string): Wishlist[] {
    return [..._wishlists.values()].filter((w) => w.creatorId === creatorId);
  },

  getWishlistById(id: string): Wishlist | undefined {
    return _wishlists.get(id);
  },

  getRecentGifts(creatorId: string): GiftEvent[] {
    const wishlists = Store.getWishlistsByCreator(creatorId);
    const ids = new Set(wishlists.map((w) => w.id));
    return RECENT_GIFTS.filter((g) => ids.has(g.wishlistId)).sort(
      (a, b) => new Date(b.createdAt).getTime() - new Date(a.createdAt).getTime()
    );
  },

  updateUserBalance(userId: string, balance: number): void {
    for (const record of _users.values()) {
      if (record.user.id === userId) {
        record.user.creditBalance = balance;
        return;
      }
    }
  },
} as const;

// ─── Demo credentials (for investor demo banner) ──────────────────────────────
export const DEMO_CREDENTIALS = {
  creator: { email: CREATOR.email,   password: "demo1234", label: "Creator account" },
  fan:     { email: SUPPORTER.email, password: "demo1234", label: "Supporter account" },
} as const;
