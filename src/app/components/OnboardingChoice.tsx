import { motion } from "motion/react";
import { Plus, Search, Sparkles, Heart, ArrowLeft } from "lucide-react";

interface OnboardingChoiceProps {
  userType: "creator" | "supporter";
  onBack?: () => void;
  onComplete?: () => void;
  onViewCreator?: () => void;
  onMakeProject?: () => void;
}

export default function OnboardingChoice({ userType, onBack, onComplete, onViewCreator, onMakeProject }: OnboardingChoiceProps) {

  // Mock data for top creators
  const topCreators = [
    { name: "Alex Creative", amount: "$2,450" },
    { name: "Sarah Designs", amount: "$1,890" },
    { name: "Mike Studios", amount: "$1,620" },
  ];

  // Mock data for top projects
  const topProjects = [
    { name: "New Gaming Setup", amount: "$3,200", progress: 85 },
    { name: "Art Studio Equipment", amount: "$2,100", progress: 65 },
    { name: "Music Production Tools", amount: "$1,800", progress: 45 },
  ];

  return (
    <div className="min-h-screen bg-[#0a0a0a] flex items-center justify-center p-4">
      {/* Back Button */}
      {onBack && (
        <motion.button
          initial={{ opacity: 0, x: -20 }}
          animate={{ opacity: 1, x: 0 }}
          transition={{ duration: 0.5 }}
          onClick={onBack}
          className="fixed top-6 left-6 z-50 flex items-center gap-2 px-4 py-2 backdrop-blur-sm rounded-xl text-white transition-all"
          style={{
            backgroundColor: "rgba(255, 255, 255, 0.05)",
            borderWidth: "1px",
            borderColor: "rgba(255, 255, 255, 0.1)",
          }}
        >
          <ArrowLeft className="w-5 h-5" />
          <span className="font-medium">Back</span>
        </motion.button>
      )}

      <motion.div
        initial={{ opacity: 0, scale: 0.95 }}
        animate={{ opacity: 1, scale: 1 }}
        transition={{ duration: 0.5 }}
        className="w-full max-w-xl mx-auto rounded-3xl overflow-hidden shadow-2xl p-8"
        style={{
          backgroundColor: "#1a1a1a",
          borderWidth: "1px",
          borderColor: "rgba(255, 255, 255, 0.1)",
        }}
      >
        {/* Header */}
        <motion.div
          initial={{ opacity: 0, y: -20 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ duration: 0.5, delay: 0.2 }}
          className="text-center mb-8"
        >
          <h1 className="text-3xl font-bold text-white mb-2">Welcome to TipFlow!</h1>
          <p className="text-gray-400">
            {userType === "creator" ? "Let's get your creator profile set up" : "Discover amazing creators to support"}
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
              whileHover={{ scale: 1.02, boxShadow: "0 20px 40px rgba(168, 85, 247, 0.4)" }}
              whileTap={{ scale: 0.98 }}
              onClick={onMakeProject}
              className="w-full flex items-center justify-center gap-2 px-6 py-4 bg-gradient-to-r from-purple-600 to-pink-600 hover:from-purple-500 hover:to-pink-500 rounded-xl text-white font-semibold text-lg transition-all shadow-lg shadow-purple-500/25"
            >
              <Plus className="w-5 h-5" />
              Make a Project
            </motion.button>

            <div>
              <h3 className="text-xl font-semibold text-gray-200 mb-4 flex items-center justify-center gap-2">
                <Sparkles className="w-5 h-5 text-purple-400" />
                Top-funded Creators
              </h3>
              <div className="space-y-3">
                {topCreators.map((creator, index) => (
                  <motion.div
                    key={index}
                    initial={{ opacity: 0, x: -20 }}
                    animate={{ opacity: 1, x: 0 }}
                    transition={{ duration: 0.3, delay: 0.1 * index }}
                    onClick={onViewCreator}
                    className="rounded-xl px-4 py-3 flex items-center justify-between transition-colors cursor-pointer hover:scale-105"
                    style={{
                      backgroundColor: "rgba(255, 255, 255, 0.05)",
                      borderWidth: "1px",
                      borderColor: "rgba(255, 255, 255, 0.05)",
                    }}
                  >
                    <span className="text-gray-300 font-medium">{creator.name}</span>
                    <span className="text-purple-400 font-semibold">{creator.amount}</span>
                  </motion.div>
                ))}
              </div>
            </div>

            <motion.button
              whileHover={{ scale: 1.02 }}
              whileTap={{ scale: 0.98 }}
              onClick={() => onComplete?.()}
              className="w-full px-6 py-4 rounded-xl text-white font-semibold text-lg transition-all"
              style={{
                backgroundColor: "rgba(255, 255, 255, 0.05)",
                borderWidth: "1px",
                borderColor: "rgba(255, 255, 255, 0.1)",
              }}
            >
              Start Creating
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
              <Search className="absolute left-4 top-1/2 -translate-y-1/2 w-5 h-5 text-gray-400" />
              <input
                type="text"
                placeholder="Search projects or creators..."
                className="w-full pl-12 pr-4 py-4 rounded-xl bg-[#0a0a0a] border border-white/10 focus:outline-none focus:ring-2 focus:ring-purple-500 focus:border-transparent text-white placeholder-gray-500 transition-all"
              />
            </div>

            <div>
              <h3 className="text-xl font-semibold text-gray-200 mb-4 flex items-center justify-center gap-2">
                <Heart className="w-5 h-5 text-pink-400" />
                Top-funded Projects
              </h3>
              <div className="space-y-3">
                {topProjects.map((project, index) => (
                  <motion.div
                    key={index}
                    initial={{ opacity: 0, x: -20 }}
                    animate={{ opacity: 1, x: 0 }}
                    transition={{ duration: 0.3, delay: 0.1 * index }}
                    className="rounded-xl px-4 py-3 transition-colors cursor-pointer"
                    style={{
                      backgroundColor: "rgba(255, 255, 255, 0.05)",
                      borderWidth: "1px",
                      borderColor: "rgba(255, 255, 255, 0.05)",
                    }}
                  >
                    <div className="flex items-center justify-between mb-2">
                      <span className="text-gray-300 font-medium">{project.name}</span>
                      <span className="text-pink-400 font-semibold">{project.amount}</span>
                    </div>
                    <div className="w-full rounded-full h-2 overflow-hidden" style={{ backgroundColor: "rgba(255, 255, 255, 0.05)" }}>
                      <motion.div
                        initial={{ width: 0 }}
                        animate={{ width: `${project.progress}%` }}
                        transition={{ duration: 1, delay: 0.3 + 0.1 * index }}
                        className="h-full bg-gradient-to-r from-purple-500 to-pink-500 rounded-full"
                      />
                    </div>
                  </motion.div>
                ))}
              </div>
            </div>

            <motion.button
              whileHover={{ scale: 1.02 }}
              whileTap={{ scale: 0.98 }}
              onClick={() => onComplete?.()}
              className="w-full px-6 py-4 rounded-xl text-white font-semibold text-lg transition-all"
              style={{
                backgroundColor: "rgba(255, 255, 255, 0.05)",
                borderWidth: "1px",
                borderColor: "rgba(255, 255, 255, 0.1)",
              }}
            >
              Start Supporting
            </motion.button>
          </motion.div>
        )}
      </motion.div>
    </div>
  );
}
