import { useState, useEffect } from "react";
import { motion } from "motion/react";
import type { GamificationState, BadgeId } from "../../lib/types";
import { xpProgress, leagueBadgeColor, leagueLabel } from "../../lib/gamification";
import { gamificationApi, type WeeklyLeaderboardEntry } from "../../lib/api";
import { Sounds } from "../../lib/sounds";
import { ProgressBar } from "./shared/ProgressBar";
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

export default function GamificationSidebar({ gamification, onToast }: GamificationSidebarProps) {
  const { current, needed, pct } = xpProgress(gamification.xp);
  const [leaderboard, setLeaderboard] = useState<WeeklyLeaderboardEntry[]>([]);

  useEffect(() => {
    (async () => {
      try {
        const res = await gamificationApi.getWeeklyLeaderboard(5);
        if (res.success && res.data) {
          setLeaderboard(res.data);
        }
      } catch {
        // Backend unavailable
      }
    })();
  }, []);

  return (
    <div className="space-y-4">
      {/* XP / Level */}
      <div className="bg-muted border border-border rounded-lg p-4 space-y-3">
        <h3 className="text-xs font-black uppercase tracking-widest text-muted-foreground">Your Level</h3>
        <div className="text-center">
          <div className="text-4xl font-black text-accent">{gamification.level}</div>
          <div className="text-xs text-muted-foreground mt-1">{current} / {needed} XP to next</div>
        </div>
        <ProgressBar value={pct * 100} className="h-2 bg-secondary" rounded />
        <div className="text-xs text-muted-foreground text-center">{gamification.xp} total XP</div>
      </div>

      {/* Streak */}
      <div className="bg-muted border border-border rounded-lg p-4 space-y-2">
        <h3 className="text-xs font-black uppercase tracking-widest text-muted-foreground">Streak</h3>
        <div className="flex items-center gap-2">
          <span className="text-2xl">🔥</span>
          <div>
            <div className="text-xl font-black text-orange-400">{gamification.streakDays} days</div>
            <div className="text-xs text-muted-foreground">2x XP on all gifts</div>
          </div>
        </div>
        <div className="text-xs text-success py-1 border border-success/30 bg-success/5 text-center rounded">
          Active today
        </div>
      </div>

      {/* League */}
      <div className="bg-muted border border-border rounded-lg p-4 space-y-2">
        <h3 className="text-xs font-black uppercase tracking-widest text-muted-foreground">League</h3>
        <div className="text-center space-y-1">
          <div className="text-3xl">{LEAGUE_EMOJI[gamification.leagueTier]}</div>
          <div className={`text-lg font-black ${leagueBadgeColor(gamification.leagueTier)}`}>
            {leagueLabel(gamification.leagueTier)}
          </div>
          <div className="text-xs text-muted-foreground">${gamification.weeklyGifted} this week</div>
        </div>
      </div>

      {/* Weekly Leaderboard */}
      <div className="bg-muted border border-border rounded-lg p-4 space-y-3">
        <h3 className="text-xs font-black uppercase tracking-widest text-muted-foreground">This Week</h3>
        <div className="space-y-2">
          {leaderboard.length > 0 ? (
            leaderboard.map((entry) => (
              <div
                key={entry.rank}
                className={`flex items-center gap-2 text-xs ${entry.isCurrentUser ? "text-accent font-bold" : "text-muted-foreground"}`}
              >
                <span className="w-4 text-center font-black">{entry.rank}</span>
                <span className="flex-1 truncate">{entry.displayName || entry.username}</span>
                <span className="font-bold">${entry.amount}</span>
              </div>
            ))
          ) : (
            <div className="text-xs text-muted-foreground text-center py-2">No activity this week</div>
          )}
        </div>
      </div>

      {/* Badges */}
      <div className="bg-muted border border-border rounded-lg p-4 space-y-3">
        <h3 className="text-xs font-black uppercase tracking-widest text-muted-foreground">Badges</h3>
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
                className={`w-10 h-10 flex items-center justify-center text-xl border rounded transition-all ${
                  earned
                    ? "border-accent/40 bg-accent/10 cursor-pointer"
                    : "border-border opacity-30 grayscale cursor-default"
                }`}
              >
                {earned || !isMystery ? meta.emoji : "❓"}
              </motion.div>
            );
          })}
        </div>
        <div className="text-xs text-muted-foreground text-center">{gamification.badges.length}/12 earned</div>
      </div>
    </div>
  );
}
