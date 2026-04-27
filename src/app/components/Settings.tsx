import { motion } from "motion/react";
import { useState } from "react";
import { Search, User, Bell, Lock, Mail, Key, Shield, LayoutDashboard, BarChart3, DollarSign, Settings as SettingsIcon, LogOut } from "lucide-react";

interface SettingsProps {
  username?: string;
  email?: string;
  creditBalance?: number;
  onUpdateBalance?: (newBalance: number) => void;
  onNavigateDashboard?: () => void;
  onNavigateAnalytics?: () => void;
  onLogout?: () => void;
  initialSection?: "profile" | "account" | "notifications" | "privacy" | "balance";
}

export default function Settings({
  username = "Username",
  email = "user@example.com",
  creditBalance,
  onNavigateDashboard,
  onNavigateAnalytics,
  onLogout,
  initialSection = "profile",
}: SettingsProps) {
  const [searchQuery, setSearchQuery] = useState("");
  const [activeSection, setActiveSection] = useState<"profile" | "account" | "notifications" | "privacy" | "balance">(initialSection);
  const spendingHistory = [
    { label: "Last week", amount: "$180.00" },
    { label: "Last month", amount: "$840.00" },
    { label: "Last year", amount: "$12,500.00" },
    { label: "All time", amount: "$28,320.00" },
  ];

  const [displayName, setDisplayName] = useState(username);
  const [userEmail, setUserEmail] = useState(email);
  const [bio, setBio] = useState("Creator and artist");

  const [emailNotifications, setEmailNotifications] = useState(true);
  const [pushNotifications, setPushNotifications] = useState(true);
  const [newSupporter, setNewSupporter] = useState(true);
  const [goalReached, setGoalReached] = useState(true);

  const [profileVisibility, setProfileVisibility] = useState(true);
  const [showLeaderboard, setShowLeaderboard] = useState(true);

  const navItems = [
    { key: "profile" as const,       icon: <User className="w-4 h-4" />,        label: "Profile" },
    { key: "account" as const,       icon: <Mail className="w-4 h-4" />,        label: "Account" },
    { key: "balance" as const,       icon: <DollarSign className="w-4 h-4" />,  label: "Credit & Spending" },
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

  const inputClass = "w-full px-4 py-3 border border-border bg-background text-foreground placeholder-subtle focus:outline-none focus:ring-2 focus:ring-accent focus:border-transparent transition-all text-sm rounded-md";

  return (
    <div className="min-h-screen bg-background text-foreground">
      {/* Navigation */}
      <nav className="fixed top-0 left-0 right-0 z-50 bg-[#0e0e0e] border-b border-[#e8185d]/40">
        <div className="max-w-full mx-auto px-6 py-4 flex items-center justify-between">
          <div className="flex items-center gap-8">
            <div className="text-xl font-black text-white tracking-tight">TipFlow</div>
            <div className="hidden md:flex items-center gap-1">
              <button onClick={onNavigateDashboard} className="flex items-center gap-2 px-4 py-2 text-white/60 hover:text-white font-medium text-sm transition-colors">
                <LayoutDashboard className="w-4 h-4" />
                Dashboard
              </button>
              <button onClick={onNavigateAnalytics} className="flex items-center gap-2 px-4 py-2 text-white/60 hover:text-white font-medium text-sm transition-colors">
                <BarChart3 className="w-4 h-4" />
                Analytics
              </button>
              <button className="flex items-center gap-2 px-4 py-2 bg-accent text-white font-medium text-sm rounded-md">
                <SettingsIcon className="w-4 h-4" />
                Settings
              </button>
            </div>
          </div>
          <div className="flex items-center gap-4">
            <div className="relative hidden sm:block">
              <Search className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-white/40" />
              <input
                type="text"
                placeholder="Search"
                value={searchQuery}
                onChange={(e) => setSearchQuery(e.target.value)}
                className="pl-10 pr-4 py-2 bg-white/10 border border-white/20 text-white placeholder-white/30 text-sm focus:outline-none focus:ring-2 focus:ring-accent transition-all w-48 rounded-md"
              />
            </div>
            {onLogout && (
              <button onClick={onLogout} className="flex items-center gap-2 px-4 py-2 border border-white/20 text-white hover:bg-white/10 text-sm font-medium transition-colors rounded-md">
                <LogOut className="w-4 h-4" />
                <span className="hidden sm:inline">Logout</span>
              </button>
            )}
          </div>
        </div>
      </nav>

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
                  className={`w-full flex items-center gap-3 px-4 py-3 text-sm font-bold transition-colors text-left rounded-md ${
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
              className="border border-border bg-background p-8 rounded-2xl card-game"
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
                      <button className="px-4 py-2 border border-border text-muted-foreground hover:text-foreground hover:bg-muted text-sm font-bold transition-colors rounded-md">
                        Upload Photo
                      </button>
                    </div>
                  </div>

                  <motion.button
                    whileHover={{ scale: 1.01 }}
                    whileTap={{ scale: 0.99 }}
                    className="px-8 py-3 rounded-md btn-cta text-white font-black text-xs uppercase tracking-widest"
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
                    className="px-8 py-3 rounded-md btn-cta text-white font-black text-xs uppercase tracking-widest"
                  >
                    Update Account
                  </motion.button>

                  <div className="pt-6 mt-6 border-t border-border">
                    <div className="text-[10px] font-black uppercase tracking-widest text-subtle mb-3">Danger Zone</div>
                    <button className="px-4 py-2 border border-red-500/40 text-red-500 hover:bg-red-500/10 text-sm font-bold transition-colors rounded-md">
                      Delete Account
                    </button>
                  </div>
                </div>
              )}

              {/* Balance Section */}
              {activeSection === "balance" && (
                <div className="space-y-6">
                  <div className="text-[10px] font-black uppercase tracking-widest text-subtle mb-6">Credit & Spending</div>

                  <div className="p-6 border border-border bg-muted rounded-xl card-game">
                    <div className="flex flex-col sm:flex-row sm:items-end sm:justify-between gap-4">
                      <div>
                        <p className="text-[10px] font-black uppercase tracking-widest text-subtle mb-2">Current Balance</p>
                        <p className="text-4xl font-black text-foreground">
                          ${creditBalance?.toLocaleString("en-US", { minimumFractionDigits: 2, maximumFractionDigits: 2 })}
                        </p>
                        <p className="text-subtle text-xs mt-2">Available for purchases and tips</p>
                      </div>
                      <div className="p-4 border border-border bg-background rounded-xl">
                        <DollarSign className="w-8 h-8 text-accent" />
                      </div>
                    </div>
                  </div>

                  <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                    {spendingHistory.map((item) => (
                      <div key={item.label} className="p-6 border border-border bg-muted rounded-xl card-game">
                        <p className="text-[10px] font-black uppercase tracking-widest text-subtle mb-4">{item.label}</p>
                        <p className="text-3xl font-black text-foreground">{item.amount}</p>
                      </div>
                    ))}
                  </div>
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
                    <div key={label} className="flex items-center justify-between p-4 border border-border bg-muted rounded-md">
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

                  <div className="flex items-center justify-between p-4 border border-border bg-muted rounded-md">
                    <div>
                      <p className="text-foreground font-bold text-sm">Public Profile</p>
                      <p className="text-subtle text-xs mt-0.5">Allow fans to discover your profile</p>
                    </div>
                    <Toggle value={profileVisibility} onChange={() => setProfileVisibility(!profileVisibility)} />
                  </div>

                  <div className="flex items-center justify-between p-4 border border-border bg-muted rounded-md">
                    <div>
                      <p className="text-foreground font-bold text-sm">Show on Leaderboard</p>
                      <p className="text-subtle text-xs mt-0.5">Display your rank on public leaderboards</p>
                    </div>
                    <Toggle value={showLeaderboard} onChange={() => setShowLeaderboard(!showLeaderboard)} />
                  </div>

                  <div className="p-4 border border-border bg-muted rounded-md">
                    <div className="flex items-start gap-3">
                      <Key className="w-4 h-4 text-subtle mt-0.5 flex-shrink-0" />
                      <div>
                        <p className="text-foreground font-bold text-sm">Two-Factor Authentication</p>
                        <p className="text-subtle text-xs mt-0.5 mb-3">Add an extra layer of security to your account</p>
                        <button className="px-4 py-2 border border-border bg-background text-foreground hover:bg-secondary text-sm font-bold transition-colors rounded-md">
                          Enable 2FA
                        </button>
                      </div>
                    </div>
                  </div>

                  <div className="p-4 border border-border bg-muted rounded-md">
                    <div className="flex items-start gap-3">
                      <Lock className="w-4 h-4 text-subtle mt-0.5 flex-shrink-0" />
                      <div className="flex-1">
                        <p className="text-foreground font-bold text-sm">Connected Accounts</p>
                        <p className="text-subtle text-xs mt-0.5 mb-3">Manage your linked social profiles</p>
                        <div className="space-y-2">
                          <button className="w-full px-4 py-2 border border-border bg-background text-muted-foreground hover:text-foreground hover:bg-secondary text-sm font-medium transition-colors text-left rounded-md">
                            Twitter — @username
                          </button>
                          <button className="w-full px-4 py-2 border border-border bg-background text-muted-foreground hover:text-foreground hover:bg-secondary text-sm font-medium transition-colors text-left rounded-md">
                            Instagram — @username
                          </button>
                        </div>
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
          <p>© 2026 TipFlow. All rights reserved.</p>
        </div>
      </footer>
    </div>
  );
}
