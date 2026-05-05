import { motion } from "motion/react";
import type { GamificationState, BadgeId } from "../../lib/types";
import { xpProgress, leagueBadgeColor, leagueLabel } from "../../lib/gamification";
import { Sounds } from "../../lib/sounds";
import type { ToastKind } from "./Toast";

interface GamificationSidebarProps {
  gamification: GamificationState;
  onToast?: (kind: ToastKind, message: string) => void;
}

const BADGE_META: Record<BadgeId, { emoji: string; label: string; description: string }> = {
  early_adopter:  { emoji: "🌟", label: "Early Adopter",  description: "Joined in the first month" },
  streak_lord:    { emoji: "🔥", label: "Streak Lord",    description: "30-day streak" },
  big_spender:    { emoji: "💎", label: "Big Spender",    description: "$500 total gifted" },
  first_gift:     { emoji: "🎁", label: "First Gift",     description: "Sent your first gift" },
  league_leader:  { emoji: "👑", label: "League Leader",  description: "Reached #1 in weekly leaderboard" },
  jackpot:        { emoji: "🎰", label: "Jackpot",        description: "Gifted to a creator who hit goal same day" },
  speed_gifter:   { emoji: "⚡", label: "Speed Gifter",   description: "Gifted within 1 hour of creator posting" },
  century_club:   { emoji: "💰", label: "Century Club",   description: "$100 to a single creator" },
  diamond_gifter: { emoji: "🏆", label: "Diamond Gifter", description: "Reached Diamond league" },
  variety_pack:   { emoji: "🌈", label: "Variety Pack",   description: "Gifted to 10 different creators" },
  mystery_1:      { emoji: "❓", label: "???",            description: "Keep gifting to unlock" },
  mystery_2:      { emoji: "❓", label: "???",            description: "Keep gifting to unlock" },
};

const ALL_BADGES = Object.keys(BADGE_META) as BadgeId[];

const LEAGUE_EMOJI: Record<GamificationState["leagueTier"], string> = {
  bronze: "🥉", silver: "🥈", gold: "🥇", diamond: "💎",
};

const MOCK_LEADERBOARD = [
  { rank: 1, name: "CryptoCarlos", amount: 520 },
  { rank: 2, name: "TurboTina",    amount: 410 },
  { rank: 3, name: "Fanatic99",    amount: 185 },
  { rank: 4, name: "Mike C.",      amount: 140 },
  { rank: 5, name: "Sarah J.",     amount: 95  },
];

export default function GamificationSidebar({ gamification, onToast }: GamificationSidebarProps) {
  const { current, needed, pct } = xpProgress(gamification.xp);

  return (
    <div className="w-52 flex-shrink-0 space-y-4">
      {/* XP / Level */}
      <div className="bg-white/5 border border-white/10 p-4 space-y-3">
        <h3 className="text-xs font-black uppercase tracking-widest text-white/60">Your Level</h3>
        <div className="text-center">
          <div className="text-4xl font-black text-accent">{gamification.level}</div>
          <div className="text-xs text-white/40 mt-1">{current} / {needed} XP to next</div>
        </div>
        <div className="h-2 bg-white/10">
          <motion.div
            className="h-full bg-accent"
            animate={{ width: `${pct * 100}%` }}
            transition={{ duration: 0.6, ease: "easeOut" }}
          />
        </div>
        <div className="text-xs text-white/40 text-center">{gamification.xp} total XP</div>
      </div>

      {/* Streak */}
      <div className="bg-white/5 border border-white/10 p-4 space-y-2">
        <h3 className="text-xs font-black uppercase tracking-widest text-white/60">Streak</h3>
        <div className="flex items-center gap-2">
          <span className="text-2xl">🔥</span>
          <div>
            <div className="text-xl font-black text-orange-400">{gamification.streakDays} days</div>
            <div className="text-xs text-white/40">2× XP on all gifts</div>
          </div>
        </div>
        <div className="text-xs text-green-400 py-1 border border-green-400/30 bg-green-400/5 text-center">
          ✅ Active today
        </div>
      </div>

      {/* League */}
      <div className="bg-white/5 border border-white/10 p-4 space-y-2">
        <h3 className="text-xs font-black uppercase tracking-widest text-white/60">League</h3>
        <div className="text-center space-y-1">
          <div className="text-3xl">{LEAGUE_EMOJI[gamification.leagueTier]}</div>
          <div className={`text-lg font-black ${leagueBadgeColor(gamification.leagueTier)}`}>
            {leagueLabel(gamification.leagueTier)}
          </div>
          <div className="text-xs text-white/40">${gamification.weeklyGifted} this week</div>
        </div>
      </div>

      {/* Weekly Leaderboard */}
      <div className="bg-white/5 border border-white/10 p-4 space-y-3">
        <h3 className="text-xs font-black uppercase tracking-widest text-white/60">This Week</h3>
        <div className="space-y-2">
          {MOCK_LEADERBOARD.map((entry) => (
            <div
              key={entry.rank}
              className={`flex items-center gap-2 text-xs ${entry.name === "Fanatic99" ? "text-accent font-bold" : "text-white/60"}`}
            >
              <span className="w-4 text-center font-black">{entry.rank}</span>
              <span className="flex-1 truncate">{entry.name}</span>
              <span className="font-bold">${entry.amount}</span>
            </div>
          ))}
        </div>
      </div>

      {/* Badges */}
      <div className="bg-white/5 border border-white/10 p-4 space-y-3">
        <h3 className="text-xs font-black uppercase tracking-widest text-white/60">Badges</h3>
        <div className="grid grid-cols-4 gap-2">
          {ALL_BADGES.map((id) => {
            const earned = gamification.badges.includes(id);
            const meta = BADGE_META[id];
            const isMystery = id.startsWith("mystery");
            return (
              <motion.div
                key={id}
                whileHover={earned ? { scale: 1.15 } : {}}
                title={earned ? `${meta.label}: ${meta.description}` : isMystery ? "Mystery — keep gifting!" : `Locked: ${meta.description}`}
                onClick={() => {
                  if (earned) {
                    Sounds.pop();
                    onToast?.("badge", `${meta.emoji} ${meta.label}`);
                  }
                }}
                className={`w-10 h-10 flex items-center justify-center text-xl border transition-all ${
                  earned
                    ? "border-accent/40 bg-accent/10 cursor-pointer"
                    : "border-white/10 opacity-25 grayscale cursor-default"
                }`}
              >
                {earned || !isMystery ? meta.emoji : "❓"}
              </motion.div>
            );
          })}
        </div>
        <div className="text-xs text-white/30 text-center">{gamification.badges.length}/12 earned</div>
      </div>
    </div>
  );
}
