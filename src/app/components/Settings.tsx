import { motion } from "motion/react";
import { useState, useEffect, useRef } from "react";
import { useSearchParams } from "react-router-dom";
import { User, Bell, Lock, Mail, Key, Shield, DollarSign, Palette, Sun, Moon, Monitor, Users, Check, Loader2, ArrowUpRight, ArrowDownLeft, Plus, ExternalLink, CheckCircle2, AlertCircle, Link2, Trash2 } from "lucide-react";
import { useTheme } from "next-themes";
import { useAuth } from "../../contexts/AuthContext";
import { userApi, walletApi, stripeApi, platformApi } from "../../lib/api";
import type { WalletSummaryResponse, TransactionResponse, PagedResponse, ConnectedPlatform, PlatformType } from "../../lib/api";
import { COMMUNITIES } from "./OnboardingChoice";

interface SettingsProps {
  username?: string;
  email?: string;
  creditBalance?: number;
  onUpdateBalance?: (newBalance: number) => void;
  initialSection?: "profile" | "account" | "notifications" | "privacy" | "balance" | "customization" | "communities" | "platforms";
}

export default function Settings({
  creditBalance,
  initialSection = "profile",
}: SettingsProps) {
  const { user, refreshUser } = useAuth();
  const [activeSection, setActiveSection] = useState<"profile" | "account" | "notifications" | "privacy" | "balance" | "customization" | "communities" | "platforms">(initialSection);
  const { theme, setTheme, resolvedTheme } = useTheme();

  const [displayName, setDisplayName] = useState(user?.displayName ?? "");
  const [userEmail, setUserEmail] = useState(user?.email ?? "");
  const [bio, setBio] = useState(user?.bio ?? "");
  const [saving, setSaving] = useState(false);

  const [emailNotifications, setEmailNotifications] = useState(true);
  const [pushNotifications, setPushNotifications] = useState(true);
  const [newSupporter, setNewSupporter] = useState(true);
  const [goalReached, setGoalReached] = useState(true);

  const [profileVisibility, setProfileVisibility] = useState(true);
  const [showLeaderboard, setShowLeaderboard] = useState(true);

  const [selectedCommunities, setSelectedCommunities] = useState<string[]>(user?.communities ?? []);
  const [savingCommunities, setSavingCommunities] = useState(false);

  // Wallet state
  const [walletSummary, setWalletSummary] = useState<WalletSummaryResponse | null>(null);
  const [transactions, setTransactions] = useState<TransactionResponse[]>([]);
  const [loadingWallet, setLoadingWallet] = useState(false);
  const [depositAmount, setDepositAmount] = useState("");
  const [showDepositInput, setShowDepositInput] = useState(false);
  const [depositLoading, setDepositLoading] = useState(false);
  const [depositError, setDepositError] = useState("");

  // Deposit success banner
  const [searchParams, setSearchParams] = useSearchParams();
  const [depositSuccess, setDepositSuccess] = useState(false);
  const depositPolled = useRef(false);

  // Stripe Connect state
  const [connectStatus, setConnectStatus] = useState<{ connected: boolean; chargesEnabled: boolean; payoutsEnabled: boolean; stripeAccountId: string | null } | null>(null);
  const [connectLoading, setConnectLoading] = useState(false);
  const [connectError, setConnectError] = useState("");

  // Connected Platforms state
  const [connectedPlatforms, setConnectedPlatforms] = useState<ConnectedPlatform[]>([]);
  const [platformsLoading, setPlatformsLoading] = useState(false);
  const [addingPlatform, setAddingPlatform] = useState<PlatformType | null>(null);
  const [platformHandle, setPlatformHandle] = useState("");
  const [platformUrl, setPlatformUrl] = useState("");
  const [platformSaving, setPlatformSaving] = useState(false);

  // Helper to fetch wallet data
  async function fetchWalletData() {
    const fetches: Promise<unknown>[] = [walletApi.getSummary(), walletApi.getTransactions()];
    if (user?.role === "creator") {
      fetches.push(stripeApi.getConnectStatus());
    }
    const [summaryRes, txRes, connectRes] = await Promise.all(fetches);
    const s = summaryRes as { success: boolean; data?: WalletSummaryResponse };
    const t = txRes as { success: boolean; data?: PagedResponse<TransactionResponse> };
    if (s.success && s.data) setWalletSummary(s.data);
    if (t.success && t.data) setTransactions(t.data.content ?? []);
    if (connectRes) {
      const c = connectRes as { success: boolean; data?: typeof connectStatus };
      if (c.success && c.data) setConnectStatus(c.data);
    }
  }

  // Fetch wallet data when balance section is active
  useEffect(() => {
    if (activeSection !== "balance") return;
    setLoadingWallet(true);
    fetchWalletData()
      .catch(() => {})
      .finally(() => setLoadingWallet(false));
  }, [activeSection]);

  // Fetch connected platforms when platforms section is active
  useEffect(() => {
    if (activeSection !== "platforms" || !user) return;
    setPlatformsLoading(true);
    userApi.getPlatforms(user.username)
      .then((res) => { if (res.success && res.data) setConnectedPlatforms(res.data); })
      .catch(() => {})
      .finally(() => setPlatformsLoading(false));
  }, [activeSection, user]);

  async function handleConnectPlatform() {
    if (!user || !addingPlatform || !platformHandle.trim()) return;
    setPlatformSaving(true);
    const res = await userApi.connectPlatform(user.username, {
      platform: addingPlatform,
      handle: platformHandle.trim(),
      url: platformUrl.trim(),
    });
    if (res.success && res.data) {
      setConnectedPlatforms((prev) => [...prev.filter(p => p.platform !== addingPlatform), res.data!]);
    }
    setPlatformSaving(false);
    setAddingPlatform(null);
    setPlatformHandle("");
    setPlatformUrl("");
  }

  async function handleDisconnectPlatform(platform: PlatformType) {
    if (!user) return;
    const res = await userApi.disconnectPlatform(user.username, platform);
    if (res.success) {
      setConnectedPlatforms((prev) => prev.filter(p => p.platform !== platform));
    }
  }

  const OAUTH_PLATFORMS: Set<PlatformType> = new Set(["YOUTUBE", "TWITCH"]);

  async function handleOAuthConnect(platformId: PlatformType) {
    setPlatformSaving(true);
    setAddingPlatform(platformId);
    try {
      const getAuthUrl = platformId === "YOUTUBE"
        ? platformApi.getYouTubeAuthUrl
        : platformApi.getTwitchAuthUrl;
      const res = await getAuthUrl();
      if (res.success && res.data?.url) {
        window.location.href = res.data.url;
      } else {
        setPlatformSaving(false);
      }
    } catch {
      setPlatformSaving(false);
    }
  }

  // After returning from Stripe checkout, poll until balance updates
  useEffect(() => {
    if (searchParams.get("deposit") !== "success" || depositPolled.current) return;
    depositPolled.current = true;
    setDepositSuccess(true);

    // Remove the query param so refreshes don't re-trigger
    const next = new URLSearchParams(searchParams);
    next.delete("deposit");
    setSearchParams(next, { replace: true });

    // Poll wallet summary a few times to catch webhook completion
    let attempts = 0;
    const maxAttempts = 6;
    const interval = setInterval(async () => {
      attempts++;
      try {
        await fetchWalletData();
        await refreshUser();
      } catch { /* ignore */ }
      if (attempts >= maxAttempts) clearInterval(interval);
    }, 2000);

    return () => clearInterval(interval);
  }, []);

  async function handleDeposit() {
    const amount = parseFloat(depositAmount);
    if (isNaN(amount) || amount < 1) {
      setDepositError("Minimum deposit is $1.00");
      return;
    }
    setDepositLoading(true);
    setDepositError("");
    const res = await walletApi.createDeposit(amount);
    if (res.success && res.data) {
      window.location.href = res.data.checkoutUrl;
    } else {
      setDepositError(res.error?.message ?? "Failed to create deposit");
      setDepositLoading(false);
    }
  }

  async function handleStripeOnboarding() {
    setConnectLoading(true);
    setConnectError("");
    const res = await stripeApi.startOnboarding();
    if (res.success && res.data) {
      window.location.href = res.data.onboardingUrl;
    } else {
      setConnectError(res.error?.message ?? "Failed to start onboarding");
      setConnectLoading(false);
    }
  }

  // Populate from user data
  useEffect(() => {
    if (user) {
      setDisplayName(user.displayName);
      setUserEmail(user.email);
      setBio(user.bio);
      setSelectedCommunities(user.communities ?? []);
    }
  }, [user]);

  async function handleSaveProfile() {
    if (!user) return;
    setSaving(true);
    await userApi.updateProfile(user.username, { displayName, bio });
    await refreshUser();
    setSaving(false);
  }

  async function handleSaveSettings() {
    if (!user) return;
    await userApi.updateSettings(user.username, {
      emailNotifications,
      giftNotifications: newSupporter,
      milestoneNotifications: goalReached,
      profileVisible: profileVisibility,
      showOnLeaderboard: showLeaderboard,
    });
  }

  async function handleSaveCommunities() {
    if (!user) return;
    setSavingCommunities(true);
    await userApi.updateCommunities(user.username, selectedCommunities);
    await refreshUser();
    setSavingCommunities(false);
  }

  function toggleCommunity(id: string) {
    setSelectedCommunities((prev) =>
      prev.includes(id) ? prev.filter((c) => c !== id) : [...prev, id]
    );
  }

  const platformColorMap: Record<string, string> = {
    YOUTUBE: "#FF0000", TWITCH: "#9146FF", TWITTER: "#000000", INSTAGRAM: "#E4405F", TIKTOK: "#00f2ea",
  };

  const navItems = [
    { key: "profile" as const,       icon: <User className="w-4 h-4" />,        label: "Profile" },
    { key: "account" as const,       icon: <Mail className="w-4 h-4" />,        label: "Account" },
    { key: "platforms" as const,     icon: <Link2 className="w-4 h-4" />,       label: "Connected Platforms" },
    { key: "balance" as const,       icon: <DollarSign className="w-4 h-4" />,  label: "Credit & Spending" },
    { key: "communities" as const,     icon: <Users className="w-4 h-4" />,       label: "Communities" },
    { key: "customization" as const,  icon: <Palette className="w-4 h-4" />,     label: "Customization" },
    { key: "notifications" as const, icon: <Bell className="w-4 h-4" />,        label: "Notifications" },
    { key: "privacy" as const,       icon: <Shield className="w-4 h-4" />,      label: "Privacy & Security" },
  ];

  const Toggle = ({ value, onChange }: { value: boolean; onChange: () => void }) => (
    <button
      onClick={onChange}
      className={`relative w-11 h-6 transition-colors flex-shrink-0 rounded-full ${value ? "bg-accent" : "bg-border"}`}
    >
      <motion.div
        animate={{ x: value ? 22 : 2 }}
        transition={{ duration: 0.2 }}
        className="absolute top-1 w-4 h-4 bg-white rounded-full shadow-sm"
      />
    </button>
  );

  const inputClass = "w-full px-4 py-3 border border-border bg-background text-foreground placeholder-subtle focus:outline-none focus:ring-2 focus:ring-accent focus:border-transparent transition-all text-sm";

  return (
    <div className="min-h-screen bg-background text-foreground">
      {/* Main Content */}
      <section className="pt-28 pb-20 px-6">
        <div className="max-w-6xl mx-auto">
          <motion.div
            initial={{ opacity: 0, y: 30 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ duration: 0.8, ease: "easeOut" }}
            className="mb-10"
          >
            <div className="text-[10px] font-black uppercase tracking-widest text-subtle mb-2">Account</div>
            <h1 className="text-5xl font-black text-foreground tracking-tight">Settings</h1>
          </motion.div>

          <div className="grid grid-cols-1 lg:grid-cols-[240px_1fr] gap-8">
            {/* Sidebar */}
            <motion.aside
              initial={{ opacity: 0, x: -20 }}
              animate={{ opacity: 1, x: 0 }}
              transition={{ duration: 0.6 }}
              className="space-y-1"
            >
              {navItems.map(({ key, icon, label }) => (
                <button
                  key={key}
                  onClick={() => setActiveSection(key)}
                  className={`w-full flex items-center gap-3 px-4 py-3 text-sm font-bold transition-colors text-left ${
                    activeSection === key
                      ? "bg-foreground text-background"
                      : "text-muted-foreground hover:text-foreground hover:bg-muted"
                  }`}
                >
                  {icon}
                  {label}
                </button>
              ))}
            </motion.aside>

            {/* Content Panel */}
            <motion.div
              initial={{ opacity: 0, x: 20 }}
              animate={{ opacity: 1, x: 0 }}
              transition={{ duration: 0.6 }}
              className="border border-border bg-background p-8 card-game"
            >
              {/* Profile */}
              {activeSection === "profile" && (
                <div className="space-y-6">
                  <div className="text-[10px] font-black uppercase tracking-widest text-subtle mb-6">Profile Settings</div>

                  <div>
                    <label className="block text-xs font-bold uppercase tracking-widest text-muted-foreground mb-2">Display Name</label>
                    <input type="text" value={displayName} onChange={(e) => setDisplayName(e.target.value)} className={inputClass} />
                  </div>

                  <div>
                    <label className="block text-xs font-bold uppercase tracking-widest text-muted-foreground mb-2">Bio</label>
                    <textarea
                      value={bio}
                      onChange={(e) => setBio(e.target.value)}
                      rows={4}
                      className={`${inputClass} resize-none`}
                    />
                  </div>

                  <div>
                    <label className="block text-xs font-bold uppercase tracking-widest text-muted-foreground mb-2">Profile Photo</label>
                    <div className="flex items-center gap-4">
                      <div className="w-16 h-16 bg-muted border border-border rounded-full flex items-center justify-center">
                        <User className="w-8 h-8 text-subtle" />
                      </div>
                      <button className="px-4 py-2 border border-border text-muted-foreground hover:text-foreground hover:bg-muted text-sm font-bold transition-colors">
                        Upload Photo
                      </button>
                    </div>
                  </div>

                  <motion.button
                    whileHover={{ scale: 1.01 }}
                    whileTap={{ scale: 0.99 }}
                    className="px-8 py-3 btn-cta text-white font-black text-xs uppercase tracking-widest"
                  >
                    Save Changes
                  </motion.button>
                </div>
              )}

              {/* Account */}
              {activeSection === "account" && (
                <div className="space-y-6">
                  <div className="text-[10px] font-black uppercase tracking-widest text-subtle mb-6">Account Settings</div>

                  <div>
                    <label className="block text-xs font-bold uppercase tracking-widest text-muted-foreground mb-2">Email Address</label>
                    <input type="email" value={userEmail} onChange={(e) => setUserEmail(e.target.value)} className={inputClass} />
                  </div>

                  <div>
                    <label className="block text-xs font-bold uppercase tracking-widest text-muted-foreground mb-2">Change Password</label>
                    <div className="space-y-3">
                      <input type="password" placeholder="Current password" className={inputClass} />
                      <input type="password" placeholder="New password" className={inputClass} />
                      <input type="password" placeholder="Confirm new password" className={inputClass} />
                    </div>
                  </div>

                  <motion.button
                    whileHover={{ scale: 1.01 }}
                    whileTap={{ scale: 0.99 }}
                    className="px-8 py-3 btn-cta text-white font-black text-xs uppercase tracking-widest"
                  >
                    Update Account
                  </motion.button>

                  <div className="pt-6 mt-6 border-t border-border">
                    <div className="text-[10px] font-black uppercase tracking-widest text-subtle mb-3">Danger Zone</div>
                    <button className="px-4 py-2 border border-red-500/40 text-red-500 hover:bg-red-500/10 text-sm font-bold transition-colors">
                      Delete Account
                    </button>
                  </div>
                </div>
              )}

              {/* Balance Section */}
              {activeSection === "balance" && (
                <div className="space-y-6">
                  <div className="text-[10px] font-black uppercase tracking-widest text-subtle mb-6">Credit & Spending</div>

                  {depositSuccess && (
                    <motion.div
                      initial={{ opacity: 0, y: -8 }}
                      animate={{ opacity: 1, y: 0 }}
                      className="flex items-center gap-3 p-4 border border-green-500/30 bg-green-500/5"
                    >
                      <CheckCircle2 className="w-5 h-5 text-green-500 flex-shrink-0" />
                      <div>
                        <p className="text-sm font-bold text-foreground">Deposit successful</p>
                        <p className="text-xs text-subtle">Your balance is updating — this may take a moment.</p>
                      </div>
                      <button
                        onClick={() => setDepositSuccess(false)}
                        className="ml-auto text-xs text-subtle hover:text-foreground"
                      >
                        Dismiss
                      </button>
                    </motion.div>
                  )}

                  {loadingWallet ? (
                    <div className="flex items-center justify-center py-12">
                      <Loader2 className="w-6 h-6 animate-spin text-muted-foreground" />
                    </div>
                  ) : (
                    <>
                      {/* Balance card with deposit */}
                      <div className="p-6 border border-border bg-muted card-game">
                        <div className="flex flex-col sm:flex-row sm:items-end sm:justify-between gap-4">
                          <div>
                            <p className="text-[10px] font-black uppercase tracking-widest text-subtle mb-2">Current Balance</p>
                            <p className="text-4xl font-black text-foreground">
                              ${(walletSummary?.creditBalance ?? creditBalance ?? 0).toLocaleString("en-US", { minimumFractionDigits: 2, maximumFractionDigits: 2 })}
                            </p>
                            <p className="text-subtle text-xs mt-2">Available for gifts</p>

                            {!showDepositInput ? (
                              <motion.button
                                whileHover={{ scale: 1.01 }}
                                whileTap={{ scale: 0.99 }}
                                onClick={() => setShowDepositInput(true)}
                                className="mt-4 px-6 py-3 btn-cta text-white font-black text-xs uppercase tracking-widest flex items-center gap-2"
                              >
                                <Plus className="w-4 h-4" />
                                Deposit Credits
                              </motion.button>
                            ) : (
                              <div className="mt-4 space-y-3">
                                <div className="flex items-center gap-2">
                                  <div className="relative flex-1">
                                    <DollarSign className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-subtle" />
                                    <input
                                      type="number"
                                      min="1"
                                      step="0.01"
                                      placeholder="5.00"
                                      value={depositAmount}
                                      onChange={(e) => { setDepositAmount(e.target.value); setDepositError(""); }}
                                      onKeyDown={(e) => e.key === "Enter" && handleDeposit()}
                                      className="w-full pl-9 pr-4 py-3 border border-border bg-background text-foreground placeholder-subtle focus:outline-none focus:ring-2 focus:ring-accent text-sm"
                                      autoFocus
                                    />
                                  </div>
                                  <motion.button
                                    whileHover={{ scale: 1.01 }}
                                    whileTap={{ scale: 0.99 }}
                                    onClick={handleDeposit}
                                    disabled={depositLoading}
                                    className="px-6 py-3 btn-cta text-white font-black text-xs uppercase tracking-widest disabled:opacity-50 flex items-center gap-2"
                                  >
                                    {depositLoading ? <Loader2 className="w-4 h-4 animate-spin" /> : "Pay"}
                                  </motion.button>
                                  <button
                                    onClick={() => { setShowDepositInput(false); setDepositAmount(""); setDepositError(""); }}
                                    className="px-3 py-3 border border-border text-muted-foreground hover:text-foreground hover:bg-muted text-sm transition-colors"
                                  >
                                    Cancel
                                  </button>
                                </div>
                                {depositError && <p className="text-red-500 text-xs">{depositError}</p>}
                                <p className="text-subtle text-[11px]">You'll be redirected to Stripe to complete payment</p>
                              </div>
                            )}
                          </div>
                          <div className="p-4 border border-border bg-background">
                            <DollarSign className="w-8 h-8 text-accent" />
                          </div>
                        </div>
                      </div>

                      {/* Payout Setup (creators only) */}
                      {user?.role === "creator" && (
                        <div className="p-6 border border-border bg-muted card-game">
                          <div className="flex items-start justify-between gap-4">
                            <div className="flex-1">
                              <p className="text-[10px] font-black uppercase tracking-widest text-subtle mb-2">Payout Setup</p>
                              {connectStatus?.chargesEnabled ? (
                                <div className="flex items-center gap-2">
                                  <CheckCircle2 className="w-5 h-5 text-green-500" />
                                  <div>
                                    <p className="text-sm font-bold text-foreground">Payouts enabled</p>
                                    <p className="text-xs text-subtle">You can receive tips from supporters</p>
                                  </div>
                                </div>
                              ) : connectStatus?.connected ? (
                                <div>
                                  <div className="flex items-center gap-2 mb-3">
                                    <AlertCircle className="w-5 h-5 text-yellow-500" />
                                    <div>
                                      <p className="text-sm font-bold text-foreground">Setup incomplete</p>
                                      <p className="text-xs text-subtle">Complete your Stripe account to receive tips</p>
                                    </div>
                                  </div>
                                  <motion.button
                                    whileHover={{ scale: 1.01 }}
                                    whileTap={{ scale: 0.99 }}
                                    onClick={handleStripeOnboarding}
                                    disabled={connectLoading}
                                    className="px-6 py-3 btn-cta text-white font-black text-xs uppercase tracking-widest flex items-center gap-2 disabled:opacity-50"
                                  >
                                    {connectLoading ? <Loader2 className="w-4 h-4 animate-spin" /> : <><ExternalLink className="w-4 h-4" /> Complete Setup</>}
                                  </motion.button>
                                </div>
                              ) : (
                                <div>
                                  <p className="text-sm text-muted-foreground mb-3">
                                    Connect a Stripe account to receive tips and payouts from supporters.
                                  </p>
                                  <motion.button
                                    whileHover={{ scale: 1.01 }}
                                    whileTap={{ scale: 0.99 }}
                                    onClick={handleStripeOnboarding}
                                    disabled={connectLoading}
                                    className="px-6 py-3 btn-cta text-white font-black text-xs uppercase tracking-widest flex items-center gap-2 disabled:opacity-50"
                                  >
                                    {connectLoading ? <Loader2 className="w-4 h-4 animate-spin" /> : <><ExternalLink className="w-4 h-4" /> Set Up Payouts</>}
                                  </motion.button>
                                  {connectError && <p className="text-red-500 text-xs mt-2">{connectError}</p>}
                                </div>
                              )}
                            </div>
                          </div>
                        </div>
                      )}

                      {/* Summary stats */}
                      <div className="grid grid-cols-1 sm:grid-cols-3 gap-4">
                        <div className="p-6 border border-border bg-muted card-game">
                          <p className="text-[10px] font-black uppercase tracking-widest text-subtle mb-4">Total Deposited</p>
                          <p className="text-3xl font-black text-foreground">
                            ${(walletSummary?.totalDeposited ?? 0).toLocaleString("en-US", { minimumFractionDigits: 2, maximumFractionDigits: 2 })}
                          </p>
                        </div>
                        <div className="p-6 border border-border bg-muted card-game">
                          <p className="text-[10px] font-black uppercase tracking-widest text-subtle mb-4">Total Spent</p>
                          <p className="text-3xl font-black text-foreground">
                            ${(walletSummary?.totalSpent ?? 0).toLocaleString("en-US", { minimumFractionDigits: 2, maximumFractionDigits: 2 })}
                          </p>
                        </div>
                        <div className="p-6 border border-border bg-muted card-game">
                          <p className="text-[10px] font-black uppercase tracking-widest text-subtle mb-4">Gifts Sent</p>
                          <p className="text-3xl font-black text-foreground">
                            {walletSummary?.giftsSentCount ?? 0}
                          </p>
                        </div>
                      </div>

                      {/* Transaction history */}
                      {transactions.length > 0 && (
                        <div>
                          <p className="text-[10px] font-black uppercase tracking-widest text-subtle mb-4">Recent Transactions</p>
                          <div className="space-y-2">
                            {transactions.map((tx) => (
                              <div key={tx.id} className="flex items-center gap-4 p-4 border border-border bg-muted">
                                <div className={`w-8 h-8 flex items-center justify-center flex-shrink-0 ${
                                  tx.type === "DEPOSIT" ? "bg-green-500/10" :
                                  tx.type === "GIFT_RECEIVED" ? "bg-blue-500/10" :
                                  "bg-red-500/10"
                                }`}>
                                  {tx.type === "DEPOSIT" ? <ArrowDownLeft className="w-4 h-4 text-green-500" /> :
                                   tx.type === "GIFT_RECEIVED" ? <ArrowDownLeft className="w-4 h-4 text-blue-500" /> :
                                   <ArrowUpRight className="w-4 h-4 text-red-500" />}
                                </div>
                                <div className="flex-1 min-w-0">
                                  <p className="text-sm font-bold text-foreground truncate">{tx.description}</p>
                                  <p className="text-[11px] text-subtle">
                                    {new Date(tx.createdAt).toLocaleDateString("en-US", { month: "short", day: "numeric", year: "numeric" })}
                                  </p>
                                </div>
                                <div className="flex-shrink-0 text-right">
                                  <p className={`text-sm font-black ${
                                    tx.type === "GIFT_SENT" ? "text-red-500" : "text-green-500"
                                  }`}>
                                    {tx.type === "GIFT_SENT" ? "-" : "+"}${tx.amount.toLocaleString("en-US", { minimumFractionDigits: 2, maximumFractionDigits: 2 })}
                                  </p>
                                </div>
                              </div>
                            ))}
                          </div>
                        </div>
                      )}
                    </>
                  )}
                </div>
              )}

              {/* Communities */}
              {activeSection === "communities" && (
                <div className="space-y-6">
                  <div>
                    <div className="text-[10px] font-black uppercase tracking-widest text-subtle mb-2">Your Communities</div>
                    <p className="text-muted-foreground text-sm">Tap to join or leave communities. Your feed and recommendations will update to match.</p>
                  </div>

                  {/* Active summary */}
                  <div className="flex items-center justify-between p-4 border border-border bg-muted">
                    <div className="flex items-center gap-3">
                      <div className="w-10 h-10 bg-accent/10 flex items-center justify-center">
                        <Users className="w-5 h-5 text-accent" />
                      </div>
                      <div>
                        <p className="text-foreground font-bold text-sm">
                          {selectedCommunities.length} {selectedCommunities.length === 1 ? "community" : "communities"} joined
                        </p>
                        <p className="text-subtle text-xs">
                          {selectedCommunities.length === 0
                            ? "Join communities to personalize your experience"
                            : COMMUNITIES.filter((c) => selectedCommunities.includes(c.id)).map((c) => c.name).join(", ")}
                        </p>
                      </div>
                    </div>
                    {selectedCommunities.length > 0 && (
                      <button
                        onClick={() => setSelectedCommunities([])}
                        className="text-xs text-subtle hover:text-foreground transition-colors font-medium"
                      >
                        Clear all
                      </button>
                    )}
                  </div>

                  {/* Community cards */}
                  <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
                    {COMMUNITIES.map((community, index) => {
                      const isSelected = selectedCommunities.includes(community.id);
                      return (
                        <motion.button
                          key={community.id}
                          initial={{ opacity: 0, y: 8 }}
                          animate={{ opacity: 1, y: 0 }}
                          transition={{ duration: 0.25, delay: 0.03 * index }}
                          whileHover={{ scale: 1.02 }}
                          whileTap={{ scale: 0.98 }}
                          onClick={() => toggleCommunity(community.id)}
                          className={`group relative flex items-start gap-4 p-4 border text-left transition-all ${
                            isSelected
                              ? "border-accent bg-accent/5"
                              : "border-border hover:border-accent/30 hover:bg-muted/50"
                          }`}
                        >
                          {/* Emoji */}
                          <div className={`w-11 h-11 flex items-center justify-center text-2xl flex-shrink-0 transition-colors ${
                            isSelected ? "bg-accent/10" : "bg-muted group-hover:bg-accent/5"
                          }`}>
                            {community.emoji}
                          </div>

                          {/* Content */}
                          <div className="flex-1 min-w-0">
                            <p className="text-sm font-black text-foreground mb-0.5">{community.name}</p>
                            <p className="text-[11px] text-muted-foreground leading-snug">{community.description}</p>
                            <p className="text-[10px] font-bold uppercase tracking-widest text-subtle mt-1.5">{community.memberCount} members</p>
                          </div>

                          {/* Selection indicator */}
                          <div className={`w-5 h-5 flex-shrink-0 flex items-center justify-center border transition-all mt-0.5 ${
                            isSelected
                              ? "bg-accent border-accent"
                              : "border-border group-hover:border-accent/40"
                          }`}>
                            {isSelected && <Check className="w-3 h-3 text-white" />}
                          </div>
                        </motion.button>
                      );
                    })}
                  </div>

                  {/* Save */}
                  <div className="flex items-center justify-between pt-2">
                    <p className="text-xs text-subtle">
                      {selectedCommunities.length === 0 ? "Select at least one community" : `${selectedCommunities.length} of ${COMMUNITIES.length} selected`}
                    </p>
                    <motion.button
                      whileHover={{ scale: 1.01 }}
                      whileTap={{ scale: 0.99 }}
                      onClick={handleSaveCommunities}
                      disabled={savingCommunities}
                      className="px-8 py-3 btn-cta text-white font-black text-xs uppercase tracking-widest flex items-center gap-2 disabled:opacity-50"
                    >
                      {savingCommunities ? <Loader2 className="w-4 h-4 animate-spin" /> : "Save Communities"}
                    </motion.button>
                  </div>
                </div>
              )}

              {/* Customization */}
              {activeSection === "customization" && (
                <div className="space-y-6">
                  <div className="text-[10px] font-black uppercase tracking-widest text-subtle mb-6">Customization</div>

                  <div>
                    <label className="block text-xs font-bold uppercase tracking-widest text-muted-foreground mb-4">Theme</label>
                    <div className="grid grid-cols-1 sm:grid-cols-3 gap-3">
                      {([
                        { key: "light", label: "Light", icon: <Sun className="w-5 h-5" />, desc: "Clean & bright" },
                        { key: "dark", label: "Dark", icon: <Moon className="w-5 h-5" />, desc: "Easy on the eyes" },
                        { key: "system", label: "System", icon: <Monitor className="w-5 h-5" />, desc: "Match your device" },
                      ] as const).map((option) => {
                        const isActive = theme === option.key;
                        return (
                          <button
                            key={option.key}
                            onClick={() => setTheme(option.key)}
                            className={`flex flex-col items-center gap-2 p-6 border text-center transition-all ${
                              isActive
                                ? "border-accent bg-accent/10 text-foreground"
                                : "border-border bg-muted text-muted-foreground hover:text-foreground hover:bg-secondary"
                            }`}
                          >
                            <div className={isActive ? "text-accent" : "text-subtle"}>{option.icon}</div>
                            <p className="font-bold text-sm">{option.label}</p>
                            <p className="text-xs text-subtle">{option.desc}</p>
                          </button>
                        );
                      })}
                    </div>
                    <p className="text-xs text-subtle mt-3">
                      Currently using <span className="font-bold text-foreground">{resolvedTheme === "dark" ? "dark" : "light"}</span> mode
                    </p>
                  </div>
                </div>
              )}

              {/* Connected Platforms */}
              {activeSection === "platforms" && (
                <div className="space-y-6">
                  <div>
                    <div className="text-[10px] font-black uppercase tracking-widest text-subtle mb-2">Connected Platforms</div>
                    <p className="text-muted-foreground text-sm">Link your social media accounts so we can auto-sync your posts.</p>
                  </div>

                  {platformsLoading ? (
                    <div className="flex items-center justify-center py-12">
                      <Loader2 className="w-6 h-6 animate-spin text-muted-foreground" />
                    </div>
                  ) : (
                    <>
                      {/* Currently connected */}
                      {connectedPlatforms.length > 0 && (
                        <div className="space-y-2">
                          <p className="text-xs font-bold uppercase tracking-widest text-subtle">Connected</p>
                          {connectedPlatforms.map((cp) => (
                            <div key={cp.platform} className="flex items-center justify-between p-4 border border-accent/30 bg-accent/5">
                              <div className="flex items-center gap-3">
                                <div
                                  className="w-8 h-8 flex items-center justify-center text-white text-[10px] font-black"
                                  style={{ backgroundColor: platformColorMap[cp.platform] || "#333" }}
                                >
                                  {cp.platform.slice(0, 2)}
                                </div>
                                <div>
                                  <p className="text-sm font-bold text-foreground">{cp.platform}</p>
                                  <p className="text-xs text-subtle">{cp.handle || cp.url}</p>
                                </div>
                              </div>
                              <button
                                onClick={() => handleDisconnectPlatform(cp.platform)}
                                className="flex items-center gap-1.5 px-3 py-1.5 text-xs font-bold text-red-500 hover:bg-red-500/10 border border-red-500/30 transition-colors"
                              >
                                <Trash2 className="w-3 h-3" />
                                Disconnect
                              </button>
                            </div>
                          ))}
                        </div>
                      )}

                      {/* Add new platform */}
                      <div className="space-y-2">
                        <p className="text-xs font-bold uppercase tracking-widest text-subtle">
                          {connectedPlatforms.length > 0 ? "Add another" : "Connect a platform"}
                        </p>
                        <div className="grid grid-cols-2 sm:grid-cols-3 gap-2">
                          {(["YOUTUBE", "TWITCH", "TWITTER", "INSTAGRAM", "TIKTOK"] as PlatformType[])
                            .filter(p => !connectedPlatforms.some(cp => cp.platform === p))
                            .map((p) => (
                              <button
                                key={p}
                                onClick={() => {
                                  if (OAUTH_PLATFORMS.has(p)) {
                                    handleOAuthConnect(p);
                                  } else {
                                    setAddingPlatform(p); setPlatformHandle(""); setPlatformUrl("");
                                  }
                                }}
                                disabled={platformSaving && addingPlatform === p}
                                className={`flex items-center gap-2 p-3 border text-left text-sm font-bold transition-colors ${
                                  addingPlatform === p
                                    ? "border-accent bg-accent/5 text-foreground"
                                    : "border-border hover:border-accent/30 text-muted-foreground hover:text-foreground"
                                } disabled:opacity-50`}
                              >
                                {platformSaving && addingPlatform === p ? (
                                  <Loader2 className="w-4 h-4 animate-spin" />
                                ) : (
                                  <div
                                    className="w-6 h-6 flex items-center justify-center text-white text-[8px] font-black"
                                    style={{ backgroundColor: platformColorMap[p] || "#333" }}
                                  >
                                    {p.slice(0, 2)}
                                  </div>
                                )}
                                {OAUTH_PLATFORMS.has(p) ? `Sign in with ${p.charAt(0) + p.slice(1).toLowerCase()}` : p}
                              </button>
                            ))}
                        </div>

                        {addingPlatform && !OAUTH_PLATFORMS.has(addingPlatform) && (
                          <motion.div
                            initial={{ opacity: 0, y: -8 }}
                            animate={{ opacity: 1, y: 0 }}
                            className="p-4 border border-accent/30 bg-muted space-y-3"
                          >
                            <p className="text-xs font-bold text-foreground">
                              Connect {addingPlatform}
                            </p>
                            <div>
                              <label className="block text-[11px] font-bold uppercase tracking-widest text-subtle mb-1">
                                {addingPlatform === "TWITTER" ? "Handle (e.g. @elonmusk)" :
                                 addingPlatform === "INSTAGRAM" ? "Username (e.g. natgeo)" :
                                 "Username (e.g. @charlidamelio)"}
                              </label>
                              <input
                                type="text"
                                value={platformHandle}
                                onChange={(e) => setPlatformHandle(e.target.value)}
                                placeholder="username"
                                className={inputClass}
                                autoFocus
                              />
                            </div>
                            <div>
                              <label className="block text-[11px] font-bold uppercase tracking-widest text-subtle mb-1">
                                Profile URL (optional)
                              </label>
                              <input
                                type="url"
                                value={platformUrl}
                                onChange={(e) => setPlatformUrl(e.target.value)}
                                placeholder={`https://${addingPlatform.toLowerCase()}.com/...`}
                                className={inputClass}
                              />
                            </div>
                            <div className="flex items-center gap-2">
                              <motion.button
                                whileHover={{ scale: 1.01 }}
                                whileTap={{ scale: 0.99 }}
                                onClick={handleConnectPlatform}
                                disabled={platformSaving || !platformHandle.trim()}
                                className="px-6 py-2.5 btn-cta text-white font-black text-xs uppercase tracking-widest disabled:opacity-50 flex items-center gap-2"
                              >
                                {platformSaving ? <Loader2 className="w-4 h-4 animate-spin" /> : "Connect"}
                              </motion.button>
                              <button
                                onClick={() => { setAddingPlatform(null); setPlatformHandle(""); setPlatformUrl(""); }}
                                className="px-4 py-2.5 border border-border text-muted-foreground hover:text-foreground text-xs font-bold transition-colors"
                              >
                                Cancel
                              </button>
                            </div>
                            <p className="text-[10px] text-subtle">
                              For this platform, you'll manually add posts via the "Add Post" button on the dashboard.
                            </p>
                          </motion.div>
                        )}
                      </div>

                      {connectedPlatforms.length === 0 && !addingPlatform && (
                        <div className="text-center py-8 text-subtle text-sm">
                          No platforms connected yet. Click a platform above to get started.
                        </div>
                      )}
                    </>
                  )}
                </div>
              )}

              {/* Notifications */}
              {activeSection === "notifications" && (
                <div className="space-y-4">
                  <div className="text-[10px] font-black uppercase tracking-widest text-subtle mb-6">Notification Preferences</div>

                  {[
                    { label: "Email Notifications", sub: "Receive updates via email", value: emailNotifications, onChange: () => setEmailNotifications(!emailNotifications) },
                    { label: "Push Notifications",  sub: "Receive push notifications",                            value: pushNotifications,  onChange: () => setPushNotifications(!pushNotifications) },
                    { label: "New Fan Gift",         sub: "When someone gifts to your item",                      value: newSupporter,       onChange: () => setNewSupporter(!newSupporter) },
                    { label: "Goal Reached",         sub: "When a funding goal is fully met",                     value: goalReached,        onChange: () => setGoalReached(!goalReached) },
                  ].map(({ label, sub, value, onChange }) => (
                    <div key={label} className="flex items-center justify-between p-4 border border-border bg-muted">
                      <div>
                        <p className="text-foreground font-bold text-sm">{label}</p>
                        <p className="text-subtle text-xs mt-0.5">{sub}</p>
                      </div>
                      <Toggle value={value} onChange={onChange} />
                    </div>
                  ))}
                </div>
              )}

              {/* Privacy */}
              {activeSection === "privacy" && (
                <div className="space-y-4">
                  <div className="text-[10px] font-black uppercase tracking-widest text-subtle mb-6">Privacy & Security</div>

                  <div className="flex items-center justify-between p-4 border border-border bg-muted">
                    <div>
                      <p className="text-foreground font-bold text-sm">Public Profile</p>
                      <p className="text-subtle text-xs mt-0.5">Allow fans to discover your profile</p>
                    </div>
                    <Toggle value={profileVisibility} onChange={() => setProfileVisibility(!profileVisibility)} />
                  </div>

                  <div className="flex items-center justify-between p-4 border border-border bg-muted">
                    <div>
                      <p className="text-foreground font-bold text-sm">Show on Leaderboard</p>
                      <p className="text-subtle text-xs mt-0.5">Display your rank on public leaderboards</p>
                    </div>
                    <Toggle value={showLeaderboard} onChange={() => setShowLeaderboard(!showLeaderboard)} />
                  </div>

                  <div className="p-4 border border-border bg-muted">
                    <div className="flex items-start gap-3">
                      <Key className="w-4 h-4 text-subtle mt-0.5 flex-shrink-0" />
                      <div>
                        <p className="text-foreground font-bold text-sm">Two-Factor Authentication</p>
                        <p className="text-subtle text-xs mt-0.5 mb-3">Add an extra layer of security to your account</p>
                        <button className="px-4 py-2 border border-border bg-background text-foreground hover:bg-secondary text-sm font-bold transition-colors">
                          Enable 2FA
                        </button>
                      </div>
                    </div>
                  </div>

                  <div className="p-4 border border-border bg-muted">
                    <div className="flex items-start gap-3">
                      <Lock className="w-4 h-4 text-subtle mt-0.5 flex-shrink-0" />
                      <div className="flex-1">
                        <p className="text-foreground font-bold text-sm">Connected Accounts</p>
                        <p className="text-subtle text-xs mt-0.5 mb-3">Manage your linked social profiles in the <button onClick={() => setActiveSection("platforms")} className="text-accent font-bold hover:underline">Connected Platforms</button> section.</p>
                      </div>
                    </div>
                  </div>
                </div>
              )}
            </motion.div>
          </div>
        </div>
      </section>

      <footer className="py-10 px-6 border-t border-border">
        <div className="max-w-7xl mx-auto text-center text-subtle text-sm">
          <p>© 2026 Rory. All rights reserved.</p>
        </div>
      </footer>
    </div>
  );
}
