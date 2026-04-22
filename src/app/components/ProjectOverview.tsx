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
  description = "This is a placeholder for a detailed description of the project. It would cover mechanics, art style, development roadmap, and what funding will help achieve. We are building an epic open-world RPG with pixel-art graphics and a deep narrative. Your support helps us afford better tools, pay artists, and dedicate full-time effort to make this dream a reality!",
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
    <div className="min-h-screen bg-[#0a0a0a] text-white">
      {/* Navigation */}
      <nav className="fixed top-0 left-0 right-0 z-50 bg-[#0a0a0a]/80 backdrop-blur-lg border-b border-white/5">
        <div className="max-w-full mx-auto px-6 py-5 flex items-center justify-between">
          <div className="flex items-center gap-8">
            <div className="text-2xl font-bold bg-gradient-to-r from-purple-400 to-pink-400 bg-clip-text text-transparent">
              TipFlow
            </div>
            {isCreator && (
              <div className="hidden md:flex items-center gap-1">
                <button
                  onClick={onNavigateDashboard}
                  className="flex items-center gap-2 px-4 py-2 rounded-xl text-gray-300 hover:text-white hover:bg-white/5 font-medium text-sm transition-all"
                >
                  <LayoutDashboard className="w-4 h-4" />
                  Dashboard
                </button>
                <button
                  onClick={onNavigateAnalytics}
                  className="flex items-center gap-2 px-4 py-2 rounded-xl text-gray-300 hover:text-white hover:bg-white/5 font-medium text-sm transition-all"
                >
                  <BarChart3 className="w-4 h-4" />
                  Analytics
                </button>
                <button
                  onClick={onNavigateSettings}
                  className="flex items-center gap-2 px-4 py-2 rounded-xl text-gray-300 hover:text-white hover:bg-white/5 font-medium text-sm transition-all"
                >
                  <SettingsIcon className="w-4 h-4" />
                  Settings
                </button>
              </div>
            )}
          </div>
          <div className="flex items-center gap-6">
            <div className="relative hidden sm:block">
              <Search className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-gray-400" />
              <input
                type="text"
                placeholder="Search"
                value={searchQuery}
                onChange={(e) => setSearchQuery(e.target.value)}
                className="pl-10 pr-4 py-2 rounded-xl bg-[#1a1a1a] border border-white/10 text-white placeholder-gray-500 text-sm focus:outline-none focus:ring-2 focus:ring-purple-500 transition-all w-64"
              />
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

      {/* Main Content */}
      <section className="relative pt-32 pb-20 px-6">
        <div className="max-w-6xl mx-auto relative z-10">
          {/* Breadcrumb */}
          <div className="flex items-center gap-2 mb-8 text-sm">
            <button
              onClick={onNavigateDashboard}
              className="text-gray-400 hover:text-white transition-colors font-medium"
            >
              My Wishlists
            </button>
            <span className="text-gray-600">/</span>
            <button
              onClick={() => onBackToWishlist?.(wishlistId)}
              className="text-gray-400 hover:text-white transition-colors font-medium"
            >
              {wishlistName}
            </button>
            <span className="text-gray-600">/</span>
            <span className="text-white font-semibold truncate max-w-[200px]">{projectTitle}</span>
          </div>

          {/* Project Header */}
          <motion.div
            initial={{ opacity: 0, y: 30 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ duration: 0.8, ease: "easeOut" }}
            className="flex flex-col sm:flex-row items-center sm:items-start gap-8 mb-16"
          >
            {/* Project Thumbnail */}
            <div
              className="w-32 h-32 sm:w-40 sm:h-40 rounded-2xl flex items-center justify-center flex-shrink-0"
              style={{
                backgroundColor: "rgba(255, 255, 255, 0.05)",
                borderWidth: "1px",
                borderColor: "rgba(255, 255, 255, 0.1)",
              }}
            >
              <User className="w-16 h-16 text-gray-500" />
            </div>

            {/* Project Name & Creator */}
            <div className="flex-1 text-center sm:text-left">
              <h1 className="text-5xl font-bold mb-4 bg-gradient-to-r from-white to-gray-300 bg-clip-text text-transparent">
                {projectTitle}
              </h1>
              <button
                onClick={onViewCreator}
                className="inline-block px-4 py-2 rounded-full font-medium text-sm transition-all hover:scale-105 cursor-pointer"
                style={{
                  backgroundColor: "rgba(139, 92, 246, 0.2)",
                  color: "#c084fc",
                }}
              >
                by {creatorName}
              </button>
            </div>
          </motion.div>

          {/* Main Content Grid */}
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
                <h2 className="text-3xl font-bold mb-6 flex items-center gap-3">
                  <span className="w-2 h-8 bg-gradient-to-b from-purple-500 to-pink-500 rounded-full"></span>
                  Description
                </h2>
                <div
                  className="rounded-2xl p-6 text-gray-300 leading-relaxed"
                  style={{
                    backgroundColor: "rgba(255, 255, 255, 0.05)",
                    borderWidth: "1px",
                    borderColor: "rgba(255, 255, 255, 0.1)",
                  }}
                >
                  {description}
                </div>
              </div>

              {/* Support Section */}
              {!isCreator && (
                <div className="mb-8">
                  <h3 className="text-xl font-semibold text-white mb-4">Support this project</h3>
                  <div className="flex items-center gap-4">
                    <div className="relative flex-shrink-0">
                      <DollarSign className="absolute left-3 top-1/2 -translate-y-1/2 w-5 h-5 text-gray-400" />
                      <input
                        type="number"
                        placeholder="0.00"
                        value={supportAmount}
                        onChange={(e) => setSupportAmount(e.target.value)}
                        min="1"
                        className="w-32 pl-10 pr-4 py-3 rounded-xl bg-[#1a1a1a] text-white placeholder-gray-500 focus:outline-none focus:ring-2 focus:ring-purple-500 transition-all"
                        style={{
                          borderWidth: "1px",
                          borderColor: "rgba(255, 255, 255, 0.1)",
                        }}
                      />
                    </div>
                    <motion.button
                      whileHover={{ scale: 1.05, boxShadow: "0 20px 40px rgba(168, 85, 247, 0.4)" }}
                      whileTap={{ scale: 0.95 }}
                      className="flex items-center gap-2 px-6 py-3 bg-gradient-to-r from-purple-600 to-pink-600 hover:from-purple-500 hover:to-pink-500 rounded-xl text-white font-semibold transition-all shadow-lg shadow-purple-500/25"
                    >
                      <Heart className="w-5 h-5" />
                      Support
                    </motion.button>
                  </div>
                </div>
              )}

              {/* Total Funded */}
              <div className="mb-8">
                <p className="text-2xl font-bold text-white mb-2">
                  Total Funded: <span className="text-transparent bg-gradient-to-r from-purple-400 to-pink-400 bg-clip-text">{totalFunded}</span>
                </p>
              </div>

              {/* Goals (Collapsible) */}
              <div
                className="rounded-2xl p-6"
                style={{
                  backgroundColor: "rgba(255, 255, 255, 0.05)",
                  borderWidth: "1px",
                  borderColor: "rgba(255, 255, 255, 0.1)",
                }}
              >
                <button
                  onClick={() => setGoalsExpanded(!goalsExpanded)}
                  className="w-full flex items-center justify-between cursor-pointer group"
                >
                  <h3 className="text-xl font-semibold text-white">Goals</h3>
                  {goalsExpanded ? (
                    <ChevronUp className="w-5 h-5 text-gray-400 group-hover:text-white transition-colors" />
                  ) : (
                    <ChevronDown className="w-5 h-5 text-gray-400 group-hover:text-white transition-colors" />
                  )}
                </button>

                {goalsExpanded && (
                  <motion.ul
                    initial={{ opacity: 0, height: 0 }}
                    animate={{ opacity: 1, height: "auto" }}
                    exit={{ opacity: 0, height: 0 }}
                    transition={{ duration: 0.3 }}
                    className="mt-6 space-y-4"
                  >
                    {goals.map((goal, index) => (
                      <motion.li
                        key={index}
                        initial={{ opacity: 0, x: -20 }}
                        animate={{ opacity: 1, x: 0 }}
                        transition={{ duration: 0.3, delay: index * 0.05 }}
                        className="flex items-center justify-between"
                      >
                        <span className="text-gray-300">{goal.name}</span>
                        <div className="flex items-center gap-3">
                          <div className="w-24 rounded-full h-2 overflow-hidden" style={{ backgroundColor: "rgba(255, 255, 255, 0.05)" }}>
                            <div
                              className="h-full bg-gradient-to-r from-purple-500 to-pink-500 rounded-full transition-all duration-500"
                              style={{ width: `${goal.progress}%` }}
                            />
                          </div>
                          <span className="text-white font-medium text-sm w-12 text-right">{goal.progress}%</span>
                        </div>
                      </motion.li>
                    ))}
                  </motion.ul>
                )}
              </div>
            </motion.div>

            {/* Right Column: Leading Supporters */}
            <motion.div
              initial={{ opacity: 0, x: 20 }}
              whileInView={{ opacity: 1, x: 0 }}
              viewport={{ once: true }}
              transition={{ duration: 0.6 }}
            >
              <h2 className="text-3xl font-bold mb-6 flex items-center gap-3">
                <span className="w-2 h-8 bg-gradient-to-b from-pink-500 to-purple-500 rounded-full"></span>
                Leading Supporters
              </h2>
              <div className="space-y-4">
                {supporters.map((supporter, index) => (
                  <motion.div
                    key={index}
                    initial={{ opacity: 0, x: 20 }}
                    whileInView={{ opacity: 1, x: 0 }}
                    viewport={{ once: true }}
                    transition={{ duration: 0.3, delay: index * 0.05 }}
                    whileHover={{ scale: 1.02, x: 5 }}
                    className="rounded-xl p-4 flex items-center gap-4 cursor-pointer"
                    style={{
                      backgroundColor: "rgba(255, 255, 255, 0.05)",
                      borderWidth: "1px",
                      borderColor: "rgba(255, 255, 255, 0.05)",
                    }}
                  >
                    <div
                      className="w-12 h-12 rounded-full flex items-center justify-center flex-shrink-0 font-semibold text-sm"
                      style={{
                        backgroundColor: "rgba(139, 92, 246, 0.3)",
                        color: "#c084fc",
                      }}
                    >
                      {supporter.initials}
                    </div>
                    <span className="text-white font-medium flex-1">{supporter.name}</span>
                    <span className="text-gray-400">{supporter.amount}</span>
                  </motion.div>
                ))}
              </div>
            </motion.div>
          </div>
        </div>
      </section>

      {/* Footer */}
      <footer className="py-16 px-6" style={{ borderTopWidth: "1px", borderColor: "rgba(255, 255, 255, 0.05)" }}>
        <div className="max-w-7xl mx-auto text-center text-gray-400">
          <p>© 2026 TipFlow. All rights reserved.</p>
        </div>
      </footer>
    </div>
  );
}
