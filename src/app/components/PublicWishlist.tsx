import { motion } from "motion/react";
import { SectionLabel } from "./shared/SectionLabel";
import { useEffect, useState } from "react";
import { User, Check, Zap, X, DollarSign, ArrowUp, ArrowLeft, Loader2 } from "lucide-react";
import { projectApi, giftApi } from "../../lib/api";
import type { ProjectResponse } from "../../lib/api";
import { useAuth } from "../../contexts/AuthContext";

interface PublicProjectProps {
  projectId: string;
  creatorUsername?: string;
  onBack?: () => void;
  onViewCreator?: () => void;
  onViewProject?: (itemId: string) => void;
}

export default function PublicWishlist({
  projectId,
  creatorUsername = "",
  onBack,
  onViewCreator,
  onViewProject,
}: PublicProjectProps) {
  const { refreshUser } = useAuth();
  const [project, setProject] = useState<ProjectResponse | null>(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState("");
  const [showQuickTip, setShowQuickTip] = useState(false);
  const [selectedItemId, setSelectedItemId] = useState<string | null>(null);
  const [selectedItemTitle, setSelectedItemTitle] = useState<string | null>(null);
  const [selectedTipAmount, setSelectedTipAmount] = useState<number>(10);
  const [customTipAmount, setCustomTipAmount] = useState("");
  const [tipConfirmed, setTipConfirmed] = useState(false);
  const [tipLoading, setTipLoading] = useState(false);
  const [tipError, setTipError] = useState("");

  useEffect(() => {
    async function fetchProject() {
      setLoading(true);
      const res = await projectApi.getById(projectId);
      if (res.success && res.data) {
        setProject(res.data);
      } else {
        setError(res.error?.message ?? "Failed to load project");
      }
      setLoading(false);
    }
    fetchProject();
  }, [projectId]);

  if (loading) {
    return (
      <div className="min-h-screen flex items-center justify-center bg-background">
        <Loader2 className="w-8 h-8 animate-spin text-accent" />
      </div>
    );
  }

  if (error || !project) {
    return (
      <div className="min-h-screen flex items-center justify-center bg-background text-foreground">
        <div className="text-center">
          <p className="text-lg font-bold mb-2">Project not found</p>
          <p className="text-subtle text-sm mb-4">{error}</p>
          <button onClick={onBack} className="text-accent hover:underline text-sm">Go back</button>
        </div>
      </div>
    );
  }

  const projectName = project.name;
  const projectDescription = project.description;
  const coverImage = project.coverImageUrl;
  const totalFunded = project.raisedAmount;
  const totalGoal = project.goalAmount;
  const items = project.items.map(item => ({
    id: item.id,
    title: item.title,
    status: (item.status === "GIFTED" ? "gifted" : "active") as "active" | "gifted",
    giftedBy: item.giftedByUsername ?? undefined,
    thumbnail: item.thumbnailUrl ?? undefined,
  }));

  const activeItems = items.filter(i => i.status === "active");
  const giftedCount = items.filter(i => i.status === "gifted").length;

  function openDonateModal(itemId?: string, itemTitle?: string) {
    setSelectedItemId(itemId ?? null);
    setSelectedItemTitle(itemTitle ?? null);
    setSelectedTipAmount(10);
    setCustomTipAmount("");
    setTipError("");
    setShowQuickTip(true);
  }

  const handleConfirmTip = async () => {
    const amount = selectedTipAmount ?? (customTipAmount ? parseFloat(customTipAmount) : 0);
    if (amount <= 0) return;
    setTipLoading(true);
    setTipError("");
    const res = await giftApi.create({
      projectId,
      ...(selectedItemId ? { itemId: selectedItemId } : {}),
      amount,
    });
    setTipLoading(false);
    if (res.success) {
      setTipConfirmed(true);
      // Refresh user balance in navbar and project data
      refreshUser();
      const refreshed = await projectApi.getById(projectId);
      if (refreshed.success && refreshed.data) {
        setProject(refreshed.data);
      }
      setTimeout(() => {
        setTipConfirmed(false);
        setShowQuickTip(false);
        setSelectedItemId(null);
        setSelectedItemTitle(null);
        setSelectedTipAmount(10);
        setCustomTipAmount("");
      }, 2000);
    } else {
      setTipError(res.error?.message ?? "Donation failed. Please try again.");
    }
  };

  return (
    <div className="min-h-screen bg-background text-foreground pt-[57px]">
      {/* Header */}
      <div className="relative">
        {/* Cover area */}
        <div className="w-full h-48 bg-gradient-to-br from-[#4a3060] via-[#5a3a6a] to-[#3a2848] overflow-hidden">
          {coverImage && (
            <img src={coverImage} alt={projectName} className="w-full h-full object-cover" />
          )}
          <div className="absolute inset-0 bg-gradient-to-t from-background via-background/40 to-transparent" />
        </div>

        {/* Project info */}
        <div className="max-w-5xl mx-auto px-6 -mt-16 relative z-10">
          <motion.div
            initial={{ opacity: 0, y: 20 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ duration: 0.5 }}
          >
            {/* Back + breadcrumb */}
            <div className="flex items-center gap-2 mb-4 text-sm">
              <button
                onClick={onBack}
                className="flex items-center gap-1.5 text-subtle hover:text-foreground transition-colors"
              >
                <ArrowLeft className="w-4 h-4" />
                Back
              </button>
              <span className="text-subtle">/</span>
              <button
                onClick={onViewCreator}
                className="text-subtle hover:text-foreground transition-colors"
              >
                {creatorUsername}
              </button>
              <span className="text-subtle">/</span>
              <span className="text-foreground font-bold">{projectName}</span>
            </div>

            <h1 className="text-3xl font-black text-foreground mb-2">{projectName}</h1>
            {projectDescription && (
              <p className="text-muted-foreground text-sm max-w-2xl mb-4">{projectDescription}</p>
            )}

            {/* Stats bar + Donate button */}
            <div className="flex items-center gap-6 mb-6 flex-wrap">
              <div className="flex items-center gap-4 text-sm">
                <span className="text-foreground font-bold">{items.length} items needed</span>
                <span className="text-subtle">{activeItems.length} remaining</span>
                {giftedCount > 0 && (
                  <span className="text-success font-medium">{giftedCount} funded</span>
                )}
              </div>
              {totalGoal > 0 && (
                <div className="flex items-center gap-3 flex-1 max-w-xs">
                  <div className="flex-1 h-2 bg-muted overflow-hidden">
                    <div
                      className="h-full bg-accent transition-all"
                      style={{ width: `${Math.min(100, (totalFunded / totalGoal) * 100)}%` }}
                    />
                  </div>
                  <span className="text-xs text-subtle font-bold whitespace-nowrap">
                    ${totalFunded.toLocaleString()} / ${totalGoal.toLocaleString()}
                  </span>
                </div>
              )}
              <button
                onClick={() => openDonateModal()}
                className="ml-auto px-6 py-2.5 btn-success text-white text-xs font-black uppercase tracking-widest transition-colors flex items-center gap-2"
              >
                <Zap className="w-4 h-4" />
                Donate to Project
              </button>
            </div>
          </motion.div>
        </div>
      </div>

      {/* Items Needed Grid */}
      <div className="max-w-5xl mx-auto px-6 pb-16">
        <div className="eyebrow mb-4 flex items-center gap-2">
          <span className="w-3 h-px bg-accent" />
          Items Needed
        </div>
        <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-4">
          {items.map((item, index) => (
              <motion.div
                key={item.id}
                initial={{ opacity: 0, y: 20 }}
                animate={{ opacity: 1, y: 0 }}
                transition={{ duration: 0.4, delay: index * 0.05 }}
                className="bg-background border border-border overflow-hidden group hover:shadow-md hover:border-accent/40 transition-all"
              >
                {/* Thumbnail */}
                <div
                  className="relative w-full h-44 bg-muted flex items-center justify-center cursor-pointer"
                  onClick={() => onViewProject?.(item.id)}
                >
                  {item.thumbnail ? (
                    <img src={item.thumbnail} alt={item.title} className="w-full h-full object-cover group-hover:scale-105 transition-transform" />
                  ) : (
                    <User className="w-14 h-14 text-subtle" />
                  )}

                  {/* Status Badge */}
                  <div
                    className={`absolute top-3 right-3 px-2 py-1 flex items-center gap-1.5 border text-[10px] font-black uppercase tracking-widest ${
                      item.status === "gifted"
                        ? "tag-funded"
                        : "tag-active"
                    }`}
                  >
                    {item.status === "gifted" ? (
                      <><Check className="w-2.5 h-2.5" />Funded</>
                    ) : (
                      <><ArrowUp className="w-2.5 h-2.5" />Needed</>
                    )}
                  </div>
                </div>

                {/* Info */}
                <div className="p-4">
                  <h3
                    className="text-sm font-black text-foreground mb-2 leading-tight line-clamp-2 group-hover:text-accent transition-colors cursor-pointer"
                    onClick={() => onViewProject?.(item.id)}
                  >
                    {item.title}
                  </h3>

                  {item.status === "gifted" ? (
                    <p className="text-subtle text-xs text-center py-2">
                      Funded by {item.giftedBy}
                    </p>
                  ) : (
                    <button
                      onClick={(e) => { e.stopPropagation(); openDonateModal(item.id, item.title); }}
                      className="w-full mt-1 py-2 btn-success text-white text-[10px] font-black uppercase tracking-widest transition-colors flex items-center justify-center gap-1.5"
                    >
                      <Zap className="w-3 h-3" />
                      Fund This
                    </button>
                  )}
                </div>
              </motion.div>
          ))}
        </div>
      </div>

      {/* Donate to Project Modal */}
      {showQuickTip && (
        <motion.div
          initial={{ opacity: 0 }}
          animate={{ opacity: 1 }}
          className="fixed inset-0 z-[100] flex items-center justify-center bg-black/60 backdrop-blur-sm p-4"
          onClick={() => setShowQuickTip(false)}
        >
          <motion.div
            initial={{ opacity: 0, scale: 0.95, y: 20 }}
            animate={{ opacity: 1, scale: 1, y: 0 }}
            transition={{ duration: 0.25 }}
            className="bg-background border border-border w-full max-w-md overflow-hidden"
            onClick={(e) => e.stopPropagation()}
          >
            {tipConfirmed ? (
              <div className="p-10 text-center">
                <motion.div
                  initial={{ scale: 0 }}
                  animate={{ scale: 1 }}
                  transition={{ type: "spring", stiffness: 300, damping: 20 }}
                  className="w-16 h-16 bg-success mx-auto mb-4 flex items-center justify-center"
                >
                  <Check className="w-8 h-8 text-white" />
                </motion.div>
                <h3 className="text-lg font-black text-foreground mb-1">Donation Sent!</h3>
                <p className="text-subtle text-sm">
                  Your contribution to {projectName} has been recorded.
                </p>
              </div>
            ) : (
              <>
                {/* Header */}
                <div className="flex items-center justify-between p-5 border-b border-border">
                  <div className="flex items-center gap-3">
                    <div className="w-8 h-8 bg-success flex items-center justify-center">
                      <Zap className="w-4 h-4 text-white" />
                    </div>
                    <div>
                      <h3 className="text-sm font-black text-foreground">
                        {selectedItemTitle ?? projectName}
                      </h3>
                      <p className="text-xs text-subtle">
                        {selectedItemTitle
                          ? `Fund this item in ${creatorUsername}'s project`
                          : `Donate to ${creatorUsername}'s project`}
                      </p>
                    </div>
                  </div>
                  <button
                    onClick={() => setShowQuickTip(false)}
                    className="w-8 h-8 flex items-center justify-center text-subtle hover:text-foreground transition-colors"
                  >
                    <X className="w-5 h-5" />
                  </button>
                </div>

                {/* Select Amount */}
                <div className="p-5 border-b border-border">
                  <SectionLabel>Donation amount</SectionLabel>
                  <div className="flex flex-wrap gap-2 mb-3">
                    {[5, 10, 25, 50, 100].map((amount) => (
                      <button
                        key={amount}
                        onClick={() => { setSelectedTipAmount(amount); setCustomTipAmount(""); }}
                        className={`px-4 py-2 text-sm font-bold border transition-colors ${
                          selectedTipAmount === amount
                            ? "border-accent bg-accent text-white"
                            : "border-border text-foreground hover:border-accent/40"
                        }`}
                      >
                        ${amount}
                      </button>
                    ))}
                  </div>
                  <div className="relative">
                    <DollarSign className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-subtle" />
                    <input
                      type="number"
                      min="1"
                      step="0.01"
                      placeholder="Custom amount"
                      value={customTipAmount}
                      onChange={(e) => { setCustomTipAmount(e.target.value); setSelectedTipAmount(0); }}
                      className="w-full pl-9 pr-4 py-2.5 bg-muted border border-border text-foreground text-sm font-medium placeholder-subtle focus:outline-none focus:ring-2 focus:ring-accent"
                    />
                  </div>
                </div>

                {/* Confirm */}
                <div className="p-5">
                  {tipError && (
                    <p className="text-destructive text-xs font-medium mb-3">{tipError}</p>
                  )}
                  <button
                    onClick={handleConfirmTip}
                    disabled={(!selectedTipAmount && !customTipAmount) || tipLoading}
                    className="w-full py-3 btn-success disabled:opacity-40 disabled:cursor-not-allowed text-white text-xs font-black uppercase tracking-widest transition-colors flex items-center justify-center gap-2"
                  >
                    {tipLoading ? (
                      <Loader2 className="w-4 h-4 animate-spin" />
                    ) : (
                      <Zap className="w-4 h-4" />
                    )}
                    {tipLoading
                      ? "Processing..."
                      : selectedTipAmount
                        ? `Donate $${selectedTipAmount}`
                        : customTipAmount
                          ? `Donate $${parseFloat(customTipAmount).toFixed(2)}`
                          : "Select Amount"}
                  </button>
                </div>
              </>
            )}
          </motion.div>
        </motion.div>
      )}
    </div>
  );
}
