import { motion } from "motion/react";
import { Plus, Search, TrendingUp, Heart, ArrowLeft } from "lucide-react";

interface OnboardingChoiceProps {
  userType: "creator" | "supporter";
  onBack?: () => void;
  onComplete?: () => void;
  onViewCreator?: () => void;
  onMakeProject?: () => void;
}

export default function OnboardingChoice({ userType, onBack, onComplete, onViewCreator, onMakeProject }: OnboardingChoiceProps) {
  const topCreators = [
    { name: "Alex Creative", amount: "$2,450" },
    { name: "Sarah Designs", amount: "$1,890" },
    { name: "Mike Studios", amount: "$1,620" },
  ];

  const topProjects = [
    { name: "New Gaming Setup", amount: "$3,200", progress: 85 },
    { name: "Art Studio Equipment", amount: "$2,100", progress: 65 },
    { name: "Music Production Tools", amount: "$1,800", progress: 45 },
  ];

  return (
    <div className="min-h-screen bg-muted flex items-center justify-center p-4">
      {onBack && (
        <motion.button
          initial={{ opacity: 0, x: -20 }}
          animate={{ opacity: 1, x: 0 }}
          transition={{ duration: 0.5 }}
          onClick={onBack}
          className="fixed top-6 left-6 z-50 flex items-center gap-2 px-4 py-2 border border-border bg-background text-foreground hover:bg-muted transition-colors"
        >
          <ArrowLeft className="w-4 h-4" />
          <span className="text-sm font-medium">Back</span>
        </motion.button>
      )}

      <motion.div
        initial={{ opacity: 0, scale: 0.98 }}
        animate={{ opacity: 1, scale: 1 }}
        transition={{ duration: 0.4 }}
        className="w-full max-w-xl mx-auto bg-background border border-border shadow-sm p-8"
      >
        {/* Header */}
        <motion.div
          initial={{ opacity: 0, y: -20 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ duration: 0.5, delay: 0.2 }}
          className="mb-8"
        >
          <div className="text-xs font-bold uppercase tracking-widest text-subtle mb-2">Welcome</div>
          <h1 className="text-3xl font-black text-foreground mb-2 tracking-tight">
            {userType === "creator" ? "Set up your profile." : "Find creators to support."}
          </h1>
          <p className="text-muted-foreground text-sm">
            {userType === "creator" ? "Add your first wishlist item to get started." : "Discover creators and start gifting."}
          </p>
        </motion.div>

        {/* Creator Content */}
        {userType === "creator" && (
          <motion.div
            initial={{ opacity: 0, y: 20 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ duration: 0.4 }}
            className="space-y-6"
          >
            <motion.button
              whileHover={{ scale: 1.01 }}
              whileTap={{ scale: 0.99 }}
              onClick={onMakeProject}
              className="w-full flex items-center justify-center gap-2 px-6 py-4 bg-accent hover:bg-[#c9164f] text-white font-black text-sm uppercase tracking-widest transition-colors"
            >
              <Plus className="w-4 h-4" />
              Add a Wishlist Item
            </motion.button>

            <div>
              <div className="text-[10px] font-black uppercase tracking-widest text-subtle mb-3 flex items-center gap-2">
                <TrendingUp className="w-3 h-3" />
                Top Creators
              </div>
              <div className="space-y-2">
                {topCreators.map((creator, index) => (
                  <motion.div
                    key={index}
                    initial={{ opacity: 0, x: -20 }}
                    animate={{ opacity: 1, x: 0 }}
                    transition={{ duration: 0.3, delay: 0.1 * index }}
                    onClick={onViewCreator}
                    className="flex items-center justify-between px-4 py-3 border border-border bg-muted hover:bg-background cursor-pointer transition-colors"
                  >
                    <span className="text-foreground font-medium text-sm">{creator.name}</span>
                    <span className="text-accent font-black text-sm">{creator.amount}</span>
                  </motion.div>
                ))}
              </div>
            </div>

            <motion.button
              whileHover={{ scale: 1.01 }}
              whileTap={{ scale: 0.99 }}
              onClick={() => onComplete?.()}
              className="w-full px-6 py-4 border border-border text-foreground font-bold text-sm uppercase tracking-wide hover:bg-muted transition-colors"
            >
              Go to Dashboard
            </motion.button>
          </motion.div>
        )}

        {/* Supporter Content */}
        {userType === "supporter" && (
          <motion.div
            initial={{ opacity: 0, y: 20 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ duration: 0.4 }}
            className="space-y-6"
          >
            <div className="relative">
              <Search className="absolute left-4 top-1/2 -translate-y-1/2 w-4 h-4 text-subtle" />
              <input
                type="text"
                placeholder="Search creators or projects..."
                className="w-full pl-11 pr-4 py-4 border border-border bg-background focus:outline-none focus:ring-2 focus:ring-accent text-foreground placeholder-[#999999] text-sm transition-all"
              />
            </div>

            <div>
              <div className="text-[10px] font-black uppercase tracking-widest text-subtle mb-3 flex items-center gap-2">
                <Heart className="w-3 h-3" />
                Trending Projects
              </div>
              <div className="space-y-2">
                {topProjects.map((project, index) => (
                  <motion.div
                    key={index}
                    initial={{ opacity: 0, x: -20 }}
                    animate={{ opacity: 1, x: 0 }}
                    transition={{ duration: 0.3, delay: 0.1 * index }}
                    className="px-4 py-3 border border-border bg-muted cursor-pointer hover:bg-background transition-colors"
                  >
                    <div className="flex items-center justify-between mb-2">
                      <span className="text-foreground font-medium text-sm">{project.name}</span>
                      <span className="text-accent font-black text-sm">{project.amount}</span>
                    </div>
                    <div className="w-full h-1.5 bg-[#e0e0e0] overflow-hidden">
                      <motion.div
                        initial={{ width: 0 }}
                        animate={{ width: `${project.progress}%` }}
                        transition={{ duration: 1, delay: 0.3 + 0.1 * index }}
                        className="h-full bg-accent"
                      />
                    </div>
                  </motion.div>
                ))}
              </div>
            </div>

            <motion.button
              whileHover={{ scale: 1.01 }}
              whileTap={{ scale: 0.99 }}
              onClick={() => onComplete?.()}
              className="w-full px-6 py-4 bg-accent hover:bg-[#c9164f] text-white font-black text-sm uppercase tracking-widest transition-colors"
            >
              Explore Creators
            </motion.button>
          </motion.div>
        )}
      </motion.div>
    </div>
  );
}
