import { motion } from "motion/react";
import { useState } from "react";
import { Search, User, ChevronDown, ChevronUp, Heart, DollarSign, LayoutDashboard, BarChart3, Settings as SettingsIcon, LogOut } from "lucide-react";

interface Goal {
  name: string;
  progress: number;
}

interface Supporter {
  name: string;
  amount: string;
  initials: string;
}

interface ProjectOverviewProps {
  projectTitle?: string;
  wishlistName?: string;
  creatorName?: string;
  description?: string;
  totalFunded?: string;
  goals?: Goal[];
  supporters?: Supporter[];
  wishlistId?: number;
  isCreator?: boolean;
  onBack?: () => void;
  onBackToWishlist?: (wishlistId: number) => void;
  onNavigateDashboard?: () => void;
  onNavigateAnalytics?: () => void;
  onNavigateSettings?: () => void;
  onLogout?: () => void;
  onViewCreator?: () => void;
}

export default function ProjectOverview({
  projectTitle = "My Awesome Game",
  wishlistName = "Creator Essentials",
  creatorName = "Creator Name",
  description = "This is a placeholder for a detailed description of the project. It covers mechanics, art style, development roadmap, and what funding will help achieve. We're building an epic open-world RPG with pixel-art graphics and a deep narrative. Your support helps us afford better tools, pay artists, and dedicate full-time effort to making this a reality.",
  totalFunded = "$1,234.56",
  goals = [
    { name: "New Monitor", progress: 80 },
    { name: "Game Engine License", progress: 10 },
    { name: "Coffee Fund", progress: 100 },
  ],
  supporters = [
    { name: "Supporter Name 1", amount: "$100", initials: "S1" },
    { name: "Supporter Name 2", amount: "$75", initials: "S2" },
    { name: "Supporter Name 3", amount: "$50", initials: "S3" },
    { name: "Supporter Name 4", amount: "$30", initials: "S4" },
  ],
  wishlistId = 1,
  isCreator = false,
  onBack,
  onBackToWishlist,
  onNavigateDashboard,
  onNavigateAnalytics,
  onNavigateSettings,
  onLogout,
  onViewCreator,
}: ProjectOverviewProps) {
  const [searchQuery, setSearchQuery] = useState("");
  const [supportAmount, setSupportAmount] = useState("");
  const [goalsExpanded, setGoalsExpanded] = useState(false);

  return (
    <div className="min-h-screen bg-background text-foreground">
      {/* Navigation */}
      <nav className="fixed top-0 left-0 right-0 z-50 bg-[#0e0e0e] border-b border-accent/40">
        <div className="max-w-full mx-auto px-6 py-4 flex items-center justify-between">
          <div className="flex items-center gap-8">
            <div className="text-xl font-black text-white tracking-tight">TipFlow</div>
            {isCreator && (
              <div className="hidden md:flex items-center gap-1">
                <button onClick={onNavigateDashboard} className="flex items-center gap-2 px-4 py-2 text-white/60 hover:text-white font-medium text-sm transition-colors">
                  <LayoutDashboard className="w-4 h-4" />
                  Dashboard
                </button>
                <button onClick={onNavigateAnalytics} className="flex items-center gap-2 px-4 py-2 text-white/60 hover:text-white font-medium text-sm transition-colors">
                  <BarChart3 className="w-4 h-4" />
                  Analytics
                </button>
                <button onClick={onNavigateSettings} className="flex items-center gap-2 px-4 py-2 text-white/60 hover:text-white font-medium text-sm transition-colors">
                  <SettingsIcon className="w-4 h-4" />
                  Settings
                </button>
              </div>
            )}
          </div>
          <div className="flex items-center gap-4">
            <div className="relative hidden sm:block">
              <Search className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-white/40" />
              <input
                type="text"
                placeholder="Search"
                value={searchQuery}
                onChange={(e) => setSearchQuery(e.target.value)}
                className="pl-10 pr-4 py-2 bg-white/10 border border-white/20 text-white placeholder-white/30 text-sm focus:outline-none focus:ring-2 focus:ring-accent transition-all w-48"
              />
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

      {/* Main Content */}
      <section className="pt-28 pb-20 px-6">
        <div className="max-w-6xl mx-auto">
          {/* Breadcrumb */}
          <div className="flex items-center gap-2 mb-8 text-sm">
            <button onClick={onNavigateDashboard} className="text-subtle hover:text-foreground transition-colors font-medium">My Wishlists</button>
            <span className="text-[#d0d0d0]">/</span>
            <button onClick={() => onBackToWishlist?.(wishlistId)} className="text-subtle hover:text-foreground transition-colors font-medium">{wishlistName}</button>
            <span className="text-[#d0d0d0]">/</span>
            <span className="text-foreground font-bold truncate max-w-[200px]">{projectTitle}</span>
          </div>

          {/* Project Header */}
          <motion.div
            initial={{ opacity: 0, y: 30 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ duration: 0.8, ease: "easeOut" }}
            className="flex flex-col sm:flex-row items-start gap-8 mb-16 pb-16 border-b border-border"
          >
            <div className="w-32 h-32 sm:w-40 sm:h-40 bg-muted border border-border flex items-center justify-center flex-shrink-0">
              <User className="w-16 h-16 text-[#d0d0d0]" />
            </div>

            <div className="flex-1">
              <div className="text-[10px] font-black uppercase tracking-widest text-subtle mb-2">{wishlistName}</div>
              <h1 className="text-5xl font-black text-foreground mb-4 tracking-tight">{projectTitle}</h1>
              <button
                onClick={onViewCreator}
                className="inline-block px-3 py-1.5 border border-border bg-muted text-muted-foreground text-sm font-bold hover:border-accent hover:text-accent transition-colors"
              >
                by {creatorName}
              </button>
            </div>
          </motion.div>

          {/* Content Grid */}
          <div className="grid grid-cols-1 lg:grid-cols-2 gap-12">
            {/* Left Column */}
            <motion.div
              initial={{ opacity: 0, x: -20 }}
              whileInView={{ opacity: 1, x: 0 }}
              viewport={{ once: true }}
              transition={{ duration: 0.6 }}
            >
              {/* Description */}
              <div className="mb-8">
                <div className="flex items-center gap-3 mb-5">
                  <div className="w-3 h-5 bg-accent" />
                  <h2 className="text-xl font-black text-foreground tracking-tight">About This Item</h2>
                </div>
                <div className="p-6 border border-border bg-muted text-muted-foreground leading-relaxed text-sm">
                  {description}
                </div>
              </div>

              {/* Support Section */}
              {!isCreator && (
                <div className="mb-8">
                  <div className="text-[10px] font-black uppercase tracking-widest text-subtle mb-4">Support This Item</div>
                  <div className="flex items-center gap-3">
                    <div className="relative flex-shrink-0">
                      <DollarSign className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-subtle" />
                      <input
                        type="number"
                        placeholder="0.00"
                        value={supportAmount}
                        onChange={(e) => setSupportAmount(e.target.value)}
                        min="1"
                        className="w-32 pl-9 pr-4 py-3 border border-border bg-background text-foreground placeholder-[#999999] focus:outline-none focus:ring-2 focus:ring-accent transition-all text-sm"
                      />
                    </div>
                    <motion.button
                      whileHover={{ scale: 1.01 }}
                      whileTap={{ scale: 0.99 }}
                      className="flex items-center gap-2 px-6 py-3 btn-cta text-white font-black text-xs uppercase tracking-widest"
                    >
                      <Heart className="w-4 h-4" />
                      Gift This
                    </motion.button>
                  </div>
                </div>
              )}

              {/* Total Funded */}
              <div className="mb-8 p-5 border border-border bg-background">
                <div className="text-[10px] font-black uppercase tracking-widest text-subtle mb-1">Total Funded</div>
                <p className="text-4xl font-black text-accent">{totalFunded}</p>
              </div>

              {/* Goals */}
              <div className="border border-border bg-background">
                <button
                  onClick={() => setGoalsExpanded(!goalsExpanded)}
                  className="w-full flex items-center justify-between p-5 cursor-pointer hover:bg-muted transition-colors"
                >
                  <h3 className="text-sm font-black uppercase tracking-widest text-foreground">Funding Goals</h3>
                  {goalsExpanded ? (
                    <ChevronUp className="w-4 h-4 text-subtle" />
                  ) : (
                    <ChevronDown className="w-4 h-4 text-subtle" />
                  )}
                </button>

                {goalsExpanded && (
                  <motion.ul
                    initial={{ opacity: 0, height: 0 }}
                    animate={{ opacity: 1, height: "auto" }}
                    transition={{ duration: 0.3 }}
                    className="border-t border-border"
                  >
                    {goals.map((goal, index) => (
                      <motion.li
                        key={index}
                        initial={{ opacity: 0, x: -20 }}
                        animate={{ opacity: 1, x: 0 }}
                        transition={{ duration: 0.3, delay: index * 0.05 }}
                        className="flex items-center justify-between p-4 border-b border-border last:border-b-0"
                      >
                        <span className="text-foreground text-sm font-medium">{goal.name}</span>
                        <div className="flex items-center gap-3">
                          <div className="w-24 h-1.5 bg-[#e0e0e0] overflow-hidden">
                            <div className="h-full bg-accent transition-all duration-500" style={{ width: `${goal.progress}%` }} />
                          </div>
                          <span className="text-foreground font-bold text-xs w-10 text-right">{goal.progress}%</span>
                        </div>
                      </motion.li>
                    ))}
                  </motion.ul>
                )}
              </div>
            </motion.div>

            {/* Right Column: Supporters */}
            <motion.div
              initial={{ opacity: 0, x: 20 }}
              whileInView={{ opacity: 1, x: 0 }}
              viewport={{ once: true }}
              transition={{ duration: 0.6 }}
            >
              <div className="flex items-center gap-3 mb-5">
                <div className="w-3 h-5 bg-foreground" />
                <h2 className="text-xl font-black text-foreground tracking-tight">Top Supporters</h2>
              </div>
              <div className="space-y-2">
                {supporters.map((supporter, index) => (
                  <motion.div
                    key={index}
                    initial={{ opacity: 0, x: 20 }}
                    whileInView={{ opacity: 1, x: 0 }}
                    viewport={{ once: true }}
                    transition={{ duration: 0.3, delay: index * 0.05 }}
                    whileHover={{ x: 4 }}
                    className="p-4 border border-border bg-background flex items-center gap-4 cursor-pointer hover:shadow-sm transition-shadow"
                  >
                    <div className="w-4 text-center text-xs font-black text-[#d0d0d0]">
                      {index + 1}
                    </div>
                    <div className="w-10 h-10 bg-muted border border-border flex items-center justify-center flex-shrink-0 font-bold text-xs text-muted-foreground">
                      {supporter.initials}
                    </div>
                    <span className="text-foreground font-bold flex-1 text-sm">{supporter.name}</span>
                    <span className="text-accent font-black text-sm">{supporter.amount}</span>
                  </motion.div>
                ))}
              </div>
            </motion.div>
          </div>
        </div>
      </section>

      <footer className="py-10 px-6 border-t border-border">
        <div className="max-w-7xl mx-auto text-center text-subtle text-sm">
          <p>© 2026 TipFlow. All rights reserved.</p>
        </div>
      </footer>
    </div>
  );
}
