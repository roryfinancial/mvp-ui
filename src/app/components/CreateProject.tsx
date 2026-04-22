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

  return (
    <div className="min-h-screen bg-white text-[#111111]">
      {/* Navigation */}
      <nav className="fixed top-0 left-0 right-0 z-50 bg-[#111111] border-b-2 border-[#e8185d]">
        <div className="max-w-7xl mx-auto px-6 py-4 flex items-center justify-between">
          <div className="text-xl font-black text-white tracking-tight">TipFlow</div>
          <div className="flex items-center gap-4">
            <div className="relative hidden sm:block">
              <Search className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-white/40" />
              <input
                type="text"
                placeholder="Search"
                value={searchQuery}
                onChange={(e) => setSearchQuery(e.target.value)}
                className="pl-10 pr-4 py-2 bg-white/10 border border-white/20 text-white placeholder-white/30 text-sm focus:outline-none focus:ring-2 focus:ring-[#e8185d] transition-all w-48"
              />
            </div>
            {onBack && (
              <button
                onClick={onBack}
                className="flex items-center gap-2 px-4 py-2 border border-white/20 text-white hover:bg-white/10 text-sm font-medium transition-colors"
              >
                <ArrowLeft className="w-4 h-4" />
                <span className="hidden sm:inline">Back</span>
              </button>
            )}
          </div>
        </div>
      </nav>

      {/* Main Content */}
      <section className="pt-28 pb-20 px-6">
        <div className="max-w-5xl mx-auto">
          <motion.div
            initial={{ opacity: 0, y: 30 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ duration: 0.8, ease: "easeOut" }}
            className="mb-12"
          >
            <div className="text-[10px] font-black uppercase tracking-widest text-[#999999] mb-2">Wishlist</div>
            <h1 className="text-5xl font-black text-[#111111] mb-2 tracking-tight">Add an Item</h1>
            <p className="text-lg text-[#6b6b6b]">Add a new item to your wishlist for fans to fund.</p>
          </motion.div>

          {/* Details Grid */}
          <motion.div
            initial={{ opacity: 0, y: 20 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ duration: 0.6, delay: 0.2 }}
            className="grid grid-cols-1 md:grid-cols-2 gap-8 mb-12"
          >
            {/* Image Upload */}
            <div>
              <label className="block text-xs font-bold uppercase tracking-widest text-[#6b6b6b] mb-2">
                Thumbnail <span className="text-[#999999] font-normal normal-case tracking-normal">optional</span>
              </label>
              <input ref={fileInputRef} type="file" accept="image/*" className="hidden" onChange={handleThumbnailSelect} />
              <motion.div
                whileHover={{ scale: 1.01 }}
                onClick={() => fileInputRef.current?.click()}
                className="relative h-64 overflow-hidden cursor-pointer border-2 border-dashed transition-all group"
                style={{ borderColor: thumbnail ? "#e8185d" : "#e0e0e0", backgroundColor: "#f5f5f5" }}
              >
                {thumbnail ? (
                  <>
                    <img src={thumbnail} alt="Preview" className="w-full h-full object-cover" />
                    <div className="absolute inset-0 bg-black/50 opacity-0 group-hover:opacity-100 transition-opacity flex items-center justify-center">
                      <div className="flex items-center gap-2 text-white font-bold text-sm">
                        <Upload className="w-4 h-4" />
                        Change Image
                      </div>
                    </div>
                    <button onClick={removeThumbnail} className="absolute top-3 right-3 w-7 h-7 bg-white border border-[#e0e0e0] flex items-center justify-center text-[#111111] hover:bg-red-50 hover:text-red-500 transition-colors z-10">
                      <X className="w-3.5 h-3.5" />
                    </button>
                  </>
                ) : (
                  <div className="absolute inset-0 flex flex-col items-center justify-center gap-3 group-hover:opacity-70 transition-opacity">
                    <div className="w-12 h-12 border border-[#e0e0e0] bg-white flex items-center justify-center">
                      <ImageIcon className="w-6 h-6 text-[#999999]" />
                    </div>
                    <div className="text-center">
                      <p className="text-[#6b6b6b] font-bold text-sm mb-0.5">Upload Thumbnail</p>
                      <p className="text-xs text-[#999999]">Click or drag image here</p>
                    </div>
                  </div>
                )}
              </motion.div>
            </div>

            {/* Fields */}
            <div className="space-y-4">
              <div>
                <label className="block text-xs font-bold uppercase tracking-widest text-[#6b6b6b] mb-2">Item Title</label>
                <input
                  type="text"
                  placeholder="e.g. Sony WH-1000XM5 Headphones"
                  value={projectTitle}
                  onChange={(e) => setProjectTitle(e.target.value)}
                  className="w-full px-4 py-3 border border-[#e0e0e0] bg-white text-[#111111] placeholder-[#999999] focus:outline-none focus:ring-2 focus:ring-[#e8185d] focus:border-transparent transition-all text-sm"
                />
              </div>
              <div>
                <label className="block text-xs font-bold uppercase tracking-widest text-[#6b6b6b] mb-2">Description</label>
                <textarea
                  placeholder="Tell fans why you want this item..."
                  value={description}
                  onChange={(e) => setDescription(e.target.value)}
                  rows={7}
                  className="w-full px-4 py-3 border border-[#e0e0e0] bg-white text-[#111111] placeholder-[#999999] focus:outline-none focus:ring-2 focus:ring-[#e8185d] focus:border-transparent transition-all resize-none text-sm"
                />
              </div>
            </div>
          </motion.div>

          {/* Funding Goals */}
          <motion.div
            initial={{ opacity: 0, y: 20 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ duration: 0.6, delay: 0.4 }}
          >
            <div className="flex items-center gap-3 mb-6">
              <div className="w-3 h-5 bg-[#e8185d]" />
              <h2 className="text-2xl font-black text-[#111111] tracking-tight">Funding Goals</h2>
            </div>

            <div className="flex flex-col sm:flex-row gap-3 mb-8">
              <input
                type="text"
                placeholder="Add a funding goal (e.g. 'New Monitor', 'Coffee Fund')"
                value={newGoal}
                onChange={(e) => setNewGoal(e.target.value)}
                onKeyPress={(e) => e.key === "Enter" && addGoal()}
                className="flex-1 px-4 py-3 border border-[#e0e0e0] bg-white text-[#111111] placeholder-[#999999] focus:outline-none focus:ring-2 focus:ring-[#e8185d] transition-all text-sm"
              />
              <motion.button
                whileHover={{ scale: 1.01 }}
                whileTap={{ scale: 0.99 }}
                onClick={addGoal}
                className="flex items-center justify-center gap-2 px-6 py-3 bg-[#e8185d] hover:bg-[#c9164f] text-white font-black text-xs uppercase tracking-widest transition-colors"
              >
                <Plus className="w-4 h-4" />
                Add Goal
              </motion.button>
            </div>

            <div className="space-y-3">
              {goals.map((goal, index) => (
                <motion.div
                  key={goal.id}
                  initial={{ opacity: 0, x: -20 }}
                  animate={{ opacity: 1, x: 0 }}
                  transition={{ duration: 0.3, delay: index * 0.05 }}
                  className="p-4 border border-[#e0e0e0] bg-[#f5f5f5] flex items-center gap-4"
                >
                  <div className="w-14 h-12 bg-white border border-[#e0e0e0] flex items-center justify-center flex-shrink-0">
                    <Upload className="w-5 h-5 text-[#d0d0d0]" />
                  </div>
                  <div className="flex-1">
                    <div className="text-[#111111] font-bold text-sm mb-0.5">{goal.name}</div>
                    <div className="text-[#999999] text-xs">{goal.price}</div>
                  </div>
                  <motion.button
                    whileHover={{ scale: 1.1 }}
                    whileTap={{ scale: 0.9 }}
                    onClick={() => removeGoal(goal.id)}
                    className="text-[#d0d0d0] hover:text-red-500 transition-colors"
                  >
                    <Trash2 className="w-4 h-4" />
                  </motion.button>
                </motion.div>
              ))}

              {goals.length === 0 && (
                <div className="text-center py-12 text-[#999999] text-sm">
                  <p className="mb-1">No goals added yet.</p>
                  <p className="text-xs">Add goals for this wishlist item above.</p>
                </div>
              )}
            </div>
          </motion.div>

          {/* Action Buttons */}
          <motion.div
            initial={{ opacity: 0, y: 20 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ duration: 0.6, delay: 0.6 }}
            className="flex justify-end gap-3 mt-12"
          >
            <motion.button
              whileHover={{ scale: 1.01 }}
              whileTap={{ scale: 0.99 }}
              onClick={onBack}
              className="px-8 py-3 border border-[#e0e0e0] text-[#111111] font-bold text-sm uppercase tracking-wide hover:bg-[#f5f5f5] transition-colors"
            >
              Cancel
            </motion.button>
            <motion.button
              whileHover={{ scale: 1.01 }}
              whileTap={{ scale: 0.99 }}
              onClick={onCreateProject}
              className="px-8 py-3 bg-[#e8185d] hover:bg-[#c9164f] text-white font-black text-sm uppercase tracking-widest transition-colors"
            >
              Add to Wishlist
            </motion.button>
          </motion.div>
        </div>
      </section>

      <footer className="py-10 px-6 border-t border-[#e0e0e0]">
        <div className="max-w-7xl mx-auto text-center text-[#999999] text-sm">
          <p>© 2026 TipFlow. All rights reserved.</p>
        </div>
      </footer>
    </div>
  );
}
