import { motion } from "motion/react";
import { useState, useRef } from "react";
import { Search, Upload, Plus, Trash2, ArrowLeft, X, ImageIcon } from "lucide-react";

interface CreateProjectProps {
  onBack?: () => void;
  onCreateProject?: () => void;
}

export default function CreateProject({ onBack, onCreateProject }: CreateProjectProps) {
  const [searchQuery, setSearchQuery] = useState("");
  const [projectTitle, setProjectTitle] = useState("");
  const [description, setDescription] = useState("");
  const [newGoal, setNewGoal] = useState("");
  const [thumbnail, setThumbnail] = useState<string | null>(null);
  const fileInputRef = useRef<HTMLInputElement>(null);
  const [goals, setGoals] = useState([
    { id: 1, name: "4K Gaming Monitor", price: "$599", image: null },
    { id: 2, name: "Mechanical Keyboard", price: "$150", image: null },
  ]);

  const addGoal = () => {
    if (newGoal.trim()) {
      setGoals([...goals, { id: Date.now(), name: newGoal, price: "$0", image: null }]);
      setNewGoal("");
    }
  };

  const removeGoal = (id: number) => {
    setGoals(goals.filter((goal) => goal.id !== id));
  };

  const handleThumbnailSelect = (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (file) {
      const url = URL.createObjectURL(file);
      setThumbnail(url);
    }
  };

  const removeThumbnail = (e: React.MouseEvent) => {
    e.stopPropagation();
    setThumbnail(null);
    if (fileInputRef.current) fileInputRef.current.value = "";
  };

  const handleCreateProject = () => {
    onCreateProject?.();
  };

  return (
    <div className="min-h-screen bg-[#0a0a0a] text-white">
      {/* Navigation */}
      <nav className="fixed top-0 left-0 right-0 z-50 bg-[#0a0a0a]/80 backdrop-blur-lg" style={{ borderBottomWidth: "1px", borderColor: "rgba(255, 255, 255, 0.05)" }}>
        <div className="max-w-7xl mx-auto px-6 py-5 flex items-center justify-between">
          <div className="text-2xl font-bold bg-gradient-to-r from-purple-400 to-pink-400 bg-clip-text text-transparent">
            TipFlow
          </div>
          <div className="flex items-center gap-6">
            <div className="relative hidden sm:block">
              <Search className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-gray-400" />
              <input
                type="text"
                placeholder="Search"
                value={searchQuery}
                onChange={(e) => setSearchQuery(e.target.value)}
                className="pl-10 pr-4 py-2 rounded-xl bg-[#1a1a1a] text-white placeholder-gray-500 text-sm focus:outline-none focus:ring-2 focus:ring-purple-500 transition-all w-64"
                style={{
                  borderWidth: "1px",
                  borderColor: "rgba(255, 255, 255, 0.1)",
                }}
              />
            </div>
            {onBack && (
              <button
                onClick={onBack}
                className="flex items-center gap-2 px-4 py-2 rounded-xl text-gray-300 hover:text-white transition-colors"
                style={{
                  backgroundColor: "rgba(255, 255, 255, 0.05)",
                  borderWidth: "1px",
                  borderColor: "rgba(255, 255, 255, 0.1)",
                }}
              >
                <ArrowLeft className="w-4 h-4" />
                <span className="text-sm font-medium hidden sm:inline">Back</span>
              </button>
            )}
          </div>
        </div>
      </nav>

      {/* Main Content */}
      <section className="relative pt-32 pb-20 px-6">
        <div className="max-w-5xl mx-auto relative z-10">
          {/* Page Title */}
          <motion.div
            initial={{ opacity: 0, y: 30 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ duration: 0.8, ease: "easeOut" }}
            className="mb-12"
          >
            <h1 className="text-5xl font-bold mb-2">
              <span className="bg-gradient-to-r from-purple-400 to-pink-400 bg-clip-text text-transparent">
                Add to Wishlist
              </span>
            </h1>
            <p className="text-xl text-gray-400">Add a new item to your wishlist for supporters to fund</p>
          </motion.div>

          {/* Project Details Grid */}
          <motion.div
            initial={{ opacity: 0, y: 20 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ duration: 0.6, delay: 0.2 }}
            className="grid grid-cols-1 md:grid-cols-2 gap-8 mb-12"
          >
            {/* Image Upload */}
            <div>
              <label className="block text-sm font-medium text-gray-300 mb-2">
                Item Thumbnail <span className="text-gray-500 font-normal">(optional)</span>
              </label>
              <input
                ref={fileInputRef}
                type="file"
                accept="image/*"
                className="hidden"
                onChange={handleThumbnailSelect}
              />
              <motion.div
                whileHover={{ scale: 1.02 }}
                onClick={() => fileInputRef.current?.click()}
                className="relative h-64 rounded-2xl overflow-hidden cursor-pointer border-2 border-dashed transition-all group"
                style={{
                  backgroundColor: "rgba(255, 255, 255, 0.05)",
                  borderColor: thumbnail ? "rgba(139, 92, 246, 0.5)" : "rgba(139, 92, 246, 0.3)",
                }}
              >
                {thumbnail ? (
                  <>
                    <img
                      src={thumbnail}
                      alt="Item thumbnail preview"
                      className="w-full h-full object-cover"
                    />
                    {/* Hover overlay */}
                    <div className="absolute inset-0 bg-black/50 opacity-0 group-hover:opacity-100 transition-opacity flex items-center justify-center">
                      <div className="flex items-center gap-2 text-white font-medium">
                        <Upload className="w-5 h-5" />
                        <span>Change Image</span>
                      </div>
                    </div>
                    {/* Remove button */}
                    <button
                      onClick={removeThumbnail}
                      className="absolute top-3 right-3 w-8 h-8 rounded-full bg-black/60 border border-white/20 flex items-center justify-center text-white hover:bg-red-500/80 transition-colors z-10"
                    >
                      <X className="w-4 h-4" />
                    </button>
                  </>
                ) : (
                  <div className="absolute inset-0 flex flex-col items-center justify-center gap-3 group-hover:opacity-80 transition-opacity">
                    <div className="w-14 h-14 rounded-2xl bg-purple-500/10 border border-purple-500/20 flex items-center justify-center group-hover:bg-purple-500/20 transition-colors">
                      <ImageIcon className="w-7 h-7 text-purple-400" />
                    </div>
                    <div className="text-center">
                      <p className="text-gray-300 font-medium mb-1">Upload Item Thumbnail</p>
                      <p className="text-sm text-gray-500">Click or drag image here</p>
                    </div>
                  </div>
                )}
              </motion.div>
            </div>

            {/* Description */}
            <div>
              <label className="block text-sm font-medium text-gray-300 mb-2">Item Title</label>
              <input
                type="text"
                placeholder="Enter item title..."
                value={projectTitle}
                onChange={(e) => setProjectTitle(e.target.value)}
                className="w-full px-4 py-3 rounded-xl bg-[#1a1a1a] text-white placeholder-gray-500 focus:outline-none focus:ring-2 focus:ring-purple-500 transition-all mb-4"
                style={{
                  borderWidth: "1px",
                  borderColor: "rgba(255, 255, 255, 0.1)",
                }}
              />
              <label className="block text-sm font-medium text-gray-300 mb-2">Description</label>
              <textarea
                placeholder="Describe this wishlist item..."
                value={description}
                onChange={(e) => setDescription(e.target.value)}
                rows={6}
                className="w-full px-4 py-3 rounded-xl bg-[#1a1a1a] text-white placeholder-gray-500 focus:outline-none focus:ring-2 focus:ring-purple-500 transition-all resize-none"
                style={{
                  borderWidth: "1px",
                  borderColor: "rgba(255, 255, 255, 0.1)",
                }}
              />
            </div>
          </motion.div>

          {/* Goals Section */}
          <motion.div
            initial={{ opacity: 0, y: 20 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ duration: 0.6, delay: 0.4 }}
          >
            <h2 className="text-3xl font-bold mb-6 flex items-center gap-3">
              <span className="w-2 h-8 bg-gradient-to-b from-purple-500 to-pink-500 rounded-full"></span>
              Funding Goals
            </h2>

            {/* Add New Goal */}
            <div className="flex flex-col sm:flex-row gap-4 mb-8">
              <input
                type="text"
                placeholder="Add a funding goal (e.g., 'New Monitor', 'Coffee Fund')"
                value={newGoal}
                onChange={(e) => setNewGoal(e.target.value)}
                onKeyPress={(e) => e.key === "Enter" && addGoal()}
                className="flex-1 px-4 py-3 rounded-xl bg-[#1a1a1a] text-white placeholder-gray-500 focus:outline-none focus:ring-2 focus:ring-purple-500 transition-all"
                style={{
                  borderWidth: "1px",
                  borderColor: "rgba(255, 255, 255, 0.1)",
                }}
              />
              <motion.button
                whileHover={{ scale: 1.05, boxShadow: "0 20px 40px rgba(168, 85, 247, 0.4)" }}
                whileTap={{ scale: 0.95 }}
                onClick={addGoal}
                className="flex items-center justify-center gap-2 px-6 py-3 bg-gradient-to-r from-purple-600 to-pink-600 hover:from-purple-500 hover:to-pink-500 rounded-xl text-white font-semibold transition-all shadow-lg shadow-purple-500/25"
              >
                <Plus className="w-5 h-5" />
                Add Goal
              </motion.button>
            </div>

            {/* Goals List */}
            <div className="space-y-4">
              {goals.map((goal, index) => (
                <motion.div
                  key={goal.id}
                  initial={{ opacity: 0, x: -20 }}
                  animate={{ opacity: 1, x: 0 }}
                  transition={{ duration: 0.3, delay: index * 0.05 }}
                  className="rounded-xl p-4 flex items-center gap-4"
                  style={{
                    backgroundColor: "rgba(255, 255, 255, 0.05)",
                    borderWidth: "1px",
                    borderColor: "rgba(255, 255, 255, 0.1)",
                  }}
                >
                  <div
                    className="w-16 h-14 rounded-lg flex items-center justify-center flex-shrink-0"
                    style={{
                      backgroundColor: "rgba(255, 255, 255, 0.05)",
                    }}
                  >
                    <Upload className="w-6 h-6 text-gray-500" />
                  </div>
                  <div className="flex-1">
                    <div className="text-white font-medium mb-1">{goal.name}</div>
                    <div className="text-gray-400 text-sm">{goal.price}</div>
                  </div>
                  <motion.button
                    whileHover={{ scale: 1.1 }}
                    whileTap={{ scale: 0.9 }}
                    onClick={() => removeGoal(goal.id)}
                    className="text-gray-500 hover:text-red-400 transition-colors"
                  >
                    <Trash2 className="w-5 h-5" />
                  </motion.button>
                </motion.div>
              ))}

              {goals.length === 0 && (
                <div className="text-center py-12 text-gray-500">
                  <p className="mb-2">No funding goals added yet</p>
                  <p className="text-sm">Add goals for this wishlist item above</p>
                </div>
              )}
            </div>
          </motion.div>

          {/* Action Buttons */}
          <motion.div
            initial={{ opacity: 0, y: 20 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ duration: 0.6, delay: 0.6 }}
            className="flex justify-end gap-4 mt-12"
          >
            <motion.button
              whileHover={{ scale: 1.02 }}
              whileTap={{ scale: 0.98 }}
              onClick={onBack}
              className="px-8 py-3 rounded-xl text-white font-semibold transition-all"
              style={{
                backgroundColor: "rgba(255, 255, 255, 0.05)",
                borderWidth: "1px",
                borderColor: "rgba(255, 255, 255, 0.1)",
              }}
            >
              Cancel
            </motion.button>
            <motion.button
              whileHover={{ scale: 1.05, boxShadow: "0 20px 40px rgba(168, 85, 247, 0.4)" }}
              whileTap={{ scale: 0.95 }}
              onClick={handleCreateProject}
              className="px-8 py-3 bg-gradient-to-r from-purple-600 to-pink-600 hover:from-purple-500 hover:to-pink-500 rounded-xl text-white font-semibold transition-all shadow-lg shadow-purple-500/25"
            >
              Add to Wishlist
            </motion.button>
          </motion.div>
        </div>
      </section>

      {/* Footer */}
      <footer className="py-16 px-6" style={{ borderTopWidth: "1px", borderColor: "rgba(255, 255, 255, 0.05)" }}>
        <div className="max-w-7xl mx-auto text-center text-gray-400">
          <p>© 2026 TipFlow. All rights reserved.</p>
        </div>
      </footer>
    </div>
  );
}
