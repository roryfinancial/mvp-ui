import { motion } from "motion/react";
import { useState } from "react";
import { User, Check, Zap, X, DollarSign, ArrowUp, ArrowLeft, ChevronRight } from "lucide-react";

interface WishlistItem {
  id: string;
  title: string;
  status: "active" | "gifted";
  giftedBy?: string;
  thumbnail?: string;
  funded?: number;
  goal?: number;
}

interface PublicWishlistProps {
  wishlistName?: string;
  wishlistDescription?: string;
  coverImage?: string;
  creatorName?: string;
  creatorUsername?: string;
  items?: WishlistItem[];
  onBack?: () => void;
  onViewCreator?: () => void;
  onViewProject?: (itemId: string) => void;
}

export default function PublicWishlist({
  wishlistName = "Studio Gear",
  wishlistDescription = "Everything I need to level up my recording setup. Help me build the ultimate creative workspace!",
  coverImage,
  creatorName = "Clavicular",
  creatorUsername = "clavicular",
  items = [
    { id: "1", title: "Ableton Push 3", status: "active" as const, funded: 340, goal: 999 },
    { id: "2", title: "Universal Audio Apollo X4 Gen 2", status: "active" as const, funded: 120, goal: 2499 },
    { id: "3", title: "Bose Solo Soundbar Series II", status: "gifted" as const, giftedBy: "Anonymous", funded: 199, goal: 199 },
    { id: "4", title: "Audio-Technica AT2020 Mic", status: "active" as const, funded: 0, goal: 99 },
    { id: "5", title: "Elgato Stream Deck MK.2", status: "active" as const, funded: 75, goal: 149 },
    { id: "6", title: "Sony MDR-7506 Headphones", status: "gifted" as const, giftedBy: "boogerbill01", funded: 89, goal: 89 },
  ],
  onBack,
  onViewCreator,
  onViewProject,
}: PublicWishlistProps) {
  const [showQuickTip, setShowQuickTip] = useState(false);
  const [selectedTipAmount, setSelectedTipAmount] = useState<number>(10);
  const [customTipAmount, setCustomTipAmount] = useState("");
  const [selectedTipItem, setSelectedTipItem] = useState<string | null>(null);
  const [tipConfirmed, setTipConfirmed] = useState(false);

  const activeItems = items.filter(i => i.status === "active");
  const giftedCount = items.filter(i => i.status === "gifted").length;
  const totalFunded = items.reduce((sum, i) => sum + (i.funded ?? 0), 0);
  const totalGoal = items.reduce((sum, i) => sum + (i.goal ?? 0), 0);

  const handleConfirmTip = () => {
    const amount = selectedTipAmount ?? (customTipAmount ? parseFloat(customTipAmount) : 0);
    if (!selectedTipItem || amount <= 0) return;
    setTipConfirmed(true);
    setTimeout(() => {
      setTipConfirmed(false);
      setShowQuickTip(false);
      setSelectedTipItem(null);
      setSelectedTipAmount(10);
      setCustomTipAmount("");
    }, 2000);
  };

  const handleTipItem = (itemId: string) => {
    setSelectedTipItem(itemId);
    setShowQuickTip(true);
  };

  return (
    <div className="min-h-screen bg-background text-foreground pt-[57px]">
      {/* Header */}
      <div className="relative">
        {/* Cover area */}
        <div className="w-full h-48 bg-gradient-to-br from-[#4a3060] via-[#5a3a6a] to-[#3a2848] overflow-hidden">
          {coverImage && (
            <img src={coverImage} alt={wishlistName} className="w-full h-full object-cover" />
          )}
          <div className="absolute inset-0 bg-gradient-to-t from-background via-background/40 to-transparent" />
        </div>

        {/* Wishlist info */}
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
                {creatorName}
              </button>
              <span className="text-subtle">/</span>
              <span className="text-foreground font-bold">{wishlistName}</span>
            </div>

            <h1 className="text-3xl font-black text-foreground mb-2">{wishlistName}</h1>
            {wishlistDescription && (
              <p className="text-muted-foreground text-sm max-w-2xl mb-4">{wishlistDescription}</p>
            )}

            {/* Stats bar */}
            <div className="flex items-center gap-6 mb-6">
              <div className="flex items-center gap-4 text-sm">
                <span className="text-foreground font-bold">{items.length} items</span>
                <span className="text-subtle">{activeItems.length} active</span>
                {giftedCount > 0 && (
                  <span className="text-[#22c55e] font-medium">{giftedCount} gifted</span>
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
            </div>
          </motion.div>
        </div>
      </div>

      {/* Items Grid */}
      <div className="max-w-5xl mx-auto px-6 pb-16">
        <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-4">
          {items.map((item, index) => {
            const progress = item.goal ? Math.min(100, ((item.funded ?? 0) / item.goal) * 100) : 0;
            return (
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
                        ? "bg-[#f0faf5] border-[#22c55e] text-[#16a34a]"
                        : "bg-[#fff0f4] border-accent text-accent"
                    }`}
                  >
                    {item.status === "gifted" ? (
                      <><Check className="w-2.5 h-2.5" />Gifted</>
                    ) : (
                      <><ArrowUp className="w-2.5 h-2.5" />Active</>
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

                  {/* Funding progress */}
                  {item.goal && (
                    <div className="mb-3">
                      <div className="flex justify-between text-[11px] mb-1">
                        <span className="text-subtle">
                          ${(item.funded ?? 0).toLocaleString()} raised
                        </span>
                        <span className="text-foreground font-bold">
                          ${item.goal.toLocaleString()}
                        </span>
                      </div>
                      <div className="h-1.5 bg-muted overflow-hidden">
                        <div
                          className={`h-full transition-all ${item.status === "gifted" ? "bg-[#22c55e]" : "bg-accent"}`}
                          style={{ width: `${progress}%` }}
                        />
                      </div>
                    </div>
                  )}

                  {/* Actions */}
                  {item.status === "active" ? (
                    <button
                      onClick={() => handleTipItem(item.id)}
                      className="w-full py-2 bg-[#22c55e] hover:bg-[#16a34a] text-white text-[11px] font-black uppercase tracking-widest transition-colors flex items-center justify-center gap-1.5"
                    >
                      <Zap className="w-3.5 h-3.5" />
                      Contribute
                    </button>
                  ) : (
                    <p className="text-subtle text-xs text-center py-2">
                      Gifted by {item.giftedBy}
                    </p>
                  )}
                </div>
              </motion.div>
            );
          })}
        </div>
      </div>

      {/* Quick Tip Modal */}
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
                  className="w-16 h-16 bg-[#22c55e] mx-auto mb-4 flex items-center justify-center"
                >
                  <Check className="w-8 h-8 text-white" />
                </motion.div>
                <h3 className="text-lg font-black text-foreground mb-1">Tip Sent!</h3>
                <p className="text-subtle text-sm">
                  Your contribution to {items.find(i => i.id === selectedTipItem)?.title ?? "this item"} has been recorded.
                </p>
              </div>
            ) : (
              <>
                {/* Header */}
                <div className="flex items-center justify-between p-5 border-b border-border">
                  <div className="flex items-center gap-3">
                    <div className="w-8 h-8 bg-[#22c55e] flex items-center justify-center">
                      <Zap className="w-4 h-4 text-white" />
                    </div>
                    <div>
                      <h3 className="text-sm font-black text-foreground">
                        {items.find(i => i.id === selectedTipItem)?.title ?? "Quick Tip"}
                      </h3>
                      <p className="text-xs text-subtle">Support {creatorName}</p>
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
                  <div className="text-[10px] font-black uppercase tracking-widest text-subtle mb-3">Tip amount</div>
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
                  <button
                    onClick={handleConfirmTip}
                    disabled={!selectedTipAmount && !customTipAmount}
                    className="w-full py-3 bg-[#22c55e] hover:bg-[#16a34a] disabled:opacity-40 disabled:cursor-not-allowed text-white text-xs font-black uppercase tracking-widest transition-colors flex items-center justify-center gap-2"
                  >
                    <Zap className="w-4 h-4" />
                    {selectedTipAmount
                      ? `Send $${selectedTipAmount} Tip`
                      : customTipAmount
                        ? `Send $${parseFloat(customTipAmount).toFixed(2)} Tip`
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