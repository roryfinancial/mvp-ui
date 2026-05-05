import { motion } from "motion/react";
import type { DailyQuest } from "../../lib/types";
import { Sounds } from "../../lib/sounds";

interface DailyQuestsProps {
  quests: DailyQuest[];
  onQuestComplete?: (questId: string) => void;
}

const DIFFICULTY_COLORS: Record<DailyQuest["difficulty"], string> = {
  easy:   "text-green-400 border-green-400/30 bg-green-400/10",
  medium: "text-yellow-400 border-yellow-400/30 bg-yellow-400/10",
  hard:   "text-red-400 border-red-400/30 bg-red-400/10",
};

export default function DailyQuests({ quests, onQuestComplete }: DailyQuestsProps) {
  const completedCount = quests.filter((q) => q.completed).length;
  const allDone = completedCount === 3;

  return (
    <div className="bg-white/5 border border-white/10 p-4 space-y-3">
      <div className="flex items-center justify-between">
        <h3 className="text-sm font-black uppercase tracking-widest text-white">Daily Quests</h3>
        <span className="text-xs text-white/40">{completedCount}/3 complete</span>
      </div>

      {/* Progress bar */}
      <div className="h-1.5 bg-white/10">
        <motion.div
          className="h-full bg-accent"
          animate={{ width: `${(completedCount / 3) * 100}%` }}
          transition={{ duration: 0.4 }}
        />
      </div>

      {/* Quest list */}
      <div className="space-y-2">
        {quests.map((quest) => (
          <div
            key={quest.id}
            onClick={() => {
              if (!quest.locked && !quest.completed && onQuestComplete) {
                Sounds.quest();
                onQuestComplete(quest.id);
              }
            }}
            className={`flex items-center gap-3 p-3 border transition-all ${
              quest.locked
                ? "opacity-40 border-white/10 bg-white/5 cursor-not-allowed"
                : quest.completed
                ? "border-green-400/30 bg-green-400/5"
                : "border-white/10 bg-white/5 cursor-pointer hover:bg-white/10"
            }`}
          >
            <div className={`w-5 h-5 border-2 flex items-center justify-center flex-shrink-0 ${quest.completed ? "border-green-400 bg-green-400" : "border-white/30"}`}>
              {quest.completed && <span className="text-black text-xs font-black">✓</span>}
            </div>
            <div className="flex-1 min-w-0">
              <p className={`text-sm font-medium ${quest.locked ? "text-white/30" : "text-white"}`}>
                {quest.locked ? "🔒 " : ""}{quest.label}
              </p>
            </div>
            <span className={`text-xs font-bold px-2 py-0.5 border ${DIFFICULTY_COLORS[quest.difficulty]}`}>
              {quest.difficulty.charAt(0).toUpperCase() + quest.difficulty.slice(1)}
            </span>
            <span className="text-xs font-black text-accent flex-shrink-0">+{quest.xpReward} XP</span>
          </div>
        ))}
      </div>

      {allDone && (
        <div className="text-center text-xs font-black text-yellow-400 py-2 border border-yellow-400/30 bg-yellow-400/5">
          🏆 All quests complete! +50 XP bonus earned
        </div>
      )}
    </div>
  );
}
