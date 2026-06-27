import { motion, AnimatePresence } from "motion/react";
import { SectionLabel } from "./shared/SectionLabel";
import { useState, useEffect } from "react";
import { useNavigate } from "react-router-dom";
import {
  User, Check, Zap, X, DollarSign, ArrowUp, Twitter, Youtube, Twitch,
  Play, Eye, Heart, MessageCircle, ChevronRight, List, ExternalLink,
  Edit2, Settings, LogIn, Loader2, Target, Calendar, Clock, MapPin, Pin,
} from "lucide-react";
import { useAuth } from "../../contexts/AuthContext";
import { userApi, projectApi, followApi, giftApi, eventApi, feedApi } from "../../lib/api";
import type { PublicUserResponse, ProjectResponse, EventResponse, FeedPostResponse } from "../../lib/api";
import ActivityFeed from "./ActivityFeed";
import { ImageWithFallback } from "./figma/ImageWithFallback";
import { EmptyState } from "./shared/EmptyState";

// ─── Types ────────────────────────────────────────────────────────────────────

interface ProjectItem { id: string; title: string; description?: string; goalAmount?: number; raisedAmount?: number; status?: string; thumbnail?: string; pinned?: boolean }
interface CreatorProject { id: string; name: string; description?: string; coverImage?: string; items: ProjectItem[] }
interface ConnectedPlatform {
  platform: "youtube" | "twitch" | "twitter" | "instagram" | "tiktok";
  url: string; handle?: string;
}

interface CreatorProfileProps {
  routeUsername?: string;
  creatorName?: string;
  rank?: number;
  description?: string;
  profileImage?: string;
  projects?: CreatorProject[];
  connectedPlatforms?: ConnectedPlatform[];
  onViewProject?: (projectId: string) => void;
}

// ─── Static config ────────────────────────────────────────────────────────────

const platformConfig = {
  youtube:   { icon: Youtube, color: "#FF0000", label: "YouTube" },
  twitch:    { icon: Twitch,  color: "#9146FF", label: "Twitch" },
  twitter:   { icon: Twitter, color: "#1d9bf0", label: "Twitter" },
  instagram: { icon: Heart,   color: "#E1306C", label: "Instagram" },
  tiktok:    { icon: Play,    color: "#00f2ea", label: "TikTok" },
};

const platformBrandIcons: Record<string, React.ReactNode> = {
  youtube: <svg viewBox="0 0 24 24" fill="currentColor" className="w-full h-full"><path d="M23.498 6.186a3.016 3.016 0 0 0-2.122-2.136C19.505 3.545 12 3.545 12 3.545s-7.505 0-9.377.505A3.017 3.017 0 0 0 .502 6.186C0 8.07 0 12 0 12s0 3.93.502 5.814a3.016 3.016 0 0 0 2.122 2.136c1.871.505 9.376.505 9.376.505s7.505 0 9.377-.505a3.015 3.015 0 0 0 2.122-2.136C24 15.93 24 12 24 12s0-3.93-.502-5.814zM9.545 15.568V8.432L15.818 12l-6.273 3.568z" /></svg>,
  twitch:   <svg viewBox="0 0 24 24" fill="currentColor" className="w-full h-full"><path d="M11.571 4.714h1.715v5.143H11.57zm4.715 0H18v5.143h-1.714zM6 0 1.714 4.286v15.428h5.143V24l4.286-4.286h3.428L22.286 12V0zm14.571 11.143-3.428 3.428h-3.429l-3 3v-3H6.857V1.714h13.714z" /></svg>,
  twitter:  <svg viewBox="0 0 24 24" fill="currentColor" className="w-full h-full"><path d="M18.244 2.25h3.308l-7.227 8.26 8.502 11.24H16.17l-5.214-6.817L4.99 21.75H1.68l7.73-8.835L1.254 2.25H8.08l4.713 6.231zm-1.161 17.52h1.833L7.084 4.126H5.117z" /></svg>,
  instagram:<svg viewBox="0 0 24 24" fill="currentColor" className="w-full h-full"><path d="M12 2.163c3.204 0 3.584.012 4.85.07 3.252.148 4.771 1.691 4.919 4.919.058 1.265.069 1.645.069 4.849 0 3.205-.012 3.584-.069 4.849-.149 3.225-1.664 4.771-4.919 4.919-1.266.058-1.644.07-4.85.07-3.204 0-3.584-.012-4.849-.07-3.26-.149-4.771-1.699-4.919-4.92-.058-1.265-.07-1.644-.07-4.849 0-3.204.013-3.583.07-4.849.149-3.227 1.664-4.771 4.919-4.919 1.266-.057 1.645-.069 4.849-.069zM12 0C8.741 0 8.333.014 7.053.072 2.695.272.273 2.69.073 7.052.014 8.333 0 8.741 0 12c0 3.259.014 3.668.072 4.948.2 4.358 2.618 6.78 6.98 6.98C8.333 23.986 8.741 24 12 24c3.259 0 3.668-.014 4.948-.072 4.354-.2 6.782-2.618 6.979-6.98.059-1.28.073-1.689.073-4.948 0-3.259-.014-3.667-.072-4.947-.196-4.354-2.617-6.78-6.979-6.98C15.668.014 15.259 0 12 0zm0 5.838a6.162 6.162 0 1 0 0 12.324 6.162 6.162 0 0 0 0-12.324zM12 16a4 4 0 1 1 0-8 4 4 0 0 1 0 8zm6.406-11.845a1.44 1.44 0 1 0 0 2.881 1.44 1.44 0 0 0 0-2.881z" /></svg>,
  tiktok:   <svg viewBox="0 0 24 24" fill="currentColor" className="w-full h-full"><path d="M12.525.02c1.31-.02 2.61-.01 3.91-.02.08 1.53.63 3.09 1.75 4.17 1.12 1.11 2.7 1.62 4.24 1.79v4.03c-1.44-.05-2.89-.35-4.2-.97-.57-.26-1.1-.59-1.62-.93-.01 2.92.01 5.84-.02 8.75-.08 1.4-.54 2.79-1.35 3.94-1.31 1.92-3.58 3.17-5.91 3.21-1.43.08-2.86-.31-4.08-1.03-2.02-1.19-3.44-3.37-3.65-5.71-.02-.5-.03-1-.01-1.49.18-1.9 1.12-3.72 2.58-4.96 1.66-1.44 3.98-2.13 6.15-1.72.02 1.48-.04 2.96-.04 4.44-.99-.32-2.15-.23-3.02.37-.63.41-1.11 1.04-1.36 1.75-.21.51-.15 1.07-.14 1.61.24 1.64 1.82 3.02 3.5 2.87 1.12-.01 2.19-.66 2.77-1.61.19-.33.4-.67.41-1.06.1-1.79.06-3.57.07-5.36.01-4.03-.01-8.05.02-12.07z" /></svg>,
};

// ─── Helpers ─────────────────────────────────────────────────────────────────

function formatNumber(n: number): string {
  if (n >= 1_000_000) return (n / 1_000_000).toFixed(1) + "M";
  if (n >= 1_000) return (n / 1_000).toFixed(1) + "K";
  return n.toString();
}

function timeAgo(timestamp: string): string {
  const diff = Date.now() - new Date(timestamp).getTime();
  const minutes = Math.floor(diff / 60000);
  if (minutes < 1) return "Just now";
  if (minutes < 60) return `${minutes}m ago`;
  const hours = Math.floor(minutes / 60);
  if (hours < 24) return `${hours}h ago`;
  const days = Math.floor(hours / 24);
  if (days < 7) return `${days}d ago`;
  const weeks = Math.floor(days / 7);
  if (weeks < 4) return `${weeks}w ago`;
  return new Date(timestamp).toLocaleDateString("en-US", { month: "short", day: "numeric" });
}

// ─── Component ────────────────────────────────────────────────────────────────

export default function CreatorProfile({
  routeUsername = "",
  creatorName: propCreatorName,
  rank: propRank,
  description: propDescription,
  profileImage,
  projects: propProjects,
  connectedPlatforms: propConnectedPlatforms,
  onViewProject,
}: CreatorProfileProps) {
  const navigate = useNavigate();
  const { user, isAuthenticated, refreshUser } = useAuth();

  // Dynamic state loaded from API
  const [profileLoading, setProfileLoading] = useState(true);
  const [creatorName, setCreatorName] = useState(propCreatorName ?? "");
  const [rank, setRank] = useState(propRank ?? 0);
  const [description, setDescription] = useState(propDescription ?? "");
  const [projects, setProjects] = useState<CreatorProject[]>(propProjects ?? []);
  const [connectedPlatforms, setConnectedPlatforms] = useState<ConnectedPlatform[]>(propConnectedPlatforms ?? []);
  const [creatorEvents, setCreatorEvents] = useState<EventResponse[]>([]);
  const [followerCount, setFollowerCount] = useState(0);
  const [isFollowing, setIsFollowing] = useState(false);
  const [feedPosts, setFeedPosts] = useState<FeedPostResponse[]>([]);
  const [feedPostsPage, setFeedPostsPage] = useState(0);
  const [feedPostsHasMore, setFeedPostsHasMore] = useState(false);
  const [feedPostsLoading, setFeedPostsLoading] = useState(false);

  useEffect(() => {
    if (!routeUsername) { setProfileLoading(false); return; }

    async function loadProfile() {
      setProfileLoading(true);
      const [profileRes, projectRes, followCountRes, eventRes, postsRes] = await Promise.all([
        userApi.getPublicProfile(routeUsername),
        projectApi.getByCreator(routeUsername),
        followApi.getFollowerCount(routeUsername),
        eventApi.getByCreator(routeUsername),
        feedApi.getCreatorPosts(routeUsername, 0, 20),
      ]);

      if (profileRes.success && profileRes.data) {
        const p = profileRes.data as PublicUserResponse;
        setCreatorName(p.displayName);
        setRank(p.rank ?? 0);
        setDescription(p.bio);
        setConnectedPlatforms(
          p.connectedPlatforms.map(cp => ({
            platform: cp.platform.toLowerCase() as ConnectedPlatform["platform"],
            url: cp.url,
            handle: cp.handle,
          }))
        );
      }

      if (projectRes.success && projectRes.data) {
        setProjects(
          projectRes.data.map((w: ProjectResponse) => ({
            id: w.id,
            name: w.name,
            description: w.description,
            coverImage: w.coverImageUrl ?? undefined,
            items: w.items.map(item => ({
              id: item.id,
              title: item.title,
              description: item.description ?? undefined,
              goalAmount: item.goalAmount,
              raisedAmount: item.raisedAmount,
              status: item.status,
              thumbnail: item.thumbnailUrl ?? undefined,
              pinned: item.pinned,
            })),
          }))
        );
      }

      if (followCountRes.success && followCountRes.data) {
        setFollowerCount((followCountRes.data as { count: number }).count);
      }

      if (eventRes.success && eventRes.data) {
        setCreatorEvents(eventRes.data);
      }

      if (postsRes.success && postsRes.data) {
        setFeedPosts(postsRes.data.content);
        setFeedPostsPage(0);
        setFeedPostsHasMore(!postsRes.data.last);
      }

      if (isAuthenticated) {
        const statusRes = await followApi.getFollowStatus(routeUsername);
        if (statusRes.success && statusRes.data) {
          setIsFollowing((statusRes.data as { following: boolean }).following);
        }
      }

      setProfileLoading(false);
    }
    loadProfile();
  }, [routeUsername, isAuthenticated]);

  // Auth-derived view modes
  const isOwnProfile = isAuthenticated && !!user && user.username.toLowerCase() === routeUsername.toLowerCase();
  const isGuest = !isAuthenticated;

  async function handleFollow() {
    if (!isAuthenticated) { navigate("/login"); return; }
    if (isFollowing) {
      await followApi.unfollow(routeUsername);
      setIsFollowing(false);
      setFollowerCount(c => c - 1);
    } else {
      await followApi.follow(routeUsername);
      setIsFollowing(true);
      setFollowerCount(c => c + 1);
    }
  }

  // Feed filter state
  const [feedTab, setFeedTab] = useState<"posts" | "activity">("posts");
  const [feedFilter, setFeedFilter] = useState<string>("all");
  const filteredFeed = feedFilter === "all" ? feedPosts : feedPosts.filter((p) => p.platform.toLowerCase() === feedFilter);

  // Quick Tip modal state
  const [showQuickTip, setShowQuickTip] = useState(false);
  const [selectedProjectId, setSelectedProjectId] = useState<string | null>(null);
  const [selectedTipAmount, setSelectedTipAmount] = useState<number>(10);
  const [customTipAmount, setCustomTipAmount] = useState("");
  const [tipConfirmed, setTipConfirmed] = useState(false);
  const [tipLoading, setTipLoading] = useState(false);
  const [tipError, setTipError] = useState("");

  async function handleConfirmTip() {
    const amount = selectedTipAmount || (customTipAmount ? parseFloat(customTipAmount) : 0);
    if (!selectedProjectId || amount <= 0) return;
    setTipLoading(true);
    setTipError("");
    const res = await giftApi.create({ projectId: selectedProjectId, amount });
    setTipLoading(false);
    if (res.success) {
      setTipConfirmed(true);
      refreshUser();
      setTimeout(() => {
        setTipConfirmed(false);
        setShowQuickTip(false);
        setSelectedProjectId(null);
        setSelectedTipAmount(10);
        setCustomTipAmount("");
      }, 2000);
    } else {
      setTipError(res.error?.message ?? "Donation failed. Please try again.");
    }
  }

  function requireAuth(action: () => void) {
    if (isGuest) { navigate("/auth"); return; }
    action();
  }

  // ── Render ─────────────────────────────────────────────────────────────────
  return (
    <div className="min-h-screen bg-background text-foreground">

      {/* ── Own-profile edit banner ────────────────────────────────────────── */}
      <AnimatePresence>
        {isOwnProfile && (
          <motion.div
            initial={{ y: -40, opacity: 0 }}
            animate={{ y: 0, opacity: 1 }}
            exit={{ y: -40, opacity: 0 }}
            className="fixed top-[57px] left-0 right-0 z-40 bg-accent/90 backdrop-blur-sm border-b border-accent/60 px-6 py-2.5 flex items-center justify-between"
          >
            <div className="flex items-center gap-2 text-white">
              <Edit2 className="w-3.5 h-3.5" />
              <span className="text-xs font-black uppercase tracking-widest">This is your public profile</span>
            </div>
            <div className="flex items-center gap-3">
              <button
                onClick={() => navigate("/settings")}
                className="flex items-center gap-1.5 px-3 py-1.5 text-xs font-bold text-white border border-white/30 hover:bg-white/10 transition-colors"
              >
                <Settings className="w-3 h-3" />
                Edit in Settings
              </button>
            </div>
          </motion.div>
        )}
      </AnimatePresence>

      {/* ── Guest sign-in strip ────────────────────────────────────────────── */}
      <AnimatePresence>
        {isGuest && (
          <motion.div
            initial={{ y: -40, opacity: 0 }}
            animate={{ y: 0, opacity: 1 }}
            exit={{ y: -40, opacity: 0 }}
            className="fixed top-0 left-0 right-0 z-50 bg-nav border-b border-border px-6 py-3 flex items-center justify-between"
          >
            <div className="text-xl font-black text-white tracking-tight">Rory</div>
            <div className="flex items-center gap-4">
              <span className="text-sm text-white/50 hidden sm:block">Create a project. Get funded. Low fees.</span>
              <button
                onClick={() => navigate("/auth")}
                className="flex items-center gap-2 px-4 py-2 btn-cta text-white text-xs font-black uppercase tracking-widest"
              >
                <LogIn className="w-3.5 h-3.5" />
                Sign In
              </button>
            </div>
          </motion.div>
        )}
      </AnimatePresence>

      {/* ── Hero ───────────────────────────────────────────────────────────── */}
      <div className={`relative w-full ${isOwnProfile ? "pt-[96px]" : isGuest ? "pt-[49px]" : "pt-[57px]"}`}>
        <div className="relative w-full h-[420px] overflow-hidden">
          {profileImage ? (
            <ImageWithFallback src={profileImage} alt={creatorName} className="absolute inset-0 w-full h-full object-cover" />
          ) : (
            <div className="absolute inset-0 bg-gradient-to-br from-[#4a3060] via-[#5a3a6a] to-[#3a2848]" />
          )}
          <div className="absolute inset-0 bg-gradient-to-t from-black/80 via-black/30 to-transparent" />
          {!profileImage && (
            <div className="absolute inset-0 flex items-center justify-center">
              <User className="w-48 h-48 text-white/10" />
            </div>
          )}

          {/* Creator info overlay */}
          <div className="absolute bottom-0 left-0 right-0 p-8">
            <motion.div initial={{ opacity: 0, y: 20 }} animate={{ opacity: 1, y: 0 }} transition={{ duration: 0.5 }}>
              <div className="flex items-center gap-2 mb-2">
                <h1 className="text-4xl font-black text-white">{creatorName}</h1>
                <div className="w-5 h-5 bg-accent flex items-center justify-center">
                  <Check className="w-3 h-3 text-white" />
                </div>
              </div>
              <p className="text-success text-sm font-bold mb-3">Ranked #{rank} Globally</p>
              <p className="text-white/75 text-sm max-w-lg leading-relaxed mb-6">{description}</p>

              {/* Action buttons — change based on auth state */}
              <div className="flex items-center gap-3 flex-wrap">
                {isOwnProfile ? (
                  // Own profile: manage project CTA
                  <button
                    onClick={() => navigate("/dashboard")}
                    className="px-6 py-2.5 text-sm font-black btn-cta text-white uppercase tracking-wider flex items-center gap-2"
                  >
                    <List className="w-4 h-4" />
                    Manage Projects
                  </button>
                ) : isGuest ? (
                  // Guest: gated CTA
                  <button
                    onClick={() => navigate("/auth")}
                    className="px-6 py-2.5 text-sm font-black btn-success text-white transition-all uppercase tracking-wider flex items-center gap-2"
                  >
                    <LogIn className="w-4 h-4" />
                    Sign In to Support
                  </button>
                ) : (
                  // Authenticated visitor: full actions
                  <>
                    <button
                      onClick={() => requireAuth(() => setShowQuickTip(true))}
                      className="px-6 py-2.5 text-sm font-black btn-success text-white transition-all uppercase tracking-wider flex items-center gap-2"
                    >
                      <Zap className="w-4 h-4" />
                      Quick Tip
                    </button>
                    <button
                      onClick={handleFollow}
                      className={`px-5 py-2.5 text-sm font-black border-2 transition-all uppercase tracking-wider ${isFollowing ? "border-accent bg-accent text-white hover:bg-transparent hover:text-white hover:border-white" : "border-white bg-transparent text-white hover:bg-white hover:text-black"}`}
                    >
                      {isFollowing ? "Following" : "Follow"}
                    </button>
                  </>
                )}
              </div>

              {/* Connected platforms */}
              {connectedPlatforms.length > 0 && (
                <div className="flex items-center gap-2 mt-4 flex-wrap">
                  {connectedPlatforms.map((cp) => {
                    const config = platformConfig[cp.platform];
                    return (
                      <a
                        key={cp.platform}
                        href={cp.url}
                        target="_blank"
                        rel="noopener noreferrer"
                        className="flex items-center gap-2 px-3.5 py-2 text-white text-xs font-bold transition-all hover:scale-105 backdrop-blur-xl border border-white/20 rounded-lg shadow-lg"
                        style={{ backgroundColor: `${config.color}30` }}
                      >
                        <span className="w-4 h-4 flex items-center justify-center" style={{ color: config.color }}>
                          {platformBrandIcons[cp.platform]}
                        </span>
                        <span className="text-white/90">{cp.handle || config.label}</span>
                        <ExternalLink className="w-3 h-3 text-white/40" />
                      </a>
                    );
                  })}
                </div>
              )}
            </motion.div>
          </div>
        </div>
      </div>

      {/* ── Content ─────────────────────────────────────────────────────────── */}
      <div className="max-w-7xl mx-auto px-6 py-8 space-y-10">

        {/* Upcoming Events */}
        {creatorEvents.length > 0 && (
          <motion.section initial={{ opacity: 0, y: 20 }} animate={{ opacity: 1, y: 0 }} transition={{ duration: 0.5, delay: 0.1 }}>
            <h2 className="text-xs font-black uppercase tracking-widest text-subtle mb-4">Upcoming Events</h2>
            <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-4">
              {creatorEvents.map((event, i) => {
                const eventDate = new Date(event.eventDate + "T00:00:00");
                const isPast = eventDate < new Date(new Date().toDateString());
                return (
                  <motion.div
                    key={event.id}
                    initial={{ opacity: 0, y: 15 }}
                    animate={{ opacity: 1, y: 0 }}
                    transition={{ duration: 0.3, delay: i * 0.05 }}
                    className={`bg-background border border-border overflow-hidden group hover:border-accent/40 hover:shadow-md transition-all ${isPast ? "opacity-50" : ""}`}
                  >
                    <div className="relative w-full h-32 bg-muted flex items-center justify-center">
                      {event.imageUrl ? (
                        <ImageWithFallback src={event.imageUrl} alt={event.title} className="w-full h-full object-cover group-hover:scale-105 transition-transform" />
                      ) : (
                        <div className="w-full h-full bg-gradient-to-br from-accent/10 to-accent/5 flex items-center justify-center">
                          <Calendar className="w-10 h-10 text-accent/30" />
                        </div>
                      )}
                      {isPast && (
                        <div className="absolute top-2 right-2 px-2 py-0.5 bg-muted border border-border text-[10px] font-black uppercase tracking-wide text-subtle">
                          Past
                        </div>
                      )}
                    </div>
                    <div className="p-4">
                      <h3 className="text-sm font-bold text-foreground leading-tight mb-2 group-hover:text-accent transition-colors">{event.title}</h3>
                      <div className="space-y-1 text-xs text-muted-foreground">
                        <div className="flex items-center gap-1.5">
                          <Calendar className="w-3 h-3 text-accent" />
                          {eventDate.toLocaleDateString("en-US", { weekday: "short", month: "short", day: "numeric", year: "numeric" })}
                        </div>
                        {event.eventTime && (
                          <div className="flex items-center gap-1.5">
                            <Clock className="w-3 h-3 text-accent" />
                            {event.eventTime}
                          </div>
                        )}
                        {event.location && (
                          <div className="flex items-center gap-1.5">
                            <MapPin className="w-3 h-3 text-accent" />
                            {event.location}
                          </div>
                        )}
                      </div>
                      {event.description && (
                        <p className="text-xs text-subtle mt-2 line-clamp-2">{event.description}</p>
                      )}
                    </div>
                  </motion.div>
                );
              })}
            </div>
          </motion.section>
        )}

        {/* Feed */}
        <motion.section initial={{ opacity: 0, y: 20 }} animate={{ opacity: 1, y: 0 }} transition={{ duration: 0.5, delay: 0.15 }}>
          {/* Feed Tab Switcher */}
          <div className="flex items-center gap-4 mb-4">
            <button
              onClick={() => setFeedTab("posts")}
              className={`text-xs font-black uppercase tracking-widest transition-colors ${feedTab === "posts" ? "text-foreground" : "text-subtle hover:text-foreground"}`}
            >
              Posts
            </button>
            <button
              onClick={() => setFeedTab("activity")}
              className={`text-xs font-black uppercase tracking-widest transition-colors ${feedTab === "activity" ? "text-foreground" : "text-subtle hover:text-foreground"}`}
            >
              Activity
            </button>
            <div className="flex-1" />
          </div>

          {/* Activity Feed Tab */}
          {feedTab === "activity" && routeUsername && (
            <ActivityFeed username={routeUsername} />
          )}

          {/* Posts Tab - Platform filters */}
          {feedTab === "posts" && (
          <>
          {/* Platform filters */}
          <div className="flex gap-2 mb-5 overflow-x-auto pb-1">
            <button
              onClick={() => setFeedFilter("all")}
              className={`px-4 py-1.5 text-xs font-bold uppercase tracking-wider transition-colors flex-shrink-0 ${feedFilter === "all" ? "bg-foreground text-background" : "bg-muted text-subtle hover:text-foreground"}`}
            >
              All
            </button>
            {(Object.keys(platformConfig) as Array<keyof typeof platformConfig>).map((platform) => {
              const hasPosts = feedPosts.some(p => p.platform.toLowerCase() === platform);
              if (!hasPosts) return null;
              const config = platformConfig[platform];
              return (
                <button
                  key={platform}
                  onClick={() => setFeedFilter(platform)}
                  className={`px-4 py-1.5 text-xs font-bold uppercase tracking-wider transition-colors flex items-center gap-1.5 flex-shrink-0 ${feedFilter === platform ? "text-white" : "bg-muted text-subtle hover:text-foreground"}`}
                  style={feedFilter === platform ? { backgroundColor: config.color } : undefined}
                >
                  <span className="w-3.5 h-3.5 flex items-center justify-center">{platformBrandIcons[platform]}</span>
                  {config.label}
                </button>
              );
            })}
          </div>

          <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 xl:grid-cols-4 gap-4">
            {filteredFeed.map((post, i) => {
              const platformKey = post.platform.toLowerCase() as keyof typeof platformConfig;
              const config = platformConfig[platformKey];
              return (
                <motion.div
                  key={post.id}
                  initial={{ opacity: 0, y: 15 }}
                  animate={{ opacity: 1, y: 0 }}
                  transition={{ duration: 0.3, delay: i * 0.04 }}
                  className="bg-background border border-border rounded-xl overflow-hidden group cursor-pointer hover:border-accent/40 hover:shadow-md transition-all"
                  onClick={() => post.platformUrl && window.open(post.platformUrl, "_blank")}
                >
                  <div className="relative w-full h-36 bg-muted flex items-center justify-center overflow-hidden">
                    {post.thumbnailUrl ? (
                      <ImageWithFallback src={post.thumbnailUrl} alt={post.caption || ""} className="w-full h-full object-cover group-hover:scale-105 transition-transform" />
                    ) : (
                      <div className="w-full h-full bg-gradient-to-br from-muted to-secondary flex items-center justify-center">
                        {config && <span className="w-10 h-10 opacity-40" style={{ color: config.color }}>{platformBrandIcons[platformKey]}</span>}
                      </div>
                    )}
                    <div className="absolute top-2 left-2 flex items-center gap-1.5 px-2 py-1 bg-black/60 backdrop-blur-sm rounded-sm">
                      {config && <span className="w-3 h-3 flex items-center justify-center text-white">{platformBrandIcons[platformKey]}</span>}
                      <span className="text-white text-[9px] font-bold uppercase tracking-wide">{config?.label || post.platform}</span>
                    </div>
                    <div className="absolute bottom-2 right-2 px-2 py-0.5 bg-black/60 text-white text-[9px] font-bold uppercase rounded-sm">{post.contentType}</div>
                  </div>
                  <div className="p-3">
                    <h3 className="text-sm font-bold text-foreground leading-tight line-clamp-2 mb-2 group-hover:text-accent transition-colors">{post.caption || "Untitled"}</h3>
                    <div className="flex items-center justify-between">
                      <span className="text-[11px] text-subtle">{post.platformCreatedAt ? timeAgo(post.platformCreatedAt) : timeAgo(post.createdAt)}</span>
                      <div className="flex items-center gap-3 text-subtle text-[11px]">
                        {post.platformViews > 0 && <span className="flex items-center gap-1"><Eye className="w-3 h-3" /> {formatNumber(post.platformViews)}</span>}
                        {post.platformLikes > 0 && <span className="flex items-center gap-1"><Heart className="w-3 h-3" /> {formatNumber(post.platformLikes)}</span>}
                        {post.platformComments > 0 && <span className="flex items-center gap-1"><MessageCircle className="w-3 h-3" /> {formatNumber(post.platformComments)}</span>}
                      </div>
                    </div>
                    {post.linkedProject && (
                      <div className="mt-2 flex items-center gap-1.5 text-[10px] font-bold text-accent">
                        <Target className="w-3 h-3" />
                        {post.linkedProject.projectName}
                        <span className="text-subtle ml-1">{Math.round(post.linkedProject.progress * 100)}% funded</span>
                      </div>
                    )}
                  </div>
                </motion.div>
              );
            })}
          </div>
          {filteredFeed.length === 0 && (
            <EmptyState icon={MessageCircle} message="No posts yet" sub="Content from connected platforms will show here." />
          )}
          {feedPostsHasMore && feedFilter === "all" && (
            <div className="flex justify-center mt-4">
              <button
                onClick={async () => {
                  setFeedPostsLoading(true);
                  const res = await feedApi.getCreatorPosts(routeUsername, feedPostsPage + 1, 20);
                  if (res.success && res.data) {
                    setFeedPosts(prev => [...prev, ...res.data!.content]);
                    setFeedPostsPage(res.data.page);
                    setFeedPostsHasMore(!res.data.last);
                  }
                  setFeedPostsLoading(false);
                }}
                disabled={feedPostsLoading}
                className="px-6 py-2.5 text-xs font-bold uppercase tracking-wider text-subtle hover:text-foreground border border-border hover:border-accent/40 transition-colors flex items-center gap-2"
              >
                {feedPostsLoading ? <Loader2 className="w-3.5 h-3.5 animate-spin" /> : null}
                Load More
              </button>
            </div>
          )}
          </>
          )}
        </motion.section>

        {/* Projects */}
        {projects.map((project, wi) => (
          <motion.section
            key={project.id}
            initial={{ opacity: 0, y: 20 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ duration: 0.5, delay: 0.2 + wi * 0.05 }}
          >
            <div className="flex items-center justify-between mb-4">
              <div>
                <h2 className="text-xs font-black uppercase tracking-widest text-subtle mb-1">{project.name}</h2>
                <p className="text-[11px] text-subtle">{project.items.length} items{project.description ? ` · ${project.description}` : ""}</p>
              </div>
              <button
                onClick={() => onViewProject?.(project.id)}
                className="flex items-center gap-1.5 px-3 py-1.5 text-xs font-bold text-subtle hover:text-foreground border border-border hover:border-accent/40 transition-colors"
              >
                View All <ChevronRight className="w-3.5 h-3.5" />
              </button>
            </div>
            <div className="flex gap-4 overflow-x-auto pb-2">
              {project.items.map((item, ii) => (
                <div
                  key={item.id}
                  onClick={() => onViewProject?.(project.id)}
                  className="flex-shrink-0 w-44 bg-background border border-border overflow-hidden cursor-pointer group hover:border-accent/50 hover:shadow-md transition-all"
                >
                  <div className="relative w-full h-32 bg-muted flex items-center justify-center">
                    {item.thumbnail ? (
                      <ImageWithFallback src={item.thumbnail} alt={item.title} className="w-full h-full object-cover group-hover:scale-105 transition-transform" />
                    ) : (
                      <User className="w-10 h-10 text-subtle" />
                    )}
                    {item.pinned && (
                      <div className="absolute top-2 left-2 px-1.5 py-0.5 flex items-center gap-1 bg-accent text-white text-[9px] font-black uppercase tracking-widest">
                        <Pin className="w-2.5 h-2.5" />
                        Pinned
                      </div>
                    )}
                  </div>
                  <div className="p-3">
                    <h3 className="text-xs font-bold text-foreground leading-tight line-clamp-2 group-hover:text-accent transition-colors">{item.title}</h3>
                  </div>
                </div>
              ))}

              {/* Gift CTA card — only for visitors, gated behind auth for guests */}
              {!isOwnProfile && (
                <div
                  onClick={() => requireAuth(() => setShowQuickTip(true))}
                  className="flex-shrink-0 w-44 bg-muted border border-dashed border-border overflow-hidden cursor-pointer group hover:border-accent/50 transition-all flex flex-col items-center justify-center gap-2 h-[calc(32px+3rem+1.5rem)] min-h-[152px]"
                >
                  <div className="w-8 h-8 bg-accent/10 flex items-center justify-center">
                    <Zap className="w-4 h-4 text-accent" />
                  </div>
                  <p className="text-xs font-bold text-muted-foreground group-hover:text-accent transition-colors text-center px-3">
                    {isGuest ? "Sign in to gift" : "Send a gift"}
                  </p>
                </div>
              )}
            </div>
          </motion.section>
        ))}
      </div>

      {/* ── Guest bottom CTA ────────────────────────────────────────────────── */}
      {isGuest && (
        <div className="border-t border-border bg-muted py-16 px-6 text-center">
          <SectionLabel className="mb-4">Want to support {creatorName}?</SectionLabel>
          <h3 className="text-3xl font-black text-foreground mb-4 tracking-tight">Create a free account.</h3>
          <p className="text-muted-foreground mb-8 max-w-md mx-auto">Donate to their project. Low platform fees, always.</p>
          <button
            onClick={() => navigate("/auth")}
            className="px-8 py-3 btn-cta text-white font-black text-sm uppercase tracking-widest inline-flex items-center gap-2"
          >
            <LogIn className="w-4 h-4" />
            Join Rory
          </button>
        </div>
      )}

      {/* ── Footer (guest only — authenticated users have Navbar) ─────────── */}
      {isGuest && (
        <footer className="py-8 px-6 border-t border-border">
          <div className="max-w-7xl mx-auto text-center text-subtle text-sm">© 2026 Rory. All rights reserved.</div>
        </footer>
      )}

      {/* ── Quick Tip Modal ──────────────────────────────────────────────────── */}
      {showQuickTip && (
        <motion.div
          initial={{ opacity: 0 }}
          animate={{ opacity: 1 }}
          className="fixed inset-0 z-[100] flex items-center justify-center bg-black/60 backdrop-blur-sm p-4"
          onClick={() => setShowQuickTip(false)}
        >
          <motion.div
            initial={{ opacity: 0, scale: 0.95, y: 20 }}
            animate={{ opacity: 1, scale: 1, y: 0 }}
            transition={{ duration: 0.25 }}
            className="bg-background border border-border w-full max-w-md overflow-hidden"
            onClick={(e) => e.stopPropagation()}
          >
            {tipConfirmed ? (
              <div className="p-10 text-center">
                <motion.div initial={{ scale: 0 }} animate={{ scale: 1 }} transition={{ type: "spring", stiffness: 300, damping: 20 }} className="w-16 h-16 bg-success mx-auto mb-4 flex items-center justify-center">
                  <Check className="w-8 h-8 text-white" />
                </motion.div>
                <h3 className="text-lg font-black text-foreground mb-1">Tip Sent!</h3>
                <p className="text-subtle text-sm">Your contribution to {creatorName} has been recorded.</p>
              </div>
            ) : (
              <>
                <div className="flex items-center justify-between p-5 border-b border-border">
                  <div className="flex items-center gap-3">
                    <div className="w-8 h-8 bg-success flex items-center justify-center">
                      <Zap className="w-4 h-4 text-white" />
                    </div>
                    <div>
                      <h3 className="text-sm font-black text-foreground">Quick Tip</h3>
                      <p className="text-xs text-subtle">Support {creatorName}</p>
                    </div>
                  </div>
                  <button onClick={() => setShowQuickTip(false)} className="w-8 h-8 flex items-center justify-center text-subtle hover:text-foreground">
                    <X className="w-5 h-5" />
                  </button>
                </div>

                {/* Step 1: Select Project */}
                <div className="p-5 border-b border-border">
                  <SectionLabel>1. Choose a project</SectionLabel>
                  <div className="space-y-2 max-h-64 overflow-y-auto">
                    {projects.map((w) => (
                      <div key={w.id}>
                        <button
                          onClick={() => setSelectedProjectId(selectedProjectId === w.id ? null : w.id)}
                          className={`w-full text-left p-3 border transition-colors flex items-center gap-3 ${selectedProjectId === w.id ? "border-accent bg-accent/5" : "border-border hover:border-accent/40"}`}
                        >
                          <div className="w-8 h-8 bg-muted flex items-center justify-center flex-shrink-0"><List className="w-3.5 h-3.5 text-accent" /></div>
                          <div className="flex-1 min-w-0">
                            <span className="text-sm font-bold text-foreground block truncate">{w.name}</span>
                            <span className="text-[11px] text-subtle">{w.items.length} goals</span>
                          </div>
                          {selectedProjectId === w.id && <Check className="w-4 h-4 text-accent flex-shrink-0" />}
                        </button>
                        {selectedProjectId === w.id && w.items.length > 0 && (
                          <div className="ml-4 mt-1 mb-1 space-y-1">
                            {w.items.map((item) => {
                              const pct = item.goalAmount && item.goalAmount > 0
                                ? Math.min(100, Math.round(((item.raisedAmount ?? 0) / item.goalAmount) * 100))
                                : 0;
                              const isFunded = item.status === "COMPLETED" || item.status === "GIFTED";
                              return (
                                <div key={item.id} className="p-2.5 border border-border bg-muted/50">
                                  <div className="flex items-center justify-between mb-0.5">
                                    <div className="flex items-center gap-2 min-w-0">
                                      <Target className="w-3 h-3 text-accent flex-shrink-0" />
                                      <span className="text-xs font-bold text-foreground truncate">{item.title}</span>
                                    </div>
                                    {isFunded ? (
                                      <span className="text-[10px] font-black uppercase tracking-widest text-success-strong flex-shrink-0">Funded</span>
                                    ) : item.goalAmount ? (
                                      <span className="text-[10px] font-bold text-subtle flex-shrink-0">
                                        ${(item.raisedAmount ?? 0).toLocaleString()} / ${item.goalAmount.toLocaleString()}
                                      </span>
                                    ) : null}
                                  </div>
                                  {item.description && (
                                    <p className="text-[11px] text-muted-foreground pl-5 mb-1.5">{item.description}</p>
                                  )}
                                  {item.goalAmount && !isFunded && (
                                    <div className="pl-5">
                                      <div className="w-full h-1 bg-secondary overflow-hidden">
                                        <div
                                          className="h-full transition-all"
                                          style={{ width: `${pct}%`, background: "var(--accent)" }}
                                        />
                                      </div>
                                    </div>
                                  )}
                                </div>
                              );
                            })}
                          </div>
                        )}
                      </div>
                    ))}
                  </div>
                </div>

                {/* Step 2: Amount */}
                <div className={`p-5 border-b border-border ${!selectedProjectId ? "opacity-40 pointer-events-none" : ""}`}>
                  <SectionLabel>2. Tip amount</SectionLabel>
                  <div className="flex flex-wrap gap-2 mb-3">
                    {[5, 10, 25, 50, 100].map((amt) => (
                      <button
                        key={amt}
                        onClick={() => { setSelectedTipAmount(amt); setCustomTipAmount(""); }}
                        className={`px-4 py-2 text-sm font-bold border transition-colors ${selectedTipAmount === amt && !customTipAmount ? "border-accent bg-accent text-white" : "border-border text-foreground hover:border-accent/40"}`}
                      >
                        ${amt}
                      </button>
                    ))}
                  </div>
                  <div className="relative">
                    <DollarSign className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-subtle" />
                    <input
                      type="number" min="1" step="0.01" placeholder="Custom amount"
                      value={customTipAmount}
                      onChange={(e) => { setCustomTipAmount(e.target.value); setSelectedTipAmount(0); }}
                      className="w-full pl-9 pr-4 py-2.5 bg-muted border border-border text-foreground text-sm focus:outline-none focus:ring-2 focus:ring-accent placeholder-subtle"
                    />
                  </div>
                </div>

                {/* Confirm */}
                <div className="p-5">
                  {tipError && (
                    <p className="text-destructive text-xs font-medium mb-3">{tipError}</p>
                  )}
                  <button
                    onClick={handleConfirmTip}
                    disabled={!selectedProjectId || (!selectedTipAmount && !customTipAmount) || tipLoading}
                    className="w-full py-3 btn-success disabled:opacity-40 disabled:cursor-not-allowed text-white text-xs font-black uppercase tracking-widest transition-colors flex items-center justify-center gap-2"
                  >
                    {tipLoading ? (
                      <Loader2 className="w-4 h-4 animate-spin" />
                    ) : (
                      <Zap className="w-4 h-4" />
                    )}
                    {tipLoading
                      ? "Processing..."
                      : selectedTipAmount && !customTipAmount
                        ? `Send $${selectedTipAmount} Tip`
                        : customTipAmount
                          ? `Send $${parseFloat(customTipAmount).toFixed(2)} Tip`
                          : "Select Amount"}
                  </button>
                </div>
              </>
            )}
          </motion.div>
        </motion.div>
      )}
    </div>
  );
}
