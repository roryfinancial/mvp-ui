// ─── Domain types ─────────────────────────────────────────────────────────────

export type UserRole = "creator" | "supporter";

export interface User {
  id: string;
  email: string;
  username: string;
  displayName: string;
  role: UserRole;
  bio: string;
  avatarUrl: string | null;
  creditBalance: number;
  createdAt: string; // ISO 8601
}

// ─── Auth ─────────────────────────────────────────────────────────────────────

export type LoginResult =
  | { ok: true; user: User }
  | { ok: false; error: string; field?: "email" | "password" | "general" };

export type SignUpResult =
  | { ok: true; user: User; confirmEmail: boolean }
  | { ok: false; error: string; field?: "email" | "password" | "general" };

// ─── Wishlist ─────────────────────────────────────────────────────────────────

export type ItemStatus = "active" | "completed" | "cancelled";

export interface WishlistItem {
  id: string;
  wishlistId: string;
  title: string;
  description: string;
  url: string;
  goalAmount: number;
  raisedAmount: number;
  status: ItemStatus;
  thumbnailUrl: string | null;
  createdAt: string;
}

export interface Wishlist {
  id: string;
  creatorId: string;
  name: string;
  description: string;
  coverImageUrl: string | null;
  items: WishlistItem[];
  createdAt: string;
}

// ─── Gamification ─────────────────────────────────────────────────────────────

export type LeagueTier = "bronze" | "silver" | "gold" | "diamond";

export type BadgeId =
  | "early_adopter"
  | "streak_lord"
  | "big_spender"
  | "first_gift"
  | "league_leader"
  | "jackpot"
  | "speed_gifter"
  | "century_club"
  | "diamond_gifter"
  | "variety_pack"
  | "mystery_1"
  | "mystery_2";

export interface GamificationState {
  xp: number;
  level: number;
  streakDays: number;
  lastActivityDate: string; // ISO date YYYY-MM-DD
  leagueTier: LeagueTier;
  weeklyGifted: number;
  badges: BadgeId[];
  questsCompletedToday: string[]; // quest IDs
}

export interface FeedEvent {
  id: string;
  type: "gift" | "follow" | "milestone" | "new_item" | "league_up" | "streak";
  actorName: string;
  targetName: string;
  amount?: number;
  timestamp: string;
}

export interface DailyQuest {
  id: string;
  difficulty: "easy" | "medium" | "hard";
  label: string;
  xpReward: number;
  completed: boolean;
  locked: boolean;
}

export interface CreatorFeedItem {
  id: string;
  creatorName: string;
  username: string;
  avatarInitials: string;
  avatarColor: string;
  itemTitle: string;
  itemDescription: string;
  goalAmount: number;
  raisedAmount: number;
  gifterCount: number;
  giftsToday: number;
  daysLeft: number;
  createdAt: string;
  giftsLast24h: number;
  tags: string[];
}

// ─── Activity ─────────────────────────────────────────────────────────────────

export interface GiftEvent {
  id: string;
  supporterId: string;
  supporterName: string;
  itemId: string;
  itemTitle: string;
  wishlistId: string;
  amount: number;
  createdAt: string;
}
