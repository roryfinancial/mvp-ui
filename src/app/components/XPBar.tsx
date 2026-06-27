import { motion } from "motion/react";
import type { GamificationState } from "../../lib/types";
import { xpProgress, leagueBadgeColor, leagueLabel } from "../../lib/gamification";
import { ProgressBar } from "./shared/ProgressBar";

interface XPBarProps {
  gamification: GamificationState;
}

const LEAGUE_BG: Record<GamificationState["leagueTier"], string> = {
  bronze:  "bg-amber-600/20 border-amber-600/40",
  silver:  "bg-slate-400/20 border-slate-400/40",
  gold:    "bg-yellow-400/20 border-yellow-400/40",
  diamond: "bg-cyan-400/20 border-cyan-400/40",
};

const LEAGUE_EMOJI: Record<GamificationState["leagueTier"], string> = {
  bronze:  "🥉",
  silver:  "🥈",
  gold:    "🥇",
  diamond: "💎",
};

export default function XPBar({ gamification }: XPBarProps) {
  const { current, needed, pct } = xpProgress(gamification.xp);

  return (
    <div className="flex items-center gap-3">
      {/* Streak pill */}
      <div className="flex items-center gap-1 px-2 py-1 bg-orange-500/20 border border-orange-500/40 text-orange-400 text-xs font-bold">
        🔥 {gamification.streakDays}d
      </div>

      {/* Level + XP bar */}
      <div className="flex items-center gap-2">
        <span className="text-xs font-black text-accent">Lv.{gamification.level}</span>
        <ProgressBar value={pct * 100} className="w-24 h-2 bg-white/10" />
        <span className="text-[10px] text-white/40">{current}/{needed}</span>
      </div>

      {/* League pill */}
      <div className={`flex items-center gap-1 px-2 py-1 border text-xs font-bold ${LEAGUE_BG[gamification.leagueTier]}`}>
        <span className={leagueBadgeColor(gamification.leagueTier)}>
          {LEAGUE_EMOJI[gamification.leagueTier]}
        </span>
        {leagueLabel(gamification.leagueTier)}
      </div>
    </div>
  );
}
