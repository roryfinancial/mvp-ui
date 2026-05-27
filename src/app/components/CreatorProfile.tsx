import { motion, AnimatePresence } from "motion/react";
import { useState, useEffect } from "react";
import { useNavigate } from "react-router-dom";
import {
  User, Check, Zap, X, DollarSign, ArrowUp, Twitter, Youtube, Twitch,
  Play, Eye, Heart, MessageCircle, ChevronRight, List, ExternalLink,
  Edit2, Settings, LogIn, Loader2, Target,
} from "lucide-react";
import { useAuth } from "../../contexts/AuthContext";
import { userApi, projectApi, followApi, giftApi } from "../../lib/api";
import type { PublicUserResponse, ProjectResponse } from "../../lib/api";

// ─── Types ────────────────────────────────────────────────────────────────────

interface ProjectItem { id: string; title: string; description?: string; goalAmount?: number; raisedAmount?: number; status?: string; thumbnail?: string }
interface CreatorProject { id: string; name: string; description?: string; coverImage?: string; items: ProjectItem[] }
interface RecentEvent { title: string; thumbnail?: string }
interface FeedItem {
  platform: "youtube" | "twitch" | "twitter" | "instagram" | "tiktok";
  type: "video" | "livestream" | "post" | "clip";
  title: string; thumbnail?: string; timestamp: string;
  views?: string; likes?: string; comments?: string; isLive?: boolean; url?: string;
}
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
  recentEvents?: RecentEvent[];
  feedItems?: FeedItem[];
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

// ─── Default seed data (replaced by API data in production) ──────────────────

const DEFAULT_FEED: FeedItem[] = [
  { platform: "youtube",   type: "video",      title: "How I Built My Setup From Scratch",                   timestamp: "2 days ago",   views: "14.2K", likes: "892",   comments: "134" },
  { platform: "twitch",    type: "livestream",  title: "Late Night Chill Stream",                            timestamp: "Live now",     views: "1.3K",  isLive: true },
  { platform: "twitter",   type: "post",        title: "Just dropped a new video. Best budget gear for 2026.", timestamp: "5 hours ago", likes: "2.1K",  comments: "89" },
  { platform: "youtube",   type: "video",      title: "Top 10 Gadgets Under $50",                            timestamp: "1 week ago",   views: "52.8K", likes: "3.4K",  comments: "421" },
  { platform: "instagram", type: "post",        title: "BTS of today's shoot. New content incoming.",        timestamp: "3 days ago",   likes: "4.7K",  comments: "156" },
  { platform: "tiktok",    type: "clip",        title: "When your setup finally comes together",             timestamp: "4 days ago",   views: "128K",  likes: "18.2K" },
  { platform: "twitch",    type: "clip",        title: "INSANE clutch play in ranked",                      timestamp: "6 days ago",   views: "8.9K",  likes: "1.2K" },
  { platform: "youtube",   type: "video",      title: "I Tried Every Standing Desk Under $300",             timestamp: "2 weeks ago",  views: "89.1K", likes: "5.6K",  comments: "673" },
];

const DEFAULT_PROJECTS: CreatorProject[] = [
  { id: "studio-gear", name: "Studio Gear", description: "Everything I need to level up my recording setup", items: [
    { id: "1", title: "Ableton Push 3", description: "MIDI controller for live production on stream", goalAmount: 1200, raisedAmount: 340, status: "ACTIVE" },
    { id: "2", title: "Universal Audio Apollo X4", description: "Pro audio interface for studio-quality sound", goalAmount: 1800, raisedAmount: 200, status: "ACTIVE" },
    { id: "3", title: "Bose Solo Soundbar", description: "Better monitoring for music reviews", goalAmount: 250, raisedAmount: 250, status: "COMPLETED" },
  ]},
  { id: "dream-items", name: "Dream Items", description: "Big ticket items on my bucket list", items: [
    { id: "4", title: "Cybertruck", description: "The ultimate content creation vehicle", goalAmount: 50000, raisedAmount: 1200, status: "ACTIVE" },
    { id: "5", title: "Rolex Submariner", description: "Milestone reward for hitting 1M subs", goalAmount: 12000, raisedAmount: 0, status: "ACTIVE" },
  ]},
  { id: "fitness", name: "Fitness & Health", items: [
    { id: "6", title: "Pull-up Bar Station", description: "Home gym setup for stream break workouts", goalAmount: 300, raisedAmount: 150, status: "ACTIVE" },
    { id: "7", title: "Theragun Pro", description: "Recovery after long streaming sessions", goalAmount: 400, raisedAmount: 400, status: "COMPLETED" },
    { id: "8", title: "Adjustable Dumbbell Set", description: "Space-efficient weights for the office", goalAmount: 350, raisedAmount: 80, status: "ACTIVE" },
  ]},
];

const DEFAULT_PLATFORMS: ConnectedPlatform[] = [
  { platform: "youtube",   url: "https://youtube.com/@Clavicular",  handle: "@Clavicular" },
  { platform: "twitch",    url: "https://twitch.tv/Clavicular",     handle: "Clavicular" },
  { platform: "twitter",   url: "https://x.com/Clavicular",         handle: "@Clavicular" },
  { platform: "instagram", url: "https://instagram.com/Clavicular", handle: "@Clavicular" },
  { platform: "tiktok",    url: "https://tiktok.com/@Clavicular",   handle: "@Clavicular" },
];

// ─── Component ────────────────────────────────────────────────────────────────

export default function CreatorProfile({
  routeUsername = "",
  creatorName: propCreatorName,
  rank: propRank,
  description: propDescription,
  profileImage,
  recentEvents = [{ title: "Stream VOD" }, { title: "Studio Tour" }, { title: "Unboxing" }, { title: "Q&A" }, { title: "Collab" }],
  feedItems = DEFAULT_FEED,
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
  const [projects, setProjects] = useState<CreatorProject[]>(propProjects ?? DEFAULT_PROJECTS);
  const [connectedPlatforms, setConnectedPlatforms] = useState<ConnectedPlatform[]>(propConnectedPlatforms ?? DEFAULT_PLATFORMS);
  const [followerCount, setFollowerCount] = useState(0);
  const [isFollowing, setIsFollowing] = useState(false);

  useEffect(() => {
    if (!routeUsername) { setProfileLoading(false); return; }

    async function loadProfile() {
      setProfileLoading(true);
      const [profileRes, projectRes, followCountRes] = await Promise.all([
        userApi.getPublicProfile(routeUsername),
        projectApi.getByCreator(routeUsername),
        followApi.getFollowerCount(routeUsername),
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
            })),
          }))
        );
      }

      if (followCountRes.success && followCountRes.data) {
        setFollowerCount((followCountRes.data as { count: number }).count);
      }

      if (isAuthenticated) {
        const statusRes = await followApi.isFollowing(routeUsername);
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
  const [feedFilter, setFeedFilter] = useState<"all" | keyof typeof platformConfig>("all");
  const filteredFeed = feedFilter === "all" ? feedItems : feedItems.filter((i) => i.platform === feedFilter);

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
            className="fixed top-0 left-0 right-0 z-50 bg-[#0e0e0e] border-b border-border px-6 py-3 flex items-center justify-between"
          >
            <div className="text-xl font-black text-white tracking-tight">Rory</div>
            <div className="flex items-center gap-4">
              <span className="text-sm text-white/50 hidden sm:block">Create a project. Get funded. Zero fees.</span>
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
            <img src={profileImage} alt={creatorName} className="absolute inset-0 w-full h-full object-cover" />
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
              <p className="text-[#22c55e] text-sm font-bold mb-3">Ranked #{rank} Globally</p>
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
                    className="px-6 py-2.5 text-sm font-black bg-[#22c55e] hover:bg-[#16a34a] text-white transition-all uppercase tracking-wider flex items-center gap-2"
                  >
                    <LogIn className="w-4 h-4" />
                    Sign In to Support
                  </button>
                ) : (
                  // Authenticated visitor: full actions
                  <>
                    <button
                      onClick={() => requireAuth(() => setShowQuickTip(true))}
                      className="px-6 py-2.5 text-sm font-black bg-[#22c55e] hover:bg-[#16a34a] text-white transition-all uppercase tracking-wider flex items-center gap-2"
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

        {/* Recent Events */}
        <motion.section initial={{ opacity: 0, y: 20 }} animate={{ opacity: 1, y: 0 }} transition={{ duration: 0.5, delay: 0.1 }}>
          <h2 className="text-xs font-black uppercase tracking-widest text-subtle mb-4">Recent Events</h2>
          <div className="flex gap-4 overflow-x-auto pb-2">
            {recentEvents.map((event, i) => (
              <div
                key={i}
                className="flex-shrink-0 w-40 h-28 bg-muted border border-border overflow-hidden cursor-pointer group hover:border-accent/50 transition-colors"
              >
                {event.thumbnail ? (
                  <img src={event.thumbnail} alt={event.title} className="w-full h-full object-cover group-hover:scale-105 transition-transform" />
                ) : (
                  <div className="w-full h-full bg-gradient-to-br from-muted to-secondary flex items-center justify-center">
                    <User className="w-10 h-10 text-subtle" />
                  </div>
                )}
              </div>
            ))}
          </div>
        </motion.section>

        {/* Feed */}
        <motion.section initial={{ opacity: 0, y: 20 }} animate={{ opacity: 1, y: 0 }} transition={{ duration: 0.5, delay: 0.15 }}>
          <h2 className="text-xs font-black uppercase tracking-widest text-subtle mb-4">Recent Feed</h2>

          {/* Platform filters */}
          <div className="flex gap-2 mb-5 overflow-x-auto pb-1">
            <button
              onClick={() => setFeedFilter("all")}
              className={`px-4 py-1.5 text-xs font-bold uppercase tracking-wider transition-colors flex-shrink-0 ${feedFilter === "all" ? "bg-foreground text-background" : "bg-muted text-subtle hover:text-foreground"}`}
            >
              All
            </button>
            {(Object.keys(platformConfig) as Array<keyof typeof platformConfig>).map((platform) => {
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
            {filteredFeed.map((item, i) => {
              const config = platformConfig[item.platform];
              return (
                <motion.div
                  key={i}
                  initial={{ opacity: 0, y: 15 }}
                  animate={{ opacity: 1, y: 0 }}
                  transition={{ duration: 0.3, delay: i * 0.04 }}
                  className="bg-background border border-border overflow-hidden group cursor-pointer hover:border-accent/40 hover:shadow-md transition-all"
                >
                  <div className="relative w-full h-36 bg-muted flex items-center justify-center">
                    {item.thumbnail ? (
                      <img src={item.thumbnail} alt={item.title} className="w-full h-full object-cover group-hover:scale-105 transition-transform" />
                    ) : (
                      <div className="w-full h-full bg-gradient-to-br from-muted to-secondary flex items-center justify-center">
                        <span className="w-10 h-10 opacity-40" style={{ color: config.color }}>{platformBrandIcons[item.platform]}</span>
                      </div>
                    )}
                    <div className="absolute top-2 left-2 px-2 py-0.5 flex items-center gap-1 text-white text-[9px] font-black uppercase" style={{ backgroundColor: config.color }}>
                      <span className="w-3 h-3 flex items-center justify-center">{platformBrandIcons[item.platform]}</span>
                      {config.label}
                    </div>
                    {item.isLive && (
                      <div className="absolute top-2 right-2 px-2 py-0.5 bg-red-600 text-white text-[9px] font-black uppercase flex items-center gap-1">
                        <span className="w-1.5 h-1.5 bg-white rounded-full animate-pulse" />
                        Live
                      </div>
                    )}
                    {!item.isLive && (
                      <div className="absolute bottom-2 right-2 px-2 py-0.5 bg-black/60 text-white text-[9px] font-bold uppercase">{item.type}</div>
                    )}
                  </div>
                  <div className="p-3">
                    <h3 className="text-sm font-bold text-foreground leading-tight line-clamp-2 mb-2 group-hover:text-accent transition-colors">{item.title}</h3>
                    <div className="flex items-center justify-between">
                      <span className="text-[11px] text-subtle">{item.timestamp}</span>
                      <div className="flex items-center gap-3 text-subtle text-[11px]">
                        {item.views    && <span className="flex items-center gap-1"><Eye className="w-3 h-3" /> {item.views}</span>}
                        {item.likes    && <span className="flex items-center gap-1"><Heart className="w-3 h-3" /> {item.likes}</span>}
                        {item.comments && <span className="flex items-center gap-1"><MessageCircle className="w-3 h-3" /> {item.comments}</span>}
                      </div>
                    </div>
                  </div>
                </motion.div>
              );
            })}
          </div>
          {filteredFeed.length === 0 && (
            <div className="text-center py-12 text-subtle text-sm">No posts from this platform yet.</div>
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
                      <img src={item.thumbnail} alt={item.title} className="w-full h-full object-cover group-hover:scale-105 transition-transform" />
                    ) : (
                      <User className="w-10 h-10 text-subtle" />
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
          <p className="text-[10px] font-black uppercase tracking-widest text-subtle mb-4">Want to support {creatorName}?</p>
          <h3 className="text-3xl font-black text-foreground mb-4 tracking-tight">Create a free account.</h3>
          <p className="text-muted-foreground mb-8 max-w-md mx-auto">Donate to their project. Zero platform fees. Creators keep 100%.</p>
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
                <motion.div initial={{ scale: 0 }} animate={{ scale: 1 }} transition={{ type: "spring", stiffness: 300, damping: 20 }} className="w-16 h-16 bg-[#22c55e] mx-auto mb-4 flex items-center justify-center">
                  <Check className="w-8 h-8 text-white" />
                </motion.div>
                <h3 className="text-lg font-black text-foreground mb-1">Tip Sent!</h3>
                <p className="text-subtle text-sm">Your contribution to {creatorName} has been recorded.</p>
              </div>
            ) : (
              <>
                <div className="flex items-center justify-between p-5 border-b border-border">
                  <div className="flex items-center gap-3">
                    <div className="w-8 h-8 bg-[#22c55e] flex items-center justify-center">
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
                  <div className="text-[10px] font-black uppercase tracking-widest text-subtle mb-3">1. Choose a project</div>
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
                                      <span className="text-[10px] font-black uppercase tracking-widest text-[#16a34a] flex-shrink-0">Funded</span>
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
                                          style={{ width: `${pct}%`, background: "oklch(65.6% 0.241 354.308)" }}
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
                  <div className="text-[10px] font-black uppercase tracking-widest text-subtle mb-3">2. Tip amount</div>
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
                    <p className="text-red-500 text-xs font-medium mb-3">{tipError}</p>
                  )}
                  <button
                    onClick={handleConfirmTip}
                    disabled={!selectedProjectId || (!selectedTipAmount && !customTipAmount) || tipLoading}
                    className="w-full py-3 bg-[#22c55e] hover:bg-[#16a34a] disabled:opacity-40 disabled:cursor-not-allowed text-white text-xs font-black uppercase tracking-widest transition-colors flex items-center justify-center gap-2"
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
