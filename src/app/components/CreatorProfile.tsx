import { motion } from "motion/react";
import { useState } from "react";
import { Search, User, ArrowLeft, Check, TrendingUp, ArrowUp, Medal, Twitter, Instagram, Youtube, Twitch } from "lucide-react";

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
  leaderboard?: LeaderboardEntry[];
  recentGifts?: RecentGift[];
  wishlistItems?: WishlistItem[];
  onBack?: () => void;
  onViewProject?: () => void;
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
  onBack,
  onViewProject,
}: CreatorProfileProps) {
  const [searchQuery, setSearchQuery] = useState("");
  const [activeTab, setActiveTab] = useState<"wishlist" | "surprise" | "gifts">("wishlist");
  const [leaderboardPeriod, setLeaderboardPeriod] = useState<"week" | "month" | "all">("month");
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

  const getRankMedal = (rank: number) => {
    if (rank === 1) return "#FFD700";
    if (rank === 2) return "#C0C0C0";
    if (rank === 3) return "#CD7F32";
    return "#e8185d";
  };

  return (
    <div className="min-h-screen bg-background text-foreground">
      {/* Navigation */}
      <nav className="fixed top-0 left-0 right-0 z-50 bg-[#0e0e0e] border-b border-accent/40">
        <div className="max-w-full mx-auto px-6 py-4 flex items-center justify-between">
          <div className="flex items-center gap-8">
            <div className="text-xl font-black text-white tracking-tight">TipFlow</div>
            <div className="hidden md:flex items-center gap-1">
              <button className="flex items-center gap-2 px-4 py-2 text-white font-medium text-sm border-b-2 border-accent">
                <User className="w-4 h-4" />
                Profile
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
                        <div key={index} className="flex items-center gap-3 p-2 hover:bg-muted cursor-pointer transition-colors">
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
            {onBack && (
              <button
                onClick={onBack}
                className="flex items-center gap-2 px-4 py-2 border border-white/20 text-white hover:bg-white/10 text-sm font-medium transition-colors"
              >
                <ArrowLeft className="w-4 h-4" />
                <span className="hidden sm:inline">Back</span>
              </button>
            )}
          </div>
        </div>
      </nav>

      {/* Main Layout */}
      <div className="flex flex-col lg:grid lg:grid-cols-[320px_1fr] gap-0 min-h-screen pt-[57px]">
        {/* Left Sidebar */}
        <aside className="w-full lg:sticky lg:top-[57px] lg:h-[calc(100vh-57px)] bg-muted p-6 flex flex-col overflow-y-auto border-r border-border">
          {/* Creator Profile */}
          <motion.div
            initial={{ opacity: 0, y: 20 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ duration: 0.5 }}
            className="flex items-center gap-4 mb-8 pb-8 border-b border-border"
          >
            <div className="relative w-16 h-16 bg-[#e0e0e0] border border-[#d0d0d0] flex items-center justify-center flex-shrink-0">
              <User className="w-7 h-7 text-subtle" />
              <div className="absolute -bottom-1 -right-1 w-5 h-5 bg-accent flex items-center justify-center">
                <Check className="w-3 h-3 text-white" />
              </div>
            </div>
            <div className="flex-1 min-w-0">
              <h1 className="text-base font-black text-foreground leading-tight">{creatorName}</h1>
              <p className="text-xs text-subtle mb-2">{username}</p>
              <div className="flex gap-3">
                <a href="#" className="text-subtle hover:text-[#1d9bf0] transition-colors"><Twitter className="w-3.5 h-3.5" /></a>
                <a href="#" className="text-subtle hover:text-[#e1306c] transition-colors"><Instagram className="w-3.5 h-3.5" /></a>
                <a href="#" className="text-subtle hover:text-[#ff0000] transition-colors"><Youtube className="w-3.5 h-3.5" /></a>
                <a href="#" className="text-subtle hover:text-[#9146ff] transition-colors"><Twitch className="w-3.5 h-3.5" /></a>
              </div>
            </div>
          </motion.div>

          {/* Action buttons */}
          <div className="flex gap-2 mb-8">
            <button className="flex-1 py-2.5 border-2 border-foreground text-foreground text-xs font-black uppercase tracking-widest hover:bg-foreground hover:text-white transition-colors">
              Follow
            </button>
            <button className="flex-1 py-2.5 bg-accent hover:bg-[#c9164f] text-white text-xs font-black uppercase tracking-widest transition-colors">
              Message
            </button>
          </div>

          {/* Leaderboard */}
          <motion.div
            initial={{ opacity: 0, y: 20 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ duration: 0.5, delay: 0.1 }}
            className="mb-8"
          >
            <div className="text-[10px] font-black uppercase tracking-widest text-subtle mb-3">Top Donations</div>
            <ul className="space-y-2">
              {leaderboard.map((entry, index) => (
                <motion.li
                  key={index}
                  initial={{ opacity: 0, x: -10 }}
                  animate={{ opacity: 1, x: 0 }}
                  transition={{ duration: 0.3, delay: 0.2 + index * 0.05 }}
                  className="flex items-center gap-3 py-2"
                >
                  <div className="relative flex-shrink-0">
                    <div className="w-9 h-9 bg-[#e0e0e0] flex items-center justify-center text-foreground font-black text-xs">
                      {entry.initials}
                    </div>
                    <span
                      className="absolute -bottom-1 -right-1 w-4 h-4 flex items-center justify-center text-[9px] font-black text-white border border-white"
                      style={{ backgroundColor: getRankMedal(entry.rank) }}
                    >
                      {entry.rank}
                    </span>
                  </div>
                  <div className="flex-1 min-w-0">
                    <p className="text-foreground font-bold text-sm truncate">{entry.name}</p>
                    <p className="text-subtle text-xs">{entry.amount}</p>
                  </div>
                </motion.li>
              ))}
            </ul>

            {/* Period Filter */}
            <div className="flex mt-4 border border-border bg-[#ebebeb]">
              {(["week", "month", "all"] as const).map(p => (
                <button
                  key={p}
                  onClick={() => setLeaderboardPeriod(p)}
                  className={`flex-1 py-2 text-[10px] font-black uppercase tracking-widest transition-colors ${
                    leaderboardPeriod === p ? "bg-foreground text-white" : "text-muted-foreground hover:bg-secondary"
                  }`}
                >
                  {p}
                </button>
              ))}
            </div>
          </motion.div>

          {/* Recent Gifts */}
          <motion.div
            initial={{ opacity: 0, y: 20 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ duration: 0.5, delay: 0.2 }}
          >
            <div className="text-[10px] font-black uppercase tracking-widest text-subtle mb-3">Recent Gifts</div>
            <ul className="space-y-2">
              {recentGifts.map((gift, index) => (
                <motion.li
                  key={index}
                  initial={{ opacity: 0, x: -10 }}
                  animate={{ opacity: 1, x: 0 }}
                  transition={{ duration: 0.3, delay: 0.3 + index * 0.05 }}
                  className="flex items-center gap-3 py-2"
                >
                  <div className="w-9 h-9 bg-[#e0e0e0] flex items-center justify-center text-foreground font-black text-xs flex-shrink-0">
                    {gift.initials}
                  </div>
                  <div>
                    <p className="text-foreground font-bold text-sm">{gift.name}</p>
                    <p className="text-subtle text-xs">{gift.timeAgo}</p>
                  </div>
                </motion.li>
              ))}
            </ul>
          </motion.div>
        </aside>

        {/* Main Content */}
        <main className="flex-1 p-8 bg-background">
          {/* Tabs */}
          <div className="flex gap-8 mb-10 border-b border-border">
            {(["wishlist", "surprise", "gifts"] as const).map(tab => (
              <button
                key={tab}
                onClick={() => setActiveTab(tab)}
                className={`pb-4 text-base font-black capitalize transition-colors relative ${
                  activeTab === tab ? "text-foreground" : "text-subtle hover:text-foreground"
                }`}
              >
                {tab}
                {activeTab === tab && (
                  <motion.div layoutId="activeTab" className="absolute bottom-0 left-0 right-0 h-0.5 bg-accent" />
                )}
              </button>
            ))}
          </div>

          {/* Wishlist Grid */}
          <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-4">
            {wishlistItems.map((item, index) => (
              <motion.div
                key={index}
                initial={{ opacity: 0, y: 20 }}
                animate={{ opacity: 1, y: 0 }}
                transition={{ duration: 0.4, delay: index * 0.05 }}
                whileHover={{ y: -2 }}
                onClick={onViewProject}
                className="bg-background border border-border overflow-hidden group cursor-pointer hover:shadow-md transition-shadow"
              >
                {/* Thumbnail */}
                <div className="relative w-full h-44 flex items-center justify-center bg-muted">
                  <User className="w-14 h-14 text-[#d0d0d0]" />

                  {/* Status Badge */}
                  <div
                    className={`absolute top-3 right-3 px-2 py-1 flex items-center gap-1.5 border text-[10px] font-black uppercase tracking-widest ${
                      item.status === "gifted"
                        ? "bg-[#f0faf5] border-[#22c55e] text-[#16a34a]"
                        : "bg-[#fff0f4] border-accent text-accent"
                    }`}
                  >
                    {item.status === "gifted" ? (
                      <><Check className="w-2.5 h-2.5" />Gifted</>
                    ) : (
                      <><ArrowUp className="w-2.5 h-2.5" />Active</>
                    )}
                  </div>
                </div>

                {/* Info */}
                <div className="p-4">
                  <h3 className="text-sm font-black text-foreground mb-1 leading-tight line-clamp-2 group-hover:text-accent transition-colors">
                    {item.title}
                  </h3>
                  <p className="text-subtle text-xs">
                    {item.status === "gifted" ? `Gifted by ${item.giftedBy}` : "View contributors"}
                  </p>
                </div>
              </motion.div>
            ))}
          </div>
        </main>
      </div>
    </div>
  );
}
