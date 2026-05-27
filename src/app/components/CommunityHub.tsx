import { useState, useEffect } from "react";
import type { GamificationState, DailyQuest } from "../../lib/types";
import { gamificationApi } from "../../lib/api";

import DailyQuests from "./DailyQuests";
import CommunityFeed from "./CommunityFeed";
import GamificationSidebar from "./GamificationSidebar";
import RecommendedCreators from "./RecommendedCreators";
import ConfettiBurst from "./Confetti";
import { ToastStack, useToasts } from "./Toast";

interface CommunityHubProps {
  gamification: GamificationState;
  onGamificationUpdate: (updated: GamificationState) => void;
}

export default function CommunityHub({ gamification, onGamificationUpdate }: CommunityHubProps) {
  const [quests, setQuests] = useState<DailyQuest[]>([]);
  const { toasts, push: pushToast, dismiss } = useToasts();

  // Fetch quests from backend on mount
  useEffect(() => {
    (async () => {
      try {
        const res = await gamificationApi.getDailyQuests();
        if (res.success && res.data) {
          setQuests(res.data.map((q) => ({
            id: q.id,
            difficulty: q.difficulty,
            label: q.label,
            xpReward: q.xpReward,
            completed: q.completed,
            locked: q.locked,
          })));
        }
      } catch {
        // Backend unavailable — show empty quests
      }
    })();
  }, []);

  return (
    <div className="min-h-screen bg-background pt-[57px]">
      <div className="max-w-7xl mx-auto flex gap-0">
        {/* Main feed column */}
        <div className="flex-1 min-w-0 max-w-[640px] mx-auto border-x border-border">
          <CommunityFeed onToast={pushToast} />
        </div>

        {/* Right sidebar — gamification + quests */}
        <div className="hidden xl:block w-[320px] flex-shrink-0 sticky top-[57px] h-[calc(100vh-57px)] overflow-y-auto p-5 space-y-5">
          <RecommendedCreators onToast={pushToast} />
          <DailyQuests quests={quests} />
          <GamificationSidebar gamification={gamification} onToast={pushToast} />
        </div>
      </div>

      <ToastStack toasts={toasts} onDismiss={dismiss} />
    </div>
  );
}
