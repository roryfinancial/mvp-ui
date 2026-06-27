import { motion } from "motion/react";
import { useState, useEffect } from "react";
import { Trophy, TrendingUp, Gift, Heart } from "lucide-react";
import { leaderboardApi } from "../../lib/api";
import type { LeaderboardEntryResponse } from "../../lib/api";
import { formatCurrency } from "../../lib/format";
import { staggerFadeUp } from "../../lib/motion";
import { EmptyState } from "./shared/EmptyState";

interface LeaderboardProps {
  onViewCreator?: (username: string) => void;
}

interface LeaderboardEntry {
  rank: number;
  name: string;
  username: string;
  initials: string;
  amount: string;
  items: number;
  supporters?: number;
  contributions?: number;
}

const RANK_COLORS = ["#FFD700", "#C0C0C0", "#CD7F32"] as const;

export default function Leaderboard({ onViewCreator }: LeaderboardProps) {
  const [tab, setTab] = useState<"creators" | "supporters">("creators");
  const [creatorsData, setCreatorsData] = useState<LeaderboardEntry[]>([]);
  const [supportersData, setSupportersData] = useState<LeaderboardEntry[]>([]);
  const [dataLoading, setDataLoading] = useState(true);

  useEffect(() => {
    async function loadData() {
      setDataLoading(true);
      const [creatorsRes, supportersRes] = await Promise.all([
        leaderboardApi.getTopCreators(10),
        leaderboardApi.getTopSupporters(10),
      ]);

      if (creatorsRes.success && creatorsRes.data) {
        setCreatorsData(
          creatorsRes.data.map((c: LeaderboardEntryResponse) => ({
            rank: c.rank,
            name: c.displayName,
            username: `@${c.username}`,
            initials: c.initials,
            amount: formatCurrency(c.totalAmount),
            items: c.totalItems,
            supporters: c.totalContributions,
          }))
        );
      }

      if (supportersRes.success && supportersRes.data) {
        setSupportersData(
          supportersRes.data.map((s: LeaderboardEntryResponse) => ({
            rank: s.rank,
            name: s.displayName,
            username: `@${s.username}`,
            initials: s.initials,
            amount: formatCurrency(s.totalAmount),
            items: s.totalItems,
            contributions: s.totalContributions,
          }))
        );
      }

      setDataLoading(false);
    }
    loadData();
  }, []);

  const entries = tab === "creators" ? creatorsData : supportersData;

  return (
    <div className="min-h-screen bg-background text-foreground">
      {/* Main Content */}
      <main className="pt-24 pb-16 px-4 sm:px-6 max-w-4xl mx-auto">
        {/* Header */}
        <motion.div
          initial={{ opacity: 0, y: 20 }}
          animate={{ opacity: 1, y: 0 }}
          className="text-center mb-10"
        >
          <div className="inline-flex items-center gap-2 mb-4">
            <Trophy className="w-8 h-8 text-accent" />
            <h1 className="text-3xl font-black tracking-tight">Leaderboard</h1>
          </div>
          <p className="text-muted-foreground text-sm">Top creators and supporters on Rory</p>
        </motion.div>

        {/* Tabs */}
        <div className="flex gap-1 mb-8 bg-muted p-1 max-w-xs mx-auto">
          <button
            onClick={() => setTab("creators")}
            className={`flex-1 flex items-center justify-center gap-2 px-4 py-2.5 text-sm font-bold transition-all ${
              tab === "creators"
                ? "bg-accent text-white"
                : "text-muted-foreground hover:text-foreground"
            }`}
          >
            <TrendingUp className="w-4 h-4" />
            Creators
          </button>
          <button
            onClick={() => setTab("supporters")}
            className={`flex-1 flex items-center justify-center gap-2 px-4 py-2.5 text-sm font-bold transition-all ${
              tab === "supporters"
                ? "bg-accent text-white"
                : "text-muted-foreground hover:text-foreground"
            }`}
          >
            <Heart className="w-4 h-4" />
            Supporters
          </button>
        </div>

        {/* Leaderboard List */}
        <motion.div
          key={tab}
          initial={{ opacity: 0, y: 10 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ duration: 0.3 }}
          className="space-y-3"
        >
          {dataLoading ? (
            Array.from({ length: 8 }).map((_, i) => (
              <div key={i} className="flex items-center gap-4 p-4 bg-card border border-border">
                <div className="w-8 h-6 skeleton" />
                <div className="w-10 h-10 skeleton" />
                <div className="flex-1 space-y-2">
                  <div className="h-3 w-32 skeleton" />
                  <div className="h-2 w-20 skeleton" />
                </div>
                <div className="h-5 w-14 skeleton" />
              </div>
            ))
          ) : entries.length === 0 ? (
            <EmptyState icon={Trophy} message="No rankings yet" sub="Gifts will populate the leaderboard soon." />
          ) : (
            entries.map((entry) => (
            <motion.div
              key={entry.rank}
              {...staggerFadeUp(entry.rank, 0, 0.04)}
              onClick={() => onViewCreator?.(entry.username.replace("@", ""))}
              className="flex items-center gap-4 p-4 bg-card border border-border hover:border-accent/40 transition-all cursor-pointer group"
              style={{
                boxShadow: entry.rank <= 3 ? `inset 3px 0 0 ${RANK_COLORS[entry.rank - 1]}` : undefined,
              }}
            >
              {/* Rank */}
              <div className="w-10 text-center">
                {entry.rank <= 3 ? (
                  <span
                    className="text-xl font-black"
                    style={{ color: RANK_COLORS[entry.rank - 1] }}
                  >
                    #{entry.rank}
                  </span>
                ) : (
                  <span className="text-lg font-bold text-muted-foreground">#{entry.rank}</span>
                )}
              </div>

              {/* Avatar */}
              <div
                className="w-10 h-10 flex items-center justify-center font-bold text-sm border"
                style={{
                  borderColor: entry.rank <= 3 ? RANK_COLORS[entry.rank - 1] : "var(--border)",
                  background: entry.rank <= 3 ? `${RANK_COLORS[entry.rank - 1]}15` : "var(--muted)",
                }}
              >
                {entry.initials}
              </div>

              {/* Info */}
              <div className="flex-1 min-w-0">
                <p className="font-bold text-sm group-hover:text-accent transition-colors truncate">{entry.name}</p>
                <p className="text-xs text-muted-foreground">{entry.username}</p>
              </div>

              {/* Stats */}
              <div className="hidden sm:flex items-center gap-6 text-xs text-muted-foreground">
                {tab === "creators" ? (
                  <>
                    <div className="text-center">
                      <p className="font-bold text-foreground text-sm">{entry.supporters}</p>
                      <p>supporters</p>
                    </div>
                    <div className="text-center">
                      <p className="font-bold text-foreground text-sm">{entry.items}</p>
                      <p>items</p>
                    </div>
                  </>
                ) : (
                  <>
                    <div className="text-center">
                      <p className="font-bold text-foreground text-sm">{entry.contributions}</p>
                      <p>gifts</p>
                    </div>
                    <div className="text-center">
                      <p className="font-bold text-foreground text-sm">{entry.items}</p>
                      <p>creators</p>
                    </div>
                  </>
                )}
              </div>

              {/* Amount */}
              <div className="text-right">
                <p className="font-black text-sm text-accent">{entry.amount}</p>
                <p className="text-[10px] text-muted-foreground uppercase tracking-wider">
                  {tab === "creators" ? "raised" : "given"}
                </p>
              </div>
            </motion.div>
            ))
          )}
        </motion.div>
      </main>
    </div>
  );
}
