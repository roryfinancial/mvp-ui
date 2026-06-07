import { motion, AnimatePresence } from "motion/react";
import { useState, useEffect } from "react";
import {
  Copy,
  Check,
  Users,
  DollarSign,
  UserCheck,
  TrendingUp,
  ChevronDown,
  Share2,
  Loader2,
} from "lucide-react";
import { referralApi, type ReferralResponse, type ReferralLinkResponse, type ReferralStatsResponse } from "../../lib/api";

interface ReferralsProps {}

const commissionTiers = [
  { label: "Starter", range: "0–5 referrals", rate: "5%", color: "bg-purple-600/15", border: "border-purple-500/30", badge: "text-purple-400 bg-purple-500/20" },
  { label: "Builder", range: "6–15 referrals", rate: "7%", color: "bg-pink-600/15", border: "border-pink-500/30", badge: "text-pink-400 bg-pink-500/20" },
  { label: "Pro", range: "16–30 referrals", rate: "9%", color: "bg-amber-600/15", border: "border-amber-500/30", badge: "text-amber-400 bg-amber-500/20" },
  { label: "Elite", range: "31+ referrals", rate: "12%", color: "bg-emerald-600/15", border: "border-emerald-500/30", badge: "text-emerald-400 bg-emerald-500/20" },
];

function formatCurrency(value: number): string {
  return `$${value.toLocaleString(undefined, { minimumFractionDigits: 2, maximumFractionDigits: 2 })}`;
}

function formatDate(iso: string): string {
  return new Date(iso).toLocaleDateString("en-US", { month: "short", day: "numeric", year: "numeric" });
}

const statusStyle: Record<string, string> = {
  ACTIVE:   "text-emerald-400 bg-emerald-500/15 border border-emerald-500/30",
  INACTIVE: "text-muted-foreground  bg-muted  border border-border",
  PENDING:  "text-amber-400  bg-amber-500/15  border border-amber-500/30",
};

export default function Referrals(_: ReferralsProps) {
  const [copied, setCopied] = useState(false);
  const [sortBy, setSortBy] = useState<"commission" | "tips" | "joined">("commission");
  const [showSortMenu, setShowSortMenu] = useState(false);
  const [dataLoading, setDataLoading] = useState(true);

  const [referrals, setReferrals] = useState<ReferralResponse[]>([]);
  const [linkData, setLinkData] = useState<ReferralLinkResponse | null>(null);
  const [stats, setStats] = useState<ReferralStatsResponse | null>(null);

  useEffect(() => {
    setDataLoading(true);
    Promise.all([
      referralApi.getMyReferrals(),
      referralApi.getLink(),
      referralApi.getStats(),
    ]).then(([refRes, linkRes, statsRes]) => {
      if (refRes.data) setReferrals(refRes.data);
      if (linkRes.data) setLinkData(linkRes.data);
      if (statsRes.data) setStats(statsRes.data);
    }).finally(() => setDataLoading(false));
  }, []);

  const referralLink = linkData?.referralLink ?? "";
  const currentTierName = linkData?.currentTier?.name ?? "Starter";

  const handleCopy = () => {
    navigator.clipboard.writeText(referralLink);
    setCopied(true);
    setTimeout(() => setCopied(false), 2000);
  };

  const sorted = [...referrals].sort((a, b) => {
    if (sortBy === "commission") return b.yourCommission - a.yourCommission;
    if (sortBy === "tips")       return b.totalTipsGenerated - a.totalTipsGenerated;
    return new Date(b.joinedDate).getTime() - new Date(a.joinedDate).getTime();
  });

  const totalCommission = stats?.totalCommissionEarned ?? 0;
  const totalReferralVolume = stats?.totalTipsGenerated ?? 0;
  const activeCount = stats?.activeReferrals ?? 0;
  const totalCount = stats?.totalReferrals ?? 0;

  if (dataLoading) {
    return (
      <div className="min-h-screen flex items-center justify-center bg-background">
        <Loader2 className="w-8 h-8 animate-spin text-accent" />
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-background text-foreground">
      <section className="relative pt-32 pb-20 px-6">
        <div className="max-w-6xl mx-auto">

          {/* Header */}
          <motion.div
            initial={{ opacity: 0, y: 30 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ duration: 0.8, ease: "easeOut" }}
            className="mb-12 flex flex-col items-center text-center gap-4"
          >
            <div>
              <h1 className="text-5xl font-black text-foreground tracking-tight mb-2">
                Referrals
              </h1>
              <p className="text-muted-foreground text-lg">Earn commission by inviting other creators to Rory</p>
            </div>

            {/* Share CTA */}
            <motion.button
              whileHover={{ scale: 1.04 }}
              whileTap={{ scale: 0.97 }}
              className="flex items-center gap-2 px-5 py-3 bg-purple-600 hover:bg-purple-500 text-white font-semibold text-sm shadow-lg shadow-purple-500/25 hover:shadow-purple-500/40 transition-all"
            >
              <Share2 className="w-4 h-4" />
              Share Your Link
            </motion.button>
          </motion.div>

          {/* Referral Link Banner */}
          <motion.div
            initial={{ opacity: 0, y: 20 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ duration: 0.6, delay: 0.1 }}
            className="mb-10 p-6 bg-purple-600/10 border border-purple-500/20"
          >
            <div className="flex flex-col items-center gap-4 text-center">
              <div>
                <p className="text-muted-foreground text-xs mb-1 uppercase tracking-wider font-medium">Your Referral Link</p>
                <p className="text-foreground font-mono text-base">{referralLink}</p>
              </div>
              <div className="flex gap-3">
                <motion.button
                  whileHover={{ scale: 1.04 }}
                  whileTap={{ scale: 0.97 }}
                  onClick={handleCopy}
                  className="flex items-center gap-2 px-4 py-2.5 bg-muted border border-border text-foreground text-sm font-medium hover:bg-secondary transition-all"
                >
                  <AnimatePresence mode="wait">
                    {copied ? (
                      <motion.span
                        key="check"
                        initial={{ opacity: 0, scale: 0.8 }}
                        animate={{ opacity: 1, scale: 1 }}
                        exit={{ opacity: 0, scale: 0.8 }}
                        className="flex items-center gap-2 text-emerald-400"
                      >
                        <Check className="w-4 h-4" />
                        Copied!
                      </motion.span>
                    ) : (
                      <motion.span
                        key="copy"
                        initial={{ opacity: 0, scale: 0.8 }}
                        animate={{ opacity: 1, scale: 1 }}
                        exit={{ opacity: 0, scale: 0.8 }}
                        className="flex items-center gap-2"
                      >
                        <Copy className="w-4 h-4" />
                        Copy Link
                      </motion.span>
                    )}
                  </AnimatePresence>
                </motion.button>
              </div>
            </div>
          </motion.div>

          {/* KPI Cards */}
          <div className="grid grid-cols-2 lg:grid-cols-3 gap-5 mb-10">
            {[
              {
                icon: <UserCheck className="w-8 h-8 text-pink-400" />,
                label: "Total Sign-Ups",
                value: String(totalCount),
                change: `${totalCount} total`,
                badgeClass: "text-pink-400 bg-pink-500/20",
                border: "border-pink-500/20",
                bg: "bg-pink-600/10",
                delay: 0.1,
              },
              {
                icon: <Users className="w-8 h-8 text-amber-400" />,
                label: "Active Referrals",
                value: String(activeCount),
                change: `${activeCount} of ${totalCount}`,
                badgeClass: "text-amber-400 bg-amber-500/20",
                border: "border-amber-500/20",
                bg: "bg-amber-600/10",
                delay: 0.26,
              },
              {
                icon: <DollarSign className="w-8 h-8 text-emerald-400" />,
                label: "Total Commission",
                value: formatCurrency(totalCommission),
                change: `${linkData?.currentTier?.commissionRate ?? 5}% rate`,
                badgeClass: "text-emerald-400 bg-emerald-500/20",
                border: "border-emerald-500/20",
                bg: "bg-emerald-600/10",
                delay: 0.34,
              },
            ].map((card, i) => (
              <motion.div
                key={i}
                initial={{ opacity: 0, y: 20 }}
                animate={{ opacity: 1, y: 0 }}
                transition={{ duration: 0.5, delay: card.delay }}
                whileHover={{ scale: 1.03, y: -4 }}
                className={`p-6 ${card.bg} border ${card.border}`}
              >
                <div className="flex items-center justify-between mb-4">
                  {card.icon}
                  <span className={`text-xs font-medium px-2 py-1 rounded-full ${card.badgeClass}`}>{card.change}</span>
                </div>
                <p className="text-muted-foreground text-sm mb-1">{card.label}</p>
                <p className="text-3xl font-bold text-foreground">{card.value}</p>
              </motion.div>
            ))}
          </div>

          {/* Referred Creators Table */}
          <motion.div
            initial={{ opacity: 0, y: 20 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ duration: 0.6, delay: 0.4 }}
            className="bg-card border border-border overflow-hidden mb-10"
          >
            <div className="p-6 border-b border-border flex items-center justify-between">
              <div>
                <h2 className="text-xl font-bold text-foreground">Referred Creators</h2>
                <p className="text-muted-foreground text-sm mt-0.5">Creators who joined via your link</p>
              </div>

              {/* Sort dropdown */}
              <div className="relative">
                <button
                  onClick={() => setShowSortMenu(!showSortMenu)}
                  className="flex items-center gap-2 px-4 py-2 bg-muted border border-border text-muted-foreground hover:text-foreground text-sm font-medium transition-all"
                >
                  Sort: {sortBy === "commission" ? "Commission" : sortBy === "tips" ? "Total Tips" : "Joined"}
                  <ChevronDown className={`w-3 h-3 transition-transform ${showSortMenu ? "rotate-180" : ""}`} />
                </button>
                <AnimatePresence>
                  {showSortMenu && (
                    <motion.div
                      initial={{ opacity: 0, y: -6, scale: 0.97 }}
                      animate={{ opacity: 1, y: 0, scale: 1 }}
                      exit={{ opacity: 0, y: -6, scale: 0.97 }}
                      transition={{ duration: 0.12 }}
                      className="absolute right-0 mt-2 w-40 bg-card border border-border shadow-xl z-10 overflow-hidden"
                    >
                      {(["commission", "tips", "joined"] as const).map((opt) => (
                        <button
                          key={opt}
                          onClick={() => { setSortBy(opt); setShowSortMenu(false); }}
                          className={`w-full text-left px-4 py-2.5 text-sm transition-colors hover:bg-muted ${sortBy === opt ? "text-purple-400 font-medium" : "text-muted-foreground"}`}
                        >
                          {opt === "commission" ? "Commission" : opt === "tips" ? "Total Tips" : "Date Joined"}
                        </button>
                      ))}
                    </motion.div>
                  )}
                </AnimatePresence>
              </div>
            </div>

            {/* Table header */}
            <div className="hidden sm:grid grid-cols-[2fr_1fr_1fr_1fr_1fr] px-6 py-3 text-xs uppercase tracking-wider text-subtle font-medium border-b border-border">
              <span>Creator</span>
              <span>Joined</span>
              <span>Total Tips</span>
              <span>Your Commission</span>
              <span>Status</span>
            </div>

            {/* Rows */}
            <div className="divide-y divide-border">
              {sorted.map((creator, i) => (
                <motion.div
                  key={creator.referredUsername}
                  initial={{ opacity: 0, x: -10 }}
                  animate={{ opacity: 1, x: 0 }}
                  transition={{ duration: 0.3, delay: 0.5 + i * 0.06 }}
                  whileHover={{ backgroundColor: "rgba(255,255,255,0.02)", x: 2 }}
                  className="grid grid-cols-1 sm:grid-cols-[2fr_1fr_1fr_1fr_1fr] px-6 py-4 items-center gap-3 sm:gap-0 transition-all cursor-pointer"
                >
                  {/* Creator info */}
                  <div className="flex items-center gap-3">
                    <div className="w-10 h-10 rounded-full flex items-center justify-center bg-purple-600/25 border border-purple-500/20 text-purple-400 font-bold text-sm flex-shrink-0">
                      {creator.referredInitials}
                    </div>
                    <div>
                      <p className="text-foreground font-medium text-sm">{creator.referredDisplayName}</p>
                      <p className="text-subtle text-xs">@{creator.referredUsername}</p>
                    </div>
                  </div>

                  <p className="text-muted-foreground text-sm">{formatDate(creator.joinedDate)}</p>

                  <div>
                    <p className="text-foreground font-semibold text-sm">{formatCurrency(creator.totalTipsGenerated)}</p>
                    <p className="text-subtle text-xs">{formatCurrency(creator.tipsThisMonth)} this mo.</p>
                  </div>

                  <div className="flex items-center gap-1.5">
                    <TrendingUp className="w-3.5 h-3.5 text-emerald-400 flex-shrink-0" />
                    <p className="text-emerald-400 font-bold text-sm">{formatCurrency(creator.yourCommission)}</p>
                  </div>

                  <span className={`inline-flex w-fit items-center px-2.5 py-1 rounded-full text-xs font-medium capitalize ${statusStyle[creator.status]}`}>
                    {creator.status.toLowerCase()}
                  </span>
                </motion.div>
              ))}
            </div>

            {/* Footer summary */}
            <div className="px-6 py-4 border-t border-border bg-muted flex flex-wrap items-center justify-between gap-3">
              <p className="text-subtle text-sm">{totalCount} referred creators · {formatCurrency(totalReferralVolume)} total volume</p>
              <p className="text-emerald-400 font-semibold text-sm">Total earned: {formatCurrency(totalCommission)}</p>
            </div>
          </motion.div>

          {/* Commission Tiers */}
          <motion.div
            initial={{ opacity: 0, y: 20 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ duration: 0.6, delay: 0.55 }}
            className="p-8 bg-card border border-border"
          >
            <div className="mb-6">
              <h2 className="text-xl font-bold text-foreground">Commission Tiers</h2>
              <p className="text-muted-foreground text-sm mt-1">Earn a higher rate as your referral network grows. You are currently on the <span className="text-purple-400 font-medium">{currentTierName}</span> tier.</p>
            </div>

            <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-4">
              {commissionTiers.map((tier, i) => (
                <motion.div
                  key={tier.label}
                  initial={{ opacity: 0, y: 15 }}
                  animate={{ opacity: 1, y: 0 }}
                  transition={{ duration: 0.4, delay: 0.65 + i * 0.08 }}
                  className={`p-5 ${tier.color} border ${tier.border} ${tier.label === currentTierName ? "ring-1 ring-purple-500/40" : ""}`}
                >
                  <div className="flex items-center justify-between mb-3">
                    <p className="text-foreground font-bold">{tier.label}</p>
                    {tier.label === currentTierName && (
                      <span className="text-xs px-2 py-0.5 rounded-full text-purple-400 bg-purple-500/20 font-medium">Current</span>
                    )}
                  </div>
                  <p className={`text-3xl font-extrabold mb-1 ${tier.badge.split(" ")[0]}`}>{tier.rate}</p>
                  <p className="text-muted-foreground text-xs">{tier.range}</p>
                </motion.div>
              ))}
            </div>
          </motion.div>
        </div>
      </section>

      <footer className="py-16 px-6 border-t border-border">
        <div className="max-w-7xl mx-auto text-center text-subtle">
          <p>© 2026 Rory. All rights reserved.</p>
        </div>
      </footer>
    </div>
  );
}
