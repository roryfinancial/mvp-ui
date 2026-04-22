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

const metricConfig: Record<Metric, { label: string; color: string; badgeClass: string }> = {
  revenue:         { label: "Revenue Over Time",           color: "#e8185d", badgeClass: "text-[#e8185d] bg-[#fff0f4]" },
  supporters:      { label: "Supporter Growth",            color: "#1d4ed8", badgeClass: "text-[#1d4ed8] bg-[#eff6ff]" },
  gifts:           { label: "Gifts Over Time",             color: "#f59e0b", badgeClass: "text-[#b45309] bg-[#fffbeb]" },
  avgContribution: { label: "Avg. Contribution Over Time", color: "#059669", badgeClass: "text-[#059669] bg-[#ecfdf5]" },
};

const recentActivity = [
  { supporter: "Sarah Johnson",   amount: "$250", project: "New Streaming Setup",     timeAgo: "2h ago",  initials: "SJ" },
  { supporter: "Mike Chen",       amount: "$180", project: "Art Supplies Collection", timeAgo: "5h ago",  initials: "MC" },
  { supporter: "Emily Rodriguez", amount: "$120", project: "New Streaming Setup",     timeAgo: "1d ago",  initials: "ER" },
  { supporter: "Alex Thompson",   amount: "$95",  project: "Coffee Fund",             timeAgo: "2d ago",  initials: "AT" },
  { supporter: "Jordan Lee",      amount: "$75",  project: "Art Supplies Collection", timeAgo: "3d ago",  initials: "JL" },
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
  const chartKey = `${selectedMetric}-${timePeriod}`;

  const statCards: { metric: Metric; icon: React.ReactNode; label: string; value: string; change: string }[] = [
    { metric: "revenue",         icon: <DollarSign className="w-8 h-8" style={{ color: metricConfig.revenue.color }} />,         label: "Total Revenue",     value: stats.revenue,           change: stats.revenueChange },
    { metric: "supporters",      icon: <Users className="w-8 h-8" style={{ color: metricConfig.supporters.color }} />,           label: "Total Fans",        value: String(stats.supporters), change: stats.supportersChange },
    { metric: "gifts",           icon: <Gift className="w-8 h-8" style={{ color: metricConfig.gifts.color }} />,                 label: "Gifts Received",    value: String(stats.gifts),      change: stats.giftsChange },
    { metric: "avgContribution", icon: <TrendingUp className="w-8 h-8" style={{ color: metricConfig.avgContribution.color }} />, label: "Avg. Gift Size",    value: stats.avg,                change: stats.avgChange },
  ];

  return (
    <div className="min-h-screen bg-white text-[#111111]">
      {/* Navigation */}
      <nav className="fixed top-0 left-0 right-0 z-50 bg-[#111111] border-b-2 border-[#e8185d]">
        <div className="max-w-full mx-auto px-6 py-4 flex items-center justify-between">
          <div className="flex items-center gap-8">
            <div className="text-xl font-black text-white tracking-tight">TipFlow</div>
            <div className="hidden md:flex items-center gap-1">
              <button onClick={onNavigateDashboard} className="flex items-center gap-2 px-4 py-2 text-white/60 hover:text-white font-medium text-sm transition-colors">
                <LayoutDashboard className="w-4 h-4" />
                Dashboard
              </button>
              <button className="flex items-center gap-2 px-4 py-2 bg-[#e8185d] text-white font-medium text-sm">
                <BarChart3 className="w-4 h-4" />
                Analytics
              </button>
              <button onClick={onNavigateSettings} className="flex items-center gap-2 px-4 py-2 text-white/60 hover:text-white font-medium text-sm transition-colors">
                <SettingsIcon className="w-4 h-4" />
                Settings
              </button>
            </div>
          </div>
          <div className="flex items-center gap-4">
            <div className="relative hidden sm:block">
              <Search className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-white/40" />
              <input
                type="text"
                placeholder="Search"
                value={searchQuery}
                onChange={(e) => setSearchQuery(e.target.value)}
                className="pl-10 pr-4 py-2 bg-white/10 border border-white/20 text-white placeholder-white/30 text-sm focus:outline-none focus:ring-2 focus:ring-[#e8185d] transition-all w-48"
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
          {/* Header */}
          <motion.div
            initial={{ opacity: 0, y: 30 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ duration: 0.8, ease: "easeOut" }}
            className="mb-10 flex items-end justify-between flex-wrap gap-4"
          >
            <div>
              <div className="text-[10px] font-black uppercase tracking-widest text-[#999999] mb-2">Creator Tools</div>
              <h1 className="text-5xl font-black text-[#111111] tracking-tight">Analytics</h1>
            </div>

            {/* Time Period Selector */}
            <div className="flex border border-[#e0e0e0] bg-[#f5f5f5]">
              {(["week", "month", "year"] as TimePeriod[]).map((p) => (
                <button
                  key={p}
                  onClick={() => setTimePeriod(p)}
                  className={`px-5 py-2 text-xs font-black uppercase tracking-widest capitalize transition-colors ${
                    timePeriod === p ? "bg-[#111111] text-white" : "text-[#6b6b6b] hover:bg-[#e0e0e0]"
                  }`}
                >
                  {p}
                </button>
              ))}
            </div>
          </motion.div>

          {/* Stat Cards */}
          <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-4 mb-10">
            {statCards.map(({ metric, icon, label, value, change }, i) => {
              const c = metricConfig[metric];
              const isActive = selectedMetric === metric;
              return (
                <motion.button
                  key={metric}
                  initial={{ opacity: 0, y: 20 }}
                  animate={{ opacity: 1, y: 0 }}
                  transition={{ duration: 0.5, delay: 0.1 + i * 0.08 }}
                  whileHover={{ y: -2 }}
                  whileTap={{ scale: 0.99 }}
                  onClick={() => setSelectedMetric(metric)}
                  className={`p-6 text-left w-full border-2 transition-all duration-150 bg-white ${
                    isActive ? "border-[#111111]" : "border-[#e0e0e0] hover:border-[#aaaaaa]"
                  }`}
                >
                  <div className="flex items-center justify-between mb-4">
                    {icon}
                    <span className={`text-xs font-black px-2 py-0.5 ${c.badgeClass}`}>{change}</span>
                  </div>
                  <p className="text-[#999999] text-xs font-bold uppercase tracking-widest mb-1">{label}</p>
                  <p className="text-3xl font-black text-[#111111]">{value}</p>
                  {isActive && (
                    <motion.p initial={{ opacity: 0 }} animate={{ opacity: 1 }} className="text-[10px] mt-2 text-[#999999] font-bold uppercase tracking-widest">
                      Viewing in chart ↓
                    </motion.p>
                  )}
                </motion.button>
              );
            })}
          </div>

          {/* Chart + Activity Grid */}
          <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
            {/* Chart */}
            <motion.div
              initial={{ opacity: 0, x: -20 }}
              animate={{ opacity: 1, x: 0 }}
              transition={{ duration: 0.6 }}
              className="border border-[#e0e0e0] bg-white p-8"
            >
              <div className="flex items-center justify-between mb-1">
                <AnimatePresence mode="wait">
                  <motion.h2
                    key={selectedMetric}
                    initial={{ opacity: 0, y: -6 }}
                    animate={{ opacity: 1, y: 0 }}
                    exit={{ opacity: 0, y: 6 }}
                    transition={{ duration: 0.2 }}
                    className="text-lg font-black text-[#111111] tracking-tight"
                  >
                    {cfg.label}
                  </motion.h2>
                </AnimatePresence>
                <span className={`text-[10px] font-black px-2 py-0.5 capitalize ${cfg.badgeClass}`}>
                  {timePeriod}
                </span>
              </div>
              <p className="text-[#999999] text-xs mb-6">Click a stat card above to switch metrics</p>

              {/* Bar Chart */}
              <div className="relative h-52">
                <div className="absolute inset-0 flex flex-col justify-between pointer-events-none">
                  {[...Array(4)].map((_, i) => (
                    <div key={i} className="w-full h-px bg-[#f0f0f0]" />
                  ))}
                </div>

                <AnimatePresence mode="wait">
                  <motion.div
                    key={chartKey}
                    initial={{ opacity: 0 }}
                    animate={{ opacity: 1 }}
                    exit={{ opacity: 0 }}
                    transition={{ duration: 0.15 }}
                    className="absolute inset-0 flex items-end gap-1.5"
                  >
                    {chart.values.map((val, idx) => {
                      const heightPct = maxVal > 0 ? (val / maxVal) * 100 : 0;
                      const isHovered = hoveredBar === idx;
                      return (
                        <div
                          key={idx}
                          className="flex-1 flex flex-col items-center justify-end h-full relative"
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
                                <div className="bg-white border border-[#e0e0e0] shadow-md px-2.5 py-1.5 text-center whitespace-nowrap">
                                  <p className="text-[#111111] font-black text-xs">{chart.format(val)}</p>
                                  <p className="text-[#999999] text-[10px]">{chart.labels[idx]}</p>
                                </div>
                              </motion.div>
                            )}
                          </AnimatePresence>

                          {/* Bar */}
                          <motion.div
                            initial={{ height: 0 }}
                            animate={{ height: `${heightPct}%` }}
                            transition={{ duration: 0.5, delay: idx * 0.04, ease: "easeOut" }}
                            className="w-full transition-opacity duration-150"
                            style={{
                              backgroundColor: cfg.color,
                              opacity: hoveredBar !== null && !isHovered ? 0.25 : 1,
                            }}
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
                        hoveredBar === i ? "text-[#111111] font-black" : "text-[#bbbbbb]"
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
              className="border border-[#e0e0e0] bg-white p-8"
            >
              <div className="text-[10px] font-black uppercase tracking-widest text-[#999999] mb-5">Recent Activity</div>
              <div className="space-y-2 max-h-80 overflow-y-auto">
                {recentActivity.map((activity, index) => (
                  <motion.div
                    key={index}
                    initial={{ opacity: 0, x: 20 }}
                    animate={{ opacity: 1, x: 0 }}
                    transition={{ duration: 0.3, delay: 0.6 + index * 0.05 }}
                    whileHover={{ x: 4 }}
                    className="flex items-center gap-4 p-4 border border-[#e0e0e0] hover:bg-[#f5f5f5] transition-colors cursor-pointer"
                  >
                    <div className="w-10 h-10 bg-[#f0f0f0] border border-[#e0e0e0] flex items-center justify-center flex-shrink-0 font-bold text-xs text-[#6b6b6b]">
                      {activity.initials}
                    </div>
                    <div className="flex-1 min-w-0">
                      <p className="text-[#111111] font-bold text-sm truncate">{activity.supporter}</p>
                      <p className="text-[#999999] text-xs truncate">gifted · {activity.project}</p>
                    </div>
                    <div className="text-right flex-shrink-0">
                      <p className="text-[#e8185d] font-black text-sm">{activity.amount}</p>
                      <p className="text-[#999999] text-xs">{activity.timeAgo}</p>
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
            className="mt-6 border border-[#e0e0e0] bg-white p-8"
          >
            <div className="text-[10px] font-black uppercase tracking-widest text-[#999999] mb-6">Top Performing Items</div>
            <div className="grid grid-cols-1 sm:grid-cols-3 gap-4">
              {([
                { name: "New Streaming Setup",     revenue: { week: "$680", month: "$1,890", year: "$8,400" }, supporters: { week: 9,  month: 28, year: 94 } },
                { name: "Art Supplies Collection", revenue: { week: "$255", month: "$520",   year: "$5,200" }, supporters: { week: 6,  month: 15, year: 52 } },
                { name: "Coffee Fund",             revenue: { week: "$75",  month: "$200",   year: "$1,840" }, supporters: { week: 5,  month: 12, year: 40 } },
              ] as const).map((project, index) => (
                <motion.div
                  key={index}
                  initial={{ opacity: 0, y: 20 }}
                  animate={{ opacity: 1, y: 0 }}
                  transition={{ duration: 0.4, delay: 0.8 + index * 0.1 }}
                  whileHover={{ y: -2 }}
                  className="p-5 border border-[#e0e0e0] bg-[#f5f5f5] hover:bg-white hover:shadow-sm transition-all cursor-pointer"
                >
                  <h3 className="text-sm font-black text-[#111111] mb-4 truncate">{project.name}</h3>
                  <div className="space-y-2">
                    <div className="flex items-center justify-between">
                      <span className="text-[#999999] text-xs font-bold uppercase tracking-widest">Revenue</span>
                      <AnimatePresence mode="wait">
                        <motion.span
                          key={timePeriod + project.name + "r"}
                          initial={{ opacity: 0, y: -4 }}
                          animate={{ opacity: 1, y: 0 }}
                          exit={{ opacity: 0, y: 4 }}
                          transition={{ duration: 0.2 }}
                          className="text-[#e8185d] font-black text-sm"
                        >
                          {project.revenue[timePeriod]}
                        </motion.span>
                      </AnimatePresence>
                    </div>
                    <div className="flex items-center justify-between">
                      <span className="text-[#999999] text-xs font-bold uppercase tracking-widest">Fans</span>
                      <AnimatePresence mode="wait">
                        <motion.span
                          key={timePeriod + project.name + "s"}
                          initial={{ opacity: 0, y: -4 }}
                          animate={{ opacity: 1, y: 0 }}
                          exit={{ opacity: 0, y: 4 }}
                          transition={{ duration: 0.2 }}
                          className="text-[#111111] font-black text-sm"
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

      <footer className="py-10 px-6 border-t border-[#e0e0e0]">
        <div className="max-w-7xl mx-auto text-center text-[#999999] text-sm">
          <p>© 2026 TipFlow. All rights reserved.</p>
        </div>
      </footer>
    </div>
  );
}
