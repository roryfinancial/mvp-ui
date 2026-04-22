import { motion } from "motion/react";
import { useState } from "react";
import { Search, User, Bell, Lock, Mail, Key, Shield, LayoutDashboard, BarChart3, Settings as SettingsIcon, LogOut } from "lucide-react";

interface SettingsProps {
  username?: string;
  email?: string;
  onNavigateDashboard?: () => void;
  onNavigateAnalytics?: () => void;
  onLogout?: () => void;
}

export default function Settings({
  username = "Username",
  email = "user@example.com",
  onNavigateDashboard,
  onNavigateAnalytics,
  onLogout,
}: SettingsProps) {
  const [searchQuery, setSearchQuery] = useState("");
  const [activeSection, setActiveSection] = useState<"profile" | "account" | "notifications" | "privacy">("profile");

  // Form states
  const [displayName, setDisplayName] = useState(username);
  const [userEmail, setUserEmail] = useState(email);
  const [bio, setBio] = useState("Creator and artist");

  // Notification preferences
  const [emailNotifications, setEmailNotifications] = useState(true);
  const [pushNotifications, setPushNotifications] = useState(true);
  const [newSupporter, setNewSupporter] = useState(true);
  const [goalReached, setGoalReached] = useState(true);

  // Privacy preferences
  const [profileVisibility, setProfileVisibility] = useState(true);
  const [showLeaderboard, setShowLeaderboard] = useState(true);

  return (
    <div className="min-h-screen bg-[#0a0a0a] text-white">
      {/* Navigation */}
      <nav className="fixed top-0 left-0 right-0 z-50 bg-[#0a0a0a]/80 backdrop-blur-lg border-b border-white/5">
        <div className="max-w-full mx-auto px-6 py-5 flex items-center justify-between">
          <div className="flex items-center gap-8">
            <div className="text-2xl font-bold bg-gradient-to-r from-purple-400 to-pink-400 bg-clip-text text-transparent">
              TipFlow
            </div>
            <div className="hidden md:flex items-center gap-1">
              <button
                onClick={onNavigateDashboard}
                className="flex items-center gap-2 px-4 py-2 rounded-xl text-gray-300 hover:text-white hover:bg-white/5 font-medium text-sm transition-all"
              >
                <LayoutDashboard className="w-4 h-4" />
                Dashboard
              </button>
              <button
                onClick={onNavigateAnalytics}
                className="flex items-center gap-2 px-4 py-2 rounded-xl text-gray-300 hover:text-white hover:bg-white/5 font-medium text-sm transition-all"
              >
                <BarChart3 className="w-4 h-4" />
                Analytics
              </button>
              <button className="flex items-center gap-2 px-4 py-2 rounded-xl bg-gradient-to-r from-purple-600/20 to-pink-600/20 border border-purple-500/30 text-white font-medium text-sm transition-all">
                <SettingsIcon className="w-4 h-4" />
                Settings
              </button>
            </div>
          </div>
          <div className="flex items-center gap-6">
            <div className="relative hidden sm:block">
              <Search className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-gray-400" />
              <input
                type="text"
                placeholder="Search"
                value={searchQuery}
                onChange={(e) => setSearchQuery(e.target.value)}
                className="pl-10 pr-4 py-2 rounded-xl bg-[#1a1a1a] border border-white/10 text-white placeholder-gray-500 text-sm focus:outline-none focus:ring-2 focus:ring-purple-500 transition-all w-64"
              />
            </div>
            {onLogout && (
              <button
                onClick={onLogout}
                className="flex items-center gap-2 px-4 py-2 rounded-xl bg-white/5 border border-white/10 text-gray-300 hover:text-white hover:bg-white/10 transition-all"
              >
                <LogOut className="w-4 h-4" />
                <span className="text-sm font-medium hidden sm:inline">Logout</span>
              </button>
            )}
          </div>
        </div>
      </nav>

      {/* Main Content */}
      <section className="relative pt-32 pb-20 px-6">
        <div className="max-w-6xl mx-auto relative z-10">
          {/* Header */}
          <motion.div
            initial={{ opacity: 0, y: 30 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ duration: 0.8, ease: "easeOut" }}
            className="mb-12"
          >
            <h1 className="text-5xl font-bold mb-4 bg-gradient-to-r from-white to-gray-300 bg-clip-text text-transparent">
              Settings
            </h1>
            <p className="text-gray-400 text-lg">Manage your account preferences and settings</p>
          </motion.div>

          {/* Settings Layout */}
          <div className="grid grid-cols-1 lg:grid-cols-[280px_1fr] gap-8">
            {/* Sidebar Navigation */}
            <motion.aside
              initial={{ opacity: 0, x: -20 }}
              animate={{ opacity: 1, x: 0 }}
              transition={{ duration: 0.6 }}
              className="space-y-2"
            >
              <button
                onClick={() => setActiveSection("profile")}
                className={`w-full flex items-center gap-3 px-4 py-3 rounded-xl transition-all ${
                  activeSection === "profile"
                    ? "bg-gradient-to-r from-purple-600/20 to-pink-600/20 border border-purple-500/30 text-white"
                    : "text-gray-400 hover:text-white hover:bg-white/5"
                }`}
              >
                <User className="w-5 h-5" />
                <span className="font-medium">Profile</span>
              </button>
              <button
                onClick={() => setActiveSection("account")}
                className={`w-full flex items-center gap-3 px-4 py-3 rounded-xl transition-all ${
                  activeSection === "account"
                    ? "bg-gradient-to-r from-purple-600/20 to-pink-600/20 border border-purple-500/30 text-white"
                    : "text-gray-400 hover:text-white hover:bg-white/5"
                }`}
              >
                <Mail className="w-5 h-5" />
                <span className="font-medium">Account</span>
              </button>
              <button
                onClick={() => setActiveSection("notifications")}
                className={`w-full flex items-center gap-3 px-4 py-3 rounded-xl transition-all ${
                  activeSection === "notifications"
                    ? "bg-gradient-to-r from-purple-600/20 to-pink-600/20 border border-purple-500/30 text-white"
                    : "text-gray-400 hover:text-white hover:bg-white/5"
                }`}
              >
                <Bell className="w-5 h-5" />
                <span className="font-medium">Notifications</span>
              </button>
              <button
                onClick={() => setActiveSection("privacy")}
                className={`w-full flex items-center gap-3 px-4 py-3 rounded-xl transition-all ${
                  activeSection === "privacy"
                    ? "bg-gradient-to-r from-purple-600/20 to-pink-600/20 border border-purple-500/30 text-white"
                    : "text-gray-400 hover:text-white hover:bg-white/5"
                }`}
              >
                <Shield className="w-5 h-5" />
                <span className="font-medium">Privacy & Security</span>
              </button>
            </motion.aside>

            {/* Main Settings Content */}
            <motion.div
              initial={{ opacity: 0, x: 20 }}
              animate={{ opacity: 1, x: 0 }}
              transition={{ duration: 0.6 }}
              className="rounded-3xl p-8 bg-[#1a1a1a] border border-white/10"
            >
              {/* Profile Section */}
              {activeSection === "profile" && (
                <div className="space-y-6">
                  <h2 className="text-2xl font-bold text-white mb-6">Profile Settings</h2>

                  <div>
                    <label className="block text-sm font-medium text-gray-300 mb-2">Display Name</label>
                    <input
                      type="text"
                      value={displayName}
                      onChange={(e) => setDisplayName(e.target.value)}
                      className="w-full px-4 py-3 rounded-xl bg-[#0a0a0a] border border-white/10 text-white placeholder-gray-500 focus:outline-none focus:ring-2 focus:ring-purple-500 transition-all"
                    />
                  </div>

                  <div>
                    <label className="block text-sm font-medium text-gray-300 mb-2">Bio</label>
                    <textarea
                      value={bio}
                      onChange={(e) => setBio(e.target.value)}
                      rows={4}
                      className="w-full px-4 py-3 rounded-xl bg-[#0a0a0a] border border-white/10 text-white placeholder-gray-500 focus:outline-none focus:ring-2 focus:ring-purple-500 transition-all resize-none"
                    />
                  </div>

                  <div>
                    <label className="block text-sm font-medium text-gray-300 mb-2">Profile Picture</label>
                    <div className="flex items-center gap-4">
                      <div className="w-20 h-20 rounded-full bg-gradient-to-br from-purple-600/20 to-pink-600/20 border border-purple-500/30 flex items-center justify-center">
                        <User className="w-10 h-10 text-purple-400" />
                      </div>
                      <button className="px-4 py-2 rounded-xl bg-white/5 border border-white/10 text-gray-300 hover:text-white hover:bg-white/10 transition-all">
                        Upload New Photo
                      </button>
                    </div>
                  </div>

                  <motion.button
                    whileHover={{ scale: 1.02 }}
                    whileTap={{ scale: 0.98 }}
                    className="px-6 py-3 bg-gradient-to-r from-purple-600 to-pink-600 hover:from-purple-500 hover:to-pink-500 rounded-xl text-white font-semibold transition-all shadow-lg shadow-purple-500/25"
                  >
                    Save Changes
                  </motion.button>
                </div>
              )}

              {/* Account Section */}
              {activeSection === "account" && (
                <div className="space-y-6">
                  <h2 className="text-2xl font-bold text-white mb-6">Account Settings</h2>

                  <div>
                    <label className="block text-sm font-medium text-gray-300 mb-2">Email Address</label>
                    <input
                      type="email"
                      value={userEmail}
                      onChange={(e) => setUserEmail(e.target.value)}
                      className="w-full px-4 py-3 rounded-xl bg-[#0a0a0a] border border-white/10 text-white placeholder-gray-500 focus:outline-none focus:ring-2 focus:ring-purple-500 transition-all"
                    />
                  </div>

                  <div>
                    <label className="block text-sm font-medium text-gray-300 mb-2">Change Password</label>
                    <input
                      type="password"
                      placeholder="Current password"
                      className="w-full px-4 py-3 rounded-xl bg-[#0a0a0a] border border-white/10 text-white placeholder-gray-500 focus:outline-none focus:ring-2 focus:ring-purple-500 transition-all mb-3"
                    />
                    <input
                      type="password"
                      placeholder="New password"
                      className="w-full px-4 py-3 rounded-xl bg-[#0a0a0a] border border-white/10 text-white placeholder-gray-500 focus:outline-none focus:ring-2 focus:ring-purple-500 transition-all mb-3"
                    />
                    <input
                      type="password"
                      placeholder="Confirm new password"
                      className="w-full px-4 py-3 rounded-xl bg-[#0a0a0a] border border-white/10 text-white placeholder-gray-500 focus:outline-none focus:ring-2 focus:ring-purple-500 transition-all"
                    />
                  </div>

                  <motion.button
                    whileHover={{ scale: 1.02 }}
                    whileTap={{ scale: 0.98 }}
                    className="px-6 py-3 bg-gradient-to-r from-purple-600 to-pink-600 hover:from-purple-500 hover:to-pink-500 rounded-xl text-white font-semibold transition-all shadow-lg shadow-purple-500/25"
                  >
                    Update Account
                  </motion.button>

                  <div className="pt-6 mt-6 border-t border-white/10">
                    <h3 className="text-lg font-semibold text-white mb-3">Danger Zone</h3>
                    <button className="px-4 py-2 rounded-xl bg-red-600/10 border border-red-500/30 text-red-400 hover:bg-red-600/20 transition-all">
                      Delete Account
                    </button>
                  </div>
                </div>
              )}

              {/* Notifications Section */}
              {activeSection === "notifications" && (
                <div className="space-y-6">
                  <h2 className="text-2xl font-bold text-white mb-6">Notification Preferences</h2>

                  <div className="space-y-4">
                    <div className="flex items-center justify-between p-4 rounded-xl bg-[#0a0a0a] border border-white/10">
                      <div>
                        <p className="text-white font-medium">Email Notifications</p>
                        <p className="text-gray-400 text-sm">Receive notifications via email</p>
                      </div>
                      <button
                        onClick={() => setEmailNotifications(!emailNotifications)}
                        className={`relative w-12 h-6 rounded-full transition-colors ${
                          emailNotifications ? "bg-purple-600" : "bg-gray-600"
                        }`}
                      >
                        <motion.div
                          animate={{ x: emailNotifications ? 24 : 2 }}
                          transition={{ duration: 0.2 }}
                          className="absolute top-1 w-4 h-4 rounded-full bg-white"
                        />
                      </button>
                    </div>

                    <div className="flex items-center justify-between p-4 rounded-xl bg-[#0a0a0a] border border-white/10">
                      <div>
                        <p className="text-white font-medium">Push Notifications</p>
                        <p className="text-gray-400 text-sm">Receive push notifications</p>
                      </div>
                      <button
                        onClick={() => setPushNotifications(!pushNotifications)}
                        className={`relative w-12 h-6 rounded-full transition-colors ${
                          pushNotifications ? "bg-purple-600" : "bg-gray-600"
                        }`}
                      >
                        <motion.div
                          animate={{ x: pushNotifications ? 24 : 2 }}
                          transition={{ duration: 0.2 }}
                          className="absolute top-1 w-4 h-4 rounded-full bg-white"
                        />
                      </button>
                    </div>

                    <div className="flex items-center justify-between p-4 rounded-xl bg-[#0a0a0a] border border-white/10">
                      <div>
                        <p className="text-white font-medium">New Supporter</p>
                        <p className="text-gray-400 text-sm">When someone supports your project</p>
                      </div>
                      <button
                        onClick={() => setNewSupporter(!newSupporter)}
                        className={`relative w-12 h-6 rounded-full transition-colors ${
                          newSupporter ? "bg-purple-600" : "bg-gray-600"
                        }`}
                      >
                        <motion.div
                          animate={{ x: newSupporter ? 24 : 2 }}
                          transition={{ duration: 0.2 }}
                          className="absolute top-1 w-4 h-4 rounded-full bg-white"
                        />
                      </button>
                    </div>

                    <div className="flex items-center justify-between p-4 rounded-xl bg-[#0a0a0a] border border-white/10">
                      <div>
                        <p className="text-white font-medium">Goal Reached</p>
                        <p className="text-gray-400 text-sm">When a funding goal is reached</p>
                      </div>
                      <button
                        onClick={() => setGoalReached(!goalReached)}
                        className={`relative w-12 h-6 rounded-full transition-colors ${
                          goalReached ? "bg-purple-600" : "bg-gray-600"
                        }`}
                      >
                        <motion.div
                          animate={{ x: goalReached ? 24 : 2 }}
                          transition={{ duration: 0.2 }}
                          className="absolute top-1 w-4 h-4 rounded-full bg-white"
                        />
                      </button>
                    </div>
                  </div>
                </div>
              )}

              {/* Privacy Section */}
              {activeSection === "privacy" && (
                <div className="space-y-6">
                  <h2 className="text-2xl font-bold text-white mb-6">Privacy & Security</h2>

                  <div className="space-y-4">
                    <div className="flex items-center justify-between p-4 rounded-xl bg-[#0a0a0a] border border-white/10">
                      <div>
                        <p className="text-white font-medium">Public Profile</p>
                        <p className="text-gray-400 text-sm">Allow others to view your profile</p>
                      </div>
                      <button
                        onClick={() => setProfileVisibility(!profileVisibility)}
                        className={`relative w-12 h-6 rounded-full transition-colors ${
                          profileVisibility ? "bg-purple-600" : "bg-gray-600"
                        }`}
                      >
                        <motion.div
                          animate={{ x: profileVisibility ? 24 : 2 }}
                          transition={{ duration: 0.2 }}
                          className="absolute top-1 w-4 h-4 rounded-full bg-white"
                        />
                      </button>
                    </div>

                    <div className="flex items-center justify-between p-4 rounded-xl bg-[#0a0a0a] border border-white/10">
                      <div>
                        <p className="text-white font-medium">Show on Leaderboard</p>
                        <p className="text-gray-400 text-sm">Display your rank on public leaderboards</p>
                      </div>
                      <button
                        onClick={() => setShowLeaderboard(!showLeaderboard)}
                        className={`relative w-12 h-6 rounded-full transition-colors ${
                          showLeaderboard ? "bg-purple-600" : "bg-gray-600"
                        }`}
                      >
                        <motion.div
                          animate={{ x: showLeaderboard ? 24 : 2 }}
                          transition={{ duration: 0.2 }}
                          className="absolute top-1 w-4 h-4 rounded-full bg-white"
                        />
                      </button>
                    </div>

                    <div className="p-4 rounded-xl bg-[#0a0a0a] border border-white/10">
                      <div className="flex items-start gap-3 mb-3">
                        <Key className="w-5 h-5 text-purple-400 mt-0.5" />
                        <div>
                          <p className="text-white font-medium">Two-Factor Authentication</p>
                          <p className="text-gray-400 text-sm mb-3">Add an extra layer of security to your account</p>
                          <button className="px-4 py-2 rounded-xl bg-white/5 border border-white/10 text-gray-300 hover:text-white hover:bg-white/10 transition-all">
                            Enable 2FA
                          </button>
                        </div>
                      </div>
                    </div>

                    <div className="p-4 rounded-xl bg-[#0a0a0a] border border-white/10">
                      <div className="flex items-start gap-3">
                        <Lock className="w-5 h-5 text-purple-400 mt-0.5" />
                        <div>
                          <p className="text-white font-medium">Connected Accounts</p>
                          <p className="text-gray-400 text-sm mb-3">Manage your connected social accounts</p>
                          <div className="space-y-2">
                            <button className="w-full px-4 py-2 rounded-xl bg-white/5 border border-white/10 text-gray-300 hover:text-white hover:bg-white/10 transition-all text-left">
                              Twitter - @username
                            </button>
                            <button className="w-full px-4 py-2 rounded-xl bg-white/5 border border-white/10 text-gray-300 hover:text-white hover:bg-white/10 transition-all text-left">
                              Instagram - @username
                            </button>
                          </div>
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

      {/* Footer */}
      <footer className="py-16 px-6 border-t border-white/5">
        <div className="max-w-7xl mx-auto text-center text-gray-400">
          <p>© 2026 TipFlow. All rights reserved.</p>
        </div>
      </footer>
    </div>
  );
}
