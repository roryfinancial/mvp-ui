import { useState } from "react";
import { motion, AnimatePresence } from "motion/react";
import { Store } from "../../lib/store";
import { Sounds } from "../../lib/sounds";
import CreatorCard from "./CreatorCard";

type FeedTab = "following" | "hot" | "explore" | "rising";

const TABS: { id: FeedTab; label: string }[] = [
  { id: "following", label: "Following" },
  { id: "hot",       label: "🔥 Hot Now" },
  { id: "explore",   label: "✨ Explore" },
  { id: "rising",    label: "📈 Rising" },
];

const RECOMMENDATION_REASONS: Record<string, string> = {
  "fc-1": "Because you gifted Neon Sculptor",
  "fc-3": "Because you follow Pixel Witch",
  "fc-6": "Trending in your network",
  "fc-2": "New creator worth watching",
  "fc-4": "Rising fast this week",
  "fc-5": "Matches your gifting style",
};

export default function CommunityFeed() {
  const [activeTab, setActiveTab] = useState<FeedTab>("following");
  const creators = Store.getFeedCreators(activeTab);

  return (
    <div className="space-y-4">
      {/* Tab bar */}
      <div className="flex gap-0 border-b border-white/10">
        {TABS.map((tab) => (
          <button
            key={tab.id}
            onClick={() => { Sounds.click(); setActiveTab(tab.id); }}
            className={`px-4 py-2.5 text-sm font-bold transition-all relative ${
              activeTab === tab.id ? "text-white" : "text-white/40 hover:text-white/70"
            }`}
          >
            {tab.label}
            {activeTab === tab.id && (
              <motion.div
                layoutId="feed-tab-indicator"
                className="absolute bottom-0 left-0 right-0 h-0.5 bg-accent"
              />
            )}
          </button>
        ))}
      </div>

      {/* Cards */}
      <AnimatePresence mode="wait">
        <motion.div
          key={activeTab}
          initial={{ opacity: 0, y: 8 }}
          animate={{ opacity: 1, y: 0 }}
          exit={{ opacity: 0, y: -8 }}
          transition={{ duration: 0.18 }}
          className="grid gap-4"
        >
          {creators.length === 0 ? (
            <div className="text-center py-12 text-white/30 text-sm">
              Nothing here yet — follow some creators!
            </div>
          ) : (
            creators.map((creator) => (
              <CreatorCard
                key={creator.id}
                creator={creator}
                recommendationReason={activeTab === "explore" ? RECOMMENDATION_REASONS[creator.id] : undefined}
                onGift={() => {}}
              />
            ))
          )}
        </motion.div>
      </AnimatePresence>
    </div>
  );
}
