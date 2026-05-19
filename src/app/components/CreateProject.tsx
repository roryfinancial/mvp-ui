import { motion } from "motion/react";
import { useState, useRef, useEffect } from "react";
import { Upload, X, ImageIcon, Loader2 } from "lucide-react";
import { projectApi } from "../../lib/api";
import type { ProjectResponse } from "../../lib/api";

interface CreateProjectProps {
  onBack?: () => void;
  onCreateProject?: () => void;
}

export default function CreateProject({ onBack, onCreateProject }: CreateProjectProps) {
  const [title, setTitle] = useState("");
  const [description, setDescription] = useState("");
  const [goalAmount, setGoalAmount] = useState("");
  const [thumbnail, setThumbnail] = useState<string | null>(null);
  const [selectedProjectId, setSelectedProjectId] = useState<string>("");
  const [projects, setProjects] = useState<ProjectResponse[]>([]);
  const [loadingProjects, setLoadingProjects] = useState(true);
  const [submitting, setSubmitting] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const fileInputRef = useRef<HTMLInputElement>(null);

  useEffect(() => {
    async function loadProjects() {
      const res = await projectApi.getMyProjects();
      if (res.success && res.data) {
        setProjects(res.data);
        if (res.data.length === 1) {
          setSelectedProjectId(res.data[0].id);
        }
      }
      setLoadingProjects(false);
    }
    loadProjects();
  }, []);

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

  const handleSubmit = async () => {
    if (!title.trim() || !goalAmount || !selectedProjectId || submitting) return;

    const amount = parseFloat(goalAmount);
    if (isNaN(amount) || amount < 0.01) {
      setError("Please enter a valid goal amount (minimum $0.01)");
      return;
    }

    setSubmitting(true);
    setError(null);

    const res = await projectApi.addItem(selectedProjectId, {
      title: title.trim(),
      description: description.trim() || undefined,
      goalAmount: amount,
    });

    if (res.success) {
      onCreateProject?.();
    } else {
      setError(res.error?.message ?? "Failed to add item");
      setSubmitting(false);
    }
  };

  const isValid = title.trim() && goalAmount && parseFloat(goalAmount) >= 0.01 && selectedProjectId;

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
            <div className="text-[10px] font-black uppercase tracking-widest text-subtle mb-2">Project</div>
            <h1 className="text-5xl font-black text-foreground mb-3 tracking-tight">Add an Item</h1>
            <p className="text-lg text-muted-foreground">Add a new item needed for your project goal.</p>
          </motion.div>

          <motion.div
            initial={{ opacity: 0, y: 20 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ duration: 0.6, delay: 0.15 }}
            className="space-y-6"
          >
            {/* Project Selector */}
            <div>
              <label className="block text-xs font-bold uppercase tracking-widest text-muted-foreground mb-2">
                Project <span className="text-accent">*</span>
              </label>
              {loadingProjects ? (
                <div className="flex items-center gap-2 text-subtle text-sm py-3">
                  <Loader2 className="w-4 h-4 animate-spin" />
                  Loading projects...
                </div>
              ) : projects.length === 0 ? (
                <p className="text-sm text-muted-foreground py-3">
                  You don't have any projects yet. Create a project first, then add items to it.
                </p>
              ) : (
                <select
                  value={selectedProjectId}
                  onChange={(e) => setSelectedProjectId(e.target.value)}
                  className="w-full px-4 py-3.5 border border-border bg-background text-foreground focus:outline-none focus:ring-2 focus:ring-accent focus:border-transparent transition-all text-sm"
                >
                  <option value="">Select a project...</option>
                  {projects.map((w) => (
                    <option key={w.id} value={w.id}>{w.name}</option>
                  ))}
                </select>
              )}
            </div>

            {/* Thumbnail */}
            <div>
              <label className="block text-xs font-bold uppercase tracking-widest text-muted-foreground mb-2">
                Thumbnail <span className="text-subtle font-normal normal-case tracking-normal">optional</span>
              </label>
              <input ref={fileInputRef} type="file" accept="image/*" className="hidden" onChange={handleThumbnailSelect} />
              <motion.div
                whileHover={{ scale: 1.005 }}
                onClick={() => fileInputRef.current?.click()}
                className="relative w-full h-44 overflow-hidden cursor-pointer border-2 border-dashed border-border hover:border-accent transition-colors group bg-muted"
              >
                {thumbnail ? (
                  <>
                    <img src={thumbnail} alt="Thumbnail preview" className="w-full h-full object-cover" />
                    <div className="absolute inset-0 bg-black/50 opacity-0 group-hover:opacity-100 transition-opacity flex items-center justify-center">
                      <div className="flex items-center gap-2 text-white font-bold text-sm">
                        <Upload className="w-4 h-4" />
                        Change Image
                      </div>
                    </div>
                    <button onClick={removeThumbnail} className="absolute top-3 right-3 w-7 h-7 bg-background border border-border flex items-center justify-center text-foreground hover:bg-red-50 hover:text-red-500 transition-colors z-10">
                      <X className="w-3.5 h-3.5" />
                    </button>
                  </>
                ) : (
                  <div className="absolute inset-0 flex flex-col items-center justify-center gap-3">
                    <div className="w-11 h-11 border border-border bg-background flex items-center justify-center group-hover:border-accent transition-colors">
                      <ImageIcon className="w-5 h-5 text-subtle" />
                    </div>
                    <div className="text-center">
                      <p className="text-muted-foreground font-bold text-sm">Upload Thumbnail</p>
                      <p className="text-subtle text-xs mt-0.5">Click or drag to upload · PNG, JPG, GIF</p>
                    </div>
                  </div>
                )}
              </motion.div>
            </div>

            {/* Title */}
            <div>
              <label className="block text-xs font-bold uppercase tracking-widest text-muted-foreground mb-2">
                Item Title <span className="text-accent">*</span>
              </label>
              <input
                type="text"
                placeholder="e.g. Sony WH-1000XM5 Headphones"
                value={title}
                onChange={(e) => setTitle(e.target.value)}
                className="w-full px-4 py-3.5 border border-border bg-background text-foreground placeholder-[#999999] focus:outline-none focus:ring-2 focus:ring-accent focus:border-transparent transition-all text-sm"
              />
            </div>

            {/* Description */}
            <div>
              <label className="block text-xs font-bold uppercase tracking-widest text-muted-foreground mb-2">
                Description <span className="text-subtle font-normal normal-case tracking-normal">optional</span>
              </label>
              <textarea
                placeholder="Tell fans why you want this item..."
                value={description}
                onChange={(e) => setDescription(e.target.value)}
                rows={4}
                className="w-full px-4 py-3.5 border border-border bg-background text-foreground placeholder-[#999999] focus:outline-none focus:ring-2 focus:ring-accent focus:border-transparent transition-all resize-none text-sm"
              />
            </div>

            {/* Goal Amount */}
            <div>
              <label className="block text-xs font-bold uppercase tracking-widest text-muted-foreground mb-2">
                Goal Amount <span className="text-accent">*</span>
              </label>
              <div className="relative">
                <span className="absolute left-4 top-1/2 -translate-y-1/2 text-muted-foreground font-bold text-sm">$</span>
                <input
                  type="number"
                  min="0.01"
                  step="0.01"
                  placeholder="0.00"
                  value={goalAmount}
                  onChange={(e) => setGoalAmount(e.target.value)}
                  className="w-full pl-8 pr-4 py-3.5 border border-border bg-background text-foreground placeholder-[#999999] focus:outline-none focus:ring-2 focus:ring-accent focus:border-transparent transition-all text-sm"
                />
              </div>
            </div>

            {error && (
              <div className="p-3 border border-red-300 bg-red-50 text-red-700 text-sm">
                {error}
              </div>
            )}

            <div className="flex justify-end gap-3 pt-2">
              <motion.button
                whileHover={{ scale: 1.01 }}
                whileTap={{ scale: 0.99 }}
                onClick={onBack}
                disabled={submitting}
                className="px-8 py-3 border border-border text-foreground font-bold text-sm uppercase tracking-wide hover:bg-muted transition-colors"
              >
                Cancel
              </motion.button>
              <motion.button
                whileHover={{ scale: 1.01 }}
                whileTap={{ scale: 0.99 }}
                onClick={handleSubmit}
                disabled={!isValid || submitting}
                className="px-8 py-3 bg-accent hover:bg-[#c9164f] disabled:opacity-40 disabled:cursor-not-allowed text-white font-black text-sm uppercase tracking-widest transition-colors flex items-center gap-2"
              >
                {submitting && <Loader2 className="w-4 h-4 animate-spin" />}
                {submitting ? "Adding..." : "Add to Project"}
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
