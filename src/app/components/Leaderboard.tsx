import { motion } from "motion/react";
import { useState } from "react";
import { Trophy, TrendingUp, Gift, Heart } from "lucide-react";

interface LeaderboardProps {
  onViewCreator?: (username: string) => void;
}

interface LeaderboardEntry {
  rank: number;
  name: string;
  username: string;
  initials: string;
  amount: string;
  items: number;
  supporters?: number;
  contributions?: number;
}

const RANK_COLORS = ["#FFD700", "#C0C0C0", "#CD7F32"] as const;

const topCreators: LeaderboardEntry[] = [
  { rank: 1, name: "Alex Creative", username: "@alexcreative", initials: "AC", amount: "$12,450", items: 8, supporters: 142 },
  { rank: 2, name: "Sarah Designs", username: "@sarahdesigns", initials: "SD", amount: "$9,820", items: 12, supporters: 98 },
  { rank: 3, name: "Jordan Streams", username: "@jordanstreams", initials: "JS", amount: "$8,340", items: 5, supporters: 87 },
  { rank: 4, name: "Maya Arts", username: "@mayaarts", initials: "MA", amount: "$6,120", items: 9, supporters: 64 },
  { rank: 5, name: "Chris Builds", username: "@chrisbuilds", initials: "CB", amount: "$5,780", items: 6, supporters: 53 },
  { rank: 6, name: "Taylor Makes", username: "@taylormakes", initials: "TM", amount: "$4,900", items: 4, supporters: 41 },
  { rank: 7, name: "Sam Creates", username: "@samcreates", initials: "SC", amount: "$3,650", items: 7, supporters: 38 },
  { rank: 8, name: "Riley Codes", username: "@rileycodes", initials: "RC", amount: "$2,940", items: 3, supporters: 29 },
  { rank: 9, name: "Morgan Plays", username: "@morganplays", initials: "MP", amount: "$2,100", items: 5, supporters: 22 },
  { rank: 10, name: "Casey Films", username: "@caseyfilms", initials: "CF", amount: "$1,870", items: 4, supporters: 18 },
];

const topSupporters: LeaderboardEntry[] = [
  { rank: 1, name: "Mike Chen", username: "@mikechen", initials: "MC", amount: "$4,250", items: 15, contributions: 32 },
  { rank: 2, name: "Emily Rodriguez", username: "@emilyrodriguez", initials: "ER", amount: "$3,800", items: 12, contributions: 28 },
  { rank: 3, name: "David Kim", username: "@davidkim", initials: "DK", amount: "$3,120", items: 9, contributions: 21 },
  { rank: 4, name: "Lisa Park", username: "@lisapark", initials: "LP", amount: "$2,640", items: 11, contributions: 19 },
  { rank: 5, name: "James Wilson", username: "@jameswilson", initials: "JW", amount: "$2,100", items: 8, contributions: 16 },
  { rank: 6, name: "Anna Lee", username: "@annalee", initials: "AL", amount: "$1,890", items: 7, contributions: 14 },
  { rank: 7, name: "Tom Harris", username: "@tomharris", initials: "TH", amount: "$1,540", items: 6, contributions: 11 },
  { rank: 8, name: "Sophie Turner", username: "@sophieturner", initials: "ST", amount: "$1,200", items: 5, contributions: 9 },
  { rank: 9, name: "Ryan Brooks", username: "@ryanbrooks", initials: "RB", amount: "$980", items: 4, contributions: 7 },
  { rank: 10, name: "Olivia Grant", username: "@oliviagrant", initials: "OG", amount: "$750", items: 3, contributions: 5 },
];

export default function Leaderboard({ onViewCreator }: LeaderboardProps) {
  const [tab, setTab] = useState<"creators" | "supporters">("creators");
  const entries = tab === "creators" ? topCreators : topSupporters;

  return (
    <div className="min-h-screen bg-background text-foreground">
      {/* Main Content */}
      <main className="pt-24 pb-16 px-4 sm:px-6 max-w-4xl mx-auto">
        {/* Header */}
        <motion.div
          initial={{ opacity: 0, y: 20 }}
          animate={{ opacity: 1, y: 0 }}
          className="text-center mb-10"
        >
          <div className="inline-flex items-center gap-2 mb-4">
            <Trophy className="w-8 h-8 text-accent" />
            <h1 className="text-3xl font-black tracking-tight">Leaderboard</h1>
          </div>
          <p className="text-muted-foreground text-sm">Top creators and supporters on TipFlow</p>
        </motion.div>

        {/* Tabs */}
        <div className="flex gap-1 mb-8 bg-muted p-1 max-w-xs mx-auto">
          <button
            onClick={() => setTab("creators")}
            className={`flex-1 flex items-center justify-center gap-2 px-4 py-2.5 text-sm font-bold transition-all ${
              tab === "creators"
                ? "bg-accent text-white"
                : "text-muted-foreground hover:text-foreground"
            }`}
          >
            <TrendingUp className="w-4 h-4" />
            Creators
          </button>
          <button
            onClick={() => setTab("supporters")}
            className={`flex-1 flex items-center justify-center gap-2 px-4 py-2.5 text-sm font-bold transition-all ${
              tab === "supporters"
                ? "bg-accent text-white"
                : "text-muted-foreground hover:text-foreground"
            }`}
          >
            <Heart className="w-4 h-4" />
            Supporters
          </button>
        </div>

        {/* Leaderboard List */}
        <motion.div
          key={tab}
          initial={{ opacity: 0, y: 10 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ duration: 0.3 }}
          className="space-y-3"
        >
          {entries.map((entry) => (
            <motion.div
              key={entry.rank}
              initial={{ opacity: 0, x: -10 }}
              animate={{ opacity: 1, x: 0 }}
              transition={{ delay: entry.rank * 0.04 }}
              onClick={() => onViewCreator?.(entry.username.replace("@", ""))}
              className="flex items-center gap-4 p-4 bg-card border border-border hover:border-accent/40 transition-all cursor-pointer group"
              style={{
                boxShadow: entry.rank <= 3 ? `inset 3px 0 0 ${RANK_COLORS[entry.rank - 1]}` : undefined,
              }}
            >
              {/* Rank */}
              <div className="w-10 text-center">
                {entry.rank <= 3 ? (
                  <span
                    className="text-xl font-black"
                    style={{ color: RANK_COLORS[entry.rank - 1] }}
                  >
                    #{entry.rank}
                  </span>
                ) : (
                  <span className="text-lg font-bold text-muted-foreground">#{entry.rank}</span>
                )}
              </div>

              {/* Avatar */}
              <div
                className="w-10 h-10 flex items-center justify-center font-bold text-sm border"
                style={{
                  borderColor: entry.rank <= 3 ? RANK_COLORS[entry.rank - 1] : "var(--border)",
                  background: entry.rank <= 3 ? `${RANK_COLORS[entry.rank - 1]}15` : "var(--muted)",
                }}
              >
                {entry.initials}
              </div>

              {/* Info */}
              <div className="flex-1 min-w-0">
                <p className="font-bold text-sm group-hover:text-accent transition-colors truncate">{entry.name}</p>
                <p className="text-xs text-muted-foreground">{entry.username}</p>
              </div>

              {/* Stats */}
              <div className="hidden sm:flex items-center gap-6 text-xs text-muted-foreground">
                {tab === "creators" ? (
                  <>
                    <div className="text-center">
                      <p className="font-bold text-foreground text-sm">{entry.supporters}</p>
                      <p>supporters</p>
                    </div>
                    <div className="text-center">
                      <p className="font-bold text-foreground text-sm">{entry.items}</p>
                      <p>items</p>
                    </div>
                  </>
                ) : (
                  <>
                    <div className="text-center">
                      <p className="font-bold text-foreground text-sm">{entry.contributions}</p>
                      <p>gifts</p>
                    </div>
                    <div className="text-center">
                      <p className="font-bold text-foreground text-sm">{entry.items}</p>
                      <p>creators</p>
                    </div>
                  </>
                )}
              </div>

              {/* Amount */}
              <div className="text-right">
                <p className="font-black text-sm text-accent">{entry.amount}</p>
                <p className="text-[10px] text-muted-foreground uppercase tracking-wider">
                  {tab === "creators" ? "raised" : "given"}
                </p>
              </div>
            </motion.div>
          ))}
        </motion.div>
      </main>
    </div>
  );
}
