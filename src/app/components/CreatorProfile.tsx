import { motion } from "motion/react";
import { useState } from "react";
import { Search, User, ArrowLeft, Check, TrendingUp, ArrowUp, Medal, DollarSign, Twitter, Instagram, Youtube, Twitch } from "lucide-react";

interface WishlistItem {
  title: string;
  status: "active" | "gifted";
  giftedBy?: string;
  thumbnail?: string;
}

interface LeaderboardEntry {
  name: string;
  amount: string;
  rank: number;
  initials: string;
}

interface RecentGift {
  name: string;
  timeAgo: string;
  initials: string;
}

interface CreatorProfileProps {
  creatorName?: string;
  username?: string;
  creditBalance?: number;
  leaderboard?: LeaderboardEntry[];
  recentGifts?: RecentGift[];
  wishlistItems?: WishlistItem[];
  onBack?: () => void;
  onViewProject?: () => void;
  onViewSettings?: () => void;
}

export default function CreatorProfile({
  creatorName = "Creator Name",
  username = "@creatorname",
  leaderboard = [
    { name: "boogerbill01", amount: "$4,699.79", rank: 1, initials: "B" },
    { name: "TheBull963", amount: "$3,710.90", rank: 2, initials: "T" },
    { name: "Maxroberts99", amount: "$2,905.11", rank: 3, initials: "M" },
  ],
  recentGifts = [
    { name: "jimdonly1", timeAgo: "1mo ago", initials: "J" },
    { name: "Anonymous", timeAgo: "2mo ago", initials: "A" },
    { name: "Anonymous", timeAgo: "2mo ago", initials: "A" },
  ],
  wishlistItems = [
    { title: "Ableton Push 3", status: "active" },
    { title: "Bose Solo Soundbar Series II", status: "gifted", giftedBy: "Anonymous" },
    { title: "Sand & Stable™ Scarlett TV Stand", status: "gifted", giftedBy: "Anonymous" },
    { title: "Mid-Century Lift Top Coffee Table", status: "gifted", giftedBy: "Anonymous" },
    { title: "Universal Audio Apollo X4 Gen 2", status: "active" },
    { title: "Orange Juice Vase", status: "gifted", giftedBy: "Anonymous" },
  ],
  creditBalance = 0,
  onBack,
  onViewProject,
  onViewSettings,
}: CreatorProfileProps) {
  const [searchQuery, setSearchQuery] = useState("");
  const [activeTab, setActiveTab] = useState<"wishlist" | "surprise" | "gifts">("wishlist");
  const [leaderboardPeriod, setLeaderboardPeriod] = useState<"week" | "month" | "all">("month");
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

  const getRankColor = (rank: number) => {
    if (rank === 1) return "#FFD700"; // Gold
    if (rank === 2) return "#C0C0C0"; // Silver
    if (rank === 3) return "#CD7F32"; // Bronze
    return "#8b5cf6"; // Purple
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
                <User className="w-4 h-4" />
                Profile
              </button>
            </div>
          </div>
          <div className="flex items-center gap-6">
            <button
              onClick={onViewSettings}
              className="flex items-center gap-2 px-4 py-2 rounded-xl bg-[#14141f] border border-white/10 text-white hover:bg-white/10 transition-all"
            >
              <DollarSign className="w-4 h-4 text-pink-400" />
              <span className="text-sm font-medium">Balance ${creditBalance.toLocaleString("en-US", { minimumFractionDigits: 2, maximumFractionDigits: 2 })}</span>
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
            {onBack && (
              <button
                onClick={onBack}
                className="flex items-center gap-2 px-4 py-2 rounded-xl bg-white/5 border border-white/10 text-gray-300 hover:text-white hover:bg-white/10 transition-all"
              >
                <ArrowLeft className="w-4 h-4" />
                <span className="text-sm font-medium hidden sm:inline">Back</span>
              </button>
            )}
          </div>
        </div>
      </nav>

      {/* Main Content - Sidebar Layout */}
      <div className="flex flex-col lg:grid lg:grid-cols-[350px_1fr] gap-0 min-h-screen pt-20">
        {/* Left Sidebar */}
        <aside className="w-full lg:sticky lg:top-20 lg:h-[calc(100vh-5rem)] bg-[#1a1a1a] p-6 flex flex-col overflow-y-auto border-r border-white/5">
          {/* Creator Profile Info */}
          <motion.div
            initial={{ opacity: 0, y: 20 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ duration: 0.5 }}
            className="flex items-center gap-4 mb-8"
          >
            <div className="relative w-16 h-16 rounded-full overflow-hidden border-2 border-purple-500/30">
              <div className="w-full h-full flex items-center justify-center bg-gradient-to-br from-purple-600/20 to-pink-600/20">
                <User className="w-8 h-8 text-purple-400" />
              </div>
            </div>
            <div className="flex-1">
              <div className="flex items-center gap-2">
                <h1 className="text-xl font-bold text-white leading-tight">{creatorName}</h1>
                <span className="w-4 h-4 bg-purple-600 rounded-full flex items-center justify-center">
                  <Check className="w-2.5 h-2.5 text-white" />
                </span>
              </div>
              <p className="text-gray-400 text-sm mb-3">{username}</p>
              <div className="space-y-1.5">
                <motion.a
                  whileHover={{ x: 2 }}
                  href="#"
                  className="flex items-center gap-2 text-gray-400 hover:text-blue-400 transition-colors group"
                >
                  <Twitter className="w-3.5 h-3.5" />
                  <span className="text-xs">@creatorname</span>
                </motion.a>
                <motion.a
                  whileHover={{ x: 2 }}
                  href="#"
                  className="flex items-center gap-2 text-gray-400 hover:text-pink-400 transition-colors group"
                >
                  <Instagram className="w-3.5 h-3.5" />
                  <span className="text-xs">@creatorname</span>
                </motion.a>
                <motion.a
                  whileHover={{ x: 2 }}
                  href="#"
                  className="flex items-center gap-2 text-gray-400 hover:text-red-500 transition-colors group"
                >
                  <Youtube className="w-3.5 h-3.5" />
                  <span className="text-xs">@creatorname</span>
                </motion.a>
                <motion.a
                  whileHover={{ x: 2 }}
                  href="#"
                  className="flex items-center gap-2 text-gray-400 hover:text-purple-500 transition-colors group"
                >
                  <Twitch className="w-3.5 h-3.5" />
                  <span className="text-xs">creatorname</span>
                </motion.a>
              </div>
            </div>
          </motion.div>

          {/* Leaderboard */}
          <motion.div
            initial={{ opacity: 0, y: 20 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ duration: 0.5, delay: 0.1 }}
            className="mb-8"
          >
            <h2 className="text-lg font-semibold text-white mb-4">Leaderboard</h2>
            <ul className="space-y-3">
              {leaderboard.map((entry, index) => (
                <motion.li
                  key={index}
                  initial={{ opacity: 0, x: -10 }}
                  animate={{ opacity: 1, x: 0 }}
                  transition={{ duration: 0.3, delay: 0.2 + index * 0.05 }}
                  whileHover={{ scale: 1.02, x: 2 }}
                  className="flex items-center gap-3"
                >
                  <div className="relative">
                    <div className="w-10 h-10 rounded-full flex items-center justify-center text-white font-bold text-sm bg-gradient-to-br from-purple-600/30 to-pink-600/30 border border-purple-500/20">
                      {entry.initials}
                    </div>
                    <span
                      className="absolute -bottom-1 -right-1 w-5 h-5 rounded-full flex items-center justify-center text-xs font-bold text-black border-2 border-[#1a1a1a]"
                      style={{
                        backgroundColor: getRankColor(entry.rank),
                      }}
                    >
                      {entry.rank}
                    </span>
                  </div>
                  <div className="flex-1">
                    <p className="text-white font-medium text-sm">{entry.name}</p>
                    <p className="text-gray-400 text-xs">{entry.amount}</p>
                  </div>
                </motion.li>
              ))}
            </ul>
            <div className="flex gap-2 text-sm text-gray-400 mt-4 rounded-full p-0.5 border border-white/10 bg-white/5">
              <button
                onClick={() => setLeaderboardPeriod("week")}
                className={`flex-1 py-1 rounded-full transition-colors ${
                  leaderboardPeriod === "week" ? "bg-purple-600 text-white" : "hover:bg-white/5"
                }`}
              >
                Week
              </button>
              <button
                onClick={() => setLeaderboardPeriod("month")}
                className={`flex-1 py-1 rounded-full transition-colors ${
                  leaderboardPeriod === "month" ? "bg-purple-600 text-white" : "hover:bg-white/5"
                }`}
              >
                Month
              </button>
              <button
                onClick={() => setLeaderboardPeriod("all")}
                className={`flex-1 py-1 rounded-full transition-colors ${
                  leaderboardPeriod === "all" ? "bg-purple-600 text-white" : "hover:bg-white/5"
                }`}
              >
                All
              </button>
            </div>
          </motion.div>

          {/* Recent Gifts */}
          <motion.div
            initial={{ opacity: 0, y: 20 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ duration: 0.5, delay: 0.2 }}
          >
            <h2 className="text-lg font-semibold text-white mb-4">Recent Gifts Received</h2>
            <ul className="space-y-3">
              {recentGifts.map((gift, index) => (
                <motion.li
                  key={index}
                  initial={{ opacity: 0, x: -10 }}
                  animate={{ opacity: 1, x: 0 }}
                  transition={{ duration: 0.3, delay: 0.3 + index * 0.05 }}
                  whileHover={{ scale: 1.02, x: 2 }}
                  className="flex items-center gap-3"
                >
                  <div className="w-10 h-10 rounded-full flex items-center justify-center text-white font-bold text-sm bg-gradient-to-br from-purple-600/30 to-pink-600/30 border border-purple-500/20">
                    {gift.initials}
                  </div>
                  <div>
                    <p className="text-white font-medium text-sm">{gift.name}</p>
                    <p className="text-gray-400 text-xs">{gift.timeAgo}</p>
                  </div>
                </motion.li>
              ))}
            </ul>
          </motion.div>
        </aside>

        {/* Main Content Area */}
        <main className="flex-1 p-8 bg-[#0a0a0a] relative overflow-hidden">
          <div className="relative z-10">
            {/* Tabs */}
            <div className="flex gap-8 mb-10 border-b border-white/5">
              <button
                onClick={() => setActiveTab("wishlist")}
                className={`pb-4 text-xl font-semibold transition-colors relative ${
                  activeTab === "wishlist"
                    ? "text-white"
                    : "text-gray-400 hover:text-white"
                }`}
              >
                Wishlist
                {activeTab === "wishlist" && (
                  <motion.div
                    layoutId="activeTab"
                    className="absolute bottom-0 left-0 right-0 h-0.5 bg-gradient-to-r from-purple-600 to-pink-600"
                  />
                )}
              </button>
              <button
                onClick={() => setActiveTab("surprise")}
                className={`pb-4 text-xl font-semibold transition-colors relative ${
                  activeTab === "surprise"
                    ? "text-white"
                    : "text-gray-400 hover:text-white"
                }`}
              >
                Surprise
                {activeTab === "surprise" && (
                  <motion.div
                    layoutId="activeTab"
                    className="absolute bottom-0 left-0 right-0 h-0.5 bg-gradient-to-r from-purple-600 to-pink-600"
                  />
                )}
              </button>
              <button
                onClick={() => setActiveTab("gifts")}
                className={`pb-4 text-xl font-semibold transition-colors relative ${
                  activeTab === "gifts"
                    ? "text-white"
                    : "text-gray-400 hover:text-white"
                }`}
              >
                Gifts
                {activeTab === "gifts" && (
                  <motion.div
                    layoutId="activeTab"
                    className="absolute bottom-0 left-0 right-0 h-0.5 bg-gradient-to-r from-purple-600 to-pink-600"
                  />
                )}
              </button>
            </div>

            {/* Wishlist Grid */}
            <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-6">
              {wishlistItems.map((item, index) => (
                <motion.div
                  key={index}
                  initial={{ opacity: 0, y: 20 }}
                  animate={{ opacity: 1, y: 0 }}
                  transition={{ duration: 0.4, delay: index * 0.05 }}
                  whileHover={{ scale: 1.03, y: -5 }}
                  onClick={onViewProject}
                  className="rounded-3xl p-6 flex flex-col relative cursor-pointer bg-[#1a1a1a] border border-white/10 overflow-hidden group"
                >
                  {/* Hover glow effect */}
                  <div className="absolute inset-0 bg-gradient-to-br from-purple-600/0 to-pink-600/0 group-hover:from-purple-600/5 group-hover:to-pink-600/5 transition-all duration-300 rounded-3xl pointer-events-none"></div>

                  {/* Thumbnail */}
                  <div className="relative w-full h-48 rounded-2xl mb-5 flex items-center justify-center bg-gradient-to-br from-purple-600/5 to-pink-600/5 border border-white/5 overflow-hidden">
                    <User className="w-16 h-16 text-gray-600 relative z-10" />
                    <div className="absolute inset-0 bg-gradient-to-br from-purple-600/10 to-pink-600/10 opacity-0 group-hover:opacity-100 transition-opacity duration-300"></div>
                  </div>

                  {/* Title and Status */}
                  <h3 className="text-lg font-bold text-white mb-2 leading-tight line-clamp-2 relative z-10">
                    {item.title}
                  </h3>
                  <p className="text-gray-400 text-sm mb-3 relative z-10">
                    {item.status === "gifted" ? `Gifted by ${item.giftedBy}` : "View contributors"}
                  </p>

                  {/* Status Badge */}
                  <motion.div
                    initial={{ scale: 0 }}
                    animate={{ scale: 1 }}
                    transition={{ duration: 0.3, delay: 0.5 + index * 0.05, type: "spring" }}
                    className="absolute top-6 right-6 px-3 py-1.5 rounded-full flex items-center gap-2 backdrop-blur-sm"
                    style={{
                      background: item.status === "gifted"
                        ? "linear-gradient(to right, rgba(16, 185, 129, 0.2), rgba(52, 211, 153, 0.2))"
                        : "linear-gradient(to right, rgba(236, 72, 153, 0.2), rgba(244, 114, 182, 0.2))",
                      border: `1px solid ${item.status === "gifted" ? "rgba(16, 185, 129, 0.3)" : "rgba(236, 72, 153, 0.3)"}`,
                    }}
                  >
                    {item.status === "gifted" ? (
                      <>
                        <Check className="w-3.5 h-3.5 text-green-400" />
                        <span className="text-xs font-semibold text-green-400">Gifted</span>
                      </>
                    ) : (
                      <>
                        <ArrowUp className="w-3.5 h-3.5 text-pink-400" />
                        <span className="text-xs font-semibold text-pink-400">Active</span>
                      </>
                    )}
                  </motion.div>
                </motion.div>
              ))}
            </div>
          </div>
        </main>
      </div>
    </div>
  );
}
