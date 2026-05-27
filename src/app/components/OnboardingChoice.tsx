import { motion } from "motion/react";
import { useState, useEffect } from "react";
import { Plus, Search, TrendingUp, Heart, ArrowLeft, Loader2, AlertCircle, Check, Twitter, Instagram, Youtube, Twitch, Link2 } from "lucide-react";
import { useAuth } from "../../contexts/AuthContext";
import { leaderboardApi, userApi } from "../../lib/api";
import type { PlatformType } from "../../lib/api";
import type { UserRole } from "../../lib/types";

export interface Community {
  id: string;
  name: string;
  emoji: string;
  description: string;
  memberCount: string;
}

export const COMMUNITIES: Community[] = [
  { id: "gaming", name: "Gaming", emoji: "\uD83C\uDFAE", description: "Streamers, esports, and game dev", memberCount: "12.4k" },
  { id: "art", name: "Art & Design", emoji: "\uD83C\uDFA8", description: "Digital art, illustration, and graphic design", memberCount: "8.7k" },
  { id: "music", name: "Music", emoji: "\uD83C\uDFB5", description: "Producers, musicians, and DJs", memberCount: "6.2k" },
  { id: "tech", name: "Tech & Dev", emoji: "\uD83D\uDCBB", description: "Coding, open source, and tech content", memberCount: "9.1k" },
  { id: "video", name: "Video & Film", emoji: "\uD83C\uDFAC", description: "YouTubers, filmmakers, and editors", memberCount: "7.3k" },
  { id: "lifestyle", name: "Lifestyle", emoji: "\u2728", description: "Fitness, food, travel, and wellness", memberCount: "5.8k" },
  { id: "education", name: "Education", emoji: "\uD83D\uDCDA", description: "Tutors, courses, and learning content", memberCount: "4.1k" },
  { id: "podcasts", name: "Podcasts", emoji: "\uD83C\uDF99\uFE0F", description: "Podcasters and audio creators", memberCount: "3.5k" },
];

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
  const [step, setStep] = useState<"choose-role" | "set-username" | "select-community" | "link-socials" | "explore">(
    needsProfileCompletion ? "choose-role" : "explore"
  );
  const [selectedRole, setSelectedRole] = useState<UserRole>(initialUserType);
  const [username, setUsername] = useState("");
  const [displayName, setDisplayName] = useState("");
  const [referralCode, setReferralCode] = useState("");
  const [selectedCommunities, setSelectedCommunities] = useState<string[]>([]);
  const [submitting, setSubmitting] = useState(false);
  const [error, setError] = useState<string | null>(null);

  // Social link state
  const [socials, setSocials] = useState<Record<string, string>>({
    TWITTER: "",
    INSTAGRAM: "",
    YOUTUBE: "",
    TWITCH: "",
    TIKTOK: "",
  });

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
    // Profile complete — move to community selection step
    setStep("select-community");
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
            <div className="text-xs font-bold uppercase tracking-widest text-subtle mb-2">Step 1 of 4</div>
            <h1 className="text-4xl font-black text-foreground tracking-tight mb-2">
              How will you use Rory?
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
              <p className="text-sm text-muted-foreground">Share your project and receive donations from supporters.</p>
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
              <p className="text-sm text-muted-foreground">Discover creators and donate to their projects.</p>
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
            <div className="text-xs font-bold uppercase tracking-widest text-subtle mb-2">Step 2 of 4</div>
            <h1 className="text-4xl font-black text-foreground tracking-tight mb-2">
              Choose your username.
            </h1>
            <p className="text-muted-foreground text-sm">This is how others will find you on Rory.</p>
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

  // ─── Step: Select Community ──────────────────────────────────────────────────
  if (step === "select-community") {
    function toggleCommunity(id: string) {
      setSelectedCommunities((prev) =>
        prev.includes(id) ? prev.filter((c) => c !== id) : [...prev, id]
      );
    }

    async function handleSaveCommunities() {
      if (selectedCommunities.length > 0 && user?.username) {
        setSubmitting(true);
        await userApi.updateCommunities(user.username, selectedCommunities);
        setSubmitting(false);
      }
      setStep("link-socials");
    }

    return (
      <div className="min-h-screen bg-muted flex items-center justify-center p-4">
        <motion.button
          initial={{ opacity: 0, x: -20 }}
          animate={{ opacity: 1, x: 0 }}
          onClick={() => setStep("set-username")}
          className="fixed top-6 left-6 z-50 flex items-center gap-2 px-4 py-2 border border-border bg-background text-foreground hover:bg-muted transition-colors"
        >
          <ArrowLeft className="w-4 h-4" />
          <span className="text-sm font-medium">Back</span>
        </motion.button>

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
            <div className="text-xs font-bold uppercase tracking-widest text-subtle mb-2">Step 3 of 4</div>
            <h1 className="text-4xl font-black text-foreground tracking-tight mb-2">
              Join your communities.
            </h1>
            <p className="text-muted-foreground text-sm">Select the communities that match your interests. You can change these anytime.</p>
          </motion.div>

          <div className="grid grid-cols-2 gap-3 mb-6">
            {COMMUNITIES.map((community, index) => {
              const isSelected = selectedCommunities.includes(community.id);
              return (
                <motion.button
                  key={community.id}
                  initial={{ opacity: 0, y: 10 }}
                  animate={{ opacity: 1, y: 0 }}
                  transition={{ duration: 0.3, delay: 0.05 * index }}
                  whileHover={{ scale: 1.02 }}
                  whileTap={{ scale: 0.98 }}
                  onClick={() => toggleCommunity(community.id)}
                  className={`relative p-4 border text-left transition-all ${
                    isSelected
                      ? "border-accent bg-accent/5"
                      : "border-border hover:border-accent/30"
                  }`}
                >
                  {isSelected && (
                    <div className="absolute top-2 right-2 w-5 h-5 bg-accent flex items-center justify-center">
                      <Check className="w-3 h-3 text-white" />
                    </div>
                  )}
                  <div className="text-2xl mb-2">{community.emoji}</div>
                  <p className="text-sm font-black text-foreground mb-0.5">{community.name}</p>
                  <p className="text-[11px] text-muted-foreground leading-snug mb-2">{community.description}</p>
                  <p className="text-[10px] font-bold uppercase tracking-widest text-subtle">{community.memberCount} members</p>
                </motion.button>
              );
            })}
          </div>

          <div className="space-y-3">
            <motion.button
              whileHover={{ scale: 1.01 }}
              whileTap={{ scale: 0.99 }}
              onClick={handleSaveCommunities}
              disabled={submitting}
              className="w-full flex items-center justify-center gap-2 px-6 py-4 bg-accent hover:bg-[#c9164f] text-white font-black text-sm uppercase tracking-widest transition-colors disabled:opacity-50"
            >
              {submitting ? <Loader2 className="w-4 h-4 animate-spin" /> : selectedCommunities.length > 0
                ? `Continue with ${selectedCommunities.length} ${selectedCommunities.length === 1 ? "community" : "communities"}`
                : "Continue"}
            </motion.button>
            <button
              onClick={() => setStep("link-socials")}
              disabled={submitting}
              className="w-full text-center text-xs text-subtle hover:text-foreground transition-colors py-2 font-medium disabled:opacity-50"
            >
              Skip for now
            </button>
          </div>
        </motion.div>
      </div>
    );
  }

  // ─── Step: Link Socials ────────────────────────────────────────────────────────
  if (step === "link-socials") {
    const SOCIAL_PLATFORMS: { key: PlatformType; label: string; icon: React.ReactNode; placeholder: string; urlPrefix: string }[] = [
      { key: "TWITTER", label: "Twitter / X", icon: <Twitter className="w-4 h-4" />, placeholder: "@yourhandle", urlPrefix: "https://x.com/" },
      { key: "INSTAGRAM", label: "Instagram", icon: <Instagram className="w-4 h-4" />, placeholder: "@yourhandle", urlPrefix: "https://instagram.com/" },
      { key: "YOUTUBE", label: "YouTube", icon: <Youtube className="w-4 h-4" />, placeholder: "@yourchannel", urlPrefix: "https://youtube.com/@" },
      { key: "TWITCH", label: "Twitch", icon: <Twitch className="w-4 h-4" />, placeholder: "yourhandle", urlPrefix: "https://twitch.tv/" },
      { key: "TIKTOK", label: "TikTok", icon: <Link2 className="w-4 h-4" />, placeholder: "@yourhandle", urlPrefix: "https://tiktok.com/@" },
    ];

    async function handleSaveSocials() {
      const entries = Object.entries(socials).filter(([, handle]) => handle.trim() !== "");
      if (entries.length > 0 && user?.username) {
        setSubmitting(true);
        setError(null);
        try {
          await Promise.all(
            entries.map(([platform, handle]) => {
              const cleanHandle = handle.trim().replace(/^@/, "");
              const config = SOCIAL_PLATFORMS.find((p) => p.key === platform)!;
              return userApi.connectPlatform(user!.username, {
                platform: platform as PlatformType,
                handle: cleanHandle,
                url: `${config.urlPrefix}${cleanHandle}`,
              });
            })
          );
        } catch {
          setError("Failed to save some social links. You can add them later in settings.");
        }
        setSubmitting(false);
      }
      setStep("explore");
    }

    const filledCount = Object.values(socials).filter((v) => v.trim() !== "").length;

    return (
      <div className="min-h-screen bg-muted flex items-center justify-center p-4">
        <motion.button
          initial={{ opacity: 0, x: -20 }}
          animate={{ opacity: 1, x: 0 }}
          onClick={() => setStep("select-community")}
          className="fixed top-6 left-6 z-50 flex items-center gap-2 px-4 py-2 border border-border bg-background text-foreground hover:bg-muted transition-colors"
        >
          <ArrowLeft className="w-4 h-4" />
          <span className="text-sm font-medium">Back</span>
        </motion.button>

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
            <div className="text-xs font-bold uppercase tracking-widest text-subtle mb-2">Step 4 of 4</div>
            <h1 className="text-4xl font-black text-foreground tracking-tight mb-2">
              Link your socials.
            </h1>
            <p className="text-muted-foreground text-sm">Connect your social accounts so supporters can find you everywhere. This is optional.</p>
          </motion.div>

          <div className="space-y-3 mb-6">
            {SOCIAL_PLATFORMS.map((platform, index) => (
              <motion.div
                key={platform.key}
                initial={{ opacity: 0, y: 10 }}
                animate={{ opacity: 1, y: 0 }}
                transition={{ duration: 0.3, delay: 0.05 * index }}
                className="flex items-center gap-3"
              >
                <div className="w-10 h-10 border border-border bg-muted flex items-center justify-center flex-shrink-0 text-subtle">
                  {platform.icon}
                </div>
                <div className="flex-1">
                  <label className="text-[10px] font-black uppercase tracking-widest text-subtle mb-1 block">{platform.label}</label>
                  <input
                    type="text"
                    value={socials[platform.key]}
                    onChange={(e) => setSocials((prev) => ({ ...prev, [platform.key]: e.target.value }))}
                    placeholder={platform.placeholder}
                    className={inputBase}
                  />
                </div>
              </motion.div>
            ))}
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

          <div className="space-y-3">
            <motion.button
              whileHover={{ scale: 1.01 }}
              whileTap={{ scale: 0.99 }}
              onClick={handleSaveSocials}
              disabled={submitting}
              className="w-full flex items-center justify-center gap-2 px-6 py-4 bg-accent hover:bg-[#c9164f] text-white font-black text-sm uppercase tracking-widest transition-colors disabled:opacity-50"
            >
              {submitting ? <Loader2 className="w-4 h-4 animate-spin" /> : filledCount > 0
                ? `Save ${filledCount} ${filledCount === 1 ? "link" : "links"} & Continue`
                : "Continue"}
            </motion.button>
            <button
              onClick={() => setStep("explore")}
              disabled={submitting}
              className="w-full text-center text-xs text-subtle hover:text-foreground transition-colors py-2 font-medium disabled:opacity-50"
            >
              Skip for now
            </button>
          </div>
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
            {userType === "creator" ? "Create your first project to get started." : "Discover creators and start gifting."}
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
              Create a Project
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
