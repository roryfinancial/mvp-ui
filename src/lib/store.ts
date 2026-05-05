// ─── In-memory data store ─────────────────────────────────────────────────────
// Seed data lives here so the whole app looks populated without a backend.
// Migration path: replace each Store method with a fetch() to the real API.
// The shapes returned must still match the types in types.ts.

import { createUser, createWishlist, createWishlistItem, createGiftEvent } from "./models";
import { hashPassword } from "./security";
import { DEMO_GAMIFICATION } from "./gamification";
import type { User, Wishlist, GiftEvent, CreatorFeedItem, FeedEvent, DailyQuest, GamificationState } from "./types";

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

// ─── Seed feed creators ───────────────────────────────────────────────────────

const FEED_CREATORS: CreatorFeedItem[] = [
  {
    id: "fc-1", creatorName: "Pixel Witch", username: "pixelwitch",
    avatarInitials: "PW", avatarColor: "bg-purple-600",
    itemTitle: "Pro Drawing Tablet", itemDescription: "Upgrading to a Wacom Cintiq for better streams",
    goalAmount: 1200, raisedAmount: 1080, gifterCount: 34, giftsToday: 8, daysLeft: 3,
    createdAt: "2026-04-30T10:00:00.000Z", giftsLast24h: 8, tags: ["following", "trending"],
  },
  {
    id: "fc-2", creatorName: "Bass Drop Benny", username: "bassdropbenny",
    avatarInitials: "BB", avatarColor: "bg-blue-600",
    itemTitle: "Studio Monitors", itemDescription: "KRK Rokit 8s for mixing my beats properly",
    goalAmount: 800, raisedAmount: 210, gifterCount: 12, giftsToday: 2, daysLeft: 21,
    createdAt: "2026-05-01T09:00:00.000Z", giftsLast24h: 2, tags: ["new"],
  },
  {
    id: "fc-3", creatorName: "Neon Sculptor", username: "neonsculptor",
    avatarInitials: "NS", avatarColor: "bg-pink-600",
    itemTitle: "Resin Casting Kit", itemDescription: "UV resin and molds for my sculpture series",
    goalAmount: 450, raisedAmount: 390, gifterCount: 28, giftsToday: 11, daysLeft: 5,
    createdAt: "2026-04-29T14:00:00.000Z", giftsLast24h: 11, tags: ["trending", "following"],
  },
  {
    id: "fc-4", creatorName: "Code Witch Kim", username: "codewitchkim",
    avatarInitials: "CK", avatarColor: "bg-green-600",
    itemTitle: "Mechanical Keyboard", itemDescription: "A proper clicky keyboard for my coding streams",
    goalAmount: 300, raisedAmount: 45, gifterCount: 5, giftsToday: 5, daysLeft: 14,
    createdAt: "2026-05-02T06:00:00.000Z", giftsLast24h: 5, tags: ["new", "rising"],
  },
  {
    id: "fc-5", creatorName: "Synth Lord", username: "synthlord",
    avatarInitials: "SL", avatarColor: "bg-orange-600",
    itemTitle: "Roland Synthesizer", itemDescription: "Roland JUNO-X for my ambient music project",
    goalAmount: 1800, raisedAmount: 540, gifterCount: 19, giftsToday: 6, daysLeft: 18,
    createdAt: "2026-04-28T11:00:00.000Z", giftsLast24h: 6, tags: ["rising"],
  },
  {
    id: "fc-6", creatorName: "VR Dev Vance", username: "vrdevvance",
    avatarInitials: "VV", avatarColor: "bg-teal-600",
    itemTitle: "Meta Quest Pro", itemDescription: "Building immersive VR experiences and need the hardware",
    goalAmount: 1500, raisedAmount: 900, gifterCount: 41, giftsToday: 9, daysLeft: 7,
    createdAt: "2026-04-27T12:00:00.000Z", giftsLast24h: 9, tags: ["trending", "following"],
  },
];

// ─── Seed feed events (live ticker) ──────────────────────────────────────────

const FEED_EVENTS: FeedEvent[] = [
  { id: "ev-1",  type: "gift",      actorName: "Sarah J.",       targetName: "Pixel Witch",         amount: 50,  timestamp: "2026-05-02T11:45:00.000Z" },
  { id: "ev-2",  type: "milestone", actorName: "Neon Sculptor",  targetName: "Resin Casting Kit",              timestamp: "2026-05-02T11:30:00.000Z" },
  { id: "ev-3",  type: "league_up", actorName: "Mike C.",        targetName: "Gold",                           timestamp: "2026-05-02T11:00:00.000Z" },
  { id: "ev-4",  type: "gift",      actorName: "Emily R.",       targetName: "VR Dev Vance",        amount: 100, timestamp: "2026-05-02T10:50:00.000Z" },
  { id: "ev-5",  type: "streak",    actorName: "Fanatic99",      targetName: "14",                             timestamp: "2026-05-02T10:30:00.000Z" },
  { id: "ev-6",  type: "new_item",  actorName: "Code Witch Kim", targetName: "Mechanical Keyboard",            timestamp: "2026-05-02T10:00:00.000Z" },
  { id: "ev-7",  type: "gift",      actorName: "Jordan T.",      targetName: "Bass Drop Benny",     amount: 25,  timestamp: "2026-05-02T09:45:00.000Z" },
  { id: "ev-8",  type: "gift",      actorName: "Alex M.",        targetName: "Synth Lord",          amount: 75,  timestamp: "2026-05-02T09:20:00.000Z" },
  { id: "ev-9",  type: "league_up", actorName: "CryptoCarlos",   targetName: "Diamond",                        timestamp: "2026-05-02T08:55:00.000Z" },
  { id: "ev-10", type: "gift",      actorName: "TurboTina",      targetName: "Pixel Witch",         amount: 200, timestamp: "2026-05-02T08:30:00.000Z" },
];

// ─── Seed daily quests ────────────────────────────────────────────────────────

const DAILY_QUESTS: DailyQuest[] = [
  { id: "quest-easy",   difficulty: "easy",   label: "Gift any creator",      xpReward: 50,  completed: true,  locked: false },
  { id: "quest-medium", difficulty: "medium", label: "Follow a new creator",  xpReward: 30,  completed: false, locked: false },
  { id: "quest-hard",   difficulty: "hard",   label: "Gift $25+ in one gift", xpReward: 100, completed: false, locked: false },
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

  getGamificationState(): GamificationState {
    return { ...DEMO_GAMIFICATION };
  },

  getFeedEvents(): FeedEvent[] {
    return [...FEED_EVENTS];
  },

  getDailyQuests(): DailyQuest[] {
    return [...DAILY_QUESTS];
  },

  getRecommendedCreators(): CreatorFeedItem[] {
    const followingIds = new Set(["fc-1", "fc-3", "fc-6"]);
    const scored: [CreatorFeedItem, number][] = FEED_CREATORS.map((c) => {
      const progress = c.raisedAmount / c.goalAmount;
      const velocity = c.giftsToday / Math.max(c.gifterCount, 1);
      const followingBonus = followingIds.has(c.id) ? 0.25 : 0;
      const ageHours = (Date.now() - new Date(c.createdAt).getTime()) / 3_600_000;
      const recency = Math.max(0, 1 - ageHours / 168);
      return [c, progress * 0.3 + velocity * 0.3 + followingBonus + recency * 0.15];
    });
    return scored.sort((a, b) => b[1] - a[1]).map(([c]) => c);
  },

  getFeedCreators(tab: "following" | "hot" | "explore" | "rising"): CreatorFeedItem[] {
    if (tab === "following") return FEED_CREATORS.filter((c) => c.tags.includes("following"));
    if (tab === "hot")       return [...FEED_CREATORS].sort((a, b) => b.giftsLast24h - a.giftsLast24h);
    if (tab === "explore")   return Store.getRecommendedCreators();
    if (tab === "rising")    return FEED_CREATORS.filter((c) => c.tags.includes("rising") || c.tags.includes("new"));
    return FEED_CREATORS;
  },
} as const;

// ─── Demo credentials (for investor demo banner) ──────────────────────────────
export const DEMO_CREDENTIALS = {
  creator: { email: CREATOR.email,   password: "demo1234", label: "Creator account" },
  fan:     { email: SUPPORTER.email, password: "demo1234", label: "Supporter account" },
} as const;
