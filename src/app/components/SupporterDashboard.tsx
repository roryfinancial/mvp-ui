import { motion } from "motion/react";
import { useState } from "react";
import { Search, User, LogOut, Heart, Trophy, DollarSign, TrendingUp, Twitter, Instagram, Youtube, Twitch, LayoutDashboard, Settings as SettingsIcon } from "lucide-react";

interface SupporterDashboardProps {
  username?: string;
  onLogout?: () => void;
  onViewProject?: () => void;
  onViewCreator?: () => void;
  onViewSettings?: () => void;
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

export default function SupporterDashboard({ username = "Username", onLogout, onViewProject, onViewCreator, onViewSettings }: SupporterDashboardProps) {
  const [searchQuery, setSearchQuery] = useState("");
  const [activeTab, setActiveTab] = useState<"following" | "global">("following");
  const [showSearchDropdown, setShowSearchDropdown] = useState(false);

  const searchResults = searchQuery.length > 0 ? {
    creators: [
      { name: "Alex Creative", username: "@alexcreative", initials: "AC" },
      { name: "Sarah Designs", username: "@sarahdesigns", initials: "SD" },
    ],
    projects: [
      { name: "New Streaming Setup", creator: "Alex Creative" },
      { name: "Art Studio Equipment", creator: "Sarah Designs" },
    ],
  } : { creators: [], projects: [] };

  const topPositions: Position[] = [
    { rank: 1, project: "New Streaming Setup", creator: "Alex Creative", amount: "$250" },
    { rank: 3, project: "Art Studio Equipment", creator: "Sarah Designs", amount: "$180" },
    { rank: 12, project: "Music Production Tools", creator: "Mike Studios", amount: "$150" },
  ];

  const followedCreators: FollowedCreator[] = [
    { name: "Alex Creative", username: "@alexcreative", initials: "AC", totalContributed: "$250", projectsSupported: 2 },
    { name: "Sarah Designs", username: "@sarahdesigns", initials: "SD", totalContributed: "$180", projectsSupported: 1 },
    { name: "Mike Studios", username: "@mikestudios", initials: "MS", totalContributed: "$150", projectsSupported: 1 },
  ];

  const topCreators: Creator[] = [
    { name: "Alex Creative", totalRaised: "$12,450", supporters: 234, initials: "AC" },
    { name: "Sarah Designs", totalRaised: "$9,890", supporters: 189, initials: "SD" },
    { name: "Mike Studios", totalRaised: "$7,620", supporters: 156, initials: "MS" },
    { name: "Jordan Lee", totalRaised: "$6,200", supporters: 142, initials: "JL" },
    { name: "Emma Vision", totalRaised: "$5,800", supporters: 128, initials: "EV" },
  ];

  const topProjects: Project[] = [
    { name: "New Streaming Setup", creator: "Alex Creative", raised: "$3,200", progress: 85 },
    { name: "Art Studio Equipment", creator: "Sarah Designs", raised: "$2,100", progress: 65 },
    { name: "Music Production Tools", creator: "Mike Studios", raised: "$1,800", progress: 45 },
    { name: "Photography Gear", creator: "Emma Vision", raised: "$1,500", progress: 38 },
    { name: "Gaming Setup", creator: "Jordan Lee", raised: "$1,200", progress: 30 },
  ];

  const stats = { totalContributed: "$580", creatorsFollowing: followedCreators.length, bestRanking: "#1" };

  return (
    <div className="min-h-screen bg-background text-foreground">
      {/* Navigation */}
      <nav className="fixed top-0 left-0 right-0 z-50 bg-[#0e0e0e] border-b border-accent/40">
        <div className="max-w-full mx-auto px-6 py-4 flex items-center justify-between">
          <div className="flex items-center gap-8">
            <div className="text-xl font-black text-white tracking-tight">TipFlow</div>
            <div className="hidden md:flex items-center gap-1">
              <button className="flex items-center gap-2 px-4 py-2 text-white font-medium text-sm border-b-2 border-accent">
                <LayoutDashboard className="w-4 h-4" />
                Dashboard
              </button>
              <button
                onClick={onViewSettings}
                className="flex items-center gap-2 px-4 py-2 text-white/60 hover:text-white font-medium text-sm transition-colors"
              >
                <SettingsIcon className="w-4 h-4" />
                Settings
              </button>
            </div>
          </div>
          <div className="flex items-center gap-4">
            <div className="relative hidden sm:block">
              <Search className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-white/40 z-10" />
              <input
                type="text"
                placeholder="Search creators or projects"
                value={searchQuery}
                onChange={(e) => { setSearchQuery(e.target.value); setShowSearchDropdown(true); }}
                onFocus={() => setShowSearchDropdown(true)}
                onBlur={() => setTimeout(() => setShowSearchDropdown(false), 200)}
                className="pl-10 pr-4 py-2 bg-white/10 border border-white/20 text-white placeholder-white/30 text-sm focus:outline-none focus:ring-2 focus:ring-accent transition-all w-56"
              />
              {showSearchDropdown && searchQuery.length > 0 && (
                <motion.div
                  initial={{ opacity: 0, y: -10 }}
                  animate={{ opacity: 1, y: 0 }}
                  className="absolute top-full mt-2 left-0 w-72 bg-background border border-border shadow-lg overflow-hidden z-50"
                >
                  {searchResults.creators.length > 0 && (
                    <div className="p-3">
                      <h3 className="text-[10px] font-black uppercase tracking-widest text-subtle mb-2 px-2">Creators</h3>
                      {searchResults.creators.map((creator, index) => (
                        <div key={index} onClick={onViewCreator} className="flex items-center gap-3 p-2 hover:bg-muted cursor-pointer transition-colors">
                          <div className="w-8 h-8 bg-muted border border-border flex items-center justify-center text-foreground font-bold text-xs">{creator.initials}</div>
                          <div className="flex-1">
                            <p className="text-foreground font-medium text-sm">{creator.name}</p>
                            <p className="text-subtle text-xs">{creator.username}</p>
                          </div>
                        </div>
                      ))}
                    </div>
                  )}
                  {searchResults.projects.length > 0 && (
                    <div className="p-3 border-t border-border">
                      <h3 className="text-[10px] font-black uppercase tracking-widest text-subtle mb-2 px-2">Projects</h3>
                      {searchResults.projects.map((project, index) => (
                        <div key={index} onClick={onViewProject} className="flex items-center gap-3 p-2 hover:bg-muted cursor-pointer transition-colors">
                          <div className="w-8 h-8 bg-muted border border-border flex items-center justify-center">
                            <TrendingUp className="w-4 h-4 text-muted-foreground" />
                          </div>
                          <div className="flex-1">
                            <p className="text-foreground font-medium text-sm">{project.name}</p>
                            <p className="text-subtle text-xs">by {project.creator}</p>
                          </div>
                        </div>
                      ))}
                    </div>
                  )}
                  {searchResults.creators.length === 0 && searchResults.projects.length === 0 && (
                    <div className="p-6 text-center text-subtle text-sm">No results for "{searchQuery}"</div>
                  )}
                </motion.div>
              )}
            </div>
            {onLogout && (
              <button onClick={onLogout} className="flex items-center gap-2 px-4 py-2 border border-white/20 text-white hover:bg-white/10 text-sm font-medium transition-colors">
                <LogOut className="w-4 h-4" />
                <span className="hidden sm:inline">Logout</span>
              </button>
            )}
          </div>
        </div>
      </nav>

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
            <div className="w-14 h-14 bg-[#e0e0e0] border border-[#d0d0d0] flex items-center justify-center flex-shrink-0">
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
                    <User className="w-5 h-5 text-[#d0d0d0] ml-auto group-hover:text-accent transition-colors" />
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
                      <span className="text-xl font-black text-[#d0d0d0] w-6">{index + 1}</span>
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
                        <div className="w-full h-1.5 bg-[#e0e0e0] overflow-hidden">
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
