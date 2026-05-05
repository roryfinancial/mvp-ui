import { useState } from "react";
import type { GamificationState, DailyQuest } from "../../lib/types";
import { Store } from "../../lib/store";
import { Sounds } from "../../lib/sounds";
import LiveTicker from "./LiveTicker";
import DailyQuests from "./DailyQuests";
import CommunityFeed from "./CommunityFeed";
import GamificationSidebar from "./GamificationSidebar";

interface CommunityHubProps {
  gamification: GamificationState;
  onGamificationUpdate: (updated: GamificationState) => void;
}

export default function CommunityHub({ gamification, onGamificationUpdate }: CommunityHubProps) {
  const feedEvents = Store.getFeedEvents();
  const [quests, setQuests] = useState<DailyQuest[]>(Store.getDailyQuests());

  function handleQuestComplete(questId: string) {
    const quest = quests.find((q) => q.id === questId);
    if (!quest || quest.completed || quest.locked) return;

    const updated = quests.map((q) => {
      if (q.id === questId) return { ...q, completed: true };
      // Completing easy unlocks hard
      if (q.difficulty === "hard" && questId === "quest-easy") return { ...q, locked: false };
      return q;
    });
    setQuests(updated);

    const allDone = updated.every((q) => q.completed);
    const xpGained = quest.xpReward + (allDone ? 50 : 0);
    onGamificationUpdate({
      ...gamification,
      xp: gamification.xp + xpGained,
      questsCompletedToday: [...gamification.questsCompletedToday, questId],
    });

    Sounds.xp();
    if (allDone) setTimeout(() => Sounds.badge(), 400);
  }

  return (
    <div className="min-h-screen bg-background pt-16">
      {/* Live Ticker */}
      <LiveTicker events={feedEvents} />

      {/* Body */}
      <div className="max-w-6xl mx-auto px-6 py-6 flex gap-6">
        {/* Main area */}
        <div className="flex-1 min-w-0 space-y-6">
          <DailyQuests quests={quests} onQuestComplete={handleQuestComplete} />
          <CommunityFeed />
        </div>

        {/* Sidebar */}
        <GamificationSidebar gamification={gamification} />
      </div>
    </div>
  );
}
