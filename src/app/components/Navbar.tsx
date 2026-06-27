import { motion } from "motion/react";
import { useState, useEffect, useRef } from "react";
import { useLocation, useNavigate } from "react-router-dom";
import { Search, LogOut, LayoutDashboard, BarChart3, Settings as SettingsIcon, DollarSign, Link2, Trophy } from "lucide-react";
import ThemeToggle from "./ThemeToggle";
import XPBar from "./XPBar";
import { useAuth } from "../../contexts/AuthContext";
import { searchApi } from "../../lib/api";
import { Sounds } from "../../lib/sounds";
import type { GamificationState } from "../../lib/types";
import { getInitials, formatCurrencyPrecise } from "../../lib/format";

interface NavbarProps {
  creditBalance: number;
  userType: "creator" | "supporter";
  gamification?: GamificationState;
}

export default function Navbar({ creditBalance, userType, gamification }: NavbarProps) {
  const [searchQuery, setSearchQuery] = useState("");
  const [showSearchDropdown, setShowSearchDropdown] = useState(false);
  const [searchResults, setSearchResults] = useState<{
    creators: { name: string; username: string; initials: string }[];
    supporters: { name: string; username: string; initials: string }[];
  }>({ creators: [], supporters: [] });
  const searchTimeout = useRef<ReturnType<typeof setTimeout> | null>(null);
  const navigate = useNavigate();
  const location = useLocation();
  const { logout } = useAuth();

  function nav(path: string) {
    Sounds.click();
    navigate(path);
  }

  // Debounced search
  useEffect(() => {
    if (searchQuery.length < 2) {
      setSearchResults({ creators: [], supporters: [] });
      return;
    }
    if (searchTimeout.current) clearTimeout(searchTimeout.current);
    searchTimeout.current = setTimeout(async () => {
      const res = await searchApi.search(searchQuery);
      if (res.success && res.data) {
        setSearchResults({
          creators: res.data.creators.map(c => ({
            name: c.displayName,
            username: `@${c.username}`,
            initials: getInitials(c.displayName),
          })),
          supporters: res.data.supporters.map(s => ({
            name: s.displayName,
            username: `@${s.username}`,
            initials: getInitials(s.displayName),
          })),
        });
      }
    }, 300);
    return () => { if (searchTimeout.current) clearTimeout(searchTimeout.current); };
  }, [searchQuery]);

  const path = location.pathname;

  const creatorLinks = [
    { label: "Dashboard", icon: LayoutDashboard, path: "/dashboard" },
    { label: "Analytics", icon: BarChart3, path: "/analytics" },
    { label: "Referrals", icon: Link2, path: "/referrals" },
    { label: "Leaderboard", icon: Trophy, path: "/leaderboard" },
    { label: "Settings", icon: SettingsIcon, path: "/settings" },
  ];

  const supporterLinks = [
    { label: "Community", icon: LayoutDashboard, path: "/supporter" },
    { label: "Leaderboard", icon: Trophy, path: "/leaderboard" },
    { label: "Settings", icon: SettingsIcon, path: "/settings" },
  ];

  const navLinks = userType === "creator" ? creatorLinks : supporterLinks;

  return (
    <nav className="fixed top-0 left-0 right-0 z-50 bg-nav border-b border-accent/40">
      <div className="max-w-full mx-auto px-6 py-4 flex items-center justify-between">
        <div className="flex items-center gap-8">
          <img src="/rory-word.svg" alt="Rory" className="h-9" />
          <div className="hidden md:flex items-center gap-1">
            {navLinks.map((link) => {
              const isActive = path === link.path
                || (link.path === "/dashboard" && path.startsWith("/dashboard"))
                || (link.path === "/supporter" && path.startsWith("/supporter"));
              const Icon = link.icon;
              return (
                <button
                  key={link.path}
                  onClick={() => nav(link.path)}
                  className={
                    isActive
                      ? "flex items-center gap-2 px-4 py-2 bg-accent text-white font-medium text-sm transition-all"
                      : "flex items-center gap-2 px-4 py-2 text-gray-300 hover:text-white hover:bg-white/5 font-medium text-sm transition-all"
                  }
                >
                  <Icon className="w-4 h-4" />
                  {link.label}
                </button>
              );
            })}
          </div>
        </div>

        <div className="flex items-center gap-4">
          {/* Gamification widgets — supporter only */}
          {userType === "supporter" && gamification && (
            <XPBar gamification={gamification} />
          )}

          <button
            onClick={() => { Sounds.click(); navigate("/settings?section=balance"); }}
            className="flex items-center gap-2 px-3 py-2 border border-white/20 text-white hover:bg-white/10 transition-colors text-sm font-medium"
          >
            <DollarSign className="w-4 h-4 text-accent" />
            <span className="hidden sm:inline">{formatCurrencyPrecise(creditBalance)}</span>
          </button>

          <div className="relative hidden sm:block">
            <Search className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-white/40 z-10" />
            <input
              type="text"
              placeholder="Search creators & supporters"
              value={searchQuery}
              onChange={(e) => { setSearchQuery(e.target.value); setShowSearchDropdown(true); }}
              onFocus={() => setShowSearchDropdown(true)}
              onBlur={() => setTimeout(() => setShowSearchDropdown(false), 200)}
              className="pl-10 pr-4 py-2 bg-white/10 border border-white/20 text-white placeholder-white/30 text-sm focus:outline-none focus:ring-2 focus:ring-accent transition-all w-56"
            />
            {showSearchDropdown && searchQuery.length > 0 && (
              <motion.div
                initial={{ opacity: 0, y: -10 }}
                animate={{ opacity: 1, y: 0 }}
                className="absolute top-full mt-2 left-0 w-72 bg-background border border-border shadow-lg overflow-hidden z-50"
              >
                {searchResults.creators.length > 0 && (
                  <div className="p-3">
                    <h3 className="eyebrow mb-2 px-2">Creators</h3>
                    {searchResults.creators.map((creator, index) => (
                      <div
                        key={index}
                        onClick={() => { nav(`/creator/${creator.username.replace("@", "")}`); setSearchQuery(""); setShowSearchDropdown(false); }}
                        className="flex items-center gap-3 p-2 hover:bg-muted cursor-pointer transition-colors"
                      >
                        <div className="w-8 h-8 bg-muted border border-border flex items-center justify-center text-foreground font-bold text-xs">{creator.initials}</div>
                        <div className="flex-1">
                          <p className="text-foreground font-medium text-sm">{creator.name}</p>
                          <p className="text-subtle text-xs">{creator.username}</p>
                        </div>
                      </div>
                    ))}
                  </div>
                )}
                {searchResults.supporters.length > 0 && (
                  <div className="p-3 border-t border-border">
                    <h3 className="eyebrow mb-2 px-2">Supporters</h3>
                    {searchResults.supporters.map((supporter, index) => (
                      <div
                        key={index}
                        onClick={() => { nav(`/supporter/${supporter.username.replace("@", "")}`); setSearchQuery(""); setShowSearchDropdown(false); }}
                        className="flex items-center gap-3 p-2 hover:bg-muted cursor-pointer transition-colors"
                      >
                        <div className="w-8 h-8 bg-muted border border-border flex items-center justify-center text-foreground font-bold text-xs">{supporter.initials}</div>
                        <div className="flex-1">
                          <p className="text-foreground font-medium text-sm">{supporter.name}</p>
                          <p className="text-subtle text-xs">{supporter.username}</p>
                        </div>
                      </div>
                    ))}
                  </div>
                )}
                {searchResults.creators.length === 0 && searchResults.supporters.length === 0 && (
                  <div className="p-6 text-center text-subtle text-sm">No results for "{searchQuery}"</div>
                )}
              </motion.div>
            )}
          </div>

          <ThemeToggle />
          <button
            onClick={async () => { Sounds.click(); await logout(); navigate("/"); }}
            className="flex items-center gap-2 px-4 py-2 border border-white/20 text-white hover:bg-white/10 text-sm font-medium transition-colors"
          >
            <LogOut className="w-4 h-4" />
            <span className="hidden sm:inline">Logout</span>
          </button>
        </div>
      </div>
    </nav>
  );
}
