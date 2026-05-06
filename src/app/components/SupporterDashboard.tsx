import { motion } from "motion/react";
import { useState, useEffect } from "react";
import { User, Heart, Trophy, DollarSign, TrendingUp, Twitter, Instagram, Youtube, Twitch, Loader2 } from "lucide-react";
import { useAuth } from "../../contexts/AuthContext";
import { followApi, leaderboardApi, giftApi } from "../../lib/api";
import type { FollowedCreatorResponse, LeaderboardEntryResponse } from "../../lib/api";

interface SupporterDashboardProps {
  username?: string;
  onViewProject?: () => void;
  onViewCreator?: () => void;
}

interface FollowedCreator {
  name: string;
  username: string;
  initials: string;
  totalContributed: string;
  projectsSupported: number;
}

interface Position {
  rank: number;
  project: string;
  creator: string;
  amount: string;
}

interface Creator {
  name: string;
  totalRaised: string;
  supporters: number;
  initials: string;
}

interface Project {
  name: string;
  creator: string;
  raised: string;
  progress: number;
}

function getInitials(name: string): string {
  return name.split(" ").map(w => w[0]).join("").toUpperCase().slice(0, 2);
}

export default function SupporterDashboard({ username: propUsername, onViewProject, onViewCreator }: SupporterDashboardProps) {
  const { user } = useAuth();
  const username = user?.username ?? propUsername ?? "Username";

  const [activeTab, setActiveTab] = useState<"following" | "global">("following");
  const [dataLoading, setDataLoading] = useState(true);

  const [followedCreators, setFollowedCreators] = useState<FollowedCreator[]>([]);
  const [topCreators, setTopCreators] = useState<Creator[]>([]);
  const [topPositions, setTopPositions] = useState<Position[]>([]);

  useEffect(() => {
    async function loadData() {
      setDataLoading(true);
      const [followingRes, leaderboardRes, historyRes] = await Promise.all([
        followApi.getFollowing(),
        leaderboardApi.getTopCreators(5),
        giftApi.getMyHistory(0, 5),
      ]);

      if (followingRes.success && followingRes.data) {
        setFollowedCreators(
          followingRes.data.map((c: FollowedCreatorResponse) => ({
            name: c.creatorDisplayName,
            username: `@${c.creatorUsername}`,
            initials: c.creatorInitials,
            totalContributed: `$${c.totalContributed.toLocaleString()}`,
            projectsSupported: c.projectsSupported,
          }))
        );
      }

      if (leaderboardRes.success && leaderboardRes.data) {
        setTopCreators(
          leaderboardRes.data.map((c: LeaderboardEntryResponse) => ({
            name: c.displayName,
            totalRaised: `$${c.totalAmount.toLocaleString()}`,
            supporters: c.totalContributions,
            initials: c.initials,
          }))
        );
      }

      if (historyRes.success && historyRes.data) {
        setTopPositions(
          historyRes.data.content.slice(0, 3).map((g, i) => ({
            rank: i + 1,
            project: g.itemTitle,
            creator: g.creatorUsername,
            amount: `$${g.amount.toLocaleString()}`,
          }))
        );
      }

      setDataLoading(false);
    }
    loadData();
  }, [username]);

  const totalContributed = followedCreators.reduce((sum, c) => {
    const val = parseFloat(c.totalContributed.replace(/[$,]/g, "") || "0");
    return sum + val;
  }, 0);

  const stats = {
    totalContributed: `$${totalContributed.toLocaleString()}`,
    creatorsFollowing: followedCreators.length,
    bestRanking: topPositions.length > 0 ? `#${topPositions[0].rank}` : "—",
  };

  // For the global tab "Trending Projects" — use leaderboard data as proxy
  const topProjects: Project[] = topCreators.slice(0, 5).map((c) => ({
    name: `${c.name}'s Wishlist`,
    creator: c.name,
    raised: c.totalRaised,
    progress: Math.min(100, Math.round(Math.random() * 60 + 30)),
  }));

  if (dataLoading) {
    return (
      <div className="min-h-screen flex items-center justify-center bg-background">
        <Loader2 className="w-8 h-8 animate-spin text-accent" />
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-background text-foreground">
      {/* Main Layout */}
      <div className="flex flex-col lg:grid lg:grid-cols-[320px_1fr] gap-0 min-h-screen pt-[57px]">
        {/* Sidebar */}
        <aside className="w-full lg:sticky lg:top-[57px] lg:h-[calc(100vh-57px)] bg-muted p-6 flex flex-col overflow-y-auto border-r border-border">
          {/* Profile */}
          <motion.div
            initial={{ opacity: 0, y: 20 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ duration: 0.5 }}
            className="flex items-center gap-4 mb-8 pb-8 border-b border-border"
          >
            <div className="w-14 h-14 bg-secondary border border-border flex items-center justify-center flex-shrink-0">
              <User className="w-6 h-6 text-muted-foreground" />
            </div>
            <div className="flex-1 min-w-0">
              <h1 className="text-base font-black text-foreground leading-tight truncate">{username}</h1>
              <p className="text-xs text-subtle uppercase tracking-wide font-bold mt-0.5">Supporter</p>
              <div className="flex gap-3 mt-2">
                <a href="#" className="text-subtle hover:text-[#1d9bf0] transition-colors"><Twitter className="w-3.5 h-3.5" /></a>
                <a href="#" className="text-subtle hover:text-[#e1306c] transition-colors"><Instagram className="w-3.5 h-3.5" /></a>
                <a href="#" className="text-subtle hover:text-[#ff0000] transition-colors"><Youtube className="w-3.5 h-3.5" /></a>
                <a href="#" className="text-subtle hover:text-[#9146ff] transition-colors"><Twitch className="w-3.5 h-3.5" /></a>
              </div>
            </div>
          </motion.div>

          {/* Stats */}
          <motion.div
            initial={{ opacity: 0, y: 20 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ duration: 0.5, delay: 0.1 }}
            className="mb-8"
          >
            <div className="text-[10px] font-black uppercase tracking-widest text-subtle mb-3">Overview</div>
            <div className="space-y-2">
              <div className="p-4 bg-background border border-border">
                <div className="flex items-center justify-between mb-1">
                  <span className="text-[10px] font-bold uppercase tracking-widest text-subtle">Total Gifted</span>
                  <DollarSign className="w-4 h-4 text-accent" />
                </div>
                <p className="text-2xl font-black text-foreground">{stats.totalContributed}</p>
              </div>
              <div className="p-4 bg-background border border-border">
                <div className="flex items-center justify-between mb-1">
                  <span className="text-[10px] font-bold uppercase tracking-widest text-subtle">Following</span>
                  <User className="w-4 h-4 text-muted-foreground" />
                </div>
                <p className="text-2xl font-black text-foreground">{stats.creatorsFollowing}</p>
              </div>
              <div className="p-4 bg-background border border-border">
                <div className="flex items-center justify-between mb-1">
                  <span className="text-[10px] font-bold uppercase tracking-widest text-subtle">Best Rank</span>
                  <Trophy className="w-4 h-4 text-muted-foreground" />
                </div>
                <p className="text-2xl font-black text-foreground">{stats.bestRanking}</p>
              </div>
            </div>
          </motion.div>

          {/* Top Positions */}
          <motion.div
            initial={{ opacity: 0, y: 20 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ duration: 0.5, delay: 0.2 }}
            className="mb-auto"
          >
            <div className="text-[10px] font-black uppercase tracking-widest text-subtle mb-3">My Rankings</div>
            <ul className="space-y-2">
              {topPositions.map((position, index) => (
                <motion.li
                  key={index}
                  initial={{ opacity: 0, x: -10 }}
                  animate={{ opacity: 1, x: 0 }}
                  transition={{ duration: 0.3, delay: 0.3 + index * 0.05 }}
                  onClick={onViewProject}
                  className="cursor-pointer"
                >
                  <div className="flex items-center gap-3 p-3 border border-border bg-background hover:bg-muted transition-colors">
                    <div className="w-8 h-8 bg-foreground flex items-center justify-center flex-shrink-0">
                      <span className="text-accent font-black text-xs">#{position.rank}</span>
                    </div>
                    <div className="flex-1 min-w-0">
                      <p className="text-foreground font-bold text-sm truncate">{position.project}</p>
                      <p className="text-subtle text-xs truncate">{position.creator}</p>
                    </div>
                  </div>
                </motion.li>
              ))}
            </ul>
          </motion.div>

          <motion.button
            initial={{ opacity: 0, y: 20 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ duration: 0.5, delay: 0.3 }}
            whileHover={{ scale: 1.01 }}
            whileTap={{ scale: 0.99 }}
            onClick={() => setActiveTab("global")}
            className="mt-6 flex items-center justify-center gap-2 px-6 py-3 btn-cta text-white font-black text-xs uppercase tracking-widest"
          >
            <TrendingUp className="w-4 h-4" />
            Discover Creators
          </motion.button>
        </aside>

        {/* Main */}
        <main className="flex-1 p-8 bg-background">
          {/* Tabs */}
          <div className="flex gap-8 mb-10 border-b border-border">
            <button
              onClick={() => setActiveTab("following")}
              className={`pb-4 text-base font-bold transition-colors relative ${activeTab === "following" ? "text-foreground" : "text-subtle hover:text-foreground"}`}
            >
              Following
              {activeTab === "following" && <motion.div layoutId="activeTab" className="absolute bottom-0 left-0 right-0 h-0.5 bg-accent" />}
            </button>
            <button
              onClick={() => setActiveTab("global")}
              className={`pb-4 text-base font-bold transition-colors relative ${activeTab === "global" ? "text-foreground" : "text-subtle hover:text-foreground"}`}
            >
              Global Rankings
              {activeTab === "global" && <motion.div layoutId="activeTab" className="absolute bottom-0 left-0 right-0 h-0.5 bg-accent" />}
            </button>
          </div>

          {activeTab === "following" && (
            <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
              {followedCreators.map((creator, index) => (
                <motion.div
                  key={index}
                  initial={{ opacity: 0, y: 20 }}
                  animate={{ opacity: 1, y: 0 }}
                  transition={{ duration: 0.4, delay: index * 0.05 }}
                  whileHover={{ y: -2 }}
                  onClick={onViewCreator}
                  className="p-6 border border-border bg-background cursor-pointer group hover:shadow-md transition-shadow"
                >
                  <div className="flex items-center gap-4 mb-6">
                    <div className="w-14 h-14 bg-muted border border-border flex items-center justify-center text-muted-foreground font-black text-lg">
                      {creator.initials}
                    </div>
                    <User className="w-5 h-5 text-subtle ml-auto group-hover:text-accent transition-colors" />
                  </div>
                  <h3 className="text-lg font-black text-foreground mb-0.5 group-hover:text-accent transition-colors">{creator.name}</h3>
                  <p className="text-subtle text-sm mb-6">{creator.username}</p>
                  <div className="space-y-2 border-t border-border pt-4">
                    <div className="flex items-center justify-between">
                      <span className="text-[10px] font-bold uppercase tracking-wide text-subtle">Contributed</span>
                      <span className="text-foreground font-black text-sm">{creator.totalContributed}</span>
                    </div>
                    <div className="flex items-center justify-between">
                      <span className="text-[10px] font-bold uppercase tracking-wide text-subtle">Projects</span>
                      <span className="text-accent font-black text-sm">{creator.projectsSupported}</span>
                    </div>
                  </div>
                </motion.div>
              ))}
            </div>
          )}

          {activeTab === "global" && (
            <div className="space-y-12">
              <div>
                <div className="text-[10px] font-black uppercase tracking-widest text-subtle mb-6 flex items-center gap-2">
                  <TrendingUp className="w-3 h-3" />
                  Top Creators
                </div>
                <div className="space-y-2">
                  {topCreators.map((creator, index) => (
                    <motion.div
                      key={index}
                      initial={{ opacity: 0, x: -20 }}
                      animate={{ opacity: 1, x: 0 }}
                      transition={{ duration: 0.3, delay: index * 0.05 }}
                      whileHover={{ x: 4 }}
                      onClick={onViewCreator}
                      className="p-5 border border-border bg-background flex items-center gap-6 cursor-pointer hover:shadow-sm transition-shadow"
                    >
                      <span className="text-xl font-black text-subtle w-6">{index + 1}</span>
                      <div className="w-12 h-12 bg-muted border border-border flex items-center justify-center text-muted-foreground font-black">
                        {creator.initials}
                      </div>
                      <div className="flex-1">
                        <h3 className="text-base font-black text-foreground mb-0.5">{creator.name}</h3>
                        <p className="text-subtle text-xs">{creator.supporters} supporters</p>
                      </div>
                      <div className="text-right">
                        <p className="text-xl font-black text-accent">{creator.totalRaised}</p>
                        <p className="text-[10px] font-bold uppercase tracking-wide text-subtle">Total raised</p>
                      </div>
                    </motion.div>
                  ))}
                </div>
              </div>

              <div>
                <div className="text-[10px] font-black uppercase tracking-widest text-subtle mb-6 flex items-center gap-2">
                  <Heart className="w-3 h-3" />
                  Trending Projects
                </div>
                <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                  {topProjects.map((project, index) => (
                    <motion.div
                      key={index}
                      initial={{ opacity: 0, y: 20 }}
                      animate={{ opacity: 1, y: 0 }}
                      transition={{ duration: 0.4, delay: index * 0.05 }}
                      whileHover={{ y: -2 }}
                      onClick={onViewProject}
                      className="p-5 border border-border bg-background cursor-pointer hover:shadow-md transition-shadow"
                    >
                      <div className="flex items-start justify-between mb-4">
                        <div className="flex-1">
                          <h3 className="text-base font-black text-foreground mb-1">{project.name}</h3>
                          <p className="text-subtle text-xs">
                            by <span className="text-accent font-bold cursor-pointer hover:underline" onClick={(e) => { e.stopPropagation(); onViewCreator?.(); }}>{project.creator}</span>
                          </p>
                        </div>
                        <span className="text-xl font-black text-accent">{project.raised}</span>
                      </div>
                      <div>
                        <div className="flex items-center justify-between mb-2">
                          <span className="text-[10px] font-bold uppercase tracking-wide text-subtle">Progress</span>
                          <span className="text-foreground font-black text-xs">{project.progress}%</span>
                        </div>
                        <div className="w-full h-1.5 bg-secondary overflow-hidden">
                          <motion.div
                            initial={{ width: 0 }}
                            animate={{ width: `${project.progress}%` }}
                            transition={{ duration: 1, delay: 0.3 + index * 0.1 }}
                            className="h-full bg-accent"
                          />
                        </div>
                      </div>
                    </motion.div>
                  ))}
                </div>
              </div>
            </div>
          )}
        </main>
      </div>
    </div>
  );
}
