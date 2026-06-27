// ─── API Client ────────────────────────────────────────────────────────────────
// Communicates with the rory-api backend. Uses the Supabase JWT for auth.

// Same-origin: every endpoint is now a Next.js API route backed by Prisma
// (the Java backend has been fully migrated in). Empty base = relative fetch.
const API_BASE = "";

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
  last: boolean;
  first: boolean;
}

export interface UserProfileResponse {
  id: string;
  username: string;
  email: string;
  displayName: string;
  bio: string;
  avatarUrl: string | null;
  userType: "CREATOR" | "SUPPORTER" | "MODERATOR";
  creditBalance: number;
  stripeOnboardingComplete: boolean;
  referralCode: string | null;
  communities: string[];
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
  communities: string[];
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
  communities?: string[];
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
  pinned: boolean;
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
  pinned?: boolean;
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
    netRevenue: number[];
    supporters: number[];
    gifts: number[];
    avgContribution: number[];
    netAvgContribution: number[];
  };
  stats: {
    totalRevenue: number;
    netRevenue: number;
    revenueChange: number;
    totalSupporters: number;
    supportersChange: number;
    totalGifts: number;
    giftsChange: number;
    avgContribution: number;
    netAvgContribution: number;
    avgContributionChange: number;
  };
  recentActivity: {
    supporterDisplayName: string;
    amount: number;
    itemTitle: string;
    timeAgo: string;
  }[];
  topProjects: {
    projectId: string;
    name: string;
    totalRevenue: number;
    netRevenue: number;
    supporterCount: number;
  }[];
}

export interface ReferralResponse {
  referredUsername: string;
  referredDisplayName: string;
  referredInitials: string;
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

// Cookie-based fetch for Next.js API routes (no Bearer token needed — session cookie handles auth)
async function nextFetch<T>(
  path: string,
  options: RequestInit = {},
): Promise<ApiResponse<T>> {
  const res = await fetch(path, {
    ...options,
    credentials: "include",
    headers: { "Content-Type": "application/json", ...(options.headers as Record<string, string> ?? {}) },
  });
  if (!res.ok) {
    const body = await res.json().catch(() => null);
    return { success: false, data: null, error: body?.error ?? { code: `HTTP_${res.status}`, message: res.statusText } };
  }
  return res.json();
}

async function getAuthToken(): Promise<string | null> {
  return null;
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
    credentials: "include",
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
  getMe: (_tokenOverride?: string) =>
    nextFetch<UserProfileResponse>("/api/users/me"),
  completeProfile: (data: CompleteProfileRequest) =>
    nextFetch<UserProfileResponse>(`/api/users/${data.username}/complete-profile`, {
      method: "POST",
      body: JSON.stringify(data),
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

  updateCommunities: (username: string, communities: string[]) =>
    apiFetch<UserProfileResponse>(`/api/users/${username}/communities`, {
      method: "PUT",
      body: JSON.stringify(communities),
    }),
};

// ─── Platform OAuth endpoints ────────────────────────────────────────────────

export const platformApi = {
  getYouTubeAuthUrl: () =>
    apiFetch<{ url: string }>("/api/platforms/youtube/auth"),

  getTwitchAuthUrl: () =>
    apiFetch<{ url: string }>("/api/platforms/twitch/auth"),
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

  setItemPinned: (projectId: string, itemId: string, pinned: boolean) =>
    apiFetch<ProjectItemResponse>(`/api/projects/${projectId}/items/${itemId}`, {
      method: "PUT",
      body: JSON.stringify({ pinned }),
    }),

  deleteItem: (projectId: string, itemId: string) =>
    apiFetch<void>(`/api/projects/${projectId}/items/${itemId}`, { method: "DELETE" }),
};

// ─── Gift endpoints ──────────────────────────────────────────────────────────

export const giftApi = {
  create: (body: { projectId: string; itemId?: string; amount: number; message?: string }) =>
    apiFetch<{ giftId: string; clientSecret: string; amount: number; creatorUsername: string; projectName: string }>(
      "/api/gifts",
      { method: "POST", body: JSON.stringify(body) }
    ),

  getRecentSupporters: (username: string, limit = 10) =>
    apiFetch<RecentSupporterResponse[]>(`/api/gifts/creator/${username}/recent?limit=${limit}`),

  getRecentSupportersByItem: (itemId: string, limit = 10) =>
    apiFetch<RecentSupporterResponse[]>(`/api/gifts/item/${itemId}/recent?limit=${limit}`),

  getTopSupporters: (username: string, limit = 10, period?: "week") =>
    apiFetch<TopSupporterResponse[]>(
      `/api/gifts/creator/${username}/top?limit=${limit}${period ? `&period=${period}` : ""}`,
    ),

  getMyHistory: (page = 0, size = 20) =>
    apiFetch<PagedResponse<GiftHistoryResponse>>(`/api/gifts/my/history?page=${page}&size=${size}`),
};

// ─── Follow endpoints ────────────────────────────────────────────────────────

export const followApi = {
  follow: (username: string) =>
    nextFetch<null>(`/api/follows/${username}`, { method: "POST" }),
  unfollow: (username: string) =>
    nextFetch<null>(`/api/follows/${username}`, { method: "DELETE" }),
  getFollowing: () =>
    nextFetch<FollowedCreatorResponse[]>("/api/follows/following"),
  getFollowerCount: (username: string) =>
    nextFetch<{ count: number }>(`/api/follows/${username}/count`),
  getFollowStatus: (username: string) =>
    nextFetch<{ following: boolean }>(`/api/follows/${username}/status`),
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
  get: (period: "week" | "month" | "year" = "month") =>
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

// ─── Feed / Post types ──────────────────────────────────────────────────────

export interface FeedPostResponse {
  id: string;
  authorUsername: string;
  authorDisplayName: string;
  authorAvatarUrl: string | null;
  platform: "YOUTUBE" | "TWITCH" | "TWITTER" | "INSTAGRAM" | "TIKTOK";
  platformUrl: string | null;
  contentType: "IMAGE" | "VIDEO" | "TEXT" | "REEL" | "STREAM" | "SHORT";
  caption: string | null;
  imageUrl: string | null;
  videoUrl: string | null;
  thumbnailUrl: string | null;
  platformLikes: number;
  platformComments: number;
  platformViews: number;
  likeCount: number;
  commentCount: number;
  likedByMe: boolean;
  linkedProject: {
    projectId: string;
    projectName: string;
    itemTitle: string | null;
    goalAmount: number;
    raisedAmount: number;
    progress: number;
  } | null;
  platformCreatedAt: string | null;
  createdAt: string;
}

export interface FeedCreatorStory {
  username: string;
  displayName: string;
  avatarUrl: string | null;
  hasNewPosts: boolean;
  platforms: string[];
}

// ─── Feed endpoints ─────────────────────────────────────────────────────────

export const feedApi = {
  getFeed: (page = 0, size = 20) =>
    apiFetch<PagedResponse<FeedPostResponse>>(`/api/feed?page=${page}&size=${size}`),

  getFollowingFeed: (page = 0, size = 20) =>
    apiFetch<PagedResponse<FeedPostResponse>>(`/api/feed/following?page=${page}&size=${size}`),

  getTrendingFeed: (page = 0, size = 20) =>
    apiFetch<PagedResponse<FeedPostResponse>>(`/api/feed/trending?page=${page}&size=${size}`),

  getCreatorPosts: (username: string, page = 0, size = 20) =>
    apiFetch<PagedResponse<FeedPostResponse>>(`/api/feed/creator/${username}?page=${page}&size=${size}`),

  getStoryCreators: () =>
    apiFetch<FeedCreatorStory[]>("/api/feed/stories"),

  toggleLike: (postId: string) =>
    apiFetch<{ liked: boolean }>(`/api/feed/${postId}/like`, { method: "POST" }),

  // ─── Post sync & management ────────────────────────────────────────────────

  syncPosts: () =>
    apiFetch<SyncResultResponse>("/api/feed/posts/sync", { method: "POST" }),

  previewUrl: (url: string) =>
    apiFetch<PostMetadataPreview>("/api/feed/posts/preview", {
      method: "POST",
      body: JSON.stringify({ url }),
    }),

  createPost: (body: { url: string; linkedProjectId?: string }) =>
    apiFetch<FeedPostResponse>("/api/feed/posts", {
      method: "POST",
      body: JSON.stringify(body),
    }),

  linkPostToProject: (postId: string, projectId: string | null) =>
    apiFetch<FeedPostResponse>(`/api/feed/posts/${postId}/link-project`, {
      method: "PUT",
      body: JSON.stringify({ projectId: projectId ?? "" }),
    }),

  getMyPosts: (page = 0, size = 50) =>
    apiFetch<PagedResponse<FeedPostResponse>>(`/api/feed/posts/my?page=${page}&size=${size}`),

  getPostsByProject: (projectId: string) =>
    apiFetch<FeedPostResponse[]>(`/api/feed/posts/project/${projectId}`),

  getMyUnlinkedPosts: () =>
    apiFetch<FeedPostResponse[]>("/api/feed/posts/my/unlinked"),
};

// ─── Post sync types ─────────────────────────────────────────────────────────

export interface SyncResultResponse {
  newPosts: number;
  skipped: number;
  errors: string[];
}

export interface PostMetadataPreview {
  platform: string;
  platformPostId: string;
  platformUrl: string;
  title: string | null;
  thumbnailUrl: string | null;
  contentType: string;
}

// ─── Activity feed types & endpoints ─────────────────────────────────────────

export interface ActivityItemResponse {
  id: string;
  type: "POST" | "GIFT" | "PROJECT_CREATED" | "ITEM_GIFTED";
  timestamp: string;
  title: string | null;
  description: string | null;
  thumbnailUrl: string | null;
  post: {
    platform: string;
    platformUrl: string | null;
    contentType: string;
    caption: string | null;
    imageUrl: string | null;
    platformViews: number;
    platformLikes: number;
    linkedProject: { projectId: string; projectName: string; progress: number } | null;
  } | null;
  gift: {
    supporterUsername: string;
    supporterDisplayName: string;
    amount: number;
    projectName: string | null;
    message: string | null;
  } | null;
  project: {
    projectId: string;
    projectName: string;
    itemTitle: string | null;
    goalAmount: number;
    raisedAmount: number;
  } | null;
}

export const activityApi = {
  getCreatorActivity: (username: string, page = 0, size = 20) =>
    apiFetch<ActivityItemResponse[]>(
      `/api/activity/creator/${username}?page=${page}&size=${size}`
    ),
};

// ─── Recommendation types & endpoints ────────────────────────────────────────

export interface RecommendedCreatorResponse {
  username: string;
  displayName: string;
  initials: string;
  avatarUrl: string | null;
  bio: string | null;
  followerCount: number;
  reason: string;
  reasonType: "FOLLOW_GRAPH" | "COMMUNITY" | "TIPPING_ACTIVITY" | "COLLABORATIVE" | "TRENDING";
  score: number;
}

export const recommendationApi = {
  getRecommendations: (limit = 10) =>
    apiFetch<RecommendedCreatorResponse[]>(`/api/recommendations?limit=${limit}`),

  dismiss: (username: string) =>
    apiFetch<void>(`/api/recommendations/dismiss/${username}`, { method: "POST" }),
};

// ─── Search endpoints ────────────────────────────────────────────────────────

export const searchApi = {
  search: (query: string, type?: "creator" | "supporter") =>
    apiFetch<SearchResultResponse>(`/api/search?q=${encodeURIComponent(query)}${type ? `&type=${type}` : ""}`),
};

// ─── Gamification endpoints ─────────────────────────────────────────────────

export interface GamificationStateResponse {
  xp: number;
  level: number;
  streakDays: number;
  lastActivityDate: string | null;
  leagueTier: string;
  weeklyGifted: number;
  badges: string[];
  questsCompletedToday: string[];
}

export interface DailyQuestResponse {
  id: string;
  difficulty: "easy" | "medium" | "hard";
  label: string;
  xpReward: number;
  completed: boolean;
  locked: boolean;
}

export interface WeeklyLeaderboardEntry {
  rank: number;
  username: string;
  displayName: string;
  amount: number;
  isCurrentUser: boolean;
}

export const gamificationApi = {
  getState: () =>
    apiFetch<GamificationStateResponse>("/api/gamification/state"),

  getDailyQuests: () =>
    apiFetch<DailyQuestResponse[]>("/api/gamification/quests"),

  getWeeklyLeaderboard: (limit = 5) =>
    apiFetch<WeeklyLeaderboardEntry[]>(`/api/gamification/weekly-leaderboard?limit=${limit}`),
};

// ─── Wallet endpoints ───────────────────────────────────────────────────────

export interface DepositResponse {
  depositId: string;
  checkoutUrl: string;
  amount: number;
}

export interface WalletSummaryResponse {
  creditBalance: number;
  totalDeposited: number;
  totalSpent: number;
  totalReceived: number;
  giftsSentCount: number;
}

export interface TransactionResponse {
  id: string;
  type: "DEPOSIT" | "GIFT_SENT" | "GIFT_RECEIVED" | "REFUND";
  amount: number;
  balanceAfter: number;
  referenceId: string | null;
  stripePaymentIntentId: string | null;
  description: string;
  createdAt: string;
}

export const walletApi = {
  createDeposit: (amount: number) =>
    apiFetch<DepositResponse>("/api/wallet/deposit", {
      method: "POST",
      body: JSON.stringify({ amount }),
    }),

  getSummary: () =>
    apiFetch<WalletSummaryResponse>("/api/wallet/summary"),

  getTransactions: (type?: string, page = 0, size = 20) =>
    apiFetch<PagedResponse<TransactionResponse>>(
      `/api/wallet/transactions?page=${page}&size=${size}${type ? `&type=${type}` : ""}`
    ),
};

// ─── Event types & endpoints ────────────────────────────────────────────────

export interface EventResponse {
  id: string;
  title: string;
  description: string | null;
  eventDate: string;
  eventTime: string | null;
  location: string | null;
  imageUrl: string | null;
  isPublic: boolean;
  createdAt: string;
}

export interface CreateEventRequest {
  title: string;
  description?: string;
  eventDate: string;
  eventTime?: string;
  location?: string;
  imageUrl?: string;
  isPublic?: boolean;
}

export const eventApi = {
  getMyEvents: () => apiFetch<EventResponse[]>("/api/events"),

  getById: (id: string) => apiFetch<EventResponse>(`/api/events/${id}`),

  getByCreator: (username: string) =>
    apiFetch<EventResponse[]>(`/api/events/creator/${username}`),

  create: (body: CreateEventRequest) =>
    apiFetch<EventResponse>("/api/events", {
      method: "POST",
      body: JSON.stringify(body),
    }),

  update: (id: string, body: Partial<CreateEventRequest>) =>
    apiFetch<EventResponse>(`/api/events/${id}`, {
      method: "PUT",
      body: JSON.stringify(body),
    }),

  delete: (id: string) =>
    apiFetch<void>(`/api/events/${id}`, { method: "DELETE" }),
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

// ─── Founder Suggestions (temporary internal tool) ───────────────────────────

export interface FounderSuggestion {
  id: string;
  author: string;
  comment: string;
  pageUrl: string;
  screenshot: string | null;
  archived: boolean;
  createdAt: string;
}

export const founderSuggestionsApi = {
  list: (archived = false) =>
    nextFetch<FounderSuggestion[]>(`/api/founder-suggestions${archived ? "?archived=true" : ""}`),
  create: (body: { author: string; comment: string; pageUrl: string; screenshot?: string | null }) =>
    nextFetch<FounderSuggestion>("/api/founder-suggestions", {
      method: "POST",
      body: JSON.stringify(body),
    }),
  setArchived: (id: string, archived: boolean) =>
    nextFetch<null>(`/api/founder-suggestions/${id}`, {
      method: "PATCH",
      body: JSON.stringify({ archived }),
    }),
  remove: (id: string) =>
    nextFetch<null>(`/api/founder-suggestions/${id}`, { method: "DELETE" }),
};
