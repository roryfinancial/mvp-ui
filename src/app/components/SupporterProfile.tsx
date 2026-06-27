import { useState, useEffect } from "react";
import { motion } from "motion/react";
import { User, Zap, Loader2, Users } from "lucide-react";
import { followApi } from "../../lib/api";
import { ImageWithFallback } from "./figma/ImageWithFallback";
import { EmptyState } from "./shared/EmptyState";

interface FollowedCreator {
  id: string;
  name: string;
  username: string;
  initials: string;
  rank?: number;
  profileImage?: string;
  isLive?: boolean;
}

interface ContributionEntry {
  creatorName: string;
  creatorInitials: string;
  itemTitle: string;
  amount: string;
  timestamp: string;
  rank?: number;
}

interface SupporterProfileProps {
  displayName?: string;
  username?: string;
  profileImage?: string;
  totalContributed?: string;
  creatorsFollowing?: number;
  bestRank?: string;
  followedCreators?: FollowedCreator[];
  contributions?: ContributionEntry[];
  onViewCreator?: (creatorId: string) => void;
}

export default function SupporterProfile({
  displayName = "boogerbill01",
  username = "@boogerbill01",
  profileImage,
  totalContributed = "$4,699.79",
  creatorsFollowing = 8,
  bestRank = "#1",
  followedCreators: followedCreatorsProp,
  contributions = [
    { creatorName: "Clavicular", creatorInitials: "CL", itemTitle: "Ableton Push 3", amount: "$250", timestamp: "2 days ago", rank: 1 },
    { creatorName: "Alex Creative", creatorInitials: "AC", itemTitle: "New Streaming Setup", amount: "$150", timestamp: "1 week ago", rank: 2 },
    { creatorName: "Sarah Designs", creatorInitials: "SD", itemTitle: "Art Studio Equipment", amount: "$100", timestamp: "2 weeks ago", rank: 5 },
    { creatorName: "Clavicular", creatorInitials: "CL", itemTitle: "Cybertruck", amount: "$500", timestamp: "3 weeks ago", rank: 1 },
    { creatorName: "Mike Studios", creatorInitials: "MS", itemTitle: "Music Production Tools", amount: "$75", timestamp: "1 month ago", rank: 3 },
  ],
  onViewCreator,
}: SupporterProfileProps) {
  const [fetchedCreators, setFetchedCreators] = useState<FollowedCreator[]>([]);
  const [loadingFollowing, setLoadingFollowing] = useState(!followedCreatorsProp);

  useEffect(() => {
    if (followedCreatorsProp) return;
    followApi.getFollowing().then(res => {
      if (res.success && res.data) {
        setFetchedCreators(res.data.map(c => ({
          id: c.creatorUsername,
          name: c.creatorDisplayName,
          username: `@${c.creatorUsername}`,
          initials: c.creatorInitials,
          profileImage: c.creatorAvatarUrl ?? undefined,
        })));
      }
    }).catch(() => {}).finally(() => setLoadingFollowing(false));
  }, [followedCreatorsProp]);

  const followedCreators = followedCreatorsProp ?? fetchedCreators;

  const getRankColor = (rank: number) => {
    if (rank === 1) return "#FFD700";
    if (rank === 2) return "#C0C0C0";
    if (rank === 3) return "#CD7F32";
    return undefined;
  };

  return (
    <div className="min-h-screen bg-background text-foreground">
      {/* Hero Section */}
      <div className="relative w-full pt-[57px]">
        <div className="relative w-full h-[320px] overflow-hidden">
          {profileImage ? (
            <ImageWithFallback src={profileImage} alt={displayName} className="absolute inset-0 w-full h-full object-cover" />
          ) : (
            <div className="absolute inset-0 bg-gradient-to-br from-[#1a1a3e] via-[#2a1a4e] to-[#0e0e2e]" />
          )}
          <div className="absolute inset-0 bg-gradient-to-t from-black/70 via-black/30 to-transparent" />

          {!profileImage && (
            <div className="absolute inset-0 flex items-center justify-center">
              <User className="w-36 h-36 text-white/10" />
            </div>
          )}

          {/* Info overlay */}
          <div className="absolute bottom-0 left-0 right-0 p-8">
            <motion.div
              initial={{ opacity: 0, y: 20 }}
              animate={{ opacity: 1, y: 0 }}
              transition={{ duration: 0.5 }}
            >
              <div className="flex items-end gap-6">
                <div className="flex-1">
                  <p className="text-[10px] font-black uppercase tracking-widest text-white/50 mb-1">Supporter</p>
                  <h1 className="text-4xl font-black text-white mb-1">{displayName}</h1>
                  <p className="text-white/50 text-sm mb-4">{username}</p>
                </div>
                {/* Stats */}
                <div className="hidden sm:flex items-center gap-6 pb-1">
                  <div className="text-center">
                    <p className="text-2xl font-black text-white">{totalContributed}</p>
                    <p className="text-[10px] font-bold uppercase tracking-widest text-white/50">Total Gifted</p>
                  </div>
                  <div className="w-px h-10 bg-white/20" />
                  <div className="text-center">
                    <p className="text-2xl font-black text-white">{followedCreators.length || creatorsFollowing}</p>
                    <p className="text-[10px] font-bold uppercase tracking-widest text-white/50">Following</p>
                  </div>
                  <div className="w-px h-10 bg-white/20" />
                  <div className="text-center">
                    <p className="text-2xl font-black text-[#FFD700]">{bestRank}</p>
                    <p className="text-[10px] font-bold uppercase tracking-widest text-white/50">Best Rank</p>
                  </div>
                </div>
              </div>
            </motion.div>
          </div>
        </div>
      </div>

      {/* Content */}
      <div className="max-w-7xl mx-auto px-6 py-8 space-y-10">
        {/* Mobile stats */}
        <div className="flex sm:hidden gap-3">
          <div className="flex-1 p-4 bg-muted border border-border text-center">
            <p className="text-lg font-black text-foreground">{totalContributed}</p>
            <p className="text-[10px] font-bold uppercase tracking-widest text-subtle">Gifted</p>
          </div>
          <div className="flex-1 p-4 bg-muted border border-border text-center">
            <p className="text-lg font-black text-foreground">{followedCreators.length || creatorsFollowing}</p>
            <p className="text-[10px] font-bold uppercase tracking-widest text-subtle">Following</p>
          </div>
          <div className="flex-1 p-4 bg-muted border border-border text-center">
            <p className="text-lg font-black text-[#FFD700]">{bestRank}</p>
            <p className="text-[10px] font-bold uppercase tracking-widest text-subtle">Best Rank</p>
          </div>
        </div>

        {/* Following Creators */}
        <motion.section
          initial={{ opacity: 0, y: 20 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ duration: 0.5, delay: 0.1 }}
        >
          <h2 className="text-xs font-black uppercase tracking-widest text-subtle mb-4">Following</h2>
          {loadingFollowing ? (
            <div className="flex items-center justify-center py-8">
              <Loader2 className="w-5 h-5 animate-spin text-muted-foreground" />
            </div>
          ) : followedCreators.length === 0 ? (
            <EmptyState icon={Users} message="Not following anyone yet" sub="Follow creators to see them here." />
          ) : (
          <div className="flex gap-4 overflow-x-auto pb-2 scrollbar-hide">
            {followedCreators.map((creator, index) => (
              <motion.div
                key={creator.id}
                initial={{ opacity: 0, scale: 0.95 }}
                animate={{ opacity: 1, scale: 1 }}
                transition={{ duration: 0.3, delay: 0.15 + index * 0.04 }}
                onClick={() => onViewCreator?.(creator.id)}
                className="flex-shrink-0 w-36 bg-background border border-border overflow-hidden cursor-pointer group hover:border-accent/50 hover:shadow-md transition-all"
              >
                <div className="relative w-full h-24 bg-muted flex items-center justify-center">
                  {creator.profileImage ? (
                    <ImageWithFallback src={creator.profileImage} alt={creator.name} className="w-full h-full object-cover group-hover:scale-105 transition-transform" />
                  ) : (
                    <div className="w-12 h-12 bg-secondary flex items-center justify-center text-foreground font-black text-lg">
                      {creator.initials}
                    </div>
                  )}
                  {creator.isLive && (
                    <div className="absolute top-2 right-2 px-1.5 py-0.5 bg-red-600 text-white text-[8px] font-black uppercase flex items-center gap-1">
                      <span className="w-1 h-1 bg-white rounded-full animate-pulse" />
                      Live
                    </div>
                  )}
                </div>
                <div className="p-2.5">
                  <h3 className="text-xs font-bold text-foreground leading-tight truncate group-hover:text-accent transition-colors">
                    {creator.name}
                  </h3>
                  {creator.rank && (
                    <p className="text-[10px] text-[#22c55e] font-bold mt-0.5">#{creator.rank} Global</p>
                  )}
                </div>
              </motion.div>
            ))}
          </div>
          )}
        </motion.section>

        {/* Contribution History */}
        <motion.section
          initial={{ opacity: 0, y: 20 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ duration: 0.5, delay: 0.15 }}
        >
          <h2 className="text-xs font-black uppercase tracking-widest text-subtle mb-4">Contribution History</h2>
          <div className="space-y-2">
            {contributions.map((entry, index) => (
              <motion.div
                key={index}
                initial={{ opacity: 0, x: -15 }}
                animate={{ opacity: 1, x: 0 }}
                transition={{ duration: 0.3, delay: 0.2 + index * 0.04 }}
                className="flex items-center gap-4 p-4 bg-background border border-border hover:border-accent/30 transition-colors cursor-pointer"
                onClick={() => onViewCreator?.(entry.creatorName.toLowerCase().replace(/\s+/g, ""))}
              >
                {/* Rank badge */}
                {entry.rank && (
                  <div
                    className="w-8 h-8 flex items-center justify-center text-xs font-black text-white flex-shrink-0"
                    style={{ backgroundColor: getRankColor(entry.rank) ?? "var(--accent)" }}
                  >
                    #{entry.rank}
                  </div>
                )}

                {/* Creator avatar */}
                <div className="w-9 h-9 bg-muted border border-border flex items-center justify-center text-foreground font-black text-xs flex-shrink-0">
                  {entry.creatorInitials}
                </div>

                {/* Details */}
                <div className="flex-1 min-w-0">
                  <p className="text-sm font-bold text-foreground truncate">{entry.itemTitle}</p>
                  <p className="text-[11px] text-subtle">{entry.creatorName} · {entry.timestamp}</p>
                </div>

                {/* Amount */}
                <div className="flex items-center gap-1.5 flex-shrink-0">
                  <Zap className="w-3.5 h-3.5 text-[#22c55e]" />
                  <span className="text-sm font-black text-foreground">{entry.amount}</span>
                </div>
              </motion.div>
            ))}
          </div>
        </motion.section>
      </div>
    </div>
  );
}