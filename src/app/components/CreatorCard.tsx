import { useState } from "react";
import { motion } from "motion/react";
import type { CreatorFeedItem } from "../../lib/types";
import { Sounds } from "../../lib/sounds";
import ConfettiBurst from "./Confetti";
import type { ToastKind } from "./Toast";
import { ProgressBar } from "./shared/ProgressBar";

interface CreatorCardProps {
  creator: CreatorFeedItem;
  recommendationReason?: string;
  onGift?: (creatorId: string) => void;
  onToast?: (kind: ToastKind, message: string) => void;
}

function urgencyChip(c: CreatorFeedItem): { label: string; color: string } | null {
  const pct = c.raisedAmount / c.goalAmount;
  if (pct >= 0.9) return { label: "⏰ Almost Funded", color: "bg-warning/20 text-warning border-warning/40" };
  if (c.giftsLast24h >= 5) return { label: "🔥 On a Roll", color: "bg-orange-400/20 text-orange-400 border-orange-400/40" };
  const ageHours = (Date.now() - new Date(c.createdAt).getTime()) / 3_600_000;
  if (ageHours < 48) return { label: "✨ New Item", color: "bg-purple-400/20 text-purple-400 border-purple-400/40" };
  return null;
}

function progressBarColor(pct: number): string {
  if (pct >= 1) return "bg-success";
  if (pct >= 0.9) return "bg-warning";
  return "bg-accent";
}

export default function CreatorCard({ creator, recommendationReason, onGift, onToast }: CreatorCardProps) {
  const [showConfetti, setShowConfetti] = useState(false);
  const pct = Math.min(creator.raisedAmount / creator.goalAmount, 1);
  const chip = urgencyChip(creator);
  const isNearGoal = pct >= 0.9;

  function handleGift() {
    Sounds.gift();
    onGift?.(creator.id);
    // Confetti if near goal or just hit it
    if (isNearGoal) {
      Sounds.funded();
      setShowConfetti(true);
      setTimeout(() => setShowConfetti(false), 2500);
      onToast?.("funded", `🎰 ${creator.creatorName} is almost funded!`);
    } else {
      onToast?.("gift", `🎁 Gift sent to ${creator.creatorName}!`);
    }
  }

  return (
    <motion.div
      initial={{ opacity: 0, y: 16 }}
      animate={{ opacity: 1, y: 0 }}
      className="relative bg-white/5 border border-white/10 p-4 space-y-3 hover:border-accent/40 transition-all overflow-hidden"
    >
      <ConfettiBurst active={showConfetti} mode="local" count={24} />
      {/* Header */}
      <div className="flex items-start justify-between gap-3">
        <div className="flex items-center gap-3">
          <div className={`w-10 h-10 ${creator.avatarColor} flex items-center justify-center font-black text-white text-sm flex-shrink-0`}>
            {creator.avatarInitials}
          </div>
          <div>
            <p className="text-white font-bold text-sm">{creator.creatorName}</p>
            <p className="text-white/40 text-xs">@{creator.username}</p>
          </div>
        </div>
        {chip && (
          <span className={`text-xs font-bold px-2 py-1 border flex-shrink-0 ${chip.color}`}>{chip.label}</span>
        )}
      </div>

      {/* Item */}
      <div>
        <p className="text-white font-semibold text-sm">{creator.itemTitle}</p>
        <p className="text-white/50 text-xs mt-0.5 line-clamp-2">{creator.itemDescription}</p>
      </div>

      {/* Progress */}
      <div>
        <div className="flex justify-between text-xs mb-1">
          <span className="text-white/60">${creator.raisedAmount.toLocaleString()} raised</span>
          <span className="text-white/40">of ${creator.goalAmount.toLocaleString()}</span>
        </div>
        <ProgressBar value={pct * 100} className="h-2 bg-white/10" barClassName={progressBarColor(pct)} />
      </div>

      {/* Stats */}
      <div className="flex items-center gap-4 text-xs text-white/40">
        <span>{creator.gifterCount} gifters</span>
        <span>•</span>
        <span>{creator.giftsToday} today</span>
        <span>•</span>
        <span>{creator.daysLeft}d left</span>
      </div>

      {recommendationReason && (
        <p className="text-xs text-accent/70 italic">{recommendationReason}</p>
      )}

      <button
        onClick={handleGift}
        className="w-full py-2 bg-accent text-white font-black text-sm uppercase tracking-wider hover:brightness-110 active:scale-95 transition-all"
      >
        Gift Now 🎁
      </button>
    </motion.div>
  );
}
