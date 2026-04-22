import { motion } from "motion/react";
import { useState, useRef } from "react";
import { ArrowLeft, List, Search, Upload, X, ImageIcon } from "lucide-react";

interface CreateWishlistProps {
  onBack?: () => void;
  onCreateWishlist?: () => void;
}

export default function CreateWishlist({ onBack, onCreateWishlist }: CreateWishlistProps) {
  const [name, setName] = useState("");
  const [description, setDescription] = useState("");
  const [searchQuery, setSearchQuery] = useState("");
  const [coverImage, setCoverImage] = useState<string | null>(null);
  const fileInputRef = useRef<HTMLInputElement>(null);

  const handleImageSelect = (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (file) {
      const url = URL.createObjectURL(file);
      setCoverImage(url);
    }
  };

  const removeImage = (e: React.MouseEvent) => {
    e.stopPropagation();
    setCoverImage(null);
    if (fileInputRef.current) fileInputRef.current.value = "";
  };

  const handleCreate = () => {
    onCreateWishlist?.();
  };

  return (
    <div className="min-h-screen bg-[#0a0a0a] text-white">
      {/* Navigation */}
      <nav className="fixed top-0 left-0 right-0 z-50 bg-[#0a0a0a]/80 backdrop-blur-lg border-b border-white/5">
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
                className="pl-10 pr-4 py-2 rounded-xl bg-[#1a1a1a] border border-white/10 text-white placeholder-gray-500 text-sm focus:outline-none focus:ring-2 focus:ring-purple-500 transition-all w-64"
              />
            </div>
            {onBack && (
              <button
                onClick={onBack}
                className="flex items-center gap-2 px-4 py-2 rounded-xl bg-white/5 border border-white/10 text-gray-300 hover:text-white hover:bg-white/10 transition-all"
              >
                <ArrowLeft className="w-4 h-4" />
                <span className="text-sm font-medium hidden sm:inline">Back</span>
              </button>
            )}
          </div>
        </div>
      </nav>

      {/* Main Content */}
      <section className="pt-32 pb-20 px-6">
        <div className="max-w-2xl mx-auto">
          {/* Page title */}
          <motion.div
            initial={{ opacity: 0, y: 30 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ duration: 0.8, ease: "easeOut" }}
            className="mb-12"
          >
            <div className="flex items-center gap-3 mb-4">
              <div className="w-10 h-10 rounded-2xl flex items-center justify-center bg-gradient-to-br from-purple-600/20 to-pink-600/20 border border-purple-500/20">
                <List className="w-5 h-5 text-purple-400" />
              </div>
              <span className="text-sm font-medium text-purple-400 uppercase tracking-wider">New Wishlist</span>
            </div>
            <h1 className="text-5xl font-bold mb-3">
              <span className="bg-gradient-to-r from-purple-400 to-pink-400 bg-clip-text text-transparent">
                Create a Wishlist
              </span>
            </h1>
            <p className="text-xl text-gray-400">
              A wishlist is a collection of items you want supporters to fund. You can add individual projects to it after creating it.
            </p>
          </motion.div>

          {/* Form */}
          <motion.div
            initial={{ opacity: 0, y: 20 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ duration: 0.6, delay: 0.15 }}
            className="space-y-6"
          >
            {/* Cover Image Upload */}
            <div>
              <label className="block text-sm font-medium text-gray-300 mb-2">
                Cover Image <span className="text-gray-500 font-normal">(optional)</span>
              </label>
              <input
                ref={fileInputRef}
                type="file"
                accept="image/*"
                className="hidden"
                onChange={handleImageSelect}
              />
              <motion.div
                whileHover={{ scale: 1.01 }}
                whileTap={{ scale: 0.99 }}
                onClick={() => fileInputRef.current?.click()}
                className="relative w-full h-48 rounded-2xl overflow-hidden cursor-pointer border-2 border-dashed border-purple-500/30 hover:border-purple-500/60 transition-all group"
                style={{ backgroundColor: "rgba(255,255,255,0.03)" }}
              >
                {coverImage ? (
                  <>
                    <img
                      src={coverImage}
                      alt="Cover preview"
                      className="w-full h-full object-cover"
                    />
                    {/* Overlay on hover */}
                    <div className="absolute inset-0 bg-black/50 opacity-0 group-hover:opacity-100 transition-opacity flex items-center justify-center">
                      <div className="flex items-center gap-2 text-white font-medium">
                        <Upload className="w-5 h-5" />
                        <span>Change Image</span>
                      </div>
                    </div>
                    {/* Remove button */}
                    <button
                      onClick={removeImage}
                      className="absolute top-3 right-3 w-8 h-8 rounded-full bg-black/60 border border-white/20 flex items-center justify-center text-white hover:bg-red-500/80 transition-colors z-10"
                    >
                      <X className="w-4 h-4" />
                    </button>
                  </>
                ) : (
                  <div className="absolute inset-0 flex flex-col items-center justify-center gap-3">
                    <div className="w-12 h-12 rounded-2xl bg-purple-500/10 border border-purple-500/20 flex items-center justify-center group-hover:bg-purple-500/20 transition-colors">
                      <ImageIcon className="w-6 h-6 text-purple-400" />
                    </div>
                    <div className="text-center">
                      <p className="text-gray-300 font-medium text-sm">Upload Cover Image</p>
                      <p className="text-gray-500 text-xs mt-0.5">Click or drag to upload · PNG, JPG, GIF</p>
                    </div>
                  </div>
                )}
              </motion.div>
            </div>

            <div>
              <label className="block text-sm font-medium text-gray-300 mb-2">
                Wishlist Name <span className="text-purple-400">*</span>
              </label>
              <input
                type="text"
                placeholder="e.g. Creator Essentials, Holiday Wishlist"
                value={name}
                onChange={(e) => setName(e.target.value)}
                className="w-full px-4 py-3.5 rounded-xl bg-[#1a1a1a] border border-white/10 text-white placeholder-gray-500 focus:outline-none focus:ring-2 focus:ring-purple-500 transition-all text-base"
              />
            </div>

            <div>
              <label className="block text-sm font-medium text-gray-300 mb-2">
                Description <span className="text-gray-500 font-normal">(optional)</span>
              </label>
              <textarea
                placeholder="Tell supporters what this wishlist is about..."
                value={description}
                onChange={(e) => setDescription(e.target.value)}
                rows={4}
                className="w-full px-4 py-3.5 rounded-xl bg-[#1a1a1a] border border-white/10 text-white placeholder-gray-500 focus:outline-none focus:ring-2 focus:ring-purple-500 transition-all resize-none text-base"
              />
            </div>

            {/* Actions */}
            <div className="flex justify-end gap-3 pt-2">
              <motion.button
                whileHover={{ scale: 1.02 }}
                whileTap={{ scale: 0.98 }}
                onClick={onBack}
                className="px-8 py-3 rounded-xl bg-white/5 border border-white/10 text-white font-semibold hover:bg-white/10 transition-all"
              >
                Cancel
              </motion.button>
              <motion.button
                whileHover={{ scale: 1.05, boxShadow: "0 20px 40px rgba(168, 85, 247, 0.4)" }}
                whileTap={{ scale: 0.95 }}
                onClick={handleCreate}
                disabled={!name.trim()}
                className="px-8 py-3 bg-gradient-to-r from-purple-600 to-pink-600 hover:from-purple-500 hover:to-pink-500 disabled:opacity-40 disabled:cursor-not-allowed rounded-xl text-white font-semibold transition-all shadow-lg shadow-purple-500/25"
              >
                Create Wishlist
              </motion.button>
            </div>
          </motion.div>
        </div>
      </section>

      <footer className="py-16 px-6 border-t border-white/5">
        <div className="max-w-7xl mx-auto text-center text-gray-400">
          <p>© 2026 TipFlow. All rights reserved.</p>
        </div>
      </footer>
    </div>
  );
}
