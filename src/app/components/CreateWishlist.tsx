import { motion } from "motion/react";
import { useState, useRef } from "react";
import { ArrowLeft, Search, Upload, X, ImageIcon } from "lucide-react";

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
        <div className="max-w-2xl mx-auto">
          <motion.div
            initial={{ opacity: 0, y: 30 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ duration: 0.8, ease: "easeOut" }}
            className="mb-12"
          >
            <div className="text-[10px] font-black uppercase tracking-widest text-[#999999] mb-2">New Wishlist</div>
            <h1 className="text-5xl font-black text-[#111111] mb-3 tracking-tight">Create a List</h1>
            <p className="text-lg text-[#6b6b6b]">
              A wishlist is a curated collection of items for your fans to fund. Add items after creating the list.
            </p>
          </motion.div>

          <motion.div
            initial={{ opacity: 0, y: 20 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ duration: 0.6, delay: 0.15 }}
            className="space-y-6"
          >
            {/* Cover Image */}
            <div>
              <label className="block text-xs font-bold uppercase tracking-widest text-[#6b6b6b] mb-2">
                Cover Image <span className="text-[#999999] font-normal normal-case tracking-normal">optional</span>
              </label>
              <input ref={fileInputRef} type="file" accept="image/*" className="hidden" onChange={handleImageSelect} />
              <motion.div
                whileHover={{ scale: 1.005 }}
                onClick={() => fileInputRef.current?.click()}
                className="relative w-full h-44 overflow-hidden cursor-pointer border-2 border-dashed border-[#e0e0e0] hover:border-[#e8185d] transition-colors group bg-[#f5f5f5]"
              >
                {coverImage ? (
                  <>
                    <img src={coverImage} alt="Cover preview" className="w-full h-full object-cover" />
                    <div className="absolute inset-0 bg-black/50 opacity-0 group-hover:opacity-100 transition-opacity flex items-center justify-center">
                      <div className="flex items-center gap-2 text-white font-bold text-sm">
                        <Upload className="w-4 h-4" />
                        Change Image
                      </div>
                    </div>
                    <button onClick={removeImage} className="absolute top-3 right-3 w-7 h-7 bg-white border border-[#e0e0e0] flex items-center justify-center text-[#111111] hover:bg-red-50 hover:text-red-500 transition-colors z-10">
                      <X className="w-3.5 h-3.5" />
                    </button>
                  </>
                ) : (
                  <div className="absolute inset-0 flex flex-col items-center justify-center gap-3">
                    <div className="w-11 h-11 border border-[#e0e0e0] bg-white flex items-center justify-center group-hover:border-[#e8185d] transition-colors">
                      <ImageIcon className="w-5 h-5 text-[#999999]" />
                    </div>
                    <div className="text-center">
                      <p className="text-[#6b6b6b] font-bold text-sm">Upload Cover Image</p>
                      <p className="text-[#999999] text-xs mt-0.5">Click or drag to upload · PNG, JPG, GIF</p>
                    </div>
                  </div>
                )}
              </motion.div>
            </div>

            <div>
              <label className="block text-xs font-bold uppercase tracking-widest text-[#6b6b6b] mb-2">
                List Name <span className="text-[#e8185d]">*</span>
              </label>
              <input
                type="text"
                placeholder="e.g. Creator Essentials, Studio Upgrades"
                value={name}
                onChange={(e) => setName(e.target.value)}
                className="w-full px-4 py-3.5 border border-[#e0e0e0] bg-white text-[#111111] placeholder-[#999999] focus:outline-none focus:ring-2 focus:ring-[#e8185d] focus:border-transparent transition-all text-sm"
              />
            </div>

            <div>
              <label className="block text-xs font-bold uppercase tracking-widest text-[#6b6b6b] mb-2">
                Description <span className="text-[#999999] font-normal normal-case tracking-normal">optional</span>
              </label>
              <textarea
                placeholder="Tell fans what this list is about..."
                value={description}
                onChange={(e) => setDescription(e.target.value)}
                rows={4}
                className="w-full px-4 py-3.5 border border-[#e0e0e0] bg-white text-[#111111] placeholder-[#999999] focus:outline-none focus:ring-2 focus:ring-[#e8185d] focus:border-transparent transition-all resize-none text-sm"
              />
            </div>

            <div className="flex justify-end gap-3 pt-2">
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
                onClick={onCreateWishlist}
                disabled={!name.trim()}
                className="px-8 py-3 bg-[#e8185d] hover:bg-[#c9164f] disabled:opacity-40 disabled:cursor-not-allowed text-white font-black text-sm uppercase tracking-widest transition-colors"
              >
                Create List
              </motion.button>
            </div>
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
