import { useState, useEffect } from "react";
import { motion } from "motion/react";
import { Gift, Youtube, Play, Eye, Heart, Target, Loader2, ExternalLink, Check } from "lucide-react";
import { activityApi } from "../../lib/api";
import type { ActivityItemResponse } from "../../lib/api";

interface ActivityFeedProps {
  username: string;
}

const platformColors: Record<string, string> = {
  YOUTUBE: "#FF0000",
  TWITCH: "#9146FF",
  TWITTER: "#000000",
  INSTAGRAM: "#E4405F",
  TIKTOK: "#00f2ea",
};

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

export default function ActivityFeed({ username }: ActivityFeedProps) {
  const [items, setItems] = useState<ActivityItemResponse[]>([]);
  const [loading, setLoading] = useState(true);
  const [page, setPage] = useState(0);
  const [hasMore, setHasMore] = useState(true);
  const [loadingMore, setLoadingMore] = useState(false);

  useEffect(() => {
    loadActivity(0, true);
  }, [username]);

  async function loadActivity(pageNum: number, reset = false) {
    if (reset) setLoading(true);
    else setLoadingMore(true);

    const res = await activityApi.getCreatorActivity(username, pageNum, 20);
    if (res.success && res.data) {
      if (reset) {
        setItems(res.data);
      } else {
        setItems(prev => [...prev, ...res.data!]);
      }
      setHasMore(res.data.length === 20);
      setPage(pageNum);
    }

    setLoading(false);
    setLoadingMore(false);
  }

  function handleLoadMore() {
    loadActivity(page + 1);
  }

  if (loading) {
    return (
      <div className="flex items-center justify-center py-12">
        <Loader2 className="w-5 h-5 animate-spin text-subtle" />
      </div>
    );
  }

  if (items.length === 0) {
    return (
      <div className="text-center py-12 text-subtle text-sm">
        No activity yet
      </div>
    );
  }

  return (
    <div className="space-y-3">
      {items.map((item, i) => (
        <motion.div
          key={item.id}
          initial={{ opacity: 0, y: 10 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ duration: 0.2, delay: i * 0.02 }}
        >
          {item.type === "POST" && <PostActivityCard item={item} />}
          {item.type === "GIFT" && <GiftActivityCard item={item} />}
          {item.type === "PROJECT_CREATED" && <ProjectActivityCard item={item} />}
          {item.type === "ITEM_GIFTED" && <ItemGiftedCard item={item} />}
        </motion.div>
      ))}

      {hasMore && (
        <button
          onClick={handleLoadMore}
          disabled={loadingMore}
          className="w-full py-3 text-xs font-bold uppercase tracking-wider text-subtle hover:text-foreground border border-border hover:border-accent/40 transition-colors flex items-center justify-center gap-2"
        >
          {loadingMore ? <Loader2 className="w-3 h-3 animate-spin" /> : null}
          Load More
        </button>
      )}
    </div>
  );
}

function PostActivityCard({ item }: { item: ActivityItemResponse }) {
  const post = item.post!;
  return (
    <div className="bg-background border border-border overflow-hidden group hover:border-accent/30 transition-colors">
      <div className="flex gap-3 p-3">
        {/* Thumbnail */}
        <div className="relative w-20 h-14 bg-muted shrink-0 overflow-hidden">
          {item.thumbnailUrl ? (
            <img src={item.thumbnailUrl} alt="" className="w-full h-full object-cover" />
          ) : (
            <div className="w-full h-full flex items-center justify-center">
              <Play className="w-4 h-4 text-subtle" />
            </div>
          )}
          <div
            className="absolute top-0.5 left-0.5 px-1 py-px text-white text-[8px] font-black uppercase"
            style={{ backgroundColor: platformColors[post.platform] || "#333" }}
          >
            {post.platform}
          </div>
        </div>

        {/* Content */}
        <div className="flex-1 min-w-0">
          <p className="text-xs font-medium text-foreground line-clamp-2 leading-tight">
            {item.title || "New post"}
          </p>
          <div className="flex items-center gap-3 mt-1 text-[10px] text-subtle">
            {post.platformViews > 0 && (
              <span className="flex items-center gap-0.5"><Eye className="w-3 h-3" />{formatNumber(post.platformViews)}</span>
            )}
            {post.platformLikes > 0 && (
              <span className="flex items-center gap-0.5"><Heart className="w-3 h-3" />{formatNumber(post.platformLikes)}</span>
            )}
            <span>{timeAgo(item.timestamp)}</span>
          </div>
          {post.linkedProject && (
            <div className="mt-1.5 flex items-center gap-1 text-[10px] text-accent font-medium">
              <Target className="w-3 h-3" />
              {post.linkedProject.projectName}
              <span className="text-subtle ml-1">{Math.round(post.linkedProject.progress * 100)}% funded</span>
            </div>
          )}
        </div>

        {/* Link out */}
        {post.platformUrl && (
          <a
            href={post.platformUrl}
            target="_blank"
            rel="noopener noreferrer"
            className="shrink-0 self-center p-1.5 text-subtle hover:text-accent transition-colors"
          >
            <ExternalLink className="w-3.5 h-3.5" />
          </a>
        )}
      </div>
    </div>
  );
}

function GiftActivityCard({ item }: { item: ActivityItemResponse }) {
  const gift = item.gift!;
  return (
    <div className="bg-background border border-border p-3 flex items-center gap-3">
      <div className="w-8 h-8 bg-green-100 dark:bg-green-900/30 flex items-center justify-center shrink-0">
        <Gift className="w-4 h-4 text-green-600" />
      </div>
      <div className="flex-1 min-w-0">
        <p className="text-xs font-medium text-foreground">
          <span className="font-bold">{gift.supporterDisplayName}</span> gifted <span className="font-bold text-green-600">${gift.amount}</span>
        </p>
        {gift.message && <p className="text-[10px] text-subtle mt-0.5 line-clamp-1">{gift.message}</p>}
      </div>
      <span className="text-[10px] text-subtle shrink-0">{timeAgo(item.timestamp)}</span>
    </div>
  );
}

function ProjectActivityCard({ item }: { item: ActivityItemResponse }) {
  return (
    <div className="bg-background border border-border p-3 flex items-center gap-3">
      <div className="w-8 h-8 bg-accent/10 flex items-center justify-center shrink-0">
        <Target className="w-4 h-4 text-accent" />
      </div>
      <div className="flex-1 min-w-0">
        <p className="text-xs font-medium text-foreground">
          Created project: <span className="font-bold">{item.project?.projectName}</span>
        </p>
        {item.description && <p className="text-[10px] text-subtle mt-0.5 line-clamp-1">{item.description}</p>}
      </div>
      <span className="text-[10px] text-subtle shrink-0">{timeAgo(item.timestamp)}</span>
    </div>
  );
}

function ItemGiftedCard({ item }: { item: ActivityItemResponse }) {
  const project = item.project!;
  return (
    <div className="bg-background border border-green-300 dark:border-green-800 p-3 flex items-center gap-3">
      <div className="w-8 h-8 bg-green-100 dark:bg-green-900/30 flex items-center justify-center shrink-0">
        <Check className="w-4 h-4 text-green-600 dark:text-green-400" />
      </div>
      <div className="flex-1 min-w-0">
        <p className="text-xs font-medium text-foreground">
          <span className="font-bold">{project.itemTitle || project.projectName}</span> fully funded!
        </p>
        <div className="w-full h-1.5 bg-muted mt-1.5 overflow-hidden">
          <div className="h-full bg-green-500 w-full" />
        </div>
      </div>
      <span className="text-[10px] text-subtle shrink-0">{timeAgo(item.timestamp)}</span>
    </div>
  );
}

function formatNumber(n: number): string {
  if (n >= 1_000_000) return (n / 1_000_000).toFixed(1) + "M";
  if (n >= 1_000) return (n / 1_000).toFixed(1) + "K";
  return n.toString();
}
