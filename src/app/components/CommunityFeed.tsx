import { useState, useEffect, useCallback } from "react";
import { motion, AnimatePresence } from "motion/react";
import { Heart, MessageCircle, Share2, ExternalLink, Eye, Play, Loader2, TrendingUp, Sparkles, Users } from "lucide-react";
import { Sounds } from "../../lib/sounds";
import { feedApi } from "../../lib/api";
import type { FeedPostResponse } from "../../lib/api";
import type { ToastKind } from "./Toast";
import { useNavigate } from "react-router-dom";
import { ProgressBar } from "./shared/ProgressBar";

type FeedTab = "foryou" | "following" | "trending";

const TABS: { id: FeedTab; label: string; icon: React.ReactNode }[] = [
  { id: "foryou",    label: "For You",   icon: <Sparkles className="w-3.5 h-3.5" /> },
  { id: "following",  label: "Following", icon: <Users className="w-3.5 h-3.5" /> },
  { id: "trending",   label: "Trending",  icon: <TrendingUp className="w-3.5 h-3.5" /> },
];

const PLATFORM_ICON: Record<string, { label: string; color: string }> = {
  YOUTUBE:   { label: "YouTube",   color: "bg-destructive" },
  TWITCH:    { label: "Twitch",    color: "bg-purple-500" },
  TWITTER:   { label: "X",         color: "bg-foreground" },
  INSTAGRAM: { label: "Instagram", color: "bg-gradient-to-tr from-warning via-pink-500 to-purple-600" },
  TIKTOK:    { label: "TikTok",    color: "bg-foreground" },
};

const CONTENT_BADGE: Record<string, string> = {
  VIDEO:  "Video",
  REEL:   "Reel",
  STREAM: "Live",
  SHORT:  "Short",
};

function timeAgo(dateStr: string): string {
  const now = Date.now();
  const then = new Date(dateStr).getTime();
  const diff = now - then;
  const mins = Math.floor(diff / 60000);
  if (mins < 1) return "just now";
  if (mins < 60) return `${mins}m`;
  const hrs = Math.floor(mins / 60);
  if (hrs < 24) return `${hrs}h`;
  const days = Math.floor(hrs / 24);
  if (days < 7) return `${days}d`;
  return `${Math.floor(days / 7)}w`;
}

function formatNumber(n: number): string {
  if (n >= 1_000_000) return `${(n / 1_000_000).toFixed(1)}M`;
  if (n >= 1_000) return `${(n / 1_000).toFixed(1)}K`;
  return n.toString();
}

interface CommunityFeedProps {
  onToast?: (kind: ToastKind, message: string) => void;
}

export default function CommunityFeed({ onToast }: CommunityFeedProps) {
  const navigate = useNavigate();
  const [activeTab, setActiveTab] = useState<FeedTab>("foryou");
  const [posts, setPosts] = useState<FeedPostResponse[]>([]);
  const [loading, setLoading] = useState(true);
  const [page, setPage] = useState(0);
  const [hasMore, setHasMore] = useState(true);
  const [loadingMore, setLoadingMore] = useState(false);

  const fetchFeed = useCallback(async (tab: FeedTab, pageNum: number, append = false) => {
    if (pageNum === 0) setLoading(true);
    else setLoadingMore(true);

    try {
      const fetcher = tab === "following" ? feedApi.getFollowingFeed
        : tab === "trending" ? feedApi.getTrendingFeed
        : feedApi.getFeed;

      const res = await fetcher(pageNum, 15);
      if (res.success && res.data) {
        const items = res.data.content;
        setPosts(prev => append ? [...prev, ...items] : items);
        setHasMore(!res.data.last);
      } else {
        console.warn(`[Feed] ${tab} failed:`, res);
      }
    } catch (err) {
      console.error(`[Feed] ${tab} error:`, err);
    }

    setLoading(false);
    setLoadingMore(false);
  }, []);

  useEffect(() => {
    setPage(0);
    setHasMore(true);
    fetchFeed(activeTab, 0);
  }, [activeTab, fetchFeed]);

  function loadMore() {
    if (loadingMore || !hasMore) return;
    const next = page + 1;
    setPage(next);
    fetchFeed(activeTab, next, true);
  }

  async function handleLike(postId: string) {
    Sounds.pop();
    setPosts(prev => prev.map(p => {
      if (p.id !== postId) return p;
      const liked = !p.likedByMe;
      return { ...p, likedByMe: liked, likeCount: p.likeCount + (liked ? 1 : -1) };
    }));
    try {
      await feedApi.toggleLike(postId);
    } catch {
      setPosts(prev => prev.map(p => {
        if (p.id !== postId) return p;
        const liked = !p.likedByMe;
        return { ...p, likedByMe: liked, likeCount: p.likeCount + (liked ? 1 : -1) };
      }));
    }
  }

  function handleGift(post: FeedPostResponse) {
    Sounds.gift();
    if (post.linkedProject) {
      navigate(`/creator/${post.authorUsername}/project/${post.linkedProject.projectId}`);
    } else {
      navigate(`/creator/${post.authorUsername}`);
    }
    onToast?.("gift", `Opening ${post.authorDisplayName}'s page...`);
  }

  return (
    <div className="min-h-screen">
      {/* Tab bar */}
      <div className="sticky top-[57px] z-10 bg-background/80 backdrop-blur-xl border-b border-border">
        <div className="flex gap-1 px-3 pt-3 pb-0">
          {TABS.map((tab) => (
            <button
              key={tab.id}
              onClick={() => { Sounds.click(); setActiveTab(tab.id); }}
              className={`relative flex items-center justify-center gap-1.5 flex-1 py-2.5 text-[13px] font-bold transition-all ${
                activeTab === tab.id ? "text-foreground" : "text-muted-foreground hover:text-foreground"
              }`}
            >
              <span className={`transition-colors ${activeTab === tab.id ? "text-accent" : ""}`}>
                {tab.icon}
              </span>
              {tab.label}
              {activeTab === tab.id && (
                <motion.div
                  layoutId="feed-tab-indicator"
                  className="absolute bottom-0 inset-x-0 h-[2px] bg-accent rounded-full"
                  transition={{ type: "spring", stiffness: 400, damping: 30 }}
                />
              )}
            </button>
          ))}
        </div>
      </div>

      {/* Feed posts */}
      {loading ? (
        <div className="flex flex-col items-center justify-center py-24 gap-3">
          <Loader2 className="w-6 h-6 animate-spin text-accent" />
          <p className="text-xs text-muted-foreground">Loading your feed</p>
        </div>
      ) : posts.length === 0 ? (
        <div className="text-center py-24 px-6">
          <div className="w-16 h-16 mx-auto mb-4 rounded-2xl bg-muted flex items-center justify-center">
            {activeTab === "following" ? <Users className="w-7 h-7 text-muted-foreground" /> : <Sparkles className="w-7 h-7 text-muted-foreground" />}
          </div>
          <p className="text-foreground font-bold text-sm mb-1">
            {activeTab === "following" ? "No posts from people you follow" : "No posts yet"}
          </p>
          <p className="text-muted-foreground text-sm max-w-xs mx-auto">
            {activeTab === "following" ? "Follow some creators to see their posts here!" : "Check back soon for new content."}
          </p>
        </div>
      ) : (
        <AnimatePresence mode="wait">
          <motion.div
            key={activeTab}
            initial={{ opacity: 0, y: 6 }}
            animate={{ opacity: 1, y: 0 }}
            exit={{ opacity: 0, y: -6 }}
            transition={{ duration: 0.2 }}
            className="divide-y divide-border"
          >
            {posts.map((post, idx) => (
              <PostCard
                key={post.id}
                post={post}
                index={idx}
                onLike={handleLike}
                onGift={handleGift}
                onNavigate={navigate}
              />
            ))}

            {/* Load more */}
            {hasMore && (
              <div className="flex justify-center py-8">
                <motion.button
                  whileHover={{ scale: 1.02 }}
                  whileTap={{ scale: 0.98 }}
                  onClick={loadMore}
                  disabled={loadingMore}
                  className="px-8 py-3 text-xs font-bold uppercase tracking-widest border border-border rounded-full text-muted-foreground hover:text-foreground hover:border-foreground/30 hover:bg-muted/50 transition-all disabled:opacity-50"
                >
                  {loadingMore ? <Loader2 className="w-4 h-4 animate-spin" /> : "Load More"}
                </motion.button>
              </div>
            )}
          </motion.div>
        </AnimatePresence>
      )}
    </div>
  );
}

// ─── Post Card ──────────────────────────────────────────────────────────────

interface PostCardProps {
  post: FeedPostResponse;
  index: number;
  onLike: (postId: string) => void;
  onGift: (post: FeedPostResponse) => void;
  onNavigate: (path: string) => void;
}

function PostCard({ post, index, onLike, onGift, onNavigate }: PostCardProps) {
  const platform = PLATFORM_ICON[post.platform];
  const contentBadge = CONTENT_BADGE[post.contentType];
  const hasMedia = post.imageUrl || post.thumbnailUrl;
  const isVideo = ["VIDEO", "REEL", "STREAM", "SHORT"].includes(post.contentType);
  const isLive = post.contentType === "STREAM";

  return (
    <motion.article
      initial={{ opacity: 0, y: 12 }}
      animate={{ opacity: 1, y: 0 }}
      transition={{ duration: 0.25, delay: Math.min(index * 0.03, 0.3) }}
      className="bg-background"
    >
      {/* Header */}
      <div className="flex items-center gap-3 px-4 pt-4 pb-3">
        <button
          onClick={() => onNavigate(`/creator/${post.authorUsername}`)}
          className="flex-shrink-0 group"
        >
          {post.authorAvatarUrl ? (
            <img
              src={post.authorAvatarUrl}
              alt={post.authorDisplayName}
              className="w-10 h-10 rounded-full object-cover ring-2 ring-transparent group-hover:ring-accent/30 transition-all"
            />
          ) : (
            <div className="w-10 h-10 rounded-full bg-gradient-to-br from-accent/20 to-accent/5 flex items-center justify-center text-xs font-black text-accent ring-2 ring-transparent group-hover:ring-accent/30 transition-all">
              {post.authorDisplayName.slice(0, 2).toUpperCase()}
            </div>
          )}
        </button>
        <div className="flex-1 min-w-0">
          <div className="flex items-center gap-2">
            <button
              onClick={() => onNavigate(`/creator/${post.authorUsername}`)}
              className="text-sm font-bold text-foreground hover:text-accent transition-colors truncate"
            >
              {post.authorDisplayName}
            </button>
            {platform && (
              <span className={`text-[9px] font-bold uppercase tracking-wider text-white px-1.5 py-0.5 rounded-full ${platform.color}`}>
                {platform.label}
              </span>
            )}
            {contentBadge && (
              <span className={`text-[9px] font-bold uppercase tracking-wider px-1.5 py-0.5 rounded-full ${
                isLive
                  ? "text-white bg-destructive animate-pulse"
                  : "text-muted-foreground bg-muted"
              }`}>
                {contentBadge}
              </span>
            )}
          </div>
          <p className="text-[11px] text-muted-foreground">
            @{post.authorUsername} · {timeAgo(post.createdAt)}
          </p>
        </div>
        {post.platformUrl && (
          <a
            href={post.platformUrl}
            target="_blank"
            rel="noopener noreferrer"
            className="flex-shrink-0 w-8 h-8 flex items-center justify-center rounded-full text-muted-foreground hover:text-foreground hover:bg-muted transition-all"
          >
            <ExternalLink className="w-4 h-4" />
          </a>
        )}
      </div>

      {/* Caption — above media */}
      {post.caption && (
        <div className="px-4 pb-3">
          <p className="text-[14px] text-foreground leading-relaxed">
            {post.caption}
          </p>
        </div>
      )}

      {/* Media */}
      {hasMedia && (
        <div className="relative bg-muted mx-4 rounded-xl overflow-hidden">
          <img
            src={post.imageUrl || post.thumbnailUrl!}
            alt=""
            className="w-full object-cover max-h-[520px]"
            loading="lazy"
          />
          {isVideo && (
            <div className="absolute inset-0 flex items-center justify-center bg-gradient-to-t from-black/40 via-transparent to-transparent">
              <a
                href={post.platformUrl ?? "#"}
                target="_blank"
                rel="noopener noreferrer"
                className="w-14 h-14 rounded-full bg-white/95 backdrop-blur-sm flex items-center justify-center shadow-xl hover:scale-110 active:scale-95 transition-transform"
              >
                <Play className="w-6 h-6 text-foreground ml-0.5" fill="currentColor" />
              </a>
            </div>
          )}
          {/* Overlaid stats */}
          <div className="absolute bottom-0 left-0 right-0 flex items-center gap-3 px-3 py-2.5 bg-gradient-to-t from-black/60 to-transparent">
            {post.platformViews > 0 && (
              <div className="flex items-center gap-1 text-white/90 text-[11px] font-bold">
                <Eye className="w-3.5 h-3.5" />
                {formatNumber(post.platformViews)} views
              </div>
            )}
            {post.platformLikes > 0 && (
              <div className="flex items-center gap-1 text-white/90 text-[11px] font-bold">
                <Heart className="w-3.5 h-3.5" />
                {formatNumber(post.platformLikes)}
              </div>
            )}
            {post.platformComments > 0 && (
              <div className="flex items-center gap-1 text-white/90 text-[11px] font-bold">
                <MessageCircle className="w-3.5 h-3.5" />
                {formatNumber(post.platformComments)}
              </div>
            )}
          </div>
        </div>
      )}

      {/* Action bar */}
      <div className="flex items-center px-4 py-2.5">
        <div className="flex items-center gap-0.5">
          <motion.button
            whileTap={{ scale: 0.85 }}
            onClick={() => onLike(post.id)}
            className="flex items-center gap-1.5 px-3 py-2 rounded-full hover:bg-destructive/10 transition-colors group"
          >
            <Heart
              className={`w-[18px] h-[18px] transition-all ${post.likedByMe ? "text-destructive fill-destructive scale-110" : "text-muted-foreground group-hover:text-destructive"}`}
            />
            {post.likeCount > 0 && (
              <span className={`text-xs font-bold ${post.likedByMe ? "text-destructive" : "text-muted-foreground"}`}>
                {formatNumber(post.likeCount)}
              </span>
            )}
          </motion.button>
          <button className="flex items-center gap-1.5 px-3 py-2 rounded-full hover:bg-accent/10 transition-colors group">
            <MessageCircle className="w-[18px] h-[18px] text-muted-foreground group-hover:text-accent transition-colors" />
            {post.commentCount > 0 && (
              <span className="text-xs font-bold text-muted-foreground">{formatNumber(post.commentCount)}</span>
            )}
          </button>
          <button className="flex items-center gap-1.5 px-3 py-2 rounded-full hover:bg-accent/10 transition-colors group">
            <Share2 className="w-[18px] h-[18px] text-muted-foreground group-hover:text-accent transition-colors" />
          </button>
        </div>
        <div className="flex-1" />
      </div>

      {/* Linked project (funding CTA) */}
      {post.linkedProject && (
        <div className="mx-4 mb-4 border border-border rounded-xl overflow-hidden bg-muted/50">
          <div className="p-4">
            <div className="flex items-start justify-between gap-3 mb-3">
              <div className="flex-1 min-w-0">
                <p className="text-[10px] font-bold uppercase tracking-widest text-accent mb-1">
                  Funding Goal
                </p>
                <p className="text-sm font-bold text-foreground truncate">
                  {post.linkedProject.itemTitle ?? post.linkedProject.projectName}
                </p>
              </div>
              <motion.button
                whileHover={{ scale: 1.03 }}
                whileTap={{ scale: 0.95 }}
                onClick={() => onGift(post)}
                className="flex-shrink-0 px-5 py-2.5 bg-accent text-white text-xs font-black uppercase tracking-wider hover:brightness-110 transition-all rounded-full"
              >
                Gift
              </motion.button>
            </div>
            <div className="flex items-center gap-3">
              <ProgressBar
                value={post.linkedProject.progress * 100}
                className="flex-1 h-2 bg-background"
                barClassName="bg-gradient-to-r from-accent to-accent/70"
                rounded
                duration={0.8}
                delay={0.2}
              />
              <span className="text-xs font-black text-foreground flex-shrink-0">
                {Math.round(post.linkedProject.progress * 100)}%
              </span>
            </div>
            <p className="text-[11px] text-muted-foreground mt-1.5">
              <span className="font-bold text-foreground">${post.linkedProject.raisedAmount.toLocaleString()}</span>
              {" "}of ${post.linkedProject.goalAmount.toLocaleString()} raised
            </p>
          </div>
        </div>
      )}

      {/* Bottom spacer */}
      <div className="h-2" />
    </motion.article>
  );
}
