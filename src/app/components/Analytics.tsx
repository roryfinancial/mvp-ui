import { motion, AnimatePresence } from "motion/react";
import { useState } from "react";
import { Search, TrendingUp, DollarSign, Users, Gift, LayoutDashboard, BarChart3, Settings as SettingsIcon, LogOut } from "lucide-react";

interface AnalyticsProps {
  onNavigateDashboard?: () => void;
  onNavigateSettings?: () => void;
  onLogout?: () => void;
}

type Metric = "revenue" | "supporters" | "gifts" | "avgContribution";
type TimePeriod = "week" | "month" | "year";

// ── Chart data per metric × time period ────────────────────────────────────
const chartData: Record<TimePeriod, Record<Metric, { values: number[]; labels: string[]; format: (n: number) => string }>> = {
  week: {
    revenue:         { values: [85, 120, 95, 180, 145, 210, 175],  labels: ["Mon","Tue","Wed","Thu","Fri","Sat","Sun"], format: n => `$${n}` },
    supporters:      { values: [2, 3, 1, 4, 3, 5, 4],             labels: ["Mon","Tue","Wed","Thu","Fri","Sat","Sun"], format: n => `${n}` },
    gifts:           { values: [1, 2, 1, 3, 2, 4, 3],             labels: ["Mon","Tue","Wed","Thu","Fri","Sat","Sun"], format: n => `${n}` },
    avgContribution: { values: [42, 40, 95, 45, 48, 42, 44],       labels: ["Mon","Tue","Wed","Thu","Fri","Sat","Sun"], format: n => `$${n}` },
  },
  month: {
    revenue:         { values: [420, 580, 710, 700],               labels: ["Week 1","Week 2","Week 3","Week 4"], format: n => `$${n}` },
    supporters:      { values: [8, 12, 15, 12],                    labels: ["Week 1","Week 2","Week 3","Week 4"], format: n => `${n}` },
    gifts:           { values: [4, 7, 8, 4],                       labels: ["Week 1","Week 2","Week 3","Week 4"], format: n => `${n}` },
    avgContribution: { values: [52, 48, 47, 58],                   labels: ["Week 1","Week 2","Week 3","Week 4"], format: n => `$${n}` },
  },
  year: {
    revenue:         { values: [180, 240, 310, 280, 420, 380, 510, 490, 620, 580, 710, 850], labels: ["Jan","Feb","Mar","Apr","May","Jun","Jul","Aug","Sep","Oct","Nov","Dec"], format: n => `$${n}` },
    supporters:      { values: [5, 8, 10, 9, 14, 12, 16, 15, 19, 18, 22, 25],               labels: ["Jan","Feb","Mar","Apr","May","Jun","Jul","Aug","Sep","Oct","Nov","Dec"], format: n => `${n}` },
    gifts:           { values: [3, 4, 6, 5, 8, 7, 9, 9, 11, 10, 13, 15],                    labels: ["Jan","Feb","Mar","Apr","May","Jun","Jul","Aug","Sep","Oct","Nov","Dec"], format: n => `${n}` },
    avgContribution: { values: [36, 30, 31, 31, 30, 32, 32, 33, 33, 32, 32, 34],             labels: ["Jan","Feb","Mar","Apr","May","Jun","Jul","Aug","Sep","Oct","Nov","Dec"], format: n => `$${n}` },
  },
};

// ── Stat totals per time period ─────────────────────────────────────────────
const periodStats: Record<TimePeriod, {
  revenue: string; revenueChange: string;
  supporters: number; supportersChange: string;
  gifts: number; giftsChange: string;
  avg: string; avgChange: string;
}> = {
  week:  { revenue: "$1,010", revenueChange: "+8%",  supporters: 22,  supportersChange: "+5",  gifts: 16,  giftsChange: "+3",  avg: "$45.91", avgChange: "+2%" },
  month: { revenue: "$2,410", revenueChange: "+12%", supporters: 47,  supportersChange: "+8",  gifts: 23,  giftsChange: "+5",  avg: "$51.28", avgChange: "+3%" },
  year:  { revenue: "$18,240",revenueChange: "+34%", supporters: 173, supportersChange: "+89", gifts: 100, giftsChange: "+52", avg: "$105.43",avgChange: "+18%"},
};

const metricConfig: Record<Metric, { label: string; color: string; accentClass: string; borderClass: string; badgeClass: string; iconColor: string }> = {
  revenue:         { label: "Revenue Over Time",          color: "from-purple-500 to-pink-500",   accentClass: "from-purple-600/10 to-purple-600/5", borderClass: "border-purple-500/20", badgeClass: "text-purple-400 bg-purple-600/20", iconColor: "text-purple-400" },
  supporters:      { label: "Supporter Growth",           color: "from-pink-500 to-rose-500",     accentClass: "from-pink-600/10 to-pink-600/5",     borderClass: "border-pink-500/20",   badgeClass: "text-pink-400 bg-pink-600/20",     iconColor: "text-pink-400" },
  gifts:           { label: "Gifts Over Time",            color: "from-blue-500 to-cyan-500",     accentClass: "from-blue-600/10 to-blue-600/5",     borderClass: "border-blue-500/20",   badgeClass: "text-blue-400 bg-blue-600/20",     iconColor: "text-blue-400" },
  avgContribution: { label: "Avg. Contribution Over Time",color: "from-green-500 to-emerald-500", accentClass: "from-green-600/10 to-green-600/5",   borderClass: "border-green-500/20",  badgeClass: "text-green-400 bg-green-600/20",   iconColor: "text-green-400" },
};

const recentActivity = [
  { supporter: "Sarah Johnson", amount: "$250", project: "New Streaming Setup",    timeAgo: "2h ago",  initials: "SJ" },
  { supporter: "Mike Chen",     amount: "$180", project: "Art Supplies Collection",timeAgo: "5h ago",  initials: "MC" },
  { supporter: "Emily Rodriguez",amount:"$120", project: "New Streaming Setup",    timeAgo: "1d ago",  initials: "ER" },
  { supporter: "Alex Thompson", amount: "$95",  project: "Coffee Fund",            timeAgo: "2d ago",  initials: "AT" },
  { supporter: "Jordan Lee",    amount: "$75",  project: "Art Supplies Collection",timeAgo: "3d ago",  initials: "JL" },
];

export default function Analytics({ onNavigateDashboard, onNavigateSettings, onLogout }: AnalyticsProps) {
  const [searchQuery, setSearchQuery] = useState("");
  const [timePeriod, setTimePeriod] = useState<TimePeriod>("month");
  const [selectedMetric, setSelectedMetric] = useState<Metric>("revenue");
  const [hoveredBar, setHoveredBar] = useState<number | null>(null);

  const stats = periodStats[timePeriod];
  const chart = chartData[timePeriod][selectedMetric];
  const cfg = metricConfig[selectedMetric];
  const maxVal = Math.max(...chart.values);

  // chart key forces re-animation when metric or period changes
  const chartKey = `${selectedMetric}-${timePeriod}`;

  const statCards: { metric: Metric; icon: React.ReactNode; label: string; value: string; change: string }[] = [
    { metric: "revenue",         icon: <DollarSign className="w-10 h-10 text-purple-400" />, label: "Total Revenue",      value: stats.revenue,               change: stats.revenueChange },
    { metric: "supporters",      icon: <Users className="w-10 h-10 text-pink-400" />,        label: "Total Supporters",   value: String(stats.supporters),     change: stats.supportersChange },
    { metric: "gifts",           icon: <Gift className="w-10 h-10 text-blue-400" />,         label: "Gifts Received",     value: String(stats.gifts),          change: stats.giftsChange },
    { metric: "avgContribution", icon: <TrendingUp className="w-10 h-10 text-green-400" />,  label: "Avg. Contribution",  value: stats.avg,                    change: stats.avgChange },
  ];

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
              <button
                onClick={onNavigateDashboard}
                className="flex items-center gap-2 px-4 py-2 rounded-xl text-gray-300 hover:text-white hover:bg-white/5 font-medium text-sm transition-all"
              >
                <LayoutDashboard className="w-4 h-4" />
                Dashboard
              </button>
              <button className="flex items-center gap-2 px-4 py-2 rounded-xl bg-gradient-to-r from-purple-600/20 to-pink-600/20 border border-purple-500/30 text-white font-medium text-sm transition-all">
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
        <div className="max-w-6xl mx-auto">
          {/* Header */}
          <motion.div
            initial={{ opacity: 0, y: 30 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ duration: 0.8, ease: "easeOut" }}
            className="mb-12 flex items-center justify-between flex-wrap gap-4"
          >
            <div>
              <h1 className="text-5xl font-bold mb-2 bg-gradient-to-r from-white to-gray-300 bg-clip-text text-transparent">
                Analytics
              </h1>
              <p className="text-gray-400 text-lg">Track your performance and growth</p>
            </div>

            {/* Time Period Selector */}
            <div className="flex gap-2 rounded-full p-1 border border-white/10 bg-white/5">
              {(["week", "month", "year"] as TimePeriod[]).map((p) => (
                <button
                  key={p}
                  onClick={() => setTimePeriod(p)}
                  className={`px-4 py-2 rounded-full text-sm font-medium capitalize transition-all ${
                    timePeriod === p
                      ? "bg-gradient-to-r from-purple-600 to-pink-600 text-white shadow-lg shadow-purple-500/20"
                      : "text-gray-400 hover:text-white"
                  }`}
                >
                  {p}
                </button>
              ))}
            </div>
          </motion.div>

          {/* Stats Grid — clickable */}
          <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-6 mb-12">
            {statCards.map(({ metric, icon, label, value, change }, i) => {
              const c = metricConfig[metric];
              const isActive = selectedMetric === metric;
              return (
                <motion.button
                  key={metric}
                  initial={{ opacity: 0, y: 20 }}
                  animate={{ opacity: 1, y: 0 }}
                  transition={{ duration: 0.5, delay: 0.1 + i * 0.08 }}
                  whileHover={{ scale: 1.03, y: -4 }}
                  whileTap={{ scale: 0.98 }}
                  onClick={() => setSelectedMetric(metric)}
                  className={`rounded-3xl p-6 text-left w-full transition-all duration-200 bg-gradient-to-br ${c.accentClass} border-2 ${
                    isActive ? `${c.borderClass} ring-1 ring-offset-0 shadow-lg` : "border-white/10 hover:border-white/20"
                  }`}
                  style={isActive ? { boxShadow: "0 8px 32px rgba(139,92,246,0.15)" } : {}}
                >
                  <div className="flex items-center justify-between mb-4">
                    {icon}
                    <span className={`text-xs font-medium px-2 py-1 rounded-full ${c.badgeClass}`}>{change}</span>
                  </div>
                  <p className="text-gray-400 text-sm mb-1">{label}</p>
                  <p className="text-3xl font-bold text-white">{value}</p>
                  {isActive && (
                    <motion.p
                      initial={{ opacity: 0 }}
                      animate={{ opacity: 1 }}
                      className="text-xs mt-2 text-gray-500"
                    >
                      Viewing in chart ↓
                    </motion.p>
                  )}
                </motion.button>
              );
            })}
          </div>

          {/* Content Grid */}
          <div className="grid grid-cols-1 lg:grid-cols-2 gap-8">
            {/* Dynamic Chart */}
            <motion.div
              initial={{ opacity: 0, x: -20 }}
              animate={{ opacity: 1, x: 0 }}
              transition={{ duration: 0.6 }}
              className="rounded-3xl p-8 bg-[#1a1a1a] border border-white/10"
            >
              <div className="flex items-center justify-between mb-2">
                <AnimatePresence mode="wait">
                  <motion.h2
                    key={selectedMetric}
                    initial={{ opacity: 0, y: -6 }}
                    animate={{ opacity: 1, y: 0 }}
                    exit={{ opacity: 0, y: 6 }}
                    transition={{ duration: 0.2 }}
                    className="text-xl font-bold text-white"
                  >
                    {cfg.label}
                  </motion.h2>
                </AnimatePresence>
                <span className={`text-xs font-medium px-2.5 py-1 rounded-full capitalize ${metricConfig[selectedMetric].badgeClass}`}>
                  {timePeriod}
                </span>
              </div>
              <p className="text-gray-500 text-xs mb-6">Click a stat card above to switch metrics</p>

              {/* Bar chart */}
              <div className="relative h-52">
                {/* Y-axis gridlines */}
                <div className="absolute inset-0 flex flex-col justify-between pointer-events-none">
                  {[...Array(4)].map((_, i) => (
                    <div key={i} className="w-full h-px bg-white/5" />
                  ))}
                </div>

                {/* Bars */}
                <AnimatePresence mode="wait">
                  <motion.div
                    key={chartKey}
                    initial={{ opacity: 0 }}
                    animate={{ opacity: 1 }}
                    exit={{ opacity: 0 }}
                    transition={{ duration: 0.15 }}
                    className="absolute inset-0 flex items-end gap-1.5 pb-0"
                  >
                    {chart.values.map((val, idx) => {
                      const heightPct = maxVal > 0 ? (val / maxVal) * 100 : 0;
                      const isHovered = hoveredBar === idx;
                      return (
                        <div
                          key={idx}
                          className="flex-1 flex flex-col items-center justify-end h-full relative group/bar"
                          onMouseEnter={() => setHoveredBar(idx)}
                          onMouseLeave={() => setHoveredBar(null)}
                        >
                          {/* Tooltip */}
                          <AnimatePresence>
                            {isHovered && (
                              <motion.div
                                initial={{ opacity: 0, y: 4 }}
                                animate={{ opacity: 1, y: 0 }}
                                exit={{ opacity: 0, y: 4 }}
                                transition={{ duration: 0.12 }}
                                className="absolute bottom-full mb-2 left-1/2 -translate-x-1/2 z-20 pointer-events-none"
                              >
                                <div className="bg-[#111] border border-white/20 rounded-lg px-2.5 py-1.5 text-center shadow-xl whitespace-nowrap">
                                  <p className="text-white font-bold text-xs">{chart.format(val)}</p>
                                  <p className="text-gray-500 text-[10px]">{chart.labels[idx]}</p>
                                </div>
                              </motion.div>
                            )}
                          </AnimatePresence>

                          {/* Bar */}
                          <motion.div
                            initial={{ height: 0 }}
                            animate={{ height: `${heightPct}%` }}
                            transition={{ duration: 0.5, delay: idx * 0.04, ease: "easeOut" }}
                            className={`w-full rounded-t-lg bg-gradient-to-t ${cfg.color} transition-opacity duration-150 ${
                              hoveredBar !== null && !isHovered ? "opacity-30" : "opacity-100"
                            }`}
                          />
                        </div>
                      );
                    })}
                  </motion.div>
                </AnimatePresence>
              </div>

              {/* X-axis labels */}
              <AnimatePresence mode="wait">
                <motion.div
                  key={chartKey + "-labels"}
                  initial={{ opacity: 0 }}
                  animate={{ opacity: 1 }}
                  exit={{ opacity: 0 }}
                  transition={{ duration: 0.2 }}
                  className="flex items-center justify-between mt-3"
                >
                  {chart.labels.map((label, i) => (
                    <span
                      key={i}
                      className={`flex-1 text-center text-[10px] transition-colors duration-150 ${
                        hoveredBar === i ? "text-white font-semibold" : "text-gray-600"
                      }`}
                    >
                      {label}
                    </span>
                  ))}
                </motion.div>
              </AnimatePresence>
            </motion.div>

            {/* Recent Activity */}
            <motion.div
              initial={{ opacity: 0, x: 20 }}
              animate={{ opacity: 1, x: 0 }}
              transition={{ duration: 0.6 }}
              className="rounded-3xl p-8 bg-[#1a1a1a] border border-white/10"
            >
              <h2 className="text-2xl font-bold text-white mb-6">Recent Activity</h2>
              <div className="space-y-4 max-h-80 overflow-y-auto">
                {recentActivity.map((activity, index) => (
                  <motion.div
                    key={index}
                    initial={{ opacity: 0, x: 20 }}
                    animate={{ opacity: 1, x: 0 }}
                    transition={{ duration: 0.3, delay: 0.6 + index * 0.05 }}
                    whileHover={{ scale: 1.02, x: 4 }}
                    className="flex items-center gap-4 p-4 rounded-xl bg-[#0a0a0a] border border-white/10 hover:border-white/20 transition-all cursor-pointer"
                  >
                    <div className="w-12 h-12 rounded-full flex items-center justify-center bg-gradient-to-br from-purple-600/30 to-pink-600/30 border border-purple-500/20 text-purple-400 font-bold flex-shrink-0">
                      {activity.initials}
                    </div>
                    <div className="flex-1 min-w-0">
                      <p className="text-white font-medium text-sm truncate">{activity.supporter}</p>
                      <p className="text-gray-400 text-xs truncate">supported {activity.project}</p>
                    </div>
                    <div className="text-right flex-shrink-0">
                      <p className="text-purple-400 font-bold text-sm">{activity.amount}</p>
                      <p className="text-gray-500 text-xs">{activity.timeAgo}</p>
                    </div>
                  </motion.div>
                ))}
              </div>
            </motion.div>
          </div>

          {/* Top Projects */}
          <motion.div
            initial={{ opacity: 0, y: 20 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ duration: 0.6, delay: 0.3 }}
            className="mt-8 rounded-3xl p-8 bg-[#1a1a1a] border border-white/10"
          >
            <h2 className="text-2xl font-bold text-white mb-6">Top Performing Projects</h2>
            <div className="grid grid-cols-1 sm:grid-cols-3 gap-6">
              {([
                { name: "New Streaming Setup",    revenue: { week: "$680", month: "$1,890", year: "$8,400"  }, supporters: { week: 9,  month: 28, year: 94  } },
                { name: "Art Supplies Collection",revenue: { week: "$255", month: "$520",   year: "$5,200"  }, supporters: { week: 6,  month: 15, year: 52  } },
                { name: "Coffee Fund",            revenue: { week: "$75",  month: "$200",   year: "$1,840"  }, supporters: { week: 5,  month: 12, year: 40  } },
              ] as const).map((project, index) => (
                <motion.div
                  key={index}
                  initial={{ opacity: 0, y: 20 }}
                  animate={{ opacity: 1, y: 0 }}
                  transition={{ duration: 0.4, delay: 0.8 + index * 0.1 }}
                  whileHover={{ scale: 1.03 }}
                  className="p-6 rounded-2xl bg-[#0a0a0a] border border-white/10 hover:border-white/20 transition-all cursor-pointer"
                >
                  <h3 className="text-base font-bold text-white mb-4 truncate">{project.name}</h3>
                  <div className="space-y-2">
                    <div className="flex items-center justify-between">
                      <span className="text-gray-400 text-sm">Revenue</span>
                      <AnimatePresence mode="wait">
                        <motion.span
                          key={timePeriod + project.name + "r"}
                          initial={{ opacity: 0, y: -4 }}
                          animate={{ opacity: 1, y: 0 }}
                          exit={{ opacity: 0, y: 4 }}
                          transition={{ duration: 0.2 }}
                          className="text-purple-400 font-semibold text-sm"
                        >
                          {project.revenue[timePeriod]}
                        </motion.span>
                      </AnimatePresence>
                    </div>
                    <div className="flex items-center justify-between">
                      <span className="text-gray-400 text-sm">Supporters</span>
                      <AnimatePresence mode="wait">
                        <motion.span
                          key={timePeriod + project.name + "s"}
                          initial={{ opacity: 0, y: -4 }}
                          animate={{ opacity: 1, y: 0 }}
                          exit={{ opacity: 0, y: 4 }}
                          transition={{ duration: 0.2 }}
                          className="text-pink-400 font-semibold text-sm"
                        >
                          {project.supporters[timePeriod]}
                        </motion.span>
                      </AnimatePresence>
                    </div>
                  </div>
                </motion.div>
              ))}
            </div>
          </motion.div>
        </div>
      </section>

      {/* Footer */}
      <footer className="py-16 px-6 border-t border-white/5">
        <div className="max-w-7xl mx-auto text-center text-gray-400">
          <p>© 2026 TipFlow. All rights reserved.</p>
        </div>
      </footer>
    </div>
  );
}
