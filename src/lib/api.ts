// ─── API Client ────────────────────────────────────────────────────────────────
// Communicates with the tipflow-api backend. Uses the Supabase JWT for auth.

import { supabase } from "./supabase";

const API_BASE = import.meta.env.VITE_API_URL ?? "http://localhost:8080";

// ─── Types matching backend DTOs ─────────────────────────────────────────────

export interface ApiResponse<T> {
  success: boolean;
  data: T | null;
  error: { code: string; message: string; details?: unknown } | null;
}

export interface PagedResponse<T> {
  content: T[];
  page: number;
  size: number;
  totalElements: number;
  totalPages: number;
}

export interface UserProfileResponse {
  id: string;
  username: string;
  email: string;
  displayName: string;
  bio: string;
  avatarUrl: string | null;
  userType: "CREATOR" | "SUPPORTER";
  creditBalance: number;
  stripeOnboardingComplete: boolean;
  referralCode: string | null;
  settings: UserSettings;
  connectedPlatforms: ConnectedPlatform[];
  createdAt: string;
}

export interface UserSettings {
  emailNotifications: boolean;
  giftNotifications: boolean;
  milestoneNotifications: boolean;
  marketingNotifications: boolean;
  profileVisible: boolean;
  showOnLeaderboard: boolean;
  showGiftAmounts: boolean;
}

export interface PublicUserResponse {
  id: string;
  username: string;
  displayName: string;
  bio: string;
  avatarUrl: string | null;
  userType: "CREATOR" | "SUPPORTER";
  rank: number | null;
  totalRaised: number | null;
  totalSupporters: number | null;
  totalItems: number | null;
  totalGifted: number | null;
  creatorsSupported: number | null;
  itemsSupported: number | null;
  connectedPlatforms: ConnectedPlatform[];
  createdAt: string;
}

export interface ConnectedPlatform {
  platform: PlatformType;
  handle: string;
  url: string;
}

export type PlatformType = "YOUTUBE" | "TWITCH" | "TWITTER" | "INSTAGRAM" | "TIKTOK" | "SHOPIFY";

export interface CompleteProfileRequest {
  username: string;
  displayName?: string;
  userType: "CREATOR" | "SUPPORTER";
  referralCode?: string;
}

export interface ProjectResponse {
  id: string;
  name: string;
  description: string;
  coverImageUrl: string | null;
  isPublic: boolean;
  goalAmount: number;
  raisedAmount: number;
  progress: number;
  items: ProjectItemResponse[];
  createdAt: string;
}

export interface ProjectItemResponse {
  id: string;
  title: string;
  description: string;
  thumbnailUrl: string | null;
  goalAmount: number;
  raisedAmount: number;
  progress: number;
  status: "ACTIVE" | "COMPLETED" | "GIFTED";
  giftedByUsername: string | null;
}

export interface CreateProjectRequest {
  name: string;
  description?: string;
  coverImageUrl?: string;
  isPublic?: boolean;
}

export interface CreateProjectItemRequest {
  title: string;
  description?: string;
  thumbnailUrl?: string;
  goalAmount: number;
}

export interface RecentSupporterResponse {
  supporterUsername: string;
  supporterDisplayName: string;
  supporterInitials: string;
  supporterAvatarUrl: string | null;
  amount: number;
  itemTitle: string;
  message: string | null;
  timeAgo: string;
}

export interface TopSupporterResponse {
  rank: number;
  supporterUsername: string;
  supporterDisplayName: string;
  supporterInitials: string;
  supporterAvatarUrl: string | null;
  totalAmount: number;
  contributionCount: number;
}

export interface LeaderboardEntryResponse {
  rank: number;
  username: string;
  displayName: string;
  initials: string;
  avatarUrl: string | null;
  userType: "CREATOR" | "SUPPORTER";
  totalAmount: number;
  totalItems: number;
  totalContributions: number;
}

export interface AnalyticsResponse {
  period: string;
  chartData: {
    labels: string[];
    revenue: number[];
    supporters: number[];
    gifts: number[];
    avgContribution: number[];
  };
  stats: {
    totalRevenue: number;
    revenueChange: number;
    totalSupporters: number;
    supportersChange: number;
    totalGifts: number;
    giftsChange: number;
    avgContribution: number;
    avgContributionChange: number;
  };
  recentActivity: {
    supporterDisplayName: string;
    amount: number;
    itemTitle: string;
    timeAgo: string;
  }[];
}

export interface ReferralResponse {
  referredUsername: string;
  joinedDate: string;
  status: "ACTIVE" | "INACTIVE" | "PENDING";
  commissionRate: number;
  totalTipsGenerated: number;
  yourCommission: number;
  tipsThisMonth: number;
}

export interface ReferralLinkResponse {
  referralCode: string;
  referralLink: string;
  totalReferrals: number;
  currentTier: {
    name: string;
    commissionRate: number;
    referralsNeeded: number;
  };
}

export interface ReferralStatsResponse {
  totalReferrals: number;
  activeReferrals: number;
  totalTipsGenerated: number;
  totalCommissionEarned: number;
  commissionThisMonth: number;
}

export interface FollowedCreatorResponse {
  creatorUsername: string;
  creatorDisplayName: string;
  creatorInitials: string;
  creatorAvatarUrl: string | null;
  totalContributed: number;
  projectsSupported: number;
  followedAt: string;
}

export interface GiftHistoryResponse {
  id: string;
  supporterUsername: string;
  creatorUsername: string;
  itemTitle: string;
  amount: number;
  status: "PENDING" | "COMPLETED" | "FAILED" | "REFUNDED";
  createdAt: string;
}

export interface SearchResultResponse {
  creators: SearchUserItem[];
  supporters: SearchUserItem[];
}

export interface SearchUserItem {
  username: string;
  displayName: string;
  avatarUrl: string | null;
  userType: "CREATOR" | "SUPPORTER";
  totalAmount: number;
}

// ─── Core fetch wrapper ────────────────────────────────────────────────────────

async function getAuthToken(): Promise<string | null> {
  const { data: { session } } = await supabase.auth.getSession();
  return session?.access_token ?? null;
}

async function apiFetch<T>(
  path: string,
  options: RequestInit = {},
  tokenOverride?: string | null,
): Promise<ApiResponse<T>> {
  const token = tokenOverride ?? await getAuthToken();
  const headers: Record<string, string> = {
    "Content-Type": "application/json",
    ...(options.headers as Record<string, string> ?? {}),
  };
  if (token) {
    headers["Authorization"] = `Bearer ${token}`;
  }

  const res = await fetch(`${API_BASE}${path}`, {
    ...options,
    headers,
    cache: "no-store" as RequestCache,
  });

  if (!res.ok) {
    const body = await res.json().catch(() => null);
    return {
      success: false,
      data: null,
      error: body?.error ?? { code: `HTTP_${res.status}`, message: res.statusText },
    };
  }

  const body = await res.json();
  // The backend wraps in ApiResponse<T>
  if (body && typeof body === "object" && "success" in body) {
    return body as ApiResponse<T>;
  }
  // Some endpoints return raw data (e.g., lists, maps)
  return { success: true, data: body as T, error: null };
}

// ─── Auth endpoints ───────────────────────────────────────────────────────────

export const authApi = {
  getMe: (token?: string) => apiFetch<UserProfileResponse>("/api/auth/me", {}, token),

  completeProfile: (req: CompleteProfileRequest) =>
    apiFetch<UserProfileResponse>("/api/auth/complete-profile", {
      method: "POST",
      body: JSON.stringify(req),
    }),
};

// ─── User endpoints ──────────────────────────────────────────────────────────

export const userApi = {
  getPublicProfile: (username: string) =>
    apiFetch<PublicUserResponse>(`/api/users/${username}`),

  updateProfile: (username: string, body: { displayName?: string; bio?: string; avatarUrl?: string }) =>
    apiFetch<UserProfileResponse>(`/api/users/${username}`, {
      method: "PUT",
      body: JSON.stringify(body),
    }),

  updateSettings: (username: string, body: Partial<UserSettings>) =>
    apiFetch<UserProfileResponse>(`/api/users/${username}/settings`, {
      method: "PUT",
      body: JSON.stringify(body),
    }),

  getPlatforms: (username: string) =>
    apiFetch<ConnectedPlatform[]>(`/api/users/${username}/platforms`),

  connectPlatform: (username: string, body: { platform: PlatformType; handle: string; url: string }) =>
    apiFetch<ConnectedPlatform>(`/api/users/${username}/platforms`, {
      method: "POST",
      body: JSON.stringify(body),
    }),

  disconnectPlatform: (username: string, platform: PlatformType) =>
    apiFetch<void>(`/api/users/${username}/platforms/${platform}`, { method: "DELETE" }),
};

// ─── Project endpoints ──────────────────────────────────────────────────────

export const projectApi = {
  getMyProjects: () => apiFetch<ProjectResponse[]>("/api/projects"),

  getById: (id: string) => apiFetch<ProjectResponse>(`/api/projects/${id}`),

  getByCreator: (username: string) =>
    apiFetch<ProjectResponse[]>(`/api/projects/creator/${username}`),

  create: (body: CreateProjectRequest) =>
    apiFetch<ProjectResponse>("/api/projects", {
      method: "POST",
      body: JSON.stringify(body),
    }),

  update: (id: string, body: Partial<CreateProjectRequest>) =>
    apiFetch<ProjectResponse>(`/api/projects/${id}`, {
      method: "PUT",
      body: JSON.stringify(body),
    }),

  delete: (id: string) =>
    apiFetch<void>(`/api/projects/${id}`, { method: "DELETE" }),

  addItem: (projectId: string, body: CreateProjectItemRequest) =>
    apiFetch<ProjectItemResponse>(`/api/projects/${projectId}/items`, {
      method: "POST",
      body: JSON.stringify(body),
    }),

  updateItem: (projectId: string, itemId: string, body: Partial<CreateProjectItemRequest>) =>
    apiFetch<ProjectItemResponse>(`/api/projects/${projectId}/items/${itemId}`, {
      method: "PUT",
      body: JSON.stringify(body),
    }),

  deleteItem: (projectId: string, itemId: string) =>
    apiFetch<void>(`/api/projects/${projectId}/items/${itemId}`, { method: "DELETE" }),
};

// ─── Gift endpoints ──────────────────────────────────────────────────────────

export const giftApi = {
  create: (body: { projectId: string; amount: number; message?: string }) =>
    apiFetch<{ giftId: string; clientSecret: string; amount: number; creatorUsername: string; projectName: string }>(
      "/api/gifts",
      { method: "POST", body: JSON.stringify(body) }
    ),

  getRecentSupporters: (username: string, limit = 10) =>
    apiFetch<RecentSupporterResponse[]>(`/api/gifts/creator/${username}/recent?limit=${limit}`),

  getTopSupporters: (username: string, limit = 10) =>
    apiFetch<TopSupporterResponse[]>(`/api/gifts/creator/${username}/top?limit=${limit}`),

  getMyHistory: (page = 0, size = 20) =>
    apiFetch<PagedResponse<GiftHistoryResponse>>(`/api/gifts/my/history?page=${page}&size=${size}`),
};

// ─── Follow endpoints ────────────────────────────────────────────────────────

export const followApi = {
  follow: (creatorUsername: string) =>
    apiFetch<{ followed: boolean }>(`/api/follows/${creatorUsername}`, { method: "POST" }),

  unfollow: (creatorUsername: string) =>
    apiFetch<{ followed: boolean }>(`/api/follows/${creatorUsername}`, { method: "DELETE" }),

  getFollowing: () => apiFetch<FollowedCreatorResponse[]>("/api/follows/following"),

  getFollowerCount: (username: string) =>
    apiFetch<{ count: number }>(`/api/follows/creator/${username}/count`),
};

// ─── Leaderboard endpoints ───────────────────────────────────────────────────

export const leaderboardApi = {
  getTopCreators: (limit = 10) =>
    apiFetch<LeaderboardEntryResponse[]>(`/api/leaderboard/creators?limit=${limit}`),

  getTopSupporters: (limit = 10) =>
    apiFetch<LeaderboardEntryResponse[]>(`/api/leaderboard/supporters?limit=${limit}`),
};

// ─── Analytics endpoints ─────────────────────────────────────────────────────

export const analyticsApi = {
  get: (period: "month" | "year" | "all-time" = "month") =>
    apiFetch<AnalyticsResponse>(`/api/analytics?period=${period}`),
};

// ─── Referral endpoints ──────────────────────────────────────────────────────

export const referralApi = {
  getMyReferrals: () => apiFetch<ReferralResponse[]>("/api/referrals"),

  getLink: () => apiFetch<ReferralLinkResponse>("/api/referrals/link"),

  getStats: () => apiFetch<ReferralStatsResponse>("/api/referrals/stats"),

  track: (referralCode: string) =>
    apiFetch<void>("/api/referrals/track", {
      method: "POST",
      body: JSON.stringify({ referralCode }),
    }),
};

// ─── Search endpoints ────────────────────────────────────────────────────────

export const searchApi = {
  search: (query: string, type?: "creator" | "supporter") =>
    apiFetch<SearchResultResponse>(`/api/search?q=${encodeURIComponent(query)}${type ? `&type=${type}` : ""}`),
};

// ─── Stripe endpoints ────────────────────────────────────────────────────────

export const stripeApi = {
  startOnboarding: () =>
    apiFetch<{ onboardingUrl: string; stripeAccountId: string }>("/api/stripe/connect/onboard", { method: "POST" }),

  getConnectStatus: () =>
    apiFetch<{ connected: boolean; chargesEnabled: boolean; payoutsEnabled: boolean; stripeAccountId: string | null }>(
      "/api/stripe/connect/status"
    ),
};
