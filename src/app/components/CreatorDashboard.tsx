import { motion, AnimatePresence } from "motion/react";
import { useState } from "react";
import { Plus, Search, User, LogOut, Gift, TrendingUp, Check, ArrowUp, Twitter, Instagram, Youtube, Twitch, LayoutDashboard, BarChart3, Settings as SettingsIcon, ChevronDown, List, DollarSign } from "lucide-react";

interface CreatorDashboardProps {
  username?: string;
  initialWishlistId?: number | null;
  creditBalance?: number;
  onLogout?: () => void;
  onCreateWishlist?: () => void;
  onAddItem?: () => void;
  onViewProject?: () => void;
  onViewAnalytics?: () => void;
  onViewSettings?: () => void;
  onViewBalance?: () => void;
}

interface Supporter {
  name: string;
  amount: string;
  initials: string;
  timeAgo: string;
}

interface WishlistItem {
  title: string;
  description: string;
  goal: string;
  raised: string;
  progress: number;
  status: "active" | "completed";
  thumbnail?: string | null;
}

interface Wishlist {
  id: number;
  name: string;
  description: string;
  coverImage?: string | null;
  items: WishlistItem[];
}

export default function CreatorDashboard({ username = "Username", initialWishlistId = null, creditBalance = 0, onLogout, onCreateWishlist, onAddItem, onViewProject, onViewAnalytics, onViewSettings, onViewBalance }: CreatorDashboardProps) {
  const [searchQuery, setSearchQuery] = useState("");
  const [showSearchDropdown, setShowSearchDropdown] = useState(false);
  const [selectedWishlistId, setSelectedWishlistId] = useState<number | null>(initialWishlistId);
  const [selectedItemIndex, setSelectedItemIndex] = useState<number | null>(null);
  const [itemTab, setItemTab] = useState<"active" | "completed" | "all">("active");

  // Mock search results
  const searchResults = searchQuery.length > 0 ? {
    creators: [
      { name: "Alex Creative", username: "@alexcreative", initials: "AC" },
      { name: "Sarah Designs", username: "@sarahdesigns", initials: "SD" },
    ],
    supporters: [
      { name: "Mike Chen", username: "@mikechen", initials: "MC" },
      { name: "Emily Rodriguez", username: "@emilyrodriguez", initials: "ER" },
    ],
  } : { creators: [], supporters: [] };

  // Mock data for recent supporters
  const recentSupporters: Supporter[] = [
    { name: "Sarah Johnson", amount: "$250", initials: "SJ", timeAgo: "2h ago" },
    { name: "Mike Chen", amount: "$180", initials: "MC", timeAgo: "5h ago" },
    { name: "Emily Rodriguez", amount: "$120", initials: "ER", timeAgo: "1d ago" },
    { name: "Alex Thompson", amount: "$95", initials: "AT", timeAgo: "2d ago" },
    { name: "Jordan Lee", amount: "$75", initials: "JL", timeAgo: "3d ago" },
  ];

  // Mock wishlists with projects inside
  const wishlists: Wishlist[] = [
    {
      id: 1,
      name: "Creator Essentials",
      description: "Everything I need to level up my content",
      items: [
        {
          title: "New Streaming Setup",
          description: "Upgrading my setup for better quality",
          goal: "$2,500",
          raised: "$1,890",
          progress: 76,
          status: "active",
        },
        {
          title: "Art Supplies Collection",
          description: "Professional grade materials for commissions",
          goal: "$800",
          raised: "$520",
          progress: 65,
          status: "active",
        },
        {
          title: "Coffee Fund",
          description: "Help fuel my creative process",
          goal: "$200",
          raised: "$200",
          progress: 100,
          status: "completed",
        },
      ],
    },
  ];

  const totalRaised = "$2,410";
  const totalActiveItems = wishlists.flatMap(w => w.items).filter(i => i.status === "active").length;
  const totalSupporters = recentSupporters.length;

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
                onClick={onViewAnalytics}
                className="flex items-center gap-2 px-4 py-2 rounded-xl text-gray-300 hover:text-white hover:bg-white/5 font-medium text-sm transition-all"
              >
                <BarChart3 className="w-4 h-4" />
                Analytics
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
                placeholder="Search creators & supporters"
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

                  {searchResults.supporters.length > 0 && (
                    <div className="p-3 border-t border-white/5">
                      <h3 className="text-xs font-semibold text-gray-400 uppercase mb-2 px-2">Supporters</h3>
                      {searchResults.supporters.map((supporter, index) => (
                        <motion.div
                          key={index}
                          whileHover={{ backgroundColor: "rgba(236, 72, 153, 0.1)" }}
                          className="flex items-center gap-3 p-2 rounded-xl cursor-pointer transition-colors"
                          style={{ backgroundColor: "rgba(0, 0, 0, 0)" }}
                        >
                          <div className="w-10 h-10 rounded-full flex items-center justify-center bg-gradient-to-br from-pink-600/30 to-purple-600/30 border border-pink-500/20 text-pink-400 font-bold text-sm">
                            {supporter.initials}
                          </div>
                          <div className="flex-1">
                            <p className="text-white font-medium text-sm">{supporter.name}</p>
                            <p className="text-gray-400 text-xs">{supporter.username}</p>
                          </div>
                        </motion.div>
                      ))}
                    </div>
                  )}

                  {searchResults.creators.length === 0 && searchResults.supporters.length === 0 && (
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
                <h1 className="text-xl font-bold text-white leading-tight">{username}</h1>
                <span className="w-4 h-4 bg-purple-600 rounded-full flex items-center justify-center">
                  <Check className="w-2.5 h-2.5 text-white" />
                </span>
              </div>
              <p className="text-gray-400 text-sm mb-3">Creator Dashboard</p>
              <div className="space-y-1.5">
                <motion.a whileHover={{ x: 2 }} href="#" className="flex items-center gap-2 text-gray-400 hover:text-blue-400 transition-colors group">
                  <Twitter className="w-3.5 h-3.5" />
                  <span className="text-xs">@username</span>
                </motion.a>
                <motion.a whileHover={{ x: 2 }} href="#" className="flex items-center gap-2 text-gray-400 hover:text-pink-400 transition-colors group">
                  <Instagram className="w-3.5 h-3.5" />
                  <span className="text-xs">@username</span>
                </motion.a>
                <motion.a whileHover={{ x: 2 }} href="#" className="flex items-center gap-2 text-gray-400 hover:text-red-500 transition-colors group">
                  <Youtube className="w-3.5 h-3.5" />
                  <span className="text-xs">@username</span>
                </motion.a>
                <motion.a whileHover={{ x: 2 }} href="#" className="flex items-center gap-2 text-gray-400 hover:text-purple-500 transition-colors group">
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
              <motion.div whileHover={{ scale: 1.02 }} className="rounded-2xl p-4 bg-gradient-to-r from-purple-600/10 to-purple-600/5 border border-purple-500/20">
                <div className="flex items-center justify-between mb-1">
                  <span className="text-gray-400 text-sm">Total Raised</span>
                  <TrendingUp className="w-4 h-4 text-purple-400" />
                </div>
                <p className="text-2xl font-bold text-white">{totalRaised}</p>
              </motion.div>
              <motion.div whileHover={{ scale: 1.02 }} className="rounded-2xl p-4 bg-gradient-to-r from-pink-600/10 to-pink-600/5 border border-pink-500/20">
                <div className="flex items-center justify-between mb-1">
                  <span className="text-gray-400 text-sm">Active Items</span>
                  <Gift className="w-4 h-4 text-pink-400" />
                </div>
                <p className="text-2xl font-bold text-white">{totalActiveItems}</p>
              </motion.div>
              <motion.div whileHover={{ scale: 1.02 }} className="rounded-2xl p-4 bg-gradient-to-r from-blue-600/10 to-blue-600/5 border border-blue-500/20">
                <div className="flex items-center justify-between mb-1">
                  <span className="text-gray-400 text-sm">Supporters</span>
                  <User className="w-4 h-4 text-blue-400" />
                </div>
                <p className="text-2xl font-bold text-white">{totalSupporters}</p>
              </motion.div>
            </div>
          </motion.div>

          {/* Recent Supporters */}
          <motion.div
            initial={{ opacity: 0, y: 20 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ duration: 0.5, delay: 0.2 }}
            className="mb-auto"
          >
            <h2 className="text-lg font-semibold text-white mb-4">Recent Supporters</h2>
            <ul className="space-y-3">
              {recentSupporters.slice(0, 5).map((supporter, index) => (
                <motion.li
                  key={index}
                  initial={{ opacity: 0, x: -10 }}
                  animate={{ opacity: 1, x: 0 }}
                  transition={{ duration: 0.3, delay: 0.3 + index * 0.05 }}
                  whileHover={{ scale: 1.02, x: 2 }}
                  className="flex items-center gap-3"
                >
                  <div className="w-10 h-10 rounded-full flex items-center justify-center text-white font-bold text-sm bg-gradient-to-br from-purple-600/30 to-pink-600/30 border border-purple-500/20">
                    {supporter.initials}
                  </div>
                  <div className="flex-1">
                    <p className="text-white font-medium text-sm">{supporter.name}</p>
                    <p className="text-gray-400 text-xs">{supporter.timeAgo}</p>
                  </div>
                  <p className="text-purple-400 font-semibold text-sm">{supporter.amount}</p>
                </motion.li>
              ))}
            </ul>
          </motion.div>

          {/* Action buttons */}
          <div className="mt-6 flex flex-col gap-3">
            <motion.button
              initial={{ opacity: 0, y: 20 }}
              animate={{ opacity: 1, y: 0 }}
              transition={{ duration: 0.5, delay: 0.3 }}
              whileHover={{ scale: 1.02, boxShadow: "0 20px 40px rgba(168, 85, 247, 0.4)" }}
              whileTap={{ scale: 0.98 }}
              onClick={onAddItem}
              className="flex items-center justify-center gap-2 px-6 py-3 bg-gradient-to-r from-purple-600 to-pink-600 hover:from-purple-500 hover:to-pink-500 rounded-2xl text-white font-semibold transition-all shadow-lg shadow-purple-500/25"
            >
              <Plus className="w-5 h-5" />
              Add Item to Wishlist
            </motion.button>
            <motion.button
              initial={{ opacity: 0, y: 20 }}
              animate={{ opacity: 1, y: 0 }}
              transition={{ duration: 0.5, delay: 0.35 }}
              whileHover={{ scale: 1.02 }}
              whileTap={{ scale: 0.98 }}
              onClick={onCreateWishlist}
              className="flex items-center justify-center gap-2 px-6 py-3 bg-white/5 border border-white/10 hover:bg-white/10 rounded-2xl text-gray-300 hover:text-white font-semibold transition-all"
            >
              <List className="w-5 h-5" />
              New Wishlist
            </motion.button>
          </div>
        </aside>

        {/* Main Content Area */}
        <main className="flex-1 p-8 bg-[#0a0a0a]">
          <AnimatePresence mode="wait">
            {selectedWishlistId === null ? (
              /* ── WISHLIST GRID VIEW ── */
              <motion.div
                key="grid"
                initial={{ opacity: 0, y: 16 }}
                animate={{ opacity: 1, y: 0 }}
                exit={{ opacity: 0, y: -8 }}
                transition={{ duration: 0.3 }}
              >
                {/* Header */}
                <div className="flex items-center justify-between mb-8">
                  <div className="flex items-center gap-3">
                    <List className="w-5 h-5 text-purple-400" />
                    <h2 className="text-2xl font-bold text-white">My Wishlists</h2>
                    <span className="px-2.5 py-0.5 rounded-full bg-white/5 border border-white/10 text-gray-400 text-xs font-medium">
                      {wishlists.length}
                    </span>
                  </div>
                  <motion.button
                    whileHover={{ scale: 1.02 }}
                    whileTap={{ scale: 0.98 }}
                    onClick={onCreateWishlist}
                    className="hidden sm:flex items-center gap-2 px-5 py-2.5 bg-white/5 border border-white/10 hover:bg-white/10 rounded-xl text-gray-300 hover:text-white font-semibold text-sm transition-all"
                  >
                    <Plus className="w-4 h-4" />
                    New Wishlist
                  </motion.button>
                </div>

                {/* Grid */}
                <div className="grid grid-cols-1 sm:grid-cols-2 xl:grid-cols-3 gap-5">
                  {wishlists.map((wishlist, wIndex) => {
                    const activeCount = wishlist.items.filter(i => i.status === "active").length;
                    const totalRaisedAmt = wishlist.items.reduce((sum, i) => {
                      const n = parseFloat(i.raised.replace(/[$,]/g, ""));
                      return sum + (isNaN(n) ? 0 : n);
                    }, 0);

                    return (
                      <motion.div
                        key={wishlist.id}
                        initial={{ opacity: 0, y: 20 }}
                        animate={{ opacity: 1, y: 0 }}
                        transition={{ duration: 0.35, delay: wIndex * 0.07 }}
                        whileHover={{ y: -4 }}
                        onClick={() => { setSelectedWishlistId(wishlist.id); setSelectedItemIndex(null); setItemTab("active"); }}
                        className="rounded-3xl bg-[#1a1a1a] border border-white/10 overflow-hidden cursor-pointer group"
                      >
                        {/* Cover banner */}
                        <div className="relative h-36 overflow-hidden">
                          {wishlist.coverImage ? (
                            <img
                              src={wishlist.coverImage}
                              alt={wishlist.name}
                              className="w-full h-full object-cover group-hover:scale-105 transition-transform duration-500"
                            />
                          ) : (
                            <div className="w-full h-full bg-gradient-to-br from-purple-600/30 via-pink-600/20 to-purple-800/30 flex items-center justify-center gap-3">
                              {[...Array(3)].map((_, i) => (
                                <div key={i} className="w-14 h-14 rounded-2xl bg-white/10 flex items-center justify-center opacity-30">
                                  <Gift className="w-7 h-7 text-white/60" />
                                </div>
                              ))}
                            </div>
                          )}
                          {/* Item count pill */}
                          <div className="absolute top-3 right-3 px-2.5 py-1 rounded-full bg-black/40 backdrop-blur-sm border border-white/10 text-xs font-semibold text-white">
                            {wishlist.items.length} {wishlist.items.length === 1 ? "item" : "items"}
                          </div>
                        </div>

                        {/* Card body */}
                        <div className="p-5">
                          <h3 className="text-lg font-bold text-white mb-1 leading-tight group-hover:text-purple-300 transition-colors">
                            {wishlist.name}
                          </h3>
                          <p className="text-gray-400 text-sm mb-4 line-clamp-2 leading-relaxed">
                            {wishlist.description}
                          </p>

                          {/* Stats row */}
                          <div className="flex items-center gap-4 text-xs text-gray-400 mb-4">
                            <span className="flex items-center gap-1.5">
                              <span className="w-1.5 h-1.5 rounded-full bg-pink-400 inline-block" />
                              {activeCount} active
                            </span>
                            <span className="flex items-center gap-1.5">
                              <span className="w-1.5 h-1.5 rounded-full bg-green-400 inline-block" />
                              {wishlist.items.filter(i => i.status === "completed").length} funded
                            </span>
                            <span className="ml-auto font-semibold text-white">${totalRaisedAmt.toLocaleString()} raised</span>
                          </div>

                          {/* Overall progress bar */}
                          {(() => {
                            const totalGoal = wishlist.items.reduce((s, i) => s + parseFloat(i.goal.replace(/[$,]/g, "") || "0"), 0);
                            const pct = totalGoal > 0 ? Math.min(100, Math.round((totalRaisedAmt / totalGoal) * 100)) : 0;
                            return (
                              <div>
                                <div className="w-full rounded-full h-1.5 overflow-hidden bg-white/5">
                                  <motion.div
                                    initial={{ width: 0 }}
                                    animate={{ width: `${pct}%` }}
                                    transition={{ duration: 1, delay: 0.3 + wIndex * 0.1 }}
                                    className="h-full bg-gradient-to-r from-purple-500 to-pink-500 rounded-full"
                                  />
                                </div>
                                <p className="text-right text-xs text-gray-500 mt-1">{pct}% funded</p>
                              </div>
                            );
                          })()}
                        </div>
                      </motion.div>
                    );
                  })}
                </div>
              </motion.div>
            ) : selectedItemIndex !== null ? (
              /* ── ITEM DETAIL VIEW ── */
              (() => {
                const wishlist = wishlists.find(w => w.id === selectedWishlistId)!;
                const item = wishlist.items[selectedItemIndex];
                return (
                  <motion.div
                    key={`item-${selectedWishlistId}-${selectedItemIndex}`}
                    initial={{ opacity: 0, y: 16 }}
                    animate={{ opacity: 1, y: 0 }}
                    exit={{ opacity: 0, y: -8 }}
                    transition={{ duration: 0.3 }}
                  >
                    {/* Breadcrumb */}
                    <div className="flex items-center gap-2 mb-8 text-sm">
                      <button
                        onClick={() => setSelectedWishlistId(null)}
                        className="text-gray-400 hover:text-white transition-colors font-medium"
                      >
                        My Wishlists
                      </button>
                      <span className="text-gray-600">/</span>
                      <button
                        onClick={() => setSelectedItemIndex(null)}
                        className="text-gray-400 hover:text-white transition-colors font-medium"
                      >
                        {wishlist.name}
                      </button>
                      <span className="text-gray-600">/</span>
                      <span className="text-white font-semibold truncate max-w-[200px]">{item.title}</span>
                    </div>

                    {/* Item header */}
                    <div className="flex flex-col sm:flex-row gap-6 mb-10">
                      {/* Thumbnail */}
                      <div className="w-full sm:w-48 h-48 rounded-2xl overflow-hidden flex-shrink-0 bg-gradient-to-br from-purple-600/20 to-pink-600/20 border border-white/10 flex items-center justify-center">
                        {item.thumbnail ? (
                          <img src={item.thumbnail} alt={item.title} className="w-full h-full object-cover" />
                        ) : (
                          <Gift className="w-16 h-16 text-gray-600" />
                        )}
                      </div>
                      <div className="flex-1">
                        <div className="flex items-center gap-3 mb-2 flex-wrap">
                          <h2 className="text-3xl font-bold text-white">{item.title}</h2>
                          <div
                            className="px-2.5 py-1 rounded-full flex items-center gap-1.5 text-xs font-semibold"
                            style={{
                              background: item.status === "completed"
                                ? "linear-gradient(to right,rgba(16,185,129,0.2),rgba(52,211,153,0.2))"
                                : "linear-gradient(to right,rgba(236,72,153,0.2),rgba(244,114,182,0.2))",
                              border: `1px solid ${item.status === "completed" ? "rgba(16,185,129,0.3)" : "rgba(236,72,153,0.3)"}`,
                              color: item.status === "completed" ? "#34d399" : "#f472b6",
                            }}
                          >
                            {item.status === "completed" ? (
                              <><Check className="w-3 h-3" />Funded</>
                            ) : (
                              <><ArrowUp className="w-3 h-3" />Active</>
                            )}
                          </div>
                        </div>
                        <p className="text-gray-400 mb-6 leading-relaxed">{item.description}</p>
                        {/* Progress */}
                        <div className="p-4 rounded-2xl bg-[#1a1a1a] border border-white/10">
                          <div className="flex items-center justify-between mb-3">
                            <span className="text-2xl font-bold text-white">{item.raised}</span>
                            <span className="text-gray-400 text-sm">of {item.goal}</span>
                          </div>
                          <div className="w-full rounded-full h-2 overflow-hidden bg-white/5 mb-2">
                            <motion.div
                              initial={{ width: 0 }}
                              animate={{ width: `${item.progress}%` }}
                              transition={{ duration: 1, ease: "easeOut" }}
                              className="h-full bg-gradient-to-r from-purple-500 to-pink-500 rounded-full"
                            />
                          </div>
                          <p className="text-right text-xs text-gray-500">{item.progress}% funded</p>
                        </div>
                      </div>
                    </div>

                    {/* Recent supporters */}
                    <div>
                      <h3 className="text-lg font-bold text-white mb-4 flex items-center gap-2">
                        <span className="w-1.5 h-5 bg-gradient-to-b from-purple-500 to-pink-500 rounded-full" />
                        Recent Supporters
                      </h3>
                      <div className="space-y-3">
                        {[
                          { name: "Sarah Johnson", amount: "$250", initials: "SJ", timeAgo: "2h ago" },
                          { name: "Mike Chen",     amount: "$180", initials: "MC", timeAgo: "5h ago" },
                          { name: "Emily Rodriguez",amount:"$120", initials: "ER", timeAgo: "1d ago" },
                        ].map((s, i) => (
                          <motion.div
                            key={i}
                            initial={{ opacity: 0, x: -10 }}
                            animate={{ opacity: 1, x: 0 }}
                            transition={{ duration: 0.3, delay: i * 0.06 }}
                            className="flex items-center gap-3 p-4 rounded-xl bg-[#1a1a1a] border border-white/10"
                          >
                            <div className="w-10 h-10 rounded-full bg-gradient-to-br from-purple-600/30 to-pink-600/30 border border-purple-500/20 flex items-center justify-center text-purple-400 font-bold text-sm flex-shrink-0">
                              {s.initials}
                            </div>
                            <div className="flex-1">
                              <p className="text-white font-medium text-sm">{s.name}</p>
                              <p className="text-gray-500 text-xs">{s.timeAgo}</p>
                            </div>
                            <p className="text-purple-400 font-semibold text-sm">{s.amount}</p>
                          </motion.div>
                        ))}
                      </div>
                    </div>
                  </motion.div>
                );
              })()
            ) : (
              /* ── WISHLIST DRILL-IN VIEW ── */
              (() => {
                const wishlist = wishlists.find(w => w.id === selectedWishlistId)!;
                const filteredItems = wishlist.items.filter(item => {
                  if (itemTab === "active") return item.status === "active";
                  if (itemTab === "completed") return item.status === "completed";
                  return true;
                });
                return (
                  <motion.div
                    key="detail"
                    initial={{ opacity: 0, y: 16 }}
                    animate={{ opacity: 1, y: 0 }}
                    exit={{ opacity: 0, y: -8 }}
                    transition={{ duration: 0.3 }}
                  >
                    {/* Breadcrumb + actions */}
                    <div className="flex items-center justify-between mb-8">
                      <div className="flex items-center gap-2 min-w-0">
                        <button
                          onClick={() => { setSelectedWishlistId(null); setSelectedItemIndex(null); }}
                          className="flex items-center gap-1.5 text-gray-400 hover:text-white transition-colors text-sm font-medium flex-shrink-0"
                        >
                          <ChevronDown className="w-4 h-4 rotate-90" />
                          My Wishlists
                        </button>
                        <span className="text-gray-600">/</span>
                        <span className="text-white font-semibold text-sm truncate">{wishlist.name}</span>
                      </div>
                      <motion.button
                        whileHover={{ scale: 1.02, boxShadow: "0 10px 30px rgba(168,85,247,0.3)" }}
                        whileTap={{ scale: 0.98 }}
                        onClick={onAddItem}
                        className="hidden sm:flex items-center gap-2 px-5 py-2.5 bg-gradient-to-r from-purple-600 to-pink-600 hover:from-purple-500 hover:to-pink-500 rounded-xl text-white font-semibold text-sm transition-all shadow-lg shadow-purple-500/20"
                      >
                        <Plus className="w-4 h-4" />
                        Add Item
                      </motion.button>
                    </div>

                    {/* Wishlist title + meta */}
                    <div className="mb-8">
                      <h2 className="text-3xl font-bold text-white mb-1">{wishlist.name}</h2>
                      <p className="text-gray-400">{wishlist.description}</p>
                    </div>

                    {/* Filter tabs */}
                    <div className="flex gap-8 mb-8 border-b border-white/5">
                      {(["active", "completed", "all"] as const).map(t => (
                        <button
                          key={t}
                          onClick={() => setItemTab(t)}
                          className={`pb-4 text-base font-semibold capitalize transition-colors relative ${
                            itemTab === t ? "text-white" : "text-gray-400 hover:text-white"
                          }`}
                        >
                          {t}
                          {itemTab === t && (
                            <motion.div
                              layoutId="itemTab"
                              className="absolute bottom-0 left-0 right-0 h-0.5 bg-gradient-to-r from-purple-600 to-pink-600"
                            />
                          )}
                        </button>
                      ))}
                    </div>

                    {/* Items grid */}
                    {filteredItems.length === 0 ? (
                      <div className="py-20 text-center text-gray-500 text-sm">
                        No {itemTab === "all" ? "" : itemTab} items in this wishlist
                      </div>
                    ) : (
                      <div className="grid grid-cols-1 sm:grid-cols-2 xl:grid-cols-3 gap-5">
                        {filteredItems.map((item, index) => (
                          <motion.div
                            key={index}
                            initial={{ opacity: 0, y: 16 }}
                            animate={{ opacity: 1, y: 0 }}
                            transition={{ duration: 0.3, delay: index * 0.05 }}
                            whileHover={{ scale: 1.03, y: -4 }}
                            onClick={() => setSelectedItemIndex(wishlist.items.indexOf(item))}
                            className="rounded-3xl bg-[#1a1a1a] border border-white/10 overflow-hidden cursor-pointer group"
                          >
                            {/* Thumbnail */}
                            <div className="relative w-full h-40 flex items-center justify-center bg-gradient-to-br from-purple-600/10 to-pink-600/10 overflow-hidden">
                              <Gift className="w-14 h-14 text-gray-600 relative z-10 group-hover:text-gray-500 transition-colors" />
                              <div className="absolute inset-0 bg-gradient-to-br from-purple-600/10 to-pink-600/10 opacity-0 group-hover:opacity-100 transition-opacity duration-300" />
                              {/* Status badge */}
                              <div
                                className="absolute top-3 right-3 px-2.5 py-1 rounded-full flex items-center gap-1.5"
                                style={{
                                  background: item.status === "completed"
                                    ? "linear-gradient(to right,rgba(16,185,129,0.2),rgba(52,211,153,0.2))"
                                    : "linear-gradient(to right,rgba(236,72,153,0.2),rgba(244,114,182,0.2))",
                                  border: `1px solid ${item.status === "completed" ? "rgba(16,185,129,0.3)" : "rgba(236,72,153,0.3)"}`,
                                }}
                              >
                                {item.status === "completed" ? (
                                  <><Check className="w-3 h-3 text-green-400" /><span className="text-xs font-semibold text-green-400">Done</span></>
                                ) : (
                                  <><ArrowUp className="w-3 h-3 text-pink-400" /><span className="text-xs font-semibold text-pink-400">Active</span></>
                                )}
                              </div>
                            </div>

                            <div className="p-5">
                              <h4 className="text-base font-bold text-white mb-1 leading-tight group-hover:text-purple-300 transition-colors">
                                {item.title}
                              </h4>
                              <p className="text-gray-400 text-xs mb-4 line-clamp-2 leading-relaxed">
                                {item.description}
                              </p>
                              <div className="flex items-center justify-between mb-2">
                                <span className="text-white font-bold text-sm">{item.raised}</span>
                                <span className="text-gray-500 text-xs">of {item.goal}</span>
                              </div>
                              <div className="w-full rounded-full h-1.5 overflow-hidden bg-white/5">
                                <motion.div
                                  initial={{ width: 0 }}
                                  animate={{ width: `${item.progress}%` }}
                                  transition={{ duration: 1, delay: 0.2 + index * 0.1 }}
                                  className="h-full bg-gradient-to-r from-purple-500 to-pink-500 rounded-full"
                                />
                              </div>
                              <p className="text-right text-xs text-gray-500 mt-1">{item.progress}% funded</p>
                            </div>
                          </motion.div>
                        ))}
                      </div>
                    )}
                  </motion.div>
                );
              })()
            )}
          </AnimatePresence>
        </main>
      </div>
    </div>
  );
}
