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

  const recentSupporters: Supporter[] = [
    { name: "Sarah Johnson", amount: "$250", initials: "SJ", timeAgo: "2h ago" },
    { name: "Mike Chen", amount: "$180", initials: "MC", timeAgo: "5h ago" },
    { name: "Emily Rodriguez", amount: "$120", initials: "ER", timeAgo: "1d ago" },
    { name: "Alex Thompson", amount: "$95", initials: "AT", timeAgo: "2d ago" },
    { name: "Jordan Lee", amount: "$75", initials: "JL", timeAgo: "3d ago" },
  ];

  const wishlists: Wishlist[] = [
    {
      id: 1,
      name: "Creator Essentials",
      description: "Everything I need to level up my content",
      items: [
        { title: "New Streaming Setup", description: "Upgrading for better quality streams", goal: "$2,500", raised: "$1,890", progress: 76, status: "active" },
        { title: "Art Supplies Collection", description: "Professional grade materials for commissions", goal: "$800", raised: "$520", progress: 65, status: "active" },
        { title: "Coffee Fund", description: "Fuel the creative process", goal: "$200", raised: "$200", progress: 100, status: "completed" },
      ],
    },
  ];

  const totalRaised = "$2,410";
  const totalActiveItems = wishlists.flatMap(w => w.items).filter(i => i.status === "active").length;
  const totalSupporters = recentSupporters.length;

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
                onClick={onViewAnalytics}
                className="flex items-center gap-2 px-4 py-2 text-white/60 hover:text-white font-medium text-sm transition-colors"
              >
                <BarChart3 className="w-4 h-4" />
                Analytics
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
            <button
              onClick={onViewBalance}
              className="flex items-center gap-2 px-3 py-2 rounded-md border border-white/20 text-white hover:bg-white/10 transition-colors text-sm font-medium"
            >
              <DollarSign className="w-4 h-4 text-accent" />
              <span className="hidden sm:inline">${creditBalance?.toLocaleString("en-US", { minimumFractionDigits: 2, maximumFractionDigits: 2 })}</span>
            </button>
            <div className="relative hidden sm:block">
              <Search className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-white/40 z-10" />
              <input
                type="text"
                placeholder="Search creators & supporters"
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
                  {searchResults.supporters.length > 0 && (
                    <div className="p-3 border-t border-border">
                      <h3 className="text-[10px] font-black uppercase tracking-widest text-subtle mb-2 px-2">Supporters</h3>
                      {searchResults.supporters.map((supporter, index) => (
                        <div key={index} className="flex items-center gap-3 p-2 hover:bg-muted cursor-pointer transition-colors">
                          <div className="w-8 h-8 bg-muted border border-border flex items-center justify-center text-foreground font-bold text-xs">{supporter.initials}</div>
                          <div className="flex-1">
                            <p className="text-foreground font-medium text-sm">{supporter.name}</p>
                            <p className="text-subtle text-xs">{supporter.username}</p>
                          </div>
                        </div>
                      ))}
                    </div>
                  )}
                  {searchResults.creators.length === 0 && searchResults.supporters.length === 0 && (
                    <div className="p-6 text-center text-subtle text-sm">No results for "{searchQuery}"</div>
                  )}
                </motion.div>
              )}
            </div>
            {onLogout && (
              <button
                onClick={onLogout}
                className="flex items-center gap-2 px-4 py-2 border border-white/20 text-white hover:bg-white/10 text-sm font-medium transition-colors"
              >
                <LogOut className="w-4 h-4" />
                <span className="hidden sm:inline">Logout</span>
              </button>
            )}
          </div>
        </div>
      </nav>

      {/* Main Layout */}
      <div className="flex flex-col lg:grid lg:grid-cols-[320px_1fr] gap-0 min-h-screen pt-[57px]">
        {/* Left Sidebar */}
        <aside className="w-full lg:sticky lg:top-[57px] lg:h-[calc(100vh-57px)] bg-muted p-6 flex flex-col overflow-y-auto border-r border-border">
          {/* Profile */}
          <motion.div
            initial={{ opacity: 0, y: 20 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ duration: 0.5 }}
            className="flex items-center gap-4 mb-8 pb-8 border-b border-border"
          >
            <div className="w-14 h-14 rounded-full bg-[#e0e0e0] border border-[#d0d0d0] flex items-center justify-center flex-shrink-0">
              <User className="w-6 h-6 text-muted-foreground" />
            </div>
            <div className="flex-1 min-w-0">
              <div className="flex items-center gap-2">
                <h1 className="text-base font-black text-foreground leading-tight truncate">{username}</h1>
                <div className="w-4 h-4 bg-accent flex items-center justify-center flex-shrink-0">
                  <Check className="w-2.5 h-2.5 text-white" />
                </div>
              </div>
              <p className="text-xs text-subtle uppercase tracking-wide font-bold mt-0.5">Creator</p>
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
              <div className="p-4 bg-background border border-border rounded-xl card-game">
                <div className="flex items-center justify-between mb-1">
                  <span className="text-[10px] font-bold uppercase tracking-widest text-subtle">Total Raised</span>
                  <TrendingUp className="w-4 h-4 text-accent" />
                </div>
                <p className="text-2xl font-black" style={{ color: "oklch(65.6% 0.241 354.308)" }}>{totalRaised}</p>
              </div>
              <div className="p-4 bg-background border border-border rounded-xl card-game">
                <div className="flex items-center justify-between mb-1">
                  <span className="text-[10px] font-bold uppercase tracking-widest text-subtle">Active Items</span>
                  <Gift className="w-4 h-4 text-muted-foreground" />
                </div>
                <p className="text-2xl font-black text-foreground">{totalActiveItems}</p>
              </div>
              <div className="p-4 bg-background border border-border rounded-xl card-game">
                <div className="flex items-center justify-between mb-1">
                  <span className="text-[10px] font-bold uppercase tracking-widest text-subtle">Supporters</span>
                  <User className="w-4 h-4 text-muted-foreground" />
                </div>
                <p className="text-2xl font-black text-foreground">{totalSupporters}</p>
              </div>
            </div>
          </motion.div>

          {/* Recent Supporters */}
          <motion.div
            initial={{ opacity: 0, y: 20 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ duration: 0.5, delay: 0.2 }}
            className="mb-auto"
          >
            <div className="text-[10px] font-black uppercase tracking-widest text-subtle mb-3">Recent Supporters</div>
            <ul className="space-y-2">
              {recentSupporters.slice(0, 5).map((supporter, index) => (
                <motion.li
                  key={index}
                  initial={{ opacity: 0, x: -10 }}
                  animate={{ opacity: 1, x: 0 }}
                  transition={{ duration: 0.3, delay: 0.3 + index * 0.05 }}
                  className="flex items-center gap-3 py-2"
                >
                  <div className="w-8 h-8 bg-[#e0e0e0] flex items-center justify-center text-foreground font-bold text-xs flex-shrink-0">
                    {supporter.initials}
                  </div>
                  <div className="flex-1 min-w-0">
                    <p className="text-foreground font-medium text-sm truncate">{supporter.name}</p>
                    <p className="text-subtle text-xs">{supporter.timeAgo}</p>
                  </div>
                  <p className="text-accent font-black text-sm flex-shrink-0">{supporter.amount}</p>
                </motion.li>
              ))}
            </ul>
          </motion.div>

          {/* Action Buttons */}
          <div className="mt-6 space-y-2">
            <motion.button
              initial={{ opacity: 0, y: 20 }}
              animate={{ opacity: 1, y: 0 }}
              transition={{ duration: 0.5, delay: 0.3 }}
              whileHover={{ scale: 1.01 }}
              whileTap={{ scale: 0.99 }}
              onClick={onAddItem}
              className="w-full flex items-center justify-center gap-2 px-6 py-3 rounded-md btn-cta text-white font-black text-xs uppercase tracking-widest"
            >
              <Plus className="w-4 h-4" />
              Add Item
            </motion.button>
            <motion.button
              initial={{ opacity: 0, y: 20 }}
              animate={{ opacity: 1, y: 0 }}
              transition={{ duration: 0.5, delay: 0.35 }}
              whileHover={{ scale: 1.01 }}
              whileTap={{ scale: 0.99 }}
              onClick={onCreateWishlist}
              className="w-full flex items-center justify-center gap-2 px-6 py-3 rounded-md border border-border bg-background hover:bg-muted text-foreground font-bold text-xs uppercase tracking-wide transition-colors"
            >
              <List className="w-4 h-4" />
              New List
            </motion.button>
          </div>
        </aside>

        {/* Main Content */}
        <main className="flex-1 p-8 bg-background">
          <AnimatePresence mode="wait">
            {selectedWishlistId === null ? (
              <motion.div
                key="grid"
                initial={{ opacity: 0, y: 16 }}
                animate={{ opacity: 1, y: 0 }}
                exit={{ opacity: 0, y: -8 }}
                transition={{ duration: 0.3 }}
              >
                <div className="flex items-center justify-between mb-8">
                  <div className="flex items-center gap-3">
                    <h2 className="text-2xl font-black text-foreground tracking-tight">My Wishlists</h2>
                    <span className="px-2 py-0.5 border border-border text-subtle text-xs font-bold">{wishlists.length}</span>
                  </div>
                  <motion.button
                    whileHover={{ scale: 1.01 }}
                    whileTap={{ scale: 0.99 }}
                    onClick={onCreateWishlist}
                    className="hidden sm:flex items-center gap-2 px-4 py-2 border border-border hover:bg-muted text-foreground font-bold text-xs uppercase tracking-wide transition-colors"
                  >
                    <Plus className="w-3.5 h-3.5" />
                    New List
                  </motion.button>
                </div>

                <div className="grid grid-cols-1 sm:grid-cols-2 xl:grid-cols-3 gap-4">
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
                        whileHover={{ y: -2 }}
                        onClick={() => { setSelectedWishlistId(wishlist.id); setSelectedItemIndex(null); setItemTab("active"); }}
                        className="bg-background border border-border rounded-xl overflow-hidden cursor-pointer group card-game"
                      >
                        <div className="relative h-32 overflow-hidden bg-muted">
                          {wishlist.coverImage ? (
                            <img src={wishlist.coverImage} alt={wishlist.name} className="w-full h-full object-cover group-hover:scale-105 transition-transform duration-500" />
                          ) : (
                            <div className="w-full h-full flex items-center justify-center gap-3">
                              {[...Array(3)].map((_, i) => (
                                <div key={i} className="w-12 h-12 border border-border bg-background flex items-center justify-center">
                                  <Gift className="w-6 h-6 text-[#d0d0d0]" />
                                </div>
                              ))}
                            </div>
                          )}
                          <div className="absolute top-2 right-2 px-2 py-0.5 bg-background border border-border text-[10px] font-black uppercase tracking-wide text-muted-foreground">
                            {wishlist.items.length} {wishlist.items.length === 1 ? "item" : "items"}
                          </div>
                        </div>

                        <div className="p-5">
                          <h3 className="text-base font-black text-foreground mb-1 group-hover:text-accent transition-colors">
                            {wishlist.name}
                          </h3>
                          <p className="text-muted-foreground text-xs mb-4 line-clamp-2">{wishlist.description}</p>

                          <div className="flex items-center gap-4 text-[10px] text-subtle mb-3 font-bold uppercase tracking-wide">
                            <span className="flex items-center gap-1">
                              <span className="w-1.5 h-1.5 rounded-full bg-accent inline-block" />
                              {activeCount} active
                            </span>
                            <span className="flex items-center gap-1">
                              <span className="w-1.5 h-1.5 rounded-full bg-[#059669] inline-block" />
                              {wishlist.items.filter(i => i.status === "completed").length} funded
                            </span>
                            <span className="ml-auto font-black text-foreground">${totalRaisedAmt.toLocaleString()}</span>
                          </div>

                          {(() => {
                            const totalGoal = wishlist.items.reduce((s, i) => s + parseFloat(i.goal.replace(/[$,]/g, "") || "0"), 0);
                            const pct = totalGoal > 0 ? Math.min(100, Math.round((totalRaisedAmt / totalGoal) * 100)) : 0;
                            return (
                              <div>
                                <div className="w-full h-1 bg-[#e0e0e0] overflow-hidden">
                                  <motion.div
                                    initial={{ width: 0 }}
                                    animate={{ width: `${pct}%` }}
                                    transition={{ duration: 1, delay: 0.3 + wIndex * 0.1 }}
                                    style={{ background: "linear-gradient(90deg, oklch(65.6% 0.241 354.308), oklch(70% 0.2 320))" }}
                                  />
                                </div>
                                <p className="text-right text-[10px] text-subtle mt-1 font-bold">{pct}% funded</p>
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
                    <div className="flex items-center gap-2 mb-8 text-sm">
                      <button onClick={() => setSelectedWishlistId(null)} className="text-subtle hover:text-foreground transition-colors font-medium">My Wishlists</button>
                      <span className="text-[#d0d0d0]">/</span>
                      <button onClick={() => setSelectedItemIndex(null)} className="text-subtle hover:text-foreground transition-colors font-medium">{wishlist.name}</button>
                      <span className="text-[#d0d0d0]">/</span>
                      <span className="text-foreground font-bold truncate max-w-[200px]">{item.title}</span>
                    </div>

                    <div className="flex flex-col sm:flex-row gap-6 mb-10">
                      <div className="w-full sm:w-48 h-48 flex-shrink-0 bg-muted border border-border flex items-center justify-center">
                        {item.thumbnail ? (
                          <img src={item.thumbnail} alt={item.title} className="w-full h-full object-cover" />
                        ) : (
                          <Gift className="w-16 h-16 text-[#d0d0d0]" />
                        )}
                      </div>
                      <div className="flex-1">
                        <div className="flex items-center gap-3 mb-2 flex-wrap">
                          <h2 className="text-3xl font-black text-foreground tracking-tight">{item.title}</h2>
                          <div className={`px-2 py-1 flex items-center gap-1.5 text-[10px] font-black uppercase tracking-widest border ${
                            item.status === "completed"
                              ? "bg-[#f0faf5] border-[#22c55e] text-[#16a34a]"
                              : "bg-[#fff0f4] border-accent text-accent"
                          }`}>
                            {item.status === "completed" ? <><Check className="w-3 h-3" />Funded</> : <><ArrowUp className="w-3 h-3" />Active</>}
                          </div>
                        </div>
                        <p className="text-muted-foreground mb-6 leading-relaxed text-sm">{item.description}</p>
                        <div className="p-4 bg-muted border border-border">
                          <div className="flex items-center justify-between mb-3">
                            <span className="text-2xl font-black text-foreground">{item.raised}</span>
                            <span className="text-subtle text-sm">of {item.goal}</span>
                          </div>
                          <div className="w-full h-2 bg-[#e0e0e0] overflow-hidden mb-2">
                            <motion.div
                              initial={{ width: 0 }}
                              animate={{ width: `${item.progress}%` }}
                              transition={{ duration: 1, ease: "easeOut" }}
                              style={{ background: "linear-gradient(90deg, oklch(65.6% 0.241 354.308), oklch(70% 0.2 320))" }}
                            />
                          </div>
                          <p className="text-right text-xs text-subtle font-bold">{item.progress}% funded</p>
                        </div>
                      </div>
                    </div>

                    <div>
                      <div className="text-[10px] font-black uppercase tracking-widest text-subtle mb-4 flex items-center gap-2">
                        <span className="w-3 h-px bg-accent" />
                        Recent Supporters
                      </div>
                      <div className="space-y-2">
                        {[
                          { name: "Sarah Johnson", amount: "$250", initials: "SJ", timeAgo: "2h ago" },
                          { name: "Mike Chen", amount: "$180", initials: "MC", timeAgo: "5h ago" },
                          { name: "Emily Rodriguez", amount: "$120", initials: "ER", timeAgo: "1d ago" },
                        ].map((s, i) => (
                          <motion.div
                            key={i}
                            initial={{ opacity: 0, x: -10 }}
                            animate={{ opacity: 1, x: 0 }}
                            transition={{ duration: 0.3, delay: i * 0.06 }}
                            className="flex items-center gap-3 p-4 border border-border bg-background"
                          >
                            <div className="w-8 h-8 bg-[#e0e0e0] flex items-center justify-center text-foreground font-bold text-xs flex-shrink-0">{s.initials}</div>
                            <div className="flex-1">
                              <p className="text-foreground font-medium text-sm">{s.name}</p>
                              <p className="text-subtle text-xs">{s.timeAgo}</p>
                            </div>
                            <p className="text-accent font-black text-sm">{s.amount}</p>
                          </motion.div>
                        ))}
                      </div>
                    </div>
                  </motion.div>
                );
              })()
            ) : (
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
                    <div className="flex items-center justify-between mb-8">
                      <div className="flex items-center gap-2 min-w-0">
                        <button
                          onClick={() => { setSelectedWishlistId(null); setSelectedItemIndex(null); }}
                          className="flex items-center gap-1.5 text-subtle hover:text-foreground transition-colors text-sm font-medium flex-shrink-0"
                        >
                          <ChevronDown className="w-4 h-4 rotate-90" />
                          My Wishlists
                        </button>
                        <span className="text-[#d0d0d0]">/</span>
                        <span className="text-foreground font-bold text-sm truncate">{wishlist.name}</span>
                      </div>
                      <motion.button
                        whileHover={{ scale: 1.01 }}
                        whileTap={{ scale: 0.99 }}
                        onClick={onAddItem}
                        className="hidden sm:flex items-center gap-2 px-4 py-2 rounded-md btn-cta text-white font-bold text-xs uppercase tracking-wide"
                      >
                        <Plus className="w-3.5 h-3.5" />
                        Add Item
                      </motion.button>
                    </div>

                    <div className="mb-8">
                      <h2 className="text-3xl font-black text-foreground mb-1 tracking-tight">{wishlist.name}</h2>
                      <p className="text-muted-foreground text-sm">{wishlist.description}</p>
                    </div>

                    <div className="flex gap-6 mb-8 border-b border-border">
                      {(["active", "completed", "all"] as const).map(t => (
                        <button
                          key={t}
                          onClick={() => setItemTab(t)}
                          className={`pb-4 text-sm font-bold capitalize transition-colors relative ${
                            itemTab === t ? "text-foreground" : "text-subtle hover:text-foreground"
                          }`}
                        >
                          {t}
                          {itemTab === t && (
                            <motion.div layoutId="itemTab" className="absolute bottom-0 left-0 right-0 h-0.5 bg-accent" />
                          )}
                        </button>
                      ))}
                    </div>

                    {filteredItems.length === 0 ? (
                      <div className="py-20 text-center text-subtle text-sm">No {itemTab === "all" ? "" : itemTab} items in this list.</div>
                    ) : (
                      <div className="grid grid-cols-1 sm:grid-cols-2 xl:grid-cols-3 gap-4">
                        {filteredItems.map((item, index) => (
                          <motion.div
                            key={index}
                            initial={{ opacity: 0, y: 16 }}
                            animate={{ opacity: 1, y: 0 }}
                            transition={{ duration: 0.3, delay: index * 0.05 }}
                            whileHover={{ y: -2 }}
                            onClick={() => setSelectedItemIndex(wishlist.items.indexOf(item))}
                            className="bg-background border border-border rounded-xl overflow-hidden cursor-pointer group card-game"
                          >
                            <div className="relative w-full h-36 flex items-center justify-center bg-muted">
                              <Gift className="w-12 h-12 text-[#d0d0d0]" />
                              <div className={`absolute top-2 right-2 px-2 py-1 flex items-center gap-1 border text-[10px] font-black uppercase tracking-widest ${
                                item.status === "completed"
                                  ? "bg-[#f0faf5] border-[#22c55e] text-[#16a34a]"
                                  : "bg-[#fff0f4] border-accent text-accent"
                              }`}>
                                {item.status === "completed" ? <><Check className="w-2.5 h-2.5" />Done</> : <><ArrowUp className="w-2.5 h-2.5" />Active</>}
                              </div>
                            </div>

                            <div className="p-4">
                              <h4 className="text-sm font-black text-foreground mb-1 group-hover:text-accent transition-colors">
                                {item.title}
                              </h4>
                              <p className="text-subtle text-xs mb-4 line-clamp-2">{item.description}</p>
                              <div className="flex items-center justify-between mb-2">
                                <span className="text-foreground font-black text-sm">{item.raised}</span>
                                <span className="text-subtle text-xs">of {item.goal}</span>
                              </div>
                              <div className="w-full h-1 bg-[#e0e0e0] overflow-hidden">
                                <motion.div
                                  initial={{ width: 0 }}
                                  animate={{ width: `${item.progress}%` }}
                                  transition={{ duration: 1, delay: 0.2 + index * 0.1 }}
                                  style={{ background: "linear-gradient(90deg, oklch(65.6% 0.241 354.308), oklch(70% 0.2 320))" }}
                                />
                              </div>
                              <p className="text-right text-[10px] text-subtle mt-1 font-bold">{item.progress}%</p>
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
