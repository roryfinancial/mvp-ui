import { motion } from "motion/react";
import { useState } from "react";
import { User, Check, Zap, X, DollarSign, ArrowUp, Twitter, Youtube, Twitch, Play, Eye, Heart, MessageCircle, ChevronRight, List, ExternalLink } from "lucide-react";

interface WishlistItem {
  id: string;
  title: string;
  status: "active" | "gifted";
  giftedBy?: string;
  thumbnail?: string;
}

interface Wishlist {
  id: string;
  name: string;
  description?: string;
  coverImage?: string;
  items: WishlistItem[];
}

interface RecentEvent {
  title: string;
  thumbnail?: string;
}

interface FeedItem {
  platform: "youtube" | "twitch" | "twitter" | "instagram" | "tiktok";
  type: "video" | "livestream" | "post" | "clip";
  title: string;
  thumbnail?: string;
  timestamp: string;
  views?: string;
  likes?: string;
  comments?: string;
  isLive?: boolean;
  url?: string;
}

interface ConnectedPlatform {
  platform: "youtube" | "twitch" | "twitter" | "instagram" | "tiktok";
  url: string;
  handle?: string;
}

interface CreatorProfileProps {
  creatorName?: string;
  rank?: number;
  description?: string;
  profileImage?: string;
  recentEvents?: RecentEvent[];
  feedItems?: FeedItem[];
  wishlists?: Wishlist[];
  connectedPlatforms?: ConnectedPlatform[];
  onViewWishlist?: (wishlistId: string) => void;
}

const platformConfig = {
  youtube: { icon: Youtube, color: "#FF0000", label: "YouTube" },
  twitch: { icon: Twitch, color: "#9146FF", label: "Twitch" },
  twitter: { icon: Twitter, color: "#1d9bf0", label: "Twitter" },
  instagram: { icon: Heart, color: "#E1306C", label: "Instagram" },
  tiktok: { icon: Play, color: "#00f2ea", label: "TikTok" },
};

const platformBrandIcons: Record<string, React.ReactNode> = {
  youtube: (
    <svg viewBox="0 0 24 24" fill="currentColor" className="w-4 h-4">
      <path d="M23.498 6.186a3.016 3.016 0 0 0-2.122-2.136C19.505 3.545 12 3.545 12 3.545s-7.505 0-9.377.505A3.017 3.017 0 0 0 .502 6.186C0 8.07 0 12 0 12s0 3.93.502 5.814a3.016 3.016 0 0 0 2.122 2.136c1.871.505 9.376.505 9.376.505s7.505 0 9.377-.505a3.015 3.015 0 0 0 2.122-2.136C24 15.93 24 12 24 12s0-3.93-.502-5.814zM9.545 15.568V8.432L15.818 12l-6.273 3.568z" />
    </svg>
  ),
  twitch: (
    <svg viewBox="0 0 24 24" fill="currentColor" className="w-4 h-4">
      <path d="M11.571 4.714h1.715v5.143H11.57zm4.715 0H18v5.143h-1.714zM6 0 1.714 4.286v15.428h5.143V24l4.286-4.286h3.428L22.286 12V0zm14.571 11.143-3.428 3.428h-3.429l-3 3v-3H6.857V1.714h13.714z" />
    </svg>
  ),
  twitter: (
    <svg viewBox="0 0 24 24" fill="currentColor" className="w-4 h-4">
      <path d="M18.244 2.25h3.308l-7.227 8.26 8.502 11.24H16.17l-5.214-6.817L4.99 21.75H1.68l7.73-8.835L1.254 2.25H8.08l4.713 6.231zm-1.161 17.52h1.833L7.084 4.126H5.117z" />
    </svg>
  ),
  instagram: (
    <svg viewBox="0 0 24 24" fill="currentColor" className="w-4 h-4">
      <path d="M12 2.163c3.204 0 3.584.012 4.85.07 3.252.148 4.771 1.691 4.919 4.919.058 1.265.069 1.645.069 4.849 0 3.205-.012 3.584-.069 4.849-.149 3.225-1.664 4.771-4.919 4.919-1.266.058-1.644.07-4.85.07-3.204 0-3.584-.012-4.849-.07-3.26-.149-4.771-1.699-4.919-4.92-.058-1.265-.07-1.644-.07-4.849 0-3.204.013-3.583.07-4.849.149-3.227 1.664-4.771 4.919-4.919 1.266-.057 1.645-.069 4.849-.069zM12 0C8.741 0 8.333.014 7.053.072 2.695.272.273 2.69.073 7.052.014 8.333 0 8.741 0 12c0 3.259.014 3.668.072 4.948.2 4.358 2.618 6.78 6.98 6.98C8.333 23.986 8.741 24 12 24c3.259 0 3.668-.014 4.948-.072 4.354-.2 6.782-2.618 6.979-6.98.059-1.28.073-1.689.073-4.948 0-3.259-.014-3.667-.072-4.947-.196-4.354-2.617-6.78-6.979-6.98C15.668.014 15.259 0 12 0zm0 5.838a6.162 6.162 0 1 0 0 12.324 6.162 6.162 0 0 0 0-12.324zM12 16a4 4 0 1 1 0-8 4 4 0 0 1 0 8zm6.406-11.845a1.44 1.44 0 1 0 0 2.881 1.44 1.44 0 0 0 0-2.881z" />
    </svg>
  ),
  tiktok: (
    <svg viewBox="0 0 24 24" fill="currentColor" className="w-4 h-4">
      <path d="M12.525.02c1.31-.02 2.61-.01 3.91-.02.08 1.53.63 3.09 1.75 4.17 1.12 1.11 2.7 1.62 4.24 1.79v4.03c-1.44-.05-2.89-.35-4.2-.97-.57-.26-1.1-.59-1.62-.93-.01 2.92.01 5.84-.02 8.75-.08 1.4-.54 2.79-1.35 3.94-1.31 1.92-3.58 3.17-5.91 3.21-1.43.08-2.86-.31-4.08-1.03-2.02-1.19-3.44-3.37-3.65-5.71-.02-.5-.03-1-.01-1.49.18-1.9 1.12-3.72 2.58-4.96 1.66-1.44 3.98-2.13 6.15-1.72.02 1.48-.04 2.96-.04 4.44-.99-.32-2.15-.23-3.02.37-.63.41-1.11 1.04-1.36 1.75-.21.51-.15 1.07-.14 1.61.24 1.64 1.82 3.02 3.5 2.87 1.12-.01 2.19-.66 2.77-1.61.19-.33.4-.67.41-1.06.1-1.79.06-3.57.07-5.36.01-4.03-.01-8.05.02-12.07z" />
    </svg>
  ),
};

export default function CreatorProfile({
  creatorName = "Clavicular",
  rank = 10,
  description = "General description up to three lines generic text can go here ignore this random text and you can see the layout or something.",
  profileImage,
  recentEvents = [
    { title: "Event 1" },
    { title: "Event 2" },
    { title: "Event 3" },
    { title: "Event 4" },
    { title: "Event 5" },
  ],
  feedItems = [
    { platform: "youtube" as const, type: "video" as const, title: "How I Built My Setup From Scratch", timestamp: "2 days ago", views: "14.2K", likes: "892", comments: "134" },
    { platform: "twitch" as const, type: "livestream" as const, title: "Late Night Chill Stream", timestamp: "Live now", views: "1.3K", isLive: true },
    { platform: "twitter" as const, type: "post" as const, title: "Just dropped a new video breaking down the best budget gear for 2026. Link in bio!", timestamp: "5 hours ago", likes: "2.1K", comments: "89" },
    { platform: "youtube" as const, type: "video" as const, title: "Top 10 Gadgets Under $50 You NEED", timestamp: "1 week ago", views: "52.8K", likes: "3.4K", comments: "421" },
    { platform: "instagram" as const, type: "post" as const, title: "BTS of today's shoot. New content incoming.", timestamp: "3 days ago", likes: "4.7K", comments: "156" },
    { platform: "tiktok" as const, type: "clip" as const, title: "When your setup finally comes together", timestamp: "4 days ago", views: "128K", likes: "18.2K" },
    { platform: "twitch" as const, type: "clip" as const, title: "INSANE clutch play in ranked", timestamp: "6 days ago", views: "8.9K", likes: "1.2K" },
    { platform: "youtube" as const, type: "video" as const, title: "I Tried Every Standing Desk Under $300", timestamp: "2 weeks ago", views: "89.1K", likes: "5.6K", comments: "673" },
  ],
  connectedPlatforms = [
    { platform: "youtube" as const, url: "https://youtube.com/@Clavicular", handle: "@Clavicular" },
    { platform: "twitch" as const, url: "https://twitch.tv/Clavicular", handle: "Clavicular" },
    { platform: "twitter" as const, url: "https://x.com/Clavicular", handle: "@Clavicular" },
    { platform: "instagram" as const, url: "https://instagram.com/Clavicular", handle: "@Clavicular" },
    { platform: "tiktok" as const, url: "https://tiktok.com/@Clavicular", handle: "@Clavicular" },
  ],
  wishlists = [
    {
      id: "studio-gear",
      name: "Studio Gear",
      description: "Everything I need to level up my recording setup",
      items: [
        { id: "1", title: "Ableton Push 3", status: "active" as const },
        { id: "2", title: "Universal Audio Apollo X4", status: "active" as const },
        { id: "3", title: "Bose Solo Soundbar", status: "gifted" as const, giftedBy: "Anonymous" },
      ],
    },
    {
      id: "dream-items",
      name: "Dream Items",
      description: "Big ticket items on my bucket list",
      items: [
        { id: "4", title: "Cybertruck", status: "active" as const },
        { id: "5", title: "Rolex Submariner", status: "active" as const },
      ],
    },
    {
      id: "fitness",
      name: "Fitness & Health",
      items: [
        { id: "6", title: "Pull-up Bar Station", status: "active" as const },
        { id: "7", title: "Theragun Pro", status: "gifted" as const, giftedBy: "boogerbill01" },
        { id: "8", title: "Adjustable Dumbbell Set", status: "active" as const },
        { id: "9", title: "Yoga Mat Pro", status: "gifted" as const, giftedBy: "Anonymous" },
      ],
    },
  ],
  onViewWishlist,
}: CreatorProfileProps) {
  const [showQuickTip, setShowQuickTip] = useState(false);
  const [selectedTipAmount, setSelectedTipAmount] = useState<number>(10);
  const [customTipAmount, setCustomTipAmount] = useState("");
  const [selectedWishlistId, setSelectedWishlistId] = useState<string | null>(null);
  const [selectedTipItem, setSelectedTipItem] = useState<string | null>(null);
  const [tipConfirmed, setTipConfirmed] = useState(false);
  const [feedFilter, setFeedFilter] = useState<"all" | "youtube" | "twitch" | "twitter" | "instagram" | "tiktok">("all");

  const filteredFeed = feedFilter === "all" ? feedItems : feedItems.filter(item => item.platform === feedFilter);

  const selectedWishlist = wishlists.find(w => w.id === selectedWishlistId);
  const activeItemsInSelected = selectedWishlist?.items.filter(i => i.status === "active") ?? [];

  const handleConfirmTip = () => {
    const amount = selectedTipAmount ?? (customTipAmount ? parseFloat(customTipAmount) : 0);
    if (!selectedTipItem || amount <= 0) return;
    setTipConfirmed(true);
    setTimeout(() => {
      setTipConfirmed(false);
      setShowQuickTip(false);
      setSelectedWishlistId(null);
      setSelectedTipItem(null);
      setSelectedTipAmount(10);
      setCustomTipAmount("");
    }, 2000);
  };

  return (
    <div className="min-h-screen bg-background text-foreground">
      {/* Hero Section */}
      <div className="relative w-full pt-[57px]">
        <div className="relative w-full h-[420px] overflow-hidden">
          {profileImage ? (
            <img
              src={profileImage}
              alt={creatorName}
              className="absolute inset-0 w-full h-full object-cover"
            />
          ) : (
            <div className="absolute inset-0 bg-gradient-to-br from-[#4a3060] via-[#5a3a6a] to-[#3a2848]" />
          )}
          <div className="absolute inset-0 bg-gradient-to-t from-black/70 via-black/30 to-transparent" />

          {!profileImage && (
            <div className="absolute inset-0 flex items-center justify-center">
              <User className="w-48 h-48 text-white/20" />
            </div>
          )}

          {/* Creator info overlay */}
          <div className="absolute bottom-0 left-0 right-0 p-8">
            <motion.div
              initial={{ opacity: 0, y: 20 }}
              animate={{ opacity: 1, y: 0 }}
              transition={{ duration: 0.5 }}
            >
              <h1 className="text-4xl font-black text-white mb-1">{creatorName}</h1>
              <p className="text-[#22c55e] text-sm font-bold mb-3">
                Ranked #{rank} Globally
              </p>
              <p className="text-white/80 text-sm max-w-lg leading-relaxed mb-6">
                {description}
              </p>

              {/* Action buttons */}
              <div className="flex items-center gap-3 flex-wrap">
                <button
                  onClick={() => setShowQuickTip(true)}
                  className="px-6 py-2.5 text-sm font-black bg-[#22c55e] hover:bg-[#16a34a] text-white transition-all uppercase tracking-wider flex items-center gap-2"
                >
                  <Zap className="w-4 h-4" />
                  Quick Tip
                </button>
                <button className="px-5 py-2.5 text-sm font-black border-2 border-white bg-transparent text-white hover:bg-white hover:text-black transition-all uppercase tracking-wider">
                  Follow
                </button>
              </div>

              {/* Connected Platforms */}
              {connectedPlatforms.length > 0 && (
                <div className="flex items-center gap-2 mt-4 flex-wrap">
                  {connectedPlatforms.map((cp) => {
                    const config = platformConfig[cp.platform];
                    const brandIcon = platformBrandIcons[cp.platform];
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
                          {brandIcon}
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

      {/* Content Rows */}
      <div className="max-w-7xl mx-auto px-6 py-8 space-y-10">
        {/* Recent Events */}
        <motion.section
          initial={{ opacity: 0, y: 20 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ duration: 0.5, delay: 0.1 }}
        >
          <h2 className="text-xs font-black uppercase tracking-widest text-subtle mb-4">Recent Events</h2>
          <div className="flex gap-4 overflow-x-auto pb-2 scrollbar-hide">
            {recentEvents.map((event, index) => (
              <motion.div
                key={index}
                initial={{ opacity: 0, scale: 0.95 }}
                animate={{ opacity: 1, scale: 1 }}
                transition={{ duration: 0.3, delay: 0.15 + index * 0.05 }}
                className="flex-shrink-0 w-40 h-28 bg-muted border border-border overflow-hidden cursor-pointer group hover:border-accent/50 transition-colors"
              >
                {event.thumbnail ? (
                  <img src={event.thumbnail} alt={event.title} className="w-full h-full object-cover group-hover:scale-105 transition-transform" />
                ) : (
                  <div className="w-full h-full bg-gradient-to-br from-muted to-secondary flex items-center justify-center">
                    <User className="w-10 h-10 text-subtle" />
                  </div>
                )}
              </motion.div>
            ))}
          </div>
        </motion.section>

        {/* Recent Feed */}
        <motion.section
          initial={{ opacity: 0, y: 20 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ duration: 0.5, delay: 0.15 }}
        >
          <div className="flex items-center justify-between mb-4">
            <h2 className="text-xs font-black uppercase tracking-widest text-subtle">Recent Feed</h2>
          </div>

          {/* Platform filter tabs */}
          <div className="flex gap-2 mb-5 overflow-x-auto pb-1 scrollbar-hide">
            <button
              onClick={() => setFeedFilter("all")}
              className={`px-4 py-1.5 text-xs font-bold uppercase tracking-wider transition-colors flex-shrink-0 ${
                feedFilter === "all"
                  ? "bg-foreground text-background"
                  : "bg-muted text-subtle hover:text-foreground"
              }`}
            >
              All
            </button>
            {(Object.keys(platformConfig) as Array<keyof typeof platformConfig>).map((platform) => {
              const config = platformConfig[platform];
              const Icon = config.icon;
              return (
                <button
                  key={platform}
                  onClick={() => setFeedFilter(platform)}
                  className={`px-4 py-1.5 text-xs font-bold uppercase tracking-wider transition-colors flex items-center gap-1.5 flex-shrink-0 ${
                    feedFilter === platform
                      ? "text-white"
                      : "bg-muted text-subtle hover:text-foreground"
                  }`}
                  style={feedFilter === platform ? { backgroundColor: config.color } : undefined}
                >
                  <Icon className="w-3.5 h-3.5" />
                  {config.label}
                </button>
              );
            })}
          </div>

          {/* Feed grid */}
          <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 xl:grid-cols-4 gap-4">
            {filteredFeed.map((item, index) => {
              const config = platformConfig[item.platform];
              const Icon = config.icon;
              return (
                <motion.div
                  key={index}
                  initial={{ opacity: 0, y: 15 }}
                  animate={{ opacity: 1, y: 0 }}
                  transition={{ duration: 0.3, delay: index * 0.04 }}
                  className="bg-background border border-border overflow-hidden group cursor-pointer hover:border-accent/40 hover:shadow-md transition-all"
                >
                  <div className="relative w-full h-36 bg-muted flex items-center justify-center">
                    {item.thumbnail ? (
                      <img src={item.thumbnail} alt={item.title} className="w-full h-full object-cover group-hover:scale-105 transition-transform" />
                    ) : (
                      <div className="w-full h-full bg-gradient-to-br from-muted to-secondary flex items-center justify-center">
                        <Icon className="w-10 h-10" style={{ color: config.color, opacity: 0.4 }} />
                      </div>
                    )}
                    <div
                      className="absolute top-2 left-2 px-2 py-0.5 flex items-center gap-1 text-white text-[9px] font-black uppercase"
                      style={{ backgroundColor: config.color }}
                    >
                      <Icon className="w-3 h-3" />
                      {config.label}
                    </div>
                    {item.isLive && (
                      <div className="absolute top-2 right-2 px-2 py-0.5 bg-red-600 text-white text-[9px] font-black uppercase flex items-center gap-1">
                        <span className="w-1.5 h-1.5 bg-white rounded-full animate-pulse" />
                        Live
                      </div>
                    )}
                    {!item.isLive && (
                      <div className="absolute bottom-2 right-2 px-2 py-0.5 bg-black/60 text-white text-[9px] font-bold uppercase">
                        {item.type}
                      </div>
                    )}
                  </div>
                  <div className="p-3">
                    <h3 className="text-sm font-bold text-foreground leading-tight line-clamp-2 mb-2 group-hover:text-accent transition-colors">
                      {item.title}
                    </h3>
                    <div className="flex items-center justify-between">
                      <span className="text-[11px] text-subtle">{item.timestamp}</span>
                      <div className="flex items-center gap-3 text-subtle text-[11px]">
                        {item.views && (
                          <span className="flex items-center gap-1">
                            <Eye className="w-3 h-3" /> {item.views}
                          </span>
                        )}
                        {item.likes && (
                          <span className="flex items-center gap-1">
                            <Heart className="w-3 h-3" /> {item.likes}
                          </span>
                        )}
                        {item.comments && (
                          <span className="flex items-center gap-1">
                            <MessageCircle className="w-3 h-3" /> {item.comments}
                          </span>
                        )}
                      </div>
                    </div>
                  </div>
                </motion.div>
              );
            })}
          </div>

          {filteredFeed.length === 0 && (
            <div className="text-center py-12 text-subtle text-sm">
              No posts from this platform yet.
            </div>
          )}
        </motion.section>

        {/* Wishlists */}
        {wishlists.map((wishlist, wIndex) => {
          const activeCount = wishlist.items.filter(i => i.status === "active").length;
          const giftedCount = wishlist.items.filter(i => i.status === "gifted").length;
          return (
            <motion.section
              key={wishlist.id}
              initial={{ opacity: 0, y: 20 }}
              animate={{ opacity: 1, y: 0 }}
              transition={{ duration: 0.5, delay: 0.2 + wIndex * 0.05 }}
            >
              <div className="flex items-center justify-between mb-4">
                <div>
                  <h2 className="text-xs font-black uppercase tracking-widest text-subtle mb-1">{wishlist.name}</h2>
                  <div className="flex items-center gap-3 text-[11px] text-subtle">
                    <span>{wishlist.items.length} items</span>
                    <span>{activeCount} active</span>
                    {giftedCount > 0 && <span className="text-[#22c55e]">{giftedCount} gifted</span>}
                  </div>
                </div>
                <button
                  onClick={() => onViewWishlist?.(wishlist.id)}
                  className="flex items-center gap-1.5 px-3 py-1.5 text-xs font-bold text-subtle hover:text-foreground border border-border hover:border-accent/40 transition-colors"
                >
                  View All
                  <ChevronRight className="w-3.5 h-3.5" />
                </button>
              </div>
              <div className="flex gap-4 overflow-x-auto pb-2 scrollbar-hide">
                {wishlist.items.map((item, index) => (
                  <motion.div
                    key={item.id}
                    initial={{ opacity: 0, scale: 0.95 }}
                    animate={{ opacity: 1, scale: 1 }}
                    transition={{ duration: 0.3, delay: 0.25 + index * 0.05 }}
                    onClick={() => onViewWishlist?.(wishlist.id)}
                    className="flex-shrink-0 w-44 bg-background border border-border overflow-hidden cursor-pointer group hover:border-accent/50 hover:shadow-md transition-all"
                  >
                    <div className="relative w-full h-32 bg-muted flex items-center justify-center">
                      {item.thumbnail ? (
                        <img src={item.thumbnail} alt={item.title} className="w-full h-full object-cover group-hover:scale-105 transition-transform" />
                      ) : (
                        <User className="w-10 h-10 text-[#d0d0d0]" />
                      )}
                      {item.status === "gifted" && (
                        <div className="absolute top-2 right-2 px-1.5 py-0.5 bg-[#22c55e] text-white text-[9px] font-black uppercase flex items-center gap-1">
                          <Check className="w-2.5 h-2.5" /> Gifted
                        </div>
                      )}
                    </div>
                    <div className="p-3">
                      <h3 className="text-xs font-bold text-foreground leading-tight line-clamp-2 group-hover:text-accent transition-colors">
                        {item.title}
                      </h3>
                    </div>
                  </motion.div>
                ))}
              </div>
            </motion.section>
          );
        })}
      </div>

      {/* Quick Tip Modal */}
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
                <motion.div
                  initial={{ scale: 0 }}
                  animate={{ scale: 1 }}
                  transition={{ type: "spring", stiffness: 300, damping: 20 }}
                  className="w-16 h-16 bg-[#22c55e] mx-auto mb-4 flex items-center justify-center"
                >
                  <Check className="w-8 h-8 text-white" />
                </motion.div>
                <h3 className="text-lg font-black text-foreground mb-1">Tip Sent!</h3>
                <p className="text-subtle text-sm">Your contribution to {creatorName} has been recorded.</p>
              </div>
            ) : (
              <>
                {/* Header */}
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
                  <button
                    onClick={() => setShowQuickTip(false)}
                    className="w-8 h-8 flex items-center justify-center text-subtle hover:text-foreground transition-colors"
                  >
                    <X className="w-5 h-5" />
                  </button>
                </div>

                {/* Step 1: Select Wishlist */}
                <div className="p-5 border-b border-border">
                  <div className="text-[10px] font-black uppercase tracking-widest text-subtle mb-3">
                    1. Choose a wishlist
                  </div>
                  <div className="space-y-2 max-h-36 overflow-y-auto">
                    {wishlists.map((wishlist) => {
                      const activeCount = wishlist.items.filter(i => i.status === "active").length;
                      if (activeCount === 0) return null;
                      return (
                        <button
                          key={wishlist.id}
                          onClick={() => { setSelectedWishlistId(wishlist.id); setSelectedTipItem(null); }}
                          className={`w-full text-left p-3 border transition-colors flex items-center gap-3 ${
                            selectedWishlistId === wishlist.id
                              ? "border-accent bg-accent/5"
                              : "border-border hover:border-accent/40"
                          }`}
                        >
                          <div className="w-8 h-8 bg-muted flex items-center justify-center flex-shrink-0">
                            <List className="w-3.5 h-3.5 text-accent" />
                          </div>
                          <div className="flex-1 min-w-0">
                            <span className="text-sm font-bold text-foreground block truncate">{wishlist.name}</span>
                            <span className="text-[11px] text-subtle">{activeCount} active items</span>
                          </div>
                          {selectedWishlistId === wishlist.id && (
                            <Check className="w-4 h-4 text-accent flex-shrink-0" />
                          )}
                        </button>
                      );
                    })}
                  </div>
                </div>

                {/* Step 2: Select Item (only if wishlist selected) */}
                <div className={`p-5 border-b border-border ${!selectedWishlistId ? "opacity-40 pointer-events-none" : ""}`}>
                  <div className="text-[10px] font-black uppercase tracking-widest text-subtle mb-3">
                    2. Choose an item
                  </div>
                  <div className="space-y-2 max-h-36 overflow-y-auto">
                    {activeItemsInSelected.length > 0 ? (
                      activeItemsInSelected.map((item) => (
                        <button
                          key={item.id}
                          onClick={() => setSelectedTipItem(item.id)}
                          className={`w-full text-left p-3 border transition-colors flex items-center gap-3 ${
                            selectedTipItem === item.id
                              ? "border-accent bg-accent/5"
                              : "border-border hover:border-accent/40"
                          }`}
                        >
                          <div className="w-8 h-8 bg-muted flex items-center justify-center flex-shrink-0">
                            <ArrowUp className="w-3.5 h-3.5 text-accent" />
                          </div>
                          <span className="text-sm font-bold text-foreground truncate">{item.title}</span>
                          {selectedTipItem === item.id && (
                            <Check className="w-4 h-4 text-accent ml-auto flex-shrink-0" />
                          )}
                        </button>
                      ))
                    ) : (
                      <p className="text-subtle text-sm text-center py-4">
                        {selectedWishlistId ? "No active items in this wishlist." : "Select a wishlist first."}
                      </p>
                    )}
                  </div>
                </div>

                {/* Step 3: Select Amount */}
                <div className={`p-5 border-b border-border ${!selectedTipItem ? "opacity-40 pointer-events-none" : ""}`}>
                  <div className="text-[10px] font-black uppercase tracking-widest text-subtle mb-3">3. Tip amount</div>
                  <div className="flex flex-wrap gap-2 mb-3">
                    {[5, 10, 25, 50, 100].map((amount) => (
                      <button
                        key={amount}
                        onClick={() => { setSelectedTipAmount(amount); setCustomTipAmount(""); }}
                        className={`px-4 py-2 text-sm font-bold border transition-colors ${
                          selectedTipAmount === amount
                            ? "border-accent bg-accent text-white"
                            : "border-border text-foreground hover:border-accent/40"
                        }`}
                      >
                        ${amount}
                      </button>
                    ))}
                  </div>
                  <div className="relative">
                    <DollarSign className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-subtle" />
                    <input
                      type="number"
                      min="1"
                      step="0.01"
                      placeholder="Custom amount"
                      value={customTipAmount}
                      onChange={(e) => { setCustomTipAmount(e.target.value); setSelectedTipAmount(0); }}
                      className="w-full pl-9 pr-4 py-2.5 bg-muted border border-border text-foreground text-sm font-medium placeholder-subtle focus:outline-none focus:ring-2 focus:ring-accent"
                    />
                  </div>
                </div>

                {/* Confirm */}
                <div className="p-5">
                  <button
                    onClick={handleConfirmTip}
                    disabled={!selectedTipItem || (!selectedTipAmount && !customTipAmount)}
                    className="w-full py-3 bg-[#22c55e] hover:bg-[#16a34a] disabled:opacity-40 disabled:cursor-not-allowed text-white text-xs font-black uppercase tracking-widest transition-colors flex items-center justify-center gap-2"
                  >
                    <Zap className="w-4 h-4" />
                    {selectedTipAmount
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