import { motion, AnimatePresence } from "motion/react";
import { useState, useRef } from "react";
import { Upload, X, ImageIcon, Loader2, Plus, Trash2, Target, DollarSign, GripVertical } from "lucide-react";
import { projectApi } from "../../lib/api";

interface Goal {
  id: string;
  title: string;
  description: string;
  goalAmount: string;
  thumbnail: string | null;
}

interface CreateProjectPageProps {
  onBack?: () => void;
  onComplete?: () => void;
}

function generateId() {
  return Math.random().toString(36).slice(2, 10);
}

function emptyGoal(): Goal {
  return { id: generateId(), title: "", description: "", goalAmount: "", thumbnail: null };
}

export default function CreateProjectPage({ onBack, onComplete }: CreateProjectPageProps) {
  // Project fields
  const [name, setName] = useState("");
  const [description, setDescription] = useState("");
  const [coverImage, setCoverImage] = useState<string | null>(null);
  const coverInputRef = useRef<HTMLInputElement>(null);

  // Goals
  const [goals, setGoals] = useState<Goal[]>([emptyGoal()]);
  const [expandedGoalId, setExpandedGoalId] = useState<string | null>(goals[0].id);

  // Submit state
  const [submitting, setSubmitting] = useState(false);
  const [error, setError] = useState<string | null>(null);

  // Cover image handlers
  const handleCoverSelect = (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (file) setCoverImage(URL.createObjectURL(file));
  };

  const removeCover = (e: React.MouseEvent) => {
    e.stopPropagation();
    setCoverImage(null);
    if (coverInputRef.current) coverInputRef.current.value = "";
  };

  // Goal handlers
  const addGoal = () => {
    const g = emptyGoal();
    setGoals((prev) => [...prev, g]);
    setExpandedGoalId(g.id);
  };

  const removeGoal = (id: string) => {
    setGoals((prev) => prev.filter((g) => g.id !== id));
    if (expandedGoalId === id) setExpandedGoalId(null);
  };

  const updateGoal = (id: string, field: keyof Goal, value: string | null) => {
    setGoals((prev) => prev.map((g) => (g.id === id ? { ...g, [field]: value } : g)));
  };

  // Validation
  const validGoals = goals.filter(
    (g) => g.title.trim() && g.goalAmount && parseFloat(g.goalAmount) >= 0.01
  );
  const isValid = name.trim() && validGoals.length > 0;

  const totalGoal = goals.reduce((sum, g) => {
    const n = parseFloat(g.goalAmount);
    return sum + (isNaN(n) ? 0 : n);
  }, 0);

  // Submit
  const handleSubmit = async () => {
    if (!isValid || submitting) return;
    setSubmitting(true);
    setError(null);

    try {
      // 1. Create the project
      const projectRes = await projectApi.create({
        name: name.trim(),
        description: description.trim() || undefined,
        isPublic: true,
      });

      if (!projectRes.success || !projectRes.data) {
        setError(projectRes.error?.message ?? "Failed to create project");
        setSubmitting(false);
        return;
      }

      const projectId = projectRes.data.id;

      // 2. Add all valid goals as items
      const itemPromises = validGoals.map((g) =>
        projectApi.addItem(projectId, {
          title: g.title.trim(),
          description: g.description.trim() || undefined,
          goalAmount: parseFloat(g.goalAmount),
        })
      );

      const results = await Promise.all(itemPromises);
      const failed = results.filter((r) => !r.success);

      if (failed.length > 0) {
        setError(`Project created, but ${failed.length} goal(s) failed to save. You can add them from the dashboard.`);
        setTimeout(() => onComplete?.(), 2000);
        return;
      }

      onComplete?.();
    } catch {
      setError("Network error — please check your connection and try again.");
      setSubmitting(false);
    }
  };

  return (
    <div className="min-h-screen bg-background text-foreground">
      <section className="pt-12 pb-20 px-6">
        <div className="max-w-3xl mx-auto">
          {/* Header */}
          <motion.div
            initial={{ opacity: 0, y: 30 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ duration: 0.8, ease: "easeOut" }}
            className="mb-12"
          >
            <div className="eyebrow mb-2">New Project</div>
            <h1 className="text-5xl font-black text-foreground mb-3 tracking-tight">Create a Project</h1>
            <p className="text-lg text-muted-foreground">
              Define your project and set funding goals. Supporters will see each goal and can donate directly.
            </p>
          </motion.div>

          <motion.div
            initial={{ opacity: 0, y: 20 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ duration: 0.6, delay: 0.15 }}
            className="space-y-10"
          >
            {/* ── Project Details ─────────────────────────────────────────── */}
            <div className="space-y-6">
              <div className="flex items-center gap-2 eyebrow">
                <span className="w-6 h-6 bg-accent text-white flex items-center justify-center text-[10px] font-black">1</span>
                Project Details
              </div>

              {/* Cover Image */}
              <div>
                <label className="block text-xs font-bold uppercase tracking-widest text-muted-foreground mb-2">
                  Cover Image <span className="text-subtle font-normal normal-case tracking-normal">optional</span>
                </label>
                <input ref={coverInputRef} type="file" accept="image/*" className="hidden" onChange={handleCoverSelect} />
                <motion.div
                  whileHover={{ scale: 1.005 }}
                  onClick={() => coverInputRef.current?.click()}
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
                      <button onClick={removeCover} className="absolute top-3 right-3 w-7 h-7 bg-background border border-border flex items-center justify-center text-foreground hover:bg-red-50 hover:text-red-500 transition-colors z-10">
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

              {/* Project Name */}
              <div>
                <label className="block text-xs font-bold uppercase tracking-widest text-muted-foreground mb-2">
                  Project Name <span className="text-accent">*</span>
                </label>
                <input
                  type="text"
                  placeholder="e.g. Studio Upgrade, Creator Essentials"
                  value={name}
                  onChange={(e) => setName(e.target.value)}
                  className="w-full px-4 py-3.5 border border-border bg-background text-foreground placeholder-[#999999] focus:outline-none focus:ring-2 focus:ring-accent focus:border-transparent transition-all text-sm"
                />
              </div>

              {/* Description */}
              <div>
                <label className="block text-xs font-bold uppercase tracking-widest text-muted-foreground mb-2">
                  Description <span className="text-subtle font-normal normal-case tracking-normal">optional</span>
                </label>
                <textarea
                  placeholder="Tell supporters what this project is about and why it matters..."
                  value={description}
                  onChange={(e) => setDescription(e.target.value)}
                  rows={4}
                  className="w-full px-4 py-3.5 border border-border bg-background text-foreground placeholder-[#999999] focus:outline-none focus:ring-2 focus:ring-accent focus:border-transparent transition-all resize-none text-sm"
                />
              </div>
            </div>

            {/* ── Funding Goals ────────────────────────────────────────── */}
            <div className="space-y-4">
              <div className="flex items-center justify-between">
                <div className="flex items-center gap-2 eyebrow">
                  <span className="w-6 h-6 bg-accent text-white flex items-center justify-center text-[10px] font-black">2</span>
                  Funding Goals
                </div>
                {totalGoal > 0 && (
                  <div className="flex items-center gap-1.5 text-sm">
                    <DollarSign className="w-3.5 h-3.5 text-accent" />
                    <span className="font-black text-foreground">${totalGoal.toLocaleString(undefined, { minimumFractionDigits: 2, maximumFractionDigits: 2 })}</span>
                    <span className="text-subtle text-xs font-bold">total</span>
                  </div>
                )}
              </div>

              <p className="text-sm text-muted-foreground -mt-1">
                Add the items or milestones your supporters can fund. Each goal is visible on your public project page.
              </p>

              {/* Goal Cards */}
              <div className="space-y-3">
                <AnimatePresence initial={false}>
                  {goals.map((goal, index) => {
                    const isExpanded = expandedGoalId === goal.id;
                    const hasAmount = goal.goalAmount && parseFloat(goal.goalAmount) > 0;
                    return (
                      <motion.div
                        key={goal.id}
                        initial={{ opacity: 0, height: 0 }}
                        animate={{ opacity: 1, height: "auto" }}
                        exit={{ opacity: 0, height: 0 }}
                        transition={{ duration: 0.25 }}
                        className="border border-border bg-background overflow-hidden"
                      >
                        {/* Goal header — always visible */}
                        <div
                          className="flex items-center gap-3 px-4 py-3 cursor-pointer hover:bg-muted/50 transition-colors"
                          onClick={() => setExpandedGoalId(isExpanded ? null : goal.id)}
                        >
                          <GripVertical className="w-4 h-4 text-subtle flex-shrink-0" />
                          <div className="w-6 h-6 bg-muted border border-border flex items-center justify-center flex-shrink-0">
                            <Target className="w-3 h-3 text-subtle" />
                          </div>
                          <div className="flex-1 min-w-0">
                            <span className="text-sm font-bold text-foreground truncate block">
                              {goal.title.trim() || `Goal ${index + 1}`}
                            </span>
                          </div>
                          {hasAmount && (
                            <span className="text-xs font-black text-accent flex-shrink-0">
                              ${parseFloat(goal.goalAmount).toLocaleString(undefined, { minimumFractionDigits: 2, maximumFractionDigits: 2 })}
                            </span>
                          )}
                          {goals.length > 1 && (
                            <button
                              onClick={(e) => { e.stopPropagation(); removeGoal(goal.id); }}
                              className="w-7 h-7 flex items-center justify-center text-subtle hover:text-red-500 hover:bg-red-50 transition-colors flex-shrink-0"
                            >
                              <Trash2 className="w-3.5 h-3.5" />
                            </button>
                          )}
                        </div>

                        {/* Goal form — expanded */}
                        <AnimatePresence>
                          {isExpanded && (
                            <motion.div
                              initial={{ opacity: 0, height: 0 }}
                              animate={{ opacity: 1, height: "auto" }}
                              exit={{ opacity: 0, height: 0 }}
                              transition={{ duration: 0.2 }}
                              className="overflow-hidden"
                            >
                              <div className="px-4 pb-4 pt-1 space-y-4 border-t border-border">
                                {/* Title */}
                                <div>
                                  <label className="block text-xs font-bold uppercase tracking-widest text-muted-foreground mb-2">
                                    Goal Title <span className="text-accent">*</span>
                                  </label>
                                  <input
                                    type="text"
                                    placeholder="e.g. Elgato Stream Deck, Camera Upgrade, New Mic"
                                    value={goal.title}
                                    onChange={(e) => updateGoal(goal.id, "title", e.target.value)}
                                    className="w-full px-4 py-3 border border-border bg-background text-foreground placeholder-[#999999] focus:outline-none focus:ring-2 focus:ring-accent focus:border-transparent transition-all text-sm"
                                  />
                                </div>

                                {/* Description */}
                                <div>
                                  <label className="block text-xs font-bold uppercase tracking-widest text-muted-foreground mb-2">
                                    Description <span className="text-subtle font-normal normal-case tracking-normal">optional</span>
                                  </label>
                                  <textarea
                                    placeholder="Why do you need this? How will it help your content?"
                                    value={goal.description}
                                    onChange={(e) => updateGoal(goal.id, "description", e.target.value)}
                                    rows={3}
                                    className="w-full px-4 py-3 border border-border bg-background text-foreground placeholder-[#999999] focus:outline-none focus:ring-2 focus:ring-accent focus:border-transparent transition-all resize-none text-sm"
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
                                      value={goal.goalAmount}
                                      onChange={(e) => updateGoal(goal.id, "goalAmount", e.target.value)}
                                      className="w-full pl-8 pr-4 py-3 border border-border bg-background text-foreground placeholder-[#999999] focus:outline-none focus:ring-2 focus:ring-accent focus:border-transparent transition-all text-sm"
                                    />
                                  </div>
                                </div>
                              </div>
                            </motion.div>
                          )}
                        </AnimatePresence>
                      </motion.div>
                    );
                  })}
                </AnimatePresence>
              </div>

              {/* Add Goal button */}
              <motion.button
                whileHover={{ scale: 1.005 }}
                whileTap={{ scale: 0.995 }}
                onClick={addGoal}
                className="w-full flex items-center justify-center gap-2 px-4 py-3 border-2 border-dashed border-border hover:border-accent text-muted-foreground hover:text-accent transition-colors text-sm font-bold"
              >
                <Plus className="w-4 h-4" />
                Add Another Goal
              </motion.button>
            </div>

            {/* ── Preview Summary ─────────────────────────────────────── */}
            {validGoals.length > 0 && name.trim() && (
              <motion.div
                initial={{ opacity: 0, y: 10 }}
                animate={{ opacity: 1, y: 0 }}
                className="p-5 border border-border bg-muted/50 space-y-3"
              >
                <div className="eyebrow">Project Preview</div>
                <div className="flex items-start justify-between gap-4">
                  <div>
                    <h3 className="text-lg font-black text-foreground">{name}</h3>
                    {description && <p className="text-sm text-muted-foreground mt-1 line-clamp-2">{description}</p>}
                  </div>
                  <div className="text-right flex-shrink-0">
                    <div className="text-2xl font-black text-accent">
                      ${totalGoal.toLocaleString(undefined, { minimumFractionDigits: 2, maximumFractionDigits: 2 })}
                    </div>
                    <div className="text-[10px] font-bold uppercase tracking-widest text-subtle">
                      {validGoals.length} {validGoals.length === 1 ? "goal" : "goals"}
                    </div>
                  </div>
                </div>
                <div className="space-y-1.5 pt-2 border-t border-border">
                  {validGoals.map((g) => (
                    <div key={g.id} className="flex items-center justify-between py-1.5">
                      <div className="flex items-center gap-2 min-w-0">
                        <Target className="w-3 h-3 text-accent flex-shrink-0" />
                        <span className="text-sm text-foreground font-medium truncate">{g.title}</span>
                      </div>
                      <span className="text-sm font-bold text-foreground flex-shrink-0">
                        ${parseFloat(g.goalAmount).toLocaleString(undefined, { minimumFractionDigits: 2, maximumFractionDigits: 2 })}
                      </span>
                    </div>
                  ))}
                </div>
              </motion.div>
            )}

            {/* ── Error ───────────────────────────────────────────────── */}
            {error && (
              <div className="p-3 border border-red-300 bg-red-50 text-red-700 text-sm">
                {error}
              </div>
            )}

            {/* ── Actions ─────────────────────────────────────────────── */}
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
                {submitting ? "Creating..." : "Create Project"}
              </motion.button>
            </div>
          </motion.div>
        </div>
      </section>

      <footer className="py-10 px-6 border-t border-border">
        <div className="max-w-7xl mx-auto text-center text-subtle text-sm">
          <p>&copy; 2026 Rory. All rights reserved.</p>
        </div>
      </footer>
    </div>
  );
}
