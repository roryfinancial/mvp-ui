import { motion } from "motion/react";
import { useState, useEffect } from "react";
import { Plus, Search, TrendingUp, Heart, ArrowLeft, Loader2, AlertCircle } from "lucide-react";
import { useAuth } from "../../contexts/AuthContext";
import { leaderboardApi } from "../../lib/api";
import type { UserRole } from "../../lib/types";

interface OnboardingChoiceProps {
  userType: "creator" | "supporter";
  onBack?: () => void;
  onComplete?: () => void;
  onViewCreator?: () => void;
  onMakeProject?: () => void;
}

export default function OnboardingChoice({ userType: initialUserType, onBack, onComplete, onViewCreator, onMakeProject }: OnboardingChoiceProps) {
  const { user, completeProfile } = useAuth();
  const needsProfileCompletion = user && !user.isProfileComplete;

  // Profile completion form state
  const [step, setStep] = useState<"choose-role" | "set-username" | "explore">(
    needsProfileCompletion ? "choose-role" : "explore"
  );
  const [selectedRole, setSelectedRole] = useState<UserRole>(initialUserType);
  const [username, setUsername] = useState("");
  const [displayName, setDisplayName] = useState("");
  const [referralCode, setReferralCode] = useState("");
  const [submitting, setSubmitting] = useState(false);
  const [error, setError] = useState<string | null>(null);

  // Dynamic data from API
  const [topCreators, setTopCreators] = useState<{ name: string; amount: string }[]>([]);

  useEffect(() => {
    leaderboardApi.getTopCreators(3).then((res) => {
      if (res.success && res.data) {
        setTopCreators(
          res.data.map((c) => ({
            name: c.displayName,
            amount: `$${c.totalAmount.toLocaleString()}`,
          }))
        );
      }
    });
  }, []);

  // Fallback data if API hasn't loaded yet
  const displayCreators = topCreators.length > 0
    ? topCreators
    : [
        { name: "Loading...", amount: "" },
      ];

  async function handleCompleteProfile() {
    setError(null);
    if (!username.trim() || username.trim().length < 3) {
      setError("Username must be at least 3 characters");
      return;
    }
    if (!/^[a-zA-Z0-9_]+$/.test(username.trim())) {
      setError("Username can only contain letters, numbers, and underscores");
      return;
    }

    setSubmitting(true);
    const res = await completeProfile(username.trim(), displayName.trim(), selectedRole, referralCode.trim() || undefined);
    setSubmitting(false);

    if (!res.ok) {
      setError(res.error ?? "Something went wrong");
      return;
    }
    // Profile complete — move to explore step
    setStep("explore");
  }

  const inputBase =
    "w-full py-4 px-4 border border-border bg-background focus:outline-none focus:ring-2 focus:ring-accent text-foreground placeholder-subtle transition-all text-sm";

  // ─── Step: Choose Role (new users) ────────────────────────────────────────────
  if (step === "choose-role" && needsProfileCompletion) {
    return (
      <div className="min-h-screen bg-muted flex items-center justify-center p-4">
        <motion.div
          initial={{ opacity: 0, scale: 0.98 }}
          animate={{ opacity: 1, scale: 1 }}
          transition={{ duration: 0.4 }}
          className="w-full max-w-xl mx-auto bg-background border border-border shadow-sm p-8"
        >
          <motion.div
            initial={{ opacity: 0, y: -20 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ duration: 0.5, delay: 0.2 }}
            className="mb-8"
          >
            <div className="text-xs font-bold uppercase tracking-widest text-subtle mb-2">Step 1 of 2</div>
            <h1 className="text-4xl font-black text-foreground tracking-tight mb-2">
              How will you use TipFlow?
            </h1>
            <p className="text-muted-foreground text-sm">Choose your primary role. You can always change this later.</p>
          </motion.div>

          <div className="space-y-3 mb-8">
            <motion.button
              whileHover={{ scale: 1.01 }}
              whileTap={{ scale: 0.99 }}
              onClick={() => setSelectedRole("creator")}
              className={`w-full p-6 border text-left transition-all ${
                selectedRole === "creator"
                  ? "border-accent bg-accent/5"
                  : "border-border hover:border-accent/30"
              }`}
            >
              <p className="text-lg font-black text-foreground mb-1">Creator</p>
              <p className="text-sm text-muted-foreground">Share your wishlist and receive gifts from supporters.</p>
            </motion.button>
            <motion.button
              whileHover={{ scale: 1.01 }}
              whileTap={{ scale: 0.99 }}
              onClick={() => setSelectedRole("supporter")}
              className={`w-full p-6 border text-left transition-all ${
                selectedRole === "supporter"
                  ? "border-accent bg-accent/5"
                  : "border-border hover:border-accent/30"
              }`}
            >
              <p className="text-lg font-black text-foreground mb-1">Supporter</p>
              <p className="text-sm text-muted-foreground">Discover creators and fund items from their wishlists.</p>
            </motion.button>
          </div>

          <motion.button
            whileHover={{ scale: 1.01 }}
            whileTap={{ scale: 0.99 }}
            onClick={() => setStep("set-username")}
            className="w-full px-6 py-4 bg-accent hover:bg-[#c9164f] text-white font-black text-sm uppercase tracking-widest transition-colors"
          >
            Continue
          </motion.button>
        </motion.div>
      </div>
    );
  }

  // ─── Step: Set Username (new users) ───────────────────────────────────────────
  if (step === "set-username" && needsProfileCompletion) {
    return (
      <div className="min-h-screen bg-muted flex items-center justify-center p-4">
        {onBack && (
          <motion.button
            initial={{ opacity: 0, x: -20 }}
            animate={{ opacity: 1, x: 0 }}
            onClick={() => setStep("choose-role")}
            className="fixed top-6 left-6 z-50 flex items-center gap-2 px-4 py-2 border border-border bg-background text-foreground hover:bg-muted transition-colors"
          >
            <ArrowLeft className="w-4 h-4" />
            <span className="text-sm font-medium">Back</span>
          </motion.button>
        )}

        <motion.div
          initial={{ opacity: 0, scale: 0.98 }}
          animate={{ opacity: 1, scale: 1 }}
          transition={{ duration: 0.4 }}
          className="w-full max-w-xl mx-auto bg-background border border-border shadow-sm p-8"
        >
          <motion.div
            initial={{ opacity: 0, y: -20 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ duration: 0.5, delay: 0.2 }}
            className="mb-8"
          >
            <div className="text-xs font-bold uppercase tracking-widest text-subtle mb-2">Step 2 of 2</div>
            <h1 className="text-4xl font-black text-foreground tracking-tight mb-2">
              Choose your username.
            </h1>
            <p className="text-muted-foreground text-sm">This is how others will find you on TipFlow.</p>
          </motion.div>

          <div className="space-y-4 mb-6">
            <div>
              <label className="text-[10px] font-black uppercase tracking-widest text-subtle mb-2 block">Username *</label>
              <input
                type="text"
                value={username}
                onChange={(e) => setUsername(e.target.value)}
                placeholder="your_username"
                className={inputBase}
                autoFocus
              />
            </div>
            <div>
              <label className="text-[10px] font-black uppercase tracking-widest text-subtle mb-2 block">Display Name</label>
              <input
                type="text"
                value={displayName}
                onChange={(e) => setDisplayName(e.target.value)}
                placeholder="Your Display Name (optional)"
                className={inputBase}
              />
            </div>
            <div>
              <label className="text-[10px] font-black uppercase tracking-widest text-subtle mb-2 block">Referral Code</label>
              <input
                type="text"
                value={referralCode}
                onChange={(e) => setReferralCode(e.target.value)}
                placeholder="Friend's referral code (optional)"
                className={inputBase}
              />
            </div>
          </div>

          {error && (
            <motion.div
              initial={{ opacity: 0, y: -10 }}
              animate={{ opacity: 1, y: 0 }}
              className="flex items-center gap-2 p-3 mb-4 border border-red-300 bg-red-50 text-red-700 text-sm"
            >
              <AlertCircle className="w-4 h-4 flex-shrink-0" />
              {error}
            </motion.div>
          )}

          <motion.button
            whileHover={{ scale: 1.01 }}
            whileTap={{ scale: 0.99 }}
            onClick={handleCompleteProfile}
            disabled={submitting}
            className="w-full flex items-center justify-center gap-2 px-6 py-4 bg-accent hover:bg-[#c9164f] text-white font-black text-sm uppercase tracking-widest transition-colors disabled:opacity-50"
          >
            {submitting ? <Loader2 className="w-4 h-4 animate-spin" /> : "Complete Setup"}
          </motion.button>
        </motion.div>
      </div>
    );
  }

  // ─── Step: Explore (existing users / after profile completion) ─────────────────
  const userType = user?.role ?? selectedRole;

  return (
    <div className="min-h-screen bg-muted flex items-center justify-center p-4">
      {onBack && (
        <motion.button
          initial={{ opacity: 0, x: -20 }}
          animate={{ opacity: 1, x: 0 }}
          transition={{ duration: 0.5 }}
          onClick={onBack}
          className="fixed top-6 left-6 z-50 flex items-center gap-2 px-4 py-2 border border-border bg-background text-foreground hover:bg-muted transition-colors"
        >
          <ArrowLeft className="w-4 h-4" />
          <span className="text-sm font-medium">Back</span>
        </motion.button>
      )}

      <motion.div
        initial={{ opacity: 0, scale: 0.98 }}
        animate={{ opacity: 1, scale: 1 }}
        transition={{ duration: 0.4 }}
        className="w-full max-w-xl mx-auto bg-background border border-border shadow-sm p-8"
      >
        <motion.div
          initial={{ opacity: 0, y: -20 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ duration: 0.5, delay: 0.2 }}
          className="mb-8"
        >
          <div className="text-xs font-bold uppercase tracking-widest text-subtle mb-2">You're all set!</div>
          <h1 className="text-5xl font-black text-foreground tracking-tight mb-2">
            {userType === "creator" ? "Set up your profile." : "Find creators to support."}
          </h1>
          <p className="text-muted-foreground text-sm">
            {userType === "creator" ? "Add your first wishlist item to get started." : "Discover creators and start gifting."}
          </p>
        </motion.div>

        {/* Creator Content */}
        {userType === "creator" && (
          <motion.div
            initial={{ opacity: 0, y: 20 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ duration: 0.4 }}
            className="space-y-6"
          >
            <motion.button
              whileHover={{ scale: 1.01 }}
              whileTap={{ scale: 0.99 }}
              onClick={onMakeProject}
              className="w-full flex items-center justify-center gap-2 px-6 py-4 bg-accent hover:bg-[#c9164f] text-white font-black text-sm uppercase tracking-widest transition-colors"
            >
              <Plus className="w-4 h-4" />
              Add a Wishlist Item
            </motion.button>

            {displayCreators.length > 0 && displayCreators[0].name !== "Loading..." && (
              <div>
                <div className="text-[10px] font-black uppercase tracking-widest text-subtle mb-3 flex items-center gap-2">
                  <TrendingUp className="w-3 h-3" />
                  Top Creators
                </div>
                <div className="space-y-2">
                  {displayCreators.map((creator, index) => (
                    <motion.div
                      key={index}
                      initial={{ opacity: 0, x: -20 }}
                      animate={{ opacity: 1, x: 0 }}
                      transition={{ duration: 0.3, delay: 0.1 * index }}
                      onClick={onViewCreator}
                      className="flex items-center justify-between px-4 py-3 border border-border bg-muted hover:bg-background cursor-pointer transition-colors"
                    >
                      <span className="text-foreground font-medium text-sm">{creator.name}</span>
                      <span className="text-accent font-black text-sm">{creator.amount}</span>
                    </motion.div>
                  ))}
                </div>
              </div>
            )}

            <motion.button
              whileHover={{ scale: 1.01 }}
              whileTap={{ scale: 0.99 }}
              onClick={() => onComplete?.()}
              className="w-full px-6 py-4 border border-border text-foreground font-bold text-sm uppercase tracking-wide hover:bg-muted transition-colors"
            >
              Go to Dashboard
            </motion.button>
          </motion.div>
        )}

        {/* Supporter Content */}
        {userType === "supporter" && (
          <motion.div
            initial={{ opacity: 0, y: 20 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ duration: 0.4 }}
            className="space-y-6"
          >
            <div className="relative">
              <Search className="absolute left-4 top-1/2 -translate-y-1/2 w-4 h-4 text-subtle" />
              <input
                type="text"
                placeholder="Search creators or projects..."
                className="w-full pl-11 pr-4 py-4 border border-border bg-background focus:outline-none focus:ring-2 focus:ring-accent text-foreground placeholder-[#999999] text-sm transition-all"
              />
            </div>

            {displayCreators.length > 0 && displayCreators[0].name !== "Loading..." && (
              <div>
                <div className="text-[10px] font-black uppercase tracking-widest text-subtle mb-3 flex items-center gap-2">
                  <Heart className="w-3 h-3" />
                  Top Creators to Support
                </div>
                <div className="space-y-2">
                  {displayCreators.map((creator, index) => (
                    <motion.div
                      key={index}
                      initial={{ opacity: 0, x: -20 }}
                      animate={{ opacity: 1, x: 0 }}
                      transition={{ duration: 0.3, delay: 0.1 * index }}
                      onClick={onViewCreator}
                      className="flex items-center justify-between px-4 py-3 border border-border bg-muted hover:bg-background cursor-pointer transition-colors"
                    >
                      <span className="text-foreground font-medium text-sm">{creator.name}</span>
                      <span className="text-accent font-black text-sm">{creator.amount}</span>
                    </motion.div>
                  ))}
                </div>
              </div>
            )}

            <motion.button
              whileHover={{ scale: 1.01 }}
              whileTap={{ scale: 0.99 }}
              onClick={() => onComplete?.()}
              className="w-full px-6 py-4 bg-accent hover:bg-[#c9164f] text-white font-black text-sm uppercase tracking-widest transition-colors"
            >
              Explore Creators
            </motion.button>
          </motion.div>
        )}
      </motion.div>
    </div>
  );
}
