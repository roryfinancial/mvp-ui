import { motion, AnimatePresence } from "motion/react";
import { useState } from "react";
import { TrendingUp, DollarSign, Users, Gift, Link2, ArrowRight } from "lucide-react";

interface AnalyticsProps {
  onNavigateReferrals?: () => void;
}

type Metric = "revenue" | "supporters" | "gifts" | "avgContribution" | "referralEarnings" | "commissionEarned";
type TimePeriod = "week" | "month" | "year";

const chartData: Record<TimePeriod, Record<Metric, { values: number[]; labels: string[]; format: (n: number) => string }>> = {
  week: {
    revenue:          { values: [85, 120, 95, 180, 145, 210, 175],  labels: ["Mon","Tue","Wed","Thu","Fri","Sat","Sun"], format: n => `$${n}` },
    supporters:       { values: [2, 3, 1, 4, 3, 5, 4],             labels: ["Mon","Tue","Wed","Thu","Fri","Sat","Sun"], format: n => `${n}` },
    gifts:            { values: [1, 2, 1, 3, 2, 4, 3],             labels: ["Mon","Tue","Wed","Thu","Fri","Sat","Sun"], format: n => `${n}` },
    avgContribution:  { values: [42, 40, 95, 45, 48, 42, 44],       labels: ["Mon","Tue","Wed","Thu","Fri","Sat","Sun"], format: n => `$${n}` },
    referralEarnings: { values: [12, 18, 14, 22, 19, 28, 24],       labels: ["Mon","Tue","Wed","Thu","Fri","Sat","Sun"], format: n => `$${n}` },
    commissionEarned: { values: [6, 9, 7, 11, 9, 14, 12],           labels: ["Mon","Tue","Wed","Thu","Fri","Sat","Sun"], format: n => `$${n}` },
  },
  month: {
    revenue:          { values: [420, 580, 710, 700],               labels: ["Week 1","Week 2","Week 3","Week 4"], format: n => `$${n}` },
    supporters:       { values: [8, 12, 15, 12],                    labels: ["Week 1","Week 2","Week 3","Week 4"], format: n => `${n}` },
    gifts:            { values: [4, 7, 8, 4],                       labels: ["Week 1","Week 2","Week 3","Week 4"], format: n => `${n}` },
    avgContribution:  { values: [52, 48, 47, 58],                   labels: ["Week 1","Week 2","Week 3","Week 4"], format: n => `$${n}` },
    referralEarnings: { values: [62, 94, 118, 106],                  labels: ["Week 1","Week 2","Week 3","Week 4"], format: n => `$${n}` },
    commissionEarned: { values: [31, 47, 59, 53],                    labels: ["Week 1","Week 2","Week 3","Week 4"], format: n => `$${n}` },
  },
  year: {
    revenue:          { values: [180, 240, 310, 280, 420, 380, 510, 490, 620, 580, 710, 850], labels: ["Jan","Feb","Mar","Apr","May","Jun","Jul","Aug","Sep","Oct","Nov","Dec"], format: n => `$${n}` },
    supporters:       { values: [5, 8, 10, 9, 14, 12, 16, 15, 19, 18, 22, 25],               labels: ["Jan","Feb","Mar","Apr","May","Jun","Jul","Aug","Sep","Oct","Nov","Dec"], format: n => `${n}` },
    gifts:            { values: [3, 4, 6, 5, 8, 7, 9, 9, 11, 10, 13, 15],                    labels: ["Jan","Feb","Mar","Apr","May","Jun","Jul","Aug","Sep","Oct","Nov","Dec"], format: n => `${n}` },
    avgContribution:  { values: [36, 30, 31, 31, 30, 32, 32, 33, 33, 32, 32, 34],             labels: ["Jan","Feb","Mar","Apr","May","Jun","Jul","Aug","Sep","Oct","Nov","Dec"], format: n => `$${n}` },
    referralEarnings: { values: [0, 0, 42, 68, 95, 112, 148, 162, 198, 220, 264, 310],        labels: ["Jan","Feb","Mar","Apr","May","Jun","Jul","Aug","Sep","Oct","Nov","Dec"], format: n => `$${n}` },
    commissionEarned: { values: [0, 0, 21, 34, 47, 56, 74, 81, 99, 110, 132, 155],            labels: ["Jan","Feb","Mar","Apr","May","Jun","Jul","Aug","Sep","Oct","Nov","Dec"], format: n => `$${n}` },
  },
};

// ── Stat totals per time period ─────────────────────────────────────────────
const periodStats: Record<TimePeriod, {
  revenue: string; revenueChange: string;
  supporters: number; supportersChange: string;
  gifts: number; giftsChange: string;
  avg: string; avgChange: string;
  referralEarnings: string; referralEarningsChange: string;
  commissionEarned: string; commissionEarnedChange: string;
}> = {
  week:  { revenue: "$1,010", revenueChange: "+8%",  supporters: 22,  supportersChange: "+5",  gifts: 16,  giftsChange: "+3",  avg: "$45.91", avgChange: "+2%",  referralEarnings: "$137",    referralEarningsChange: "+14%", commissionEarned: "$68",     commissionEarnedChange: "+14%" },
  month: { revenue: "$2,410", revenueChange: "+12%", supporters: 47,  supportersChange: "+8",  gifts: 23,  giftsChange: "+5",  avg: "$51.28", avgChange: "+3%",  referralEarnings: "$380",    referralEarningsChange: "+21%", commissionEarned: "$190",    commissionEarnedChange: "+21%" },
  year:  { revenue: "$18,240",revenueChange: "+34%", supporters: 173, supportersChange: "+89", gifts: 100, giftsChange: "+52", avg: "$105.43",avgChange: "+18%", referralEarnings: "$1,619",  referralEarningsChange: "+68%", commissionEarned: "$809",    commissionEarnedChange: "+68%" },
};

const metricConfig: Record<Metric, { label: string; color: string; accentClass: string; borderClass: string; badgeClass: string; iconColor: string }> = {
  revenue:          { label: "Revenue Over Time",             color: "oklch(65.6% 0.241 354.308)",   accentClass: "bg-purple-600/10",   borderClass: "border-purple-500/20", badgeClass: "text-purple-400 bg-purple-600/20", iconColor: "text-purple-400" },
  supporters:       { label: "Supporter Growth",              color: "oklch(72% 0.2 350)",            accentClass: "bg-pink-600/10",     borderClass: "border-pink-500/20",   badgeClass: "text-pink-400 bg-pink-600/20",     iconColor: "text-pink-400" },
  gifts:            { label: "Gifts Over Time",               color: "oklch(60% 0.2 250)",            accentClass: "bg-blue-600/10",     borderClass: "border-blue-500/20",   badgeClass: "text-blue-400 bg-blue-600/20",     iconColor: "text-blue-400" },
  avgContribution:  { label: "Avg. Contribution Over Time",   color: "oklch(65% 0.18 155)",           accentClass: "bg-green-600/10",    borderClass: "border-green-500/20",  badgeClass: "text-green-400 bg-green-600/20",   iconColor: "text-green-400" },
  referralEarnings: { label: "Referral Earnings Over Time",   color: "oklch(72% 0.18 80)",            accentClass: "bg-amber-600/10",    borderClass: "border-amber-500/20",  badgeClass: "text-amber-400 bg-amber-600/20",   iconColor: "text-amber-400" },
  commissionEarned: { label: "Commission Earned Over Time",   color: "oklch(68% 0.15 185)",           accentClass: "bg-teal-600/10",     borderClass: "border-teal-500/20",   badgeClass: "text-teal-400 bg-teal-600/20",     iconColor: "text-teal-400" },
};

const recentActivity = [
  { supporter: "Sarah Johnson",   amount: "$250", project: "New Streaming Setup",     timeAgo: "2h ago",  initials: "SJ" },
  { supporter: "Mike Chen",       amount: "$180", project: "Art Supplies Collection", timeAgo: "5h ago",  initials: "MC" },
  { supporter: "Emily Rodriguez", amount: "$120", project: "New Streaming Setup",     timeAgo: "1d ago",  initials: "ER" },
  { supporter: "Alex Thompson",   amount: "$95",  project: "Coffee Fund",             timeAgo: "2d ago",  initials: "AT" },
  { supporter: "Jordan Lee",      amount: "$75",  project: "Art Supplies Collection", timeAgo: "3d ago",  initials: "JL" },
];

export default function Analytics({ onNavigateReferrals }: AnalyticsProps) {
  const [timePeriod, setTimePeriod] = useState<TimePeriod>("month");
  const [selectedMetric, setSelectedMetric] = useState<Metric>("revenue");
  const [hoveredBar, setHoveredBar] = useState<number | null>(null);

  const stats = periodStats[timePeriod];
  const chart = chartData[timePeriod][selectedMetric];
  const cfg = metricConfig[selectedMetric];
  const maxVal = Math.max(...chart.values);
  const chartKey = `${selectedMetric}-${timePeriod}`;

  const statCards: { metric: Metric; icon: React.ReactNode; label: string; value: string; change: string }[] = [
    { metric: "revenue",          icon: <DollarSign className="w-10 h-10 text-purple-400" />, label: "Total Revenue",        value: stats.revenue,                    change: stats.revenueChange },
    { metric: "supporters",       icon: <Users className="w-10 h-10 text-pink-400" />,        label: "Total Supporters",     value: String(stats.supporters),         change: stats.supportersChange },
    { metric: "gifts",            icon: <Gift className="w-10 h-10 text-blue-400" />,         label: "Gifts Received",       value: String(stats.gifts),              change: stats.giftsChange },
    { metric: "avgContribution",  icon: <TrendingUp className="w-10 h-10 text-green-400" />,  label: "Avg. Contribution",    value: stats.avg,                        change: stats.avgChange },
  ];

  const referralStatCards: { metric: Metric; icon: React.ReactNode; label: string; value: string; change: string }[] = [
    { metric: "referralEarnings", icon: <Link2 className="w-10 h-10 text-amber-400" />,       label: "Referral Earnings",    value: stats.referralEarnings,           change: stats.referralEarningsChange },
    { metric: "commissionEarned", icon: <TrendingUp className="w-10 h-10 text-teal-400" />,   label: "Commission Earned",    value: stats.commissionEarned,           change: stats.commissionEarnedChange },
  ];

  return (
    <div className="min-h-screen bg-background text-foreground">
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
              <div className="text-[10px] font-black uppercase tracking-widest text-subtle mb-2">Creator Tools</div>
              <h1 className="text-5xl font-black text-foreground tracking-tight">Analytics</h1>
            </div>

            {/* Time Period Selector */}
            <div className="flex border border-border bg-muted">
              {(["week", "month", "year"] as TimePeriod[]).map((p) => (
                <button
                  key={p}
                  onClick={() => setTimePeriod(p)}
                  className={`px-5 py-2 text-xs font-black uppercase tracking-widest capitalize transition-colors ${
                    timePeriod === p ? "bg-foreground text-background" : "text-muted-foreground hover:bg-secondary"
                  }`}
                >
                  {p}
                </button>
              ))}
            </div>
          </motion.div>

          {/* Stats Grid — clickable */}
          <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-6 mb-6">
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
                  className={`p-6 text-left w-full transition-all duration-200 ${c.accentClass} border-2 ${
                    isActive ? `${c.borderClass} ring-1 ring-offset-0 shadow-lg` : "border-border hover:border-border"
                  }`}
                  style={isActive ? { boxShadow: "0 8px 32px rgba(139,92,246,0.15)" } : {}}
                >
                  <div className="flex items-center justify-between mb-4">
                    {icon}
                    <span className={`text-xs font-medium px-2 py-1 ${c.badgeClass}`}>{change}</span>
                  </div>
                  <p className="text-muted-foreground text-sm mb-1">{label}</p>
                  <p className="text-3xl font-bold text-foreground">{value}</p>
                  {isActive && (
                    <motion.p
                      initial={{ opacity: 0 }}
                      animate={{ opacity: 1 }}
                      className="text-xs mt-2 text-subtle"
                    >
                      Viewing in chart ↓
                    </motion.p>
                  )}
                </motion.button>
              );
            })}
          </div>

          {/* Referral KPI Cards — clickable, same dynamic pattern */}
          <div className="grid grid-cols-1 sm:grid-cols-2 gap-6 mb-12">
            {referralStatCards.map(({ metric, icon, label, value, change }, i) => {
              const c = metricConfig[metric];
              const isActive = selectedMetric === metric;
              return (
                <motion.button
                  key={metric}
                  initial={{ opacity: 0, y: 20 }}
                  animate={{ opacity: 1, y: 0 }}
                  transition={{ duration: 0.5, delay: 0.42 + i * 0.08 }}
                  whileHover={{ scale: 1.03, y: -4 }}
                  whileTap={{ scale: 0.98 }}
                  onClick={() => setSelectedMetric(metric)}
                  className={`p-6 text-left w-full transition-all duration-200 ${c.accentClass} border-2 ${
                    isActive ? `${c.borderClass} ring-1 ring-offset-0 shadow-lg` : "border-border hover:border-border"
                  }`}
                  style={isActive ? { boxShadow: "0 8px 32px rgba(251,191,36,0.12)" } : {}}
                >
                  <div className="flex items-center justify-between mb-4">
                    {icon}
                    <span className={`text-xs font-medium px-2 py-1 ${c.badgeClass}`}>{change}</span>
                  </div>
                  <p className="text-muted-foreground text-sm mb-1">{label}</p>
                  <p className="text-3xl font-bold text-foreground">{value}</p>
                  {isActive && (
                    <motion.p initial={{ opacity: 0 }} animate={{ opacity: 1 }} className="text-xs mt-2 text-subtle">
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
              className="border border-border bg-background p-8 card-game"
            >
              <div className="flex items-center justify-between mb-1">
                <AnimatePresence mode="wait">
                  <motion.h2
                    key={selectedMetric}
                    initial={{ opacity: 0, y: -6 }}
                    animate={{ opacity: 1, y: 0 }}
                    exit={{ opacity: 0, y: 6 }}
                    transition={{ duration: 0.2 }}
                    className="text-lg font-black text-foreground tracking-tight"
                  >
                    {cfg.label}
                  </motion.h2>
                </AnimatePresence>
                <span className={`text-[10px] font-black px-2 py-0.5 capitalize ${cfg.badgeClass}`}>
                  {timePeriod}
                </span>
              </div>
              <p className="text-subtle text-xs mb-6">Click a stat card above to switch metrics</p>

              {/* Bar Chart */}
              <div className="relative h-52">
                <div className="absolute inset-0 flex flex-col justify-between pointer-events-none">
                  {[...Array(4)].map((_, i) => (
                    <div key={i} className="w-full h-px bg-muted" />
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
                                <div className="bg-background border border-border shadow-md px-2.5 py-1.5 text-center whitespace-nowrap">
                                  <p className="text-foreground font-black text-xs">{chart.format(val)}</p>
                                  <p className="text-subtle text-[10px]">{chart.labels[idx]}</p>
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
                        hoveredBar === i ? "text-foreground font-black" : "text-subtle"
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
              className="border border-border bg-background p-8 card-game"
            >
              <div className="text-[10px] font-black uppercase tracking-widest text-subtle mb-5">Recent Activity</div>
              <div className="space-y-2 max-h-80 overflow-y-auto">
                {recentActivity.map((activity, index) => (
                  <motion.div
                    key={index}
                    initial={{ opacity: 0, x: 20 }}
                    animate={{ opacity: 1, x: 0 }}
                    transition={{ duration: 0.3, delay: 0.6 + index * 0.05 }}
                    whileHover={{ x: 4 }}
                    className="flex items-center gap-4 p-4 border border-border hover:bg-muted transition-colors cursor-pointer"
                  >
                    <div className="w-10 h-10 bg-muted border border-border flex items-center justify-center flex-shrink-0 font-bold text-xs text-muted-foreground">
                      {activity.initials}
                    </div>
                    <div className="flex-1 min-w-0">
                      <p className="text-foreground font-bold text-sm truncate">{activity.supporter}</p>
                      <p className="text-subtle text-xs truncate">gifted · {activity.project}</p>
                    </div>
                    <div className="text-right flex-shrink-0">
                      <p className="text-accent font-black text-sm">{activity.amount}</p>
                      <p className="text-subtle text-xs">{activity.timeAgo}</p>
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
            className="mt-6 border border-border bg-background p-8"
          >
            <div className="text-[10px] font-black uppercase tracking-widest text-subtle mb-6">Top Performing Items</div>
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
                  className="p-5 border border-border bg-muted hover:bg-background hover:shadow-sm transition-all cursor-pointer"
                >
                  <h3 className="text-sm font-black text-foreground mb-4 truncate">{project.name}</h3>
                  <div className="space-y-2">
                    <div className="flex items-center justify-between">
                      <span className="text-subtle text-xs font-bold uppercase tracking-widest">Revenue</span>
                      <AnimatePresence mode="wait">
                        <motion.span
                          key={timePeriod + project.name + "r"}
                          initial={{ opacity: 0, y: -4 }}
                          animate={{ opacity: 1, y: 0 }}
                          exit={{ opacity: 0, y: 4 }}
                          transition={{ duration: 0.2 }}
                          className="text-accent font-black text-sm"
                        >
                          {project.revenue[timePeriod]}
                        </motion.span>
                      </AnimatePresence>
                    </div>
                    <div className="flex items-center justify-between">
                      <span className="text-subtle text-xs font-bold uppercase tracking-widest">Fans</span>
                      <AnimatePresence mode="wait">
                        <motion.span
                          key={timePeriod + project.name + "s"}
                          initial={{ opacity: 0, y: -4 }}
                          animate={{ opacity: 1, y: 0 }}
                          exit={{ opacity: 0, y: 4 }}
                          transition={{ duration: 0.2 }}
                          className="text-foreground font-black text-sm"
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

          {/* Referral Overview Panel */}
          <motion.div
            initial={{ opacity: 0, y: 20 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ duration: 0.6, delay: 0.45 }}
            className="mt-8 p-8 bg-amber-600/10 border border-amber-500/20"
          >
            <div className="flex items-start justify-between flex-wrap gap-4 mb-6">
              <div>
                <h2 className="text-2xl font-bold text-foreground">Referral Overview</h2>
                <p className="text-muted-foreground text-sm mt-1">Earnings from creators you've referred to TipFlow</p>
              </div>
              <motion.button
                whileHover={{ scale: 1.04 }}
                whileTap={{ scale: 0.97 }}
                onClick={onNavigateReferrals}
                className="flex items-center gap-2 px-5 py-2.5 bg-amber-600/15 border border-amber-500/30 text-amber-400 font-medium text-sm hover:bg-amber-600/25 transition-all"
              >
                Manage Referrals
                <ArrowRight className="w-4 h-4" />
              </motion.button>
            </div>

            <div className="grid grid-cols-1 sm:grid-cols-3 gap-5">
              {[
                { label: "Active Referred Creators", value: "3", sub: "of 5 total", color: "text-amber-400" },
                {
                  label: "Referral Earnings",
                  value: periodStats[timePeriod].referralEarnings,
                  sub: `${periodStats[timePeriod].referralEarningsChange} vs prior ${timePeriod}`,
                  color: "text-amber-400",
                },
                {
                  label: "Commission Earned",
                  value: periodStats[timePeriod].commissionEarned,
                  sub: "5% rate · Starter tier",
                  color: "text-teal-400",
                },
              ].map((item, i) => (
                <motion.div
                  key={i}
                  initial={{ opacity: 0, y: 10 }}
                  animate={{ opacity: 1, y: 0 }}
                  transition={{ duration: 0.4, delay: 0.55 + i * 0.08 }}
                  className="p-5 bg-muted border border-border"
                >
                  <p className="text-muted-foreground text-sm mb-2">{item.label}</p>
                  <AnimatePresence mode="wait">
                    <motion.p
                      key={timePeriod + item.label}
                      initial={{ opacity: 0, y: -4 }}
                      animate={{ opacity: 1, y: 0 }}
                      exit={{ opacity: 0, y: 4 }}
                      transition={{ duration: 0.2 }}
                      className={`text-3xl font-bold ${item.color}`}
                    >
                      {item.value}
                    </motion.p>
                  </AnimatePresence>
                  <p className="text-subtle text-xs mt-1">{item.sub}</p>
                </motion.div>
              ))}
            </div>
          </motion.div>
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
