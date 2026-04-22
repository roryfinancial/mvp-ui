import { motion } from "motion/react";
import { useState } from "react";
import { Plus, Search, TrendingUp, Users, DollarSign, Heart, X } from "lucide-react";

interface DashboardProps {
  userType: "creator" | "fan";
  onBack?: () => void;
}

export default function Dashboard({ userType, onBack }: DashboardProps) {
  const [searchOpen, setSearchOpen] = useState(false);
  const [searchQuery, setSearchQuery] = useState("");

  // Mock data for top funded creators
  const topCreators = [
    { name: "Alex Chen", avatar: "AC", raised: "$12,450", supporters: 234, category: "Art" },
    { name: "Sarah Martinez", avatar: "SM", raised: "$10,230", supporters: 189, category: "Music" },
    { name: "James Wilson", avatar: "JW", raised: "$9,870", supporters: 156, category: "Gaming" },
    { name: "Emma Davis", avatar: "ED", raised: "$8,920", supporters: 143, category: "Tech" },
  ];

  // Mock data for top funded projects
  const topProjects = [
    {
      title: "New Album Recording",
      creator: "Sarah Martinez",
      raised: "$8,450",
      goal: "$10,000",
      supporters: 127,
      progress: 84.5
    },
    {
      title: "Art Exhibition 2024",
      creator: "Alex Chen",
      raised: "$6,230",
      goal: "$8,000",
      supporters: 98,
      progress: 77.9
    },
    {
      title: "Gaming Setup Upgrade",
      creator: "James Wilson",
      raised: "$5,670",
      goal: "$7,500",
      supporters: 89,
      progress: 75.6
    },
    {
      title: "Tech Tutorial Series",
      creator: "Emma Davis",
      raised: "$4,890",
      goal: "$6,000",
      supporters: 76,
      progress: 81.5
    },
  ];

  // Mock search results
  const searchResults = topCreators.filter(creator =>
    creator.name.toLowerCase().includes(searchQuery.toLowerCase()) ||
    creator.category.toLowerCase().includes(searchQuery.toLowerCase())
  );

  return (
    <div className="min-h-screen bg-[#0a0a0a] text-white">
      {/* Header */}
      <div className="border-b border-white/10 bg-[#0a0a0a]/80 backdrop-blur-lg">
        <div className="max-w-7xl mx-auto px-6 py-5 flex items-center justify-between">
          <div className="text-2xl font-bold bg-gradient-to-r from-purple-400 to-pink-400 bg-clip-text text-transparent">
            TipFlow
          </div>
          <div className="flex items-center gap-4">
            <button className="text-gray-300 hover:text-white transition-colors font-medium">
              Profile
            </button>
            <button className="text-gray-300 hover:text-white transition-colors font-medium">
              Settings
            </button>
          </div>
        </div>
      </div>

      <div className="max-w-7xl mx-auto px-6 py-12">
        {/* Welcome Section */}
        <motion.div
          initial={{ opacity: 0, y: 20 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ duration: 0.6 }}
          className="mb-12"
        >
          <h1 className="text-5xl font-bold mb-4">
            Welcome back!
          </h1>
          <p className="text-xl text-gray-400">
            {userType === "creator"
              ? "Ready to create your next project?"
              : "Find creators to support today"}
          </p>
        </motion.div>

        <div className="grid lg:grid-cols-3 gap-8">
          {/* Main Action Area - 2 columns */}
          <motion.div
            initial={{ opacity: 0, x: -20 }}
            animate={{ opacity: 1, x: 0 }}
            transition={{ duration: 0.6, delay: 0.2 }}
            className="lg:col-span-2"
          >
            {userType === "creator" ? (
              // Creator: Make a Project Button
              <motion.div
                whileHover={{ scale: 1.01 }}
                className="bg-gradient-to-br from-purple-600/20 to-pink-600/20 border border-purple-500/30 rounded-3xl p-12 mb-8 cursor-pointer group relative overflow-hidden"
              >
                <div className="absolute inset-0 bg-gradient-to-br from-purple-600/0 to-pink-600/0 group-hover:from-purple-600/10 group-hover:to-pink-600/10 transition-all duration-300"></div>
                <div className="relative z-10 flex items-center justify-between">
                  <div>
                    <h2 className="text-4xl font-bold mb-3">Create a New Project</h2>
                    <p className="text-xl text-gray-300">
                      Set your funding goals and share your vision
                    </p>
                  </div>
                  <motion.div
                    whileHover={{ scale: 1.1, rotate: 90 }}
                    transition={{ duration: 0.3 }}
                  >
                    <Plus className="w-16 h-16 text-purple-400" />
                  </motion.div>
                </div>
              </motion.div>
            ) : (
              // Supporter: Search for Creators
              <div className="bg-[#1a1a1a] border border-white/10 rounded-3xl p-8 mb-8">
                <h2 className="text-3xl font-bold mb-6">Find Creators</h2>
                <div className="relative">
                  <Search className="absolute left-4 top-1/2 -translate-y-1/2 w-5 h-5 text-gray-400" />
                  <input
                    type="text"
                    placeholder="Search by name or category..."
                    value={searchQuery}
                    onChange={(e) => {
                      setSearchQuery(e.target.value);
                      setSearchOpen(e.target.value.length > 0);
                    }}
                    onFocus={() => setSearchOpen(true)}
                    className="w-full pl-12 pr-4 py-4 rounded-xl bg-[#0a0a0a] border border-white/10 focus:outline-none focus:ring-2 focus:ring-purple-500 focus:border-transparent text-white placeholder-gray-500 transition-all"
                  />

                  {/* Search Dropdown */}
                  {searchOpen && (
                    <motion.div
                      initial={{ opacity: 0, y: -10 }}
                      animate={{ opacity: 1, y: 0 }}
                      className="absolute top-full mt-2 w-full bg-[#1a1a1a] border border-white/10 rounded-xl shadow-2xl overflow-hidden z-[60]"
                    >
                      {searchResults.length > 0 ? (
                        searchResults.map((creator, index) => (
                          <motion.div
                            key={index}
                            initial={{ opacity: 0, x: -20 }}
                            animate={{ opacity: 1, x: 0 }}
                            transition={{ delay: index * 0.1 }}
                            whileHover={{ backgroundColor: "rgba(139, 92, 246, 0.1)" }}
                            className="p-4 cursor-pointer border-b border-white/5 last:border-b-0 flex items-center gap-4"
                            style={{ backgroundColor: "rgba(0, 0, 0, 0)" }}
                          >
                            <div className="w-12 h-12 rounded-full bg-gradient-to-br from-purple-600 to-pink-600 flex items-center justify-center font-bold">
                              {creator.avatar}
                            </div>
                            <div className="flex-1">
                              <div className="font-semibold text-white">{creator.name}</div>
                              <div className="text-sm text-gray-400">{creator.category}</div>
                            </div>
                            <div className="text-right">
                              <div className="text-purple-400 font-semibold">{creator.raised}</div>
                              <div className="text-xs text-gray-500">{creator.supporters} supporters</div>
                            </div>
                          </motion.div>
                        ))
                      ) : (
                        <div className="p-6 text-center text-gray-500">
                          No creators found
                        </div>
                      )}
                    </motion.div>
                  )}
                </div>

                {/* Start Support Button */}
                <motion.button
                  whileHover={{ scale: 1.02 }}
                  whileTap={{ scale: 0.98 }}
                  className="w-full mt-6 bg-gradient-to-r from-purple-600 to-pink-600 hover:from-purple-500 hover:to-pink-500 text-white py-4 rounded-xl font-semibold text-lg transition-all shadow-lg shadow-purple-500/25"
                >
                  Start Supporting
                </motion.button>
              </div>
            )}

            {/* Top Funded Section */}
            <motion.div
              initial={{ opacity: 0, y: 20 }}
              animate={{ opacity: 1, y: 0 }}
              transition={{ duration: 0.6, delay: 0.4 }}
              className="bg-[#1a1a1a] border border-white/10 rounded-3xl p-8"
            >
              <div className="flex items-center gap-3 mb-6">
                <TrendingUp className="w-6 h-6 text-purple-400" />
                <h2 className="text-2xl font-bold">
                  {userType === "creator" ? "Top Funded Creators" : "Top Funded Projects"}
                </h2>
              </div>

              {userType === "creator" ? (
                // Show top creators
                <div className="space-y-4">
                  {topCreators.map((creator, index) => (
                    <motion.div
                      key={index}
                      initial={{ opacity: 0, x: -20 }}
                      animate={{ opacity: 1, x: 0 }}
                      transition={{ delay: index * 0.1 }}
                      whileHover={{ scale: 1.02, backgroundColor: "rgba(139, 92, 246, 0.05)" }}
                      className="p-5 rounded-2xl border border-white/5 hover:border-purple-500/30 transition-all cursor-pointer"
                      style={{ backgroundColor: "rgba(0, 0, 0, 0)" }}
                    >
                      <div className="flex items-center gap-4">
                        <div className="relative">
                          <div className="w-14 h-14 rounded-full bg-gradient-to-br from-purple-600 to-pink-600 flex items-center justify-center font-bold text-lg">
                            {creator.avatar}
                          </div>
                          <div className="absolute -top-1 -right-1 w-6 h-6 rounded-full bg-[#0a0a0a] border-2 border-yellow-500 flex items-center justify-center text-xs">
                            {index + 1}
                          </div>
                        </div>
                        <div className="flex-1">
                          <div className="font-semibold text-white text-lg">{creator.name}</div>
                          <div className="text-sm text-gray-400">{creator.category}</div>
                        </div>
                        <div className="text-right">
                          <div className="text-purple-400 font-bold text-lg">{creator.raised}</div>
                          <div className="flex items-center gap-1 text-xs text-gray-500">
                            <Users className="w-3 h-3" />
                            {creator.supporters}
                          </div>
                        </div>
                      </div>
                    </motion.div>
                  ))}
                </div>
              ) : (
                // Show top projects
                <div className="space-y-4">
                  {topProjects.map((project, index) => (
                    <motion.div
                      key={index}
                      initial={{ opacity: 0, x: -20 }}
                      animate={{ opacity: 1, x: 0 }}
                      transition={{ delay: index * 0.1 }}
                      whileHover={{ scale: 1.02, backgroundColor: "rgba(139, 92, 246, 0.05)" }}
                      className="p-5 rounded-2xl border border-white/5 hover:border-purple-500/30 transition-all cursor-pointer"
                      style={{ backgroundColor: "rgba(0, 0, 0, 0)" }}
                    >
                      <div className="flex items-start justify-between mb-3">
                        <div>
                          <div className="font-semibold text-white text-lg mb-1">{project.title}</div>
                          <div className="text-sm text-gray-400">by {project.creator}</div>
                        </div>
                        <div className="text-right">
                          <div className="text-purple-400 font-bold">{project.raised}</div>
                          <div className="text-xs text-gray-500">of {project.goal}</div>
                        </div>
                      </div>

                      {/* Progress Bar */}
                      <div className="relative w-full h-2 bg-white/5 rounded-full overflow-hidden mb-2">
                        <motion.div
                          initial={{ width: 0 }}
                          animate={{ width: `${project.progress}%` }}
                          transition={{ duration: 1, delay: 0.5 + index * 0.1 }}
                          className="absolute top-0 left-0 h-full bg-gradient-to-r from-purple-600 to-pink-600 rounded-full"
                        ></motion.div>
                      </div>

                      <div className="flex items-center gap-2 text-xs text-gray-500">
                        <Heart className="w-3 h-3" />
                        {project.supporters} supporters
                      </div>
                    </motion.div>
                  ))}
                </div>
              )}
            </motion.div>
          </motion.div>

          {/* Stats Sidebar - 1 column */}
          <motion.div
            initial={{ opacity: 0, x: 20 }}
            animate={{ opacity: 1, x: 0 }}
            transition={{ duration: 0.6, delay: 0.3 }}
            className="space-y-6"
          >
            {/* Stats Cards */}
            <motion.div
              whileHover={{ scale: 1.02 }}
              className="bg-gradient-to-br from-purple-600/20 to-purple-600/10 border border-purple-500/30 rounded-2xl p-6"
            >
              <div className="flex items-center gap-3 mb-2">
                <div className="w-10 h-10 rounded-xl bg-purple-600/30 flex items-center justify-center">
                  <DollarSign className="w-5 h-5 text-purple-400" />
                </div>
                <div className="text-sm text-gray-400">
                  {userType === "creator" ? "Total Raised" : "Total Given"}
                </div>
              </div>
              <div className="text-3xl font-bold text-white">$0</div>
              <div className="text-xs text-gray-500 mt-1">Get started today!</div>
            </motion.div>

            <motion.div
              whileHover={{ scale: 1.02 }}
              className="bg-gradient-to-br from-pink-600/20 to-pink-600/10 border border-pink-500/30 rounded-2xl p-6"
            >
              <div className="flex items-center gap-3 mb-2">
                <div className="w-10 h-10 rounded-xl bg-pink-600/30 flex items-center justify-center">
                  <Users className="w-5 h-5 text-pink-400" />
                </div>
                <div className="text-sm text-gray-400">
                  {userType === "creator" ? "Supporters" : "Supporting"}
                </div>
              </div>
              <div className="text-3xl font-bold text-white">0</div>
              <div className="text-xs text-gray-500 mt-1">Build your community</div>
            </motion.div>

            <motion.div
              whileHover={{ scale: 1.02 }}
              className="bg-gradient-to-br from-blue-600/20 to-blue-600/10 border border-blue-500/30 rounded-2xl p-6"
            >
              <div className="flex items-center gap-3 mb-2">
                <div className="w-10 h-10 rounded-xl bg-blue-600/30 flex items-center justify-center">
                  <Heart className="w-5 h-5 text-blue-400" />
                </div>
                <div className="text-sm text-gray-400">
                  {userType === "creator" ? "Active Projects" : "Wishlists Viewed"}
                </div>
              </div>
              <div className="text-3xl font-bold text-white">0</div>
              <div className="text-xs text-gray-500 mt-1">Start creating impact</div>
            </motion.div>

            {/* Quick Tips */}
            <div className="bg-[#1a1a1a] border border-white/10 rounded-2xl p-6">
              <h3 className="font-bold text-white mb-4">Quick Tips</h3>
              <div className="space-y-3 text-sm text-gray-400">
                <div className="flex items-start gap-2">
                  <div className="w-1.5 h-1.5 rounded-full bg-purple-500 mt-1.5"></div>
                  <span>
                    {userType === "creator"
                      ? "Set clear funding goals for your projects"
                      : "Follow creators to stay updated"}
                  </span>
                </div>
                <div className="flex items-start gap-2">
                  <div className="w-1.5 h-1.5 rounded-full bg-pink-500 mt-1.5"></div>
                  <span>
                    {userType === "creator"
                      ? "Share your wishlist on social media"
                      : "Check out trending projects"}
                  </span>
                </div>
                <div className="flex items-start gap-2">
                  <div className="w-1.5 h-1.5 rounded-full bg-blue-500 mt-1.5"></div>
                  <span>
                    {userType === "creator"
                      ? "Thank your supporters regularly"
                      : "Every contribution makes a difference"}
                  </span>
                </div>
              </div>
            </div>
          </motion.div>
        </div>
      </div>

      {/* Click outside to close search */}
      {searchOpen && (
        <div
          className="fixed inset-0 z-40"
          onClick={() => setSearchOpen(false)}
        ></div>
      )}
    </div>
  );
}
