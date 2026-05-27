import { motion } from "motion/react";
import type { DailyQuest } from "../../lib/types";

interface DailyQuestsProps {
  quests: DailyQuest[];
}

const DIFFICULTY_COLORS: Record<DailyQuest["difficulty"], string> = {
  easy:   "text-green-500 border-green-500/30 bg-green-500/10",
  medium: "text-yellow-500 border-yellow-500/30 bg-yellow-500/10",
  hard:   "text-red-500 border-red-500/30 bg-red-500/10",
};

export default function DailyQuests({ quests }: DailyQuestsProps) {
  const completedCount = quests.filter((q) => q.completed).length;
  const allDone = quests.length > 0 && completedCount === quests.length;

  return (
    <div className="bg-muted border border-border rounded-lg p-4 space-y-3">
      <div className="flex items-center justify-between">
        <h3 className="text-sm font-black uppercase tracking-widest text-foreground">Daily Quests</h3>
        <span className="text-xs text-muted-foreground">{completedCount}/{quests.length} complete</span>
      </div>

      {/* Progress bar */}
      <div className="h-1.5 bg-secondary rounded-full overflow-hidden">
        <motion.div
          className="h-full bg-accent rounded-full"
          animate={{ width: `${quests.length > 0 ? (completedCount / quests.length) * 100 : 0}%` }}
          transition={{ duration: 0.4 }}
        />
      </div>

      {/* Quest list */}
      <div className="space-y-2">
        {quests.map((quest) => (
          <div
            key={quest.id}
            className={`flex items-center gap-3 p-3 border rounded transition-all ${
              quest.locked
                ? "opacity-40 border-border bg-secondary"
                : quest.completed
                ? "border-green-500/30 bg-green-500/5"
                : "border-border bg-background"
            }`}
          >
            <div className={`w-5 h-5 border-2 flex items-center justify-center flex-shrink-0 rounded-sm ${quest.completed ? "border-green-500 bg-green-500" : "border-muted-foreground/30"}`}>
              {quest.completed && <span className="text-white text-xs font-black">✓</span>}
            </div>
            <div className="flex-1 min-w-0">
              <p className={`text-sm font-medium ${quest.locked ? "text-muted-foreground/50" : "text-foreground"}`}>
                {quest.locked ? "🔒 " : ""}{quest.label}
              </p>
            </div>
            <span className={`text-xs font-bold px-2 py-0.5 border rounded ${DIFFICULTY_COLORS[quest.difficulty]}`}>
              {quest.difficulty.charAt(0).toUpperCase() + quest.difficulty.slice(1)}
            </span>
            <span className="text-xs font-black text-accent flex-shrink-0">+{quest.xpReward} XP</span>
          </div>
        ))}
      </div>

      {allDone && (
        <div className="text-center text-xs font-black text-yellow-500 py-2 border border-yellow-500/30 bg-yellow-500/5 rounded">
          All quests complete! +50 XP bonus earned
        </div>
      )}
    </div>
  );
}
