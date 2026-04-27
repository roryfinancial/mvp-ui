import { motion } from "motion/react";
import { useState, useRef } from "react";
import { Upload, X, ImageIcon } from "lucide-react";

interface CreateWishlistProps {
  onBack?: () => void;
  onCreateWishlist?: () => void;
}

export default function CreateWishlist({ onBack, onCreateWishlist }: CreateWishlistProps) {
  const [name, setName] = useState("");
  const [description, setDescription] = useState("");
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
    <div className="min-h-screen bg-background text-foreground">
      {/* Main Content */}
      <section className="pt-12 pb-20 px-6">
        <div className="max-w-2xl mx-auto">
          <motion.div
            initial={{ opacity: 0, y: 30 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ duration: 0.8, ease: "easeOut" }}
            className="mb-12"
          >
            <div className="text-[10px] font-black uppercase tracking-widest text-subtle mb-2">New Wishlist</div>
            <h1 className="text-5xl font-black text-foreground mb-3 tracking-tight">Create a List</h1>
            <p className="text-lg text-muted-foreground">
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
              <label className="block text-xs font-bold uppercase tracking-widest text-muted-foreground mb-2">
                Cover Image <span className="text-subtle font-normal normal-case tracking-normal">optional</span>
              </label>
              <input ref={fileInputRef} type="file" accept="image/*" className="hidden" onChange={handleImageSelect} />
              <motion.div
                whileHover={{ scale: 1.005 }}
                onClick={() => fileInputRef.current?.click()}
                className="relative w-full h-44 overflow-hidden cursor-pointer border-2 border-dashed border-border hover:border-accent transition-colors group bg-muted"
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
                    <button onClick={removeImage} className="absolute top-3 right-3 w-7 h-7 bg-background border border-border flex items-center justify-center text-foreground hover:bg-red-50 hover:text-red-500 transition-colors z-10">
                      <X className="w-3.5 h-3.5" />
                    </button>
                  </>
                ) : (
                  <div className="absolute inset-0 flex flex-col items-center justify-center gap-3">
                    <div className="w-11 h-11 border border-border bg-background flex items-center justify-center group-hover:border-accent transition-colors">
                      <ImageIcon className="w-5 h-5 text-subtle" />
                    </div>
                    <div className="text-center">
                      <p className="text-muted-foreground font-bold text-sm">Upload Cover Image</p>
                      <p className="text-subtle text-xs mt-0.5">Click or drag to upload · PNG, JPG, GIF</p>
                    </div>
                  </div>
                )}
              </motion.div>
            </div>

            <div>
              <label className="block text-xs font-bold uppercase tracking-widest text-muted-foreground mb-2">
                List Name <span className="text-accent">*</span>
              </label>
              <input
                type="text"
                placeholder="e.g. Creator Essentials, Studio Upgrades"
                value={name}
                onChange={(e) => setName(e.target.value)}
                className="w-full px-4 py-3.5 border border-border bg-background text-foreground placeholder-[#999999] focus:outline-none focus:ring-2 focus:ring-accent focus:border-transparent transition-all text-sm"
              />
            </div>

            <div>
              <label className="block text-xs font-bold uppercase tracking-widest text-muted-foreground mb-2">
                Description <span className="text-subtle font-normal normal-case tracking-normal">optional</span>
              </label>
              <textarea
                placeholder="Tell fans what this list is about..."
                value={description}
                onChange={(e) => setDescription(e.target.value)}
                rows={4}
                className="w-full px-4 py-3.5 border border-border bg-background text-foreground placeholder-[#999999] focus:outline-none focus:ring-2 focus:ring-accent focus:border-transparent transition-all resize-none text-sm"
              />
            </div>

            <div className="flex justify-end gap-3 pt-2">
              <motion.button
                whileHover={{ scale: 1.01 }}
                whileTap={{ scale: 0.99 }}
                onClick={onBack}
                className="px-8 py-3 border border-border text-foreground font-bold text-sm uppercase tracking-wide hover:bg-muted transition-colors"
              >
                Cancel
              </motion.button>
              <motion.button
                whileHover={{ scale: 1.01 }}
                whileTap={{ scale: 0.99 }}
                onClick={onCreateWishlist}
                disabled={!name.trim()}
                className="px-8 py-3 bg-accent hover:bg-[#c9164f] disabled:opacity-40 disabled:cursor-not-allowed text-white font-black text-sm uppercase tracking-widest transition-colors"
              >
                Create List
              </motion.button>
            </div>
          </motion.div>
        </div>
      </section>

      <footer className="py-10 px-6 border-t border-border">
        <div className="max-w-7xl mx-auto text-center text-subtle text-sm">
          <p>© 2026 TipFlow. All rights reserved.</p>
        </div>
      </footer>
    </div>
  );
}
