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
  referralCode: string | null;
  stripeOnboardingComplete: boolean;
  isProfileComplete: boolean; // true if username is not provisional (user_xxxx)
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
