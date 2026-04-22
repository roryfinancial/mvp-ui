import { motion } from "motion/react";
import { useState } from "react";
import { Search, User, LogOut, Heart, Trophy, DollarSign, TrendingUp, Twitter, Instagram, Youtube, Twitch, LayoutDashboard, Settings as SettingsIcon } from "lucide-react";

interface SupporterDashboardProps {
  username?: string;
  creditBalance?: number;
  onLogout?: () => void;
  onViewProject?: () => void;
  onViewCreator?: () => void;
  onViewSettings?: () => void;
  onViewBalance?: () => void;
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

export default function SupporterDashboard({ username = "Username", creditBalance = 0, onLogout, onViewProject, onViewCreator, onViewSettings, onViewBalance }: SupporterDashboardProps) {
  const [searchQuery, setSearchQuery] = useState("");
  const [activeTab, setActiveTab] = useState<"following" | "global">("following");
  const [showSearchDropdown, setShowSearchDropdown] = useState(false);

  // Mock search results
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

  // Mock data for top positions
  const topPositions: Position[] = [
    { rank: 1, project: "New Streaming Setup", creator: "Alex Creative", amount: "$250" },
    { rank: 3, project: "Art Studio Equipment", creator: "Sarah Designs", amount: "$180" },
    { rank: 12, project: "Music Production Tools", creator: "Mike Studios", amount: "$150" },
  ];

  // Mock data for followed creators
  const followedCreators: FollowedCreator[] = [
    { name: "Alex Creative", username: "@alexcreative", initials: "AC", totalContributed: "$250", projectsSupported: 2 },
    { name: "Sarah Designs", username: "@sarahdesigns", initials: "SD", totalContributed: "$180", projectsSupported: 1 },
    { name: "Mike Studios", username: "@mikestudios", initials: "MS", totalContributed: "$150", projectsSupported: 1 },
  ];

  // Mock data for top creators
  const topCreators: Creator[] = [
    { name: "Alex Creative", totalRaised: "$12,450", supporters: 234, initials: "AC" },
    { name: "Sarah Designs", totalRaised: "$9,890", supporters: 189, initials: "SD" },
    { name: "Mike Studios", totalRaised: "$7,620", supporters: 156, initials: "MS" },
    { name: "Jordan Lee", totalRaised: "$6,200", supporters: 142, initials: "JL" },
    { name: "Emma Vision", totalRaised: "$5,800", supporters: 128, initials: "EV" },
  ];

  // Mock data for top projects
  const topProjects: Project[] = [
    { name: "New Streaming Setup", creator: "Alex Creative", raised: "$3,200", progress: 85 },
    { name: "Art Studio Equipment", creator: "Sarah Designs", raised: "$2,100", progress: 65 },
    { name: "Music Production Tools", creator: "Mike Studios", raised: "$1,800", progress: 45 },
    { name: "Photography Gear", creator: "Emma Vision", raised: "$1,500", progress: 38 },
    { name: "Gaming Setup", creator: "Jordan Lee", raised: "$1,200", progress: 30 },
  ];

  const stats = {
    totalContributed: "$580",
    creatorsFollowing: followedCreators.length,
    bestRanking: "#1",
  };

  return (
    <div className="min-h-screen bg-[#0a0a0a] text-white">
      {/* Navigation */}
      <nav className="fixed top-0 left-0 right-0 z-50 bg-[#0a0a0a]/80 backdrop-blur-lg border-b border-white/5">
        <div className="max-w-full mx-auto px-6 py-5 flex items-center justify-between">
          <div className="flex items-center gap-8">
            <div className="text-2xl font-bold bg-gradient-to-r from-purple-400 to-pink-400 bg-clip-text text-transparent">
              TipFlow
            </div>
            <div className="hidden md:flex items-center gap-1">
              <button className="flex items-center gap-2 px-4 py-2 rounded-xl bg-gradient-to-r from-purple-600/20 to-pink-600/20 border border-purple-500/30 text-white font-medium text-sm transition-all">
                <LayoutDashboard className="w-4 h-4" />
                Dashboard
              </button>
              <button
                onClick={onViewSettings}
                className="flex items-center gap-2 px-4 py-2 rounded-xl text-gray-300 hover:text-white hover:bg-white/5 font-medium text-sm transition-all"
              >
                <SettingsIcon className="w-4 h-4" />
                Settings
              </button>
            </div>
          </div>
          <div className="flex items-center gap-6">
            <button
              onClick={onViewBalance}
              className="flex items-center gap-2 px-4 py-2 rounded-xl bg-[#14141f] border border-white/10 text-white hover:bg-white/10 transition-all"
            >
              <DollarSign className="w-4 h-4 text-pink-400" />
              <span className="text-sm font-medium hidden sm:inline">Balance ${creditBalance.toLocaleString("en-US", { minimumFractionDigits: 2, maximumFractionDigits: 2 })}</span>
            </button>
            <div className="relative hidden sm:block">
              <Search className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-gray-400 z-10" />
              <input
                type="text"
                placeholder="Search creators or projects"
                value={searchQuery}
                onChange={(e) => {
                  setSearchQuery(e.target.value);
                  setShowSearchDropdown(true);
                }}
                onFocus={() => setShowSearchDropdown(true)}
                onBlur={() => setTimeout(() => setShowSearchDropdown(false), 200)}
                className="pl-10 pr-4 py-2 rounded-xl bg-[#1a1a1a] border border-white/10 text-white placeholder-gray-500 text-sm focus:outline-none focus:ring-2 focus:ring-purple-500 transition-all w-64"
              />

              {/* Search Dropdown */}
              {showSearchDropdown && searchQuery.length > 0 && (
                <motion.div
                  initial={{ opacity: 0, y: -10 }}
                  animate={{ opacity: 1, y: 0 }}
                  className="absolute top-full mt-2 left-0 w-80 bg-[#1a1a1a] border border-white/10 rounded-2xl shadow-2xl overflow-hidden z-50"
                >
                  {searchResults.creators.length > 0 && (
                    <div className="p-3">
                      <h3 className="text-xs font-semibold text-gray-400 uppercase mb-2 px-2">Creators</h3>
                      {searchResults.creators.map((creator, index) => (
                        <motion.div
                          key={index}
                          whileHover={{ backgroundColor: "rgba(139, 92, 246, 0.1)" }}
                          onClick={onViewCreator}
                          className="flex items-center gap-3 p-2 rounded-xl cursor-pointer transition-colors"
                          style={{ backgroundColor: "rgba(0, 0, 0, 0)" }}
                        >
                          <div className="w-10 h-10 rounded-full flex items-center justify-center bg-gradient-to-br from-purple-600/30 to-pink-600/30 border border-purple-500/20 text-purple-400 font-bold text-sm">
                            {creator.initials}
                          </div>
                          <div className="flex-1">
                            <p className="text-white font-medium text-sm">{creator.name}</p>
                            <p className="text-gray-400 text-xs">{creator.username}</p>
                          </div>
                        </motion.div>
                      ))}
                    </div>
                  )}

                  {searchResults.projects.length > 0 && (
                    <div className="p-3 border-t border-white/5">
                      <h3 className="text-xs font-semibold text-gray-400 uppercase mb-2 px-2">Projects</h3>
                      {searchResults.projects.map((project, index) => (
                        <motion.div
                          key={index}
                          whileHover={{ backgroundColor: "rgba(236, 72, 153, 0.1)" }}
                          onClick={onViewProject}
                          className="flex items-center gap-3 p-2 rounded-xl cursor-pointer transition-colors"
                          style={{ backgroundColor: "rgba(0, 0, 0, 0)" }}
                        >
                          <div className="w-10 h-10 rounded-xl flex items-center justify-center bg-gradient-to-br from-pink-600/20 to-purple-600/20 border border-pink-500/20">
                            <TrendingUp className="w-5 h-5 text-pink-400" />
                          </div>
                          <div className="flex-1">
                            <p className="text-white font-medium text-sm">{project.name}</p>
                            <p className="text-gray-400 text-xs">by {project.creator}</p>
                          </div>
                        </motion.div>
                      ))}
                    </div>
                  )}

                  {searchResults.creators.length === 0 && searchResults.projects.length === 0 && (
                    <div className="p-6 text-center text-gray-400 text-sm">
                      No results found for "{searchQuery}"
                    </div>
                  )}
                </motion.div>
              )}
            </div>
            {onLogout && (
              <button
                onClick={onLogout}
                className="flex items-center gap-2 px-4 py-2 rounded-xl bg-white/5 border border-white/10 text-gray-300 hover:text-white hover:bg-white/10 transition-all"
              >
                <LogOut className="w-4 h-4" />
                <span className="text-sm font-medium hidden sm:inline">Logout</span>
              </button>
            )}
          </div>
        </div>
      </nav>

      {/* Main Content - Sidebar Layout */}
      <div className="flex flex-col lg:grid lg:grid-cols-[350px_1fr] gap-0 min-h-screen pt-20">
        {/* Left Sidebar */}
        <aside className="w-full lg:sticky lg:top-20 lg:h-[calc(100vh-5rem)] bg-[#1a1a1a] p-6 flex flex-col overflow-y-auto border-r border-white/5">
          {/* Supporter Profile Info */}
          <motion.div
            initial={{ opacity: 0, y: 20 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ duration: 0.5 }}
            className="flex items-center gap-4 mb-8"
          >
            <div className="relative w-16 h-16 rounded-full overflow-hidden border-2 border-pink-500/30">
              <div className="w-full h-full flex items-center justify-center bg-gradient-to-br from-pink-600/20 to-purple-600/20">
                <User className="w-8 h-8 text-pink-400" />
              </div>
            </div>
            <div className="flex-1">
              <h1 className="text-xl font-bold text-white leading-tight">{username}</h1>
              <p className="text-gray-400 text-sm mb-3">Supporter Dashboard</p>
              <div className="space-y-1.5">
                <motion.a
                  whileHover={{ x: 2 }}
                  href="#"
                  className="flex items-center gap-2 text-gray-400 hover:text-blue-400 transition-colors group"
                >
                  <Twitter className="w-3.5 h-3.5" />
                  <span className="text-xs">@username</span>
                </motion.a>
                <motion.a
                  whileHover={{ x: 2 }}
                  href="#"
                  className="flex items-center gap-2 text-gray-400 hover:text-pink-400 transition-colors group"
                >
                  <Instagram className="w-3.5 h-3.5" />
                  <span className="text-xs">@username</span>
                </motion.a>
                <motion.a
                  whileHover={{ x: 2 }}
                  href="#"
                  className="flex items-center gap-2 text-gray-400 hover:text-red-500 transition-colors group"
                >
                  <Youtube className="w-3.5 h-3.5" />
                  <span className="text-xs">@username</span>
                </motion.a>
                <motion.a
                  whileHover={{ x: 2 }}
                  href="#"
                  className="flex items-center gap-2 text-gray-400 hover:text-purple-500 transition-colors group"
                >
                  <Twitch className="w-3.5 h-3.5" />
                  <span className="text-xs">username</span>
                </motion.a>
              </div>
            </div>
          </motion.div>

          {/* Quick Stats */}
          <motion.div
            initial={{ opacity: 0, y: 20 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ duration: 0.5, delay: 0.1 }}
            className="mb-8"
          >
            <h2 className="text-lg font-semibold text-white mb-4">Overview</h2>
            <div className="space-y-3">
              <motion.div
                whileHover={{ scale: 1.02 }}
                className="rounded-2xl p-4 bg-gradient-to-r from-purple-600/10 to-purple-600/5 border border-purple-500/20"
              >
                <div className="flex items-center justify-between mb-1">
                  <span className="text-gray-400 text-sm">Total Contributed</span>
                  <DollarSign className="w-4 h-4 text-purple-400" />
                </div>
                <p className="text-2xl font-bold text-white">{stats.totalContributed}</p>
              </motion.div>
              <motion.div
                whileHover={{ scale: 1.02 }}
                className="rounded-2xl p-4 bg-gradient-to-r from-pink-600/10 to-pink-600/5 border border-pink-500/20"
              >
                <div className="flex items-center justify-between mb-1">
                  <span className="text-gray-400 text-sm">Creators Following</span>
                  <User className="w-4 h-4 text-pink-400" />
                </div>
                <p className="text-2xl font-bold text-white">{stats.creatorsFollowing}</p>
              </motion.div>
              <motion.div
                whileHover={{ scale: 1.02 }}
                className="rounded-2xl p-4 bg-gradient-to-r from-blue-600/10 to-blue-600/5 border border-blue-500/20"
              >
                <div className="flex items-center justify-between mb-1">
                  <span className="text-gray-400 text-sm">Best Ranking</span>
                  <Trophy className="w-4 h-4 text-blue-400" />
                </div>
                <p className="text-2xl font-bold text-white">{stats.bestRanking}</p>
              </motion.div>
            </div>
          </motion.div>

          {/* Top Positions */}
          <motion.div
            initial={{ opacity: 0, y: 20 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ duration: 0.5, delay: 0.2 }}
            className="mb-auto"
          >
            <h2 className="text-lg font-semibold text-white mb-4">Top Positions</h2>
            <ul className="space-y-3">
              {topPositions.slice(0, 3).map((position, index) => (
                <motion.li
                  key={index}
                  initial={{ opacity: 0, x: -10 }}
                  animate={{ opacity: 1, x: 0 }}
                  transition={{ duration: 0.3, delay: 0.3 + index * 0.05 }}
                  whileHover={{ scale: 1.02, x: 2 }}
                  onClick={onViewProject}
                  className="cursor-pointer"
                >
                  <div className="flex items-center gap-3 p-3 rounded-xl bg-gradient-to-r from-pink-600/5 to-purple-600/5 border border-pink-500/10 hover:border-pink-500/20 transition-all">
                    <div className="w-10 h-10 rounded-lg flex items-center justify-center bg-gradient-to-br from-pink-600/30 to-purple-600/30 border border-pink-500/20">
                      <span className="text-pink-400 font-bold text-sm">#{position.rank}</span>
                    </div>
                    <div className="flex-1 min-w-0">
                      <p className="text-white font-medium text-sm truncate">{position.project}</p>
                      <p className="text-gray-400 text-xs truncate">{position.creator}</p>
                    </div>
                  </div>
                </motion.li>
              ))}
            </ul>
          </motion.div>

          {/* Discover Button */}
          <motion.button
            initial={{ opacity: 0, y: 20 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ duration: 0.5, delay: 0.3 }}
            whileHover={{ scale: 1.02, boxShadow: "0 20px 40px rgba(236, 72, 153, 0.4)" }}
            whileTap={{ scale: 0.98 }}
            onClick={() => setActiveTab("global")}
            className="mt-6 flex items-center justify-center gap-2 px-6 py-3 bg-gradient-to-r from-pink-600 to-purple-600 hover:from-pink-500 hover:to-purple-500 rounded-2xl text-white font-semibold transition-all shadow-lg shadow-pink-500/25"
          >
            <TrendingUp className="w-5 h-5" />
            Discover Creators
          </motion.button>
        </aside>

        {/* Main Content Area */}
        <main className="flex-1 p-8 bg-[#0a0a0a] relative overflow-hidden">
          <div className="relative z-10">
            {/* Tabs */}
            <div className="flex gap-8 mb-10 border-b border-white/5">
              <button
                onClick={() => setActiveTab("following")}
                className={`pb-4 text-xl font-semibold transition-colors relative ${
                  activeTab === "following"
                    ? "text-white"
                    : "text-gray-400 hover:text-white"
                }`}
              >
                Following
                {activeTab === "following" && (
                  <motion.div
                    layoutId="activeTab"
                    className="absolute bottom-0 left-0 right-0 h-0.5 bg-gradient-to-r from-pink-600 to-purple-600"
                  />
                )}
              </button>
              <button
                onClick={() => setActiveTab("global")}
                className={`pb-4 text-xl font-semibold transition-colors relative ${
                  activeTab === "global"
                    ? "text-white"
                    : "text-gray-400 hover:text-white"
                }`}
              >
                Global Rankings
                {activeTab === "global" && (
                  <motion.div
                    layoutId="activeTab"
                    className="absolute bottom-0 left-0 right-0 h-0.5 bg-gradient-to-r from-pink-600 to-purple-600"
                  />
                )}
              </button>
            </div>

            {/* Tab Content */}
            {activeTab === "following" && (
              <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
                {followedCreators.map((creator, index) => (
                  <motion.div
                    key={index}
                    initial={{ opacity: 0, y: 20 }}
                    animate={{ opacity: 1, y: 0 }}
                    transition={{ duration: 0.4, delay: index * 0.05 }}
                    whileHover={{ scale: 1.03, y: -5 }}
                    onClick={onViewCreator}
                    className="rounded-3xl p-6 flex flex-col relative cursor-pointer bg-[#1a1a1a] border border-white/10 overflow-hidden group"
                  >
                    <div className="absolute inset-0 bg-gradient-to-br from-pink-600/0 to-purple-600/0 group-hover:from-pink-600/5 group-hover:to-purple-600/5 transition-all duration-300 rounded-3xl pointer-events-none"></div>

                    <div className="flex items-center gap-4 mb-6 relative z-10">
                      <div className="w-16 h-16 rounded-2xl flex items-center justify-center bg-gradient-to-br from-pink-600/20 to-purple-600/20 border border-pink-500/30 text-pink-400 font-bold text-xl">
                        {creator.initials}
                      </div>
                      <User className="w-6 h-6 text-pink-400 ml-auto" />
                    </div>

                    <h3 className="text-xl font-bold text-white mb-1 leading-tight relative z-10">
                      {creator.name}
                    </h3>
                    <p className="text-gray-400 text-sm mb-6 relative z-10">
                      {creator.username}
                    </p>

                    <div className="mt-auto space-y-3 relative z-10">
                      <div className="flex items-center justify-between">
                        <span className="text-gray-400 text-sm">Total contributed</span>
                        <span className="text-white font-bold">{creator.totalContributed}</span>
                      </div>
                      <div className="flex items-center justify-between">
                        <span className="text-gray-400 text-sm">Projects supported</span>
                        <span className="text-pink-400 font-semibold">{creator.projectsSupported}</span>
                      </div>
                    </div>
                  </motion.div>
                ))}
              </div>
            )}

            {activeTab === "global" && (
              <div className="space-y-12">
                {/* Top Creators Section */}
                <div>
                  <div className="flex items-center gap-3 mb-6">
                    <TrendingUp className="w-6 h-6 text-purple-400" />
                    <h2 className="text-2xl font-bold text-white">Top Creators Worldwide</h2>
                  </div>
                  <div className="space-y-4">
                    {topCreators.map((creator, index) => (
                      <motion.div
                        key={index}
                        initial={{ opacity: 0, x: -20 }}
                        animate={{ opacity: 1, x: 0 }}
                        transition={{ duration: 0.3, delay: index * 0.05 }}
                        whileHover={{ scale: 1.02, x: 5 }}
                        onClick={onViewCreator}
                        className="rounded-3xl p-6 flex items-center gap-6 cursor-pointer bg-[#1a1a1a] border border-white/10 hover:border-white/20 transition-all group"
                      >
                        <div className="flex items-center gap-4 flex-1">
                          <span className="text-2xl font-bold text-gray-600 w-8">{index + 1}</span>
                          <div className="w-14 h-14 rounded-2xl flex items-center justify-center bg-gradient-to-br from-purple-600/20 to-pink-600/20 border border-purple-500/30 text-purple-400 font-bold">
                            {creator.initials}
                          </div>
                          <div className="flex-1">
                            <h3 className="text-xl font-bold text-white mb-1">{creator.name}</h3>
                            <p className="text-gray-400 text-sm">{creator.supporters} supporters</p>
                          </div>
                        </div>
                        <div className="text-right">
                          <p className="text-2xl font-bold bg-gradient-to-r from-purple-400 to-pink-400 bg-clip-text text-transparent">{creator.totalRaised}</p>
                          <p className="text-gray-400 text-sm">Total raised</p>
                        </div>
                      </motion.div>
                    ))}
                  </div>
                </div>

                {/* Top Projects Section */}
                <div>
                  <div className="flex items-center gap-3 mb-6">
                    <Heart className="w-6 h-6 text-pink-400" />
                    <h2 className="text-2xl font-bold text-white">Trending Projects Worldwide</h2>
                  </div>
                  <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                    {topProjects.map((project, index) => (
                      <motion.div
                        key={index}
                        initial={{ opacity: 0, y: 20 }}
                        animate={{ opacity: 1, y: 0 }}
                        transition={{ duration: 0.4, delay: index * 0.05 }}
                        whileHover={{ scale: 1.02 }}
                        onClick={onViewProject}
                        className="rounded-3xl p-6 cursor-pointer bg-[#1a1a1a] border border-white/10 hover:border-white/20 transition-all group"
                      >
                        <div className="flex items-start justify-between mb-4">
                          <div className="flex-1">
                            <h3 className="text-xl font-bold text-white mb-2 leading-tight">{project.name}</h3>
                            <p className="text-gray-400 text-sm">
                              by <span className="text-purple-400 font-medium cursor-pointer hover:underline" onClick={(e) => { e.stopPropagation(); onViewCreator?.(); }}>{project.creator}</span>
                            </p>
                          </div>
                          <span className="text-2xl font-bold bg-gradient-to-r from-pink-400 to-purple-400 bg-clip-text text-transparent">{project.raised}</span>
                        </div>

                        <div>
                          <div className="flex items-center justify-between mb-2">
                            <span className="text-gray-400 text-sm">Progress</span>
                            <span className="text-white font-semibold text-sm">{project.progress}%</span>
                          </div>
                          <div className="w-full rounded-full h-2.5 overflow-hidden bg-white/5">
                            <motion.div
                              initial={{ width: 0 }}
                              animate={{ width: `${project.progress}%` }}
                              transition={{ duration: 1, delay: 0.3 + index * 0.1 }}
                              className="h-full bg-gradient-to-r from-pink-500 to-purple-500 rounded-full"
                            />
                          </div>
                        </div>
                      </motion.div>
                    ))}
                  </div>
                </div>
              </div>
            )}
          </div>
        </main>
      </div>
    </div>
  );
}
