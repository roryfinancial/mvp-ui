import { useState } from "react";
import type { GamificationState, DailyQuest } from "../../lib/types";
import { Store } from "../../lib/store";
import { Sounds } from "../../lib/sounds";
import { levelFromXp } from "../../lib/gamification";
import LiveTicker from "./LiveTicker";
import DailyQuests from "./DailyQuests";
import CommunityFeed from "./CommunityFeed";
import GamificationSidebar from "./GamificationSidebar";
import ConfettiBurst from "./Confetti";
import { ToastStack, useToasts } from "./Toast";

interface CommunityHubProps {
  gamification: GamificationState;
  onGamificationUpdate: (updated: GamificationState) => void;
}

export default function CommunityHub({ gamification, onGamificationUpdate }: CommunityHubProps) {
  const feedEvents = Store.getFeedEvents();
  const [quests, setQuests] = useState<DailyQuest[]>(Store.getDailyQuests());
  const [showLevelUpConfetti, setShowLevelUpConfetti] = useState(false);
  const { toasts, push: pushToast, dismiss } = useToasts();

  function handleQuestComplete(questId: string) {
    const quest = quests.find((q) => q.id === questId);
    if (!quest || quest.completed || quest.locked) return;

    const updated = quests.map((q) => {
      if (q.id === questId) return { ...q, completed: true };
      if (q.difficulty === "hard" && questId === "quest-easy") return { ...q, locked: false };
      return q;
    });
    setQuests(updated);

    const allDone = updated.every((q) => q.completed);
    const xpGained = quest.xpReward + (allDone ? 50 : 0);
    const newXp = gamification.xp + xpGained;
    const oldLevel = gamification.level;
    const newLevel = levelFromXp(newXp);
    const didLevelUp = newLevel > oldLevel;

    onGamificationUpdate({
      ...gamification,
      xp: newXp,
      level: newLevel,
      questsCompletedToday: [...gamification.questsCompletedToday, questId],
    });

    Sounds.xp();
    pushToast("xp", `+${xpGained} XP`);

    if (didLevelUp) {
      setTimeout(() => {
        Sounds.levelup();
        pushToast("levelup", `🎉 Level Up! You're now Level ${newLevel}`);
        setShowLevelUpConfetti(true);
        setTimeout(() => setShowLevelUpConfetti(false), 3000);
      }, 300);
    }

    if (allDone) {
      setTimeout(() => Sounds.badge(), 400);
    }
  }

  return (
    <div className="min-h-screen bg-background pt-16">
      {/* Fullscreen level-up confetti */}
      <ConfettiBurst active={showLevelUpConfetti} mode="fullscreen" count={60} />

      {/* Live Ticker */}
      <LiveTicker events={feedEvents} />

      {/* Body */}
      <div className="max-w-6xl mx-auto px-6 py-6 flex gap-6">
        {/* Main area */}
        <div className="flex-1 min-w-0 space-y-6">
          <DailyQuests
            quests={quests}
            onQuestComplete={handleQuestComplete}
            onToast={pushToast}
          />
          <CommunityFeed onToast={pushToast} />
        </div>

        {/* Sidebar */}
        <GamificationSidebar gamification={gamification} onToast={pushToast} />
      </div>

      {/* Toast notifications */}
      <ToastStack toasts={toasts} onDismiss={dismiss} />
    </div>
  );
}
