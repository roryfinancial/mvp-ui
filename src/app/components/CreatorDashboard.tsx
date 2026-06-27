import { useState, useEffect, useRef } from "react";
import { motion, AnimatePresence } from "motion/react";
import { Sounds } from "../../lib/sounds";
import ConfettiBurst from "./Confetti";
import { ImageWithFallback } from "./figma/ImageWithFallback";
import { Plus, User, Gift, TrendingUp, Check, ArrowUp, Twitter, Instagram, Youtube, Twitch, ChevronDown, ChevronLeft, ChevronRight, List, ShoppingBag, Trophy, Loader2, Trash2, X, Calendar, Clock, MapPin, RefreshCw, Link2, Eye, Heart, Pin } from "lucide-react";
import { useAuth } from "../../contexts/AuthContext";
import { projectApi, giftApi, eventApi, feedApi } from "../../lib/api";
import type { ProjectResponse, RecentSupporterResponse, TopSupporterResponse, EventResponse, FeedPostResponse } from "../../lib/api";
import AddPostDialog from "./AddPostDialog";
import { SectionLabel } from "./shared/SectionLabel";
import { UserListItem } from "./shared/UserListItem";
import { EmptyState } from "./shared/EmptyState";
import { StatMiniCard } from "./shared/StatMiniCard";
import { ProgressBar } from "./shared/ProgressBar";
import { fadeUp, fadeUpFast, fadeIn, scaleIn, btnHover, staggerFadeUp, staggerSlideLeft } from "../../lib/motion";
import { formatCurrency, formatEventDate, formatShortDate, formatCompact, calcProgress, parseMoney } from "../../lib/format";

interface CreatorDashboardProps {
  username?: string;
  initialProjectId?: number | null;
  creditBalance?: number;
  shopifyStore?: { name: string; url: string } | null;
  onLogout?: () => void
  onCreateProject?: () => void;
  onAddItem?: () => void;
  onCreateEvent?: () => void;
}

interface Supporter {
  name: string;
  amount: string;
  initials: string;
  timeAgo: string;
}

interface ProjectItem {
  id: string;
  title: string;
  description: string;
  goal: string;
  raised: string;
  progress: number;
  status: "active" | "completed";
  thumbnail?: string | null;
  pinned: boolean;
}

interface DashboardProject {
  id: string;
  name: string;
  description: string;
  coverImage?: string | null;
  items: ProjectItem[];
}

export default function CreatorDashboard({ username: propUsername, initialProjectId = null, shopifyStore = null, onCreateProject, onAddItem, onCreateEvent }: CreatorDashboardProps) {
  const { user } = useAuth();
  const username = user?.username ?? propUsername ?? "Username";

  const [selectedProjectId, setSelectedProjectId] = useState<string | null>(initialProjectId?.toString() ?? null);
  const [selectedItemIndex, setSelectedItemIndex] = useState<number | null>(null);
  const [itemTab, setItemTab] = useState<"active" | "completed" | "all">("active");
  const [confettiTitle, setConfettiTitle] = useState<string | null>(null);
  const firedFunded = useRef(false);

  const [dataLoading, setDataLoading] = useState(true);
  const [dataError, setDataError] = useState<string | null>(null);

  // Item-level recent supporters
  const [itemSupporters, setItemSupporters] = useState<Supporter[]>([]);
  const [itemSupportersLoading, setItemSupportersLoading] = useState(false);

  // Delete confirmation state
  const [deleteTarget, setDeleteTarget] = useState<{ type: "project"; projectId: string } | { type: "item"; projectId: string; itemId: string } | null>(null);
  const [deleteLoading, setDeleteLoading] = useState(false);

  async function handleDelete() {
    if (!deleteTarget) return;
    setDeleteLoading(true);
    try {
      if (deleteTarget.type === "project") {
        const res = await projectApi.delete(deleteTarget.projectId);
        if (res.success) {
          setProjects(prev => prev.filter(p => p.id !== deleteTarget.projectId));
          if (selectedProjectId === deleteTarget.projectId) {
            setSelectedProjectId(null);
            setSelectedItemIndex(null);
          }
        }
      } else {
        const res = await projectApi.deleteItem(deleteTarget.projectId, deleteTarget.itemId);
        if (res.success) {
          setProjects(prev => prev.map(p =>
            p.id === deleteTarget.projectId
              ? { ...p, items: p.items.filter(i => i.id !== deleteTarget.itemId) }
              : p
          ));
          if (selectedItemIndex !== null) setSelectedItemIndex(null);
        }
      }
    } catch {
      // silently fail — could add toast later
    }
    setDeleteLoading(false);
    setDeleteTarget(null);
  }

  // Post sync state
  const [syncing, setSyncing] = useState(false);
  const [syncResult, setSyncResult] = useState<{ newPosts: number } | null>(null);
  const [addPostOpen, setAddPostOpen] = useState(false);
  const [myPosts, setMyPosts] = useState<FeedPostResponse[]>([]);
  const [postsLoaded, setPostsLoaded] = useState(false);
  const [postsPage, setPostsPage] = useState(0);
  const [postsTotalPages, setPostsTotalPages] = useState(0);
  const [postsTotalElements, setPostsTotalElements] = useState(0);
  const [postsLoadingPage, setPostsLoadingPage] = useState(false);
  const [postsPlatformFilter, setPostsPlatformFilter] = useState<string>("ALL");

  // Dynamic data from API
  const [projects, setProjects] = useState<DashboardProject[]>([]);
  const [events, setEvents] = useState<EventResponse[]>([]);
  const [recentSupporters, setRecentSupporters] = useState<Supporter[]>([]);
  const [topSupportersLeaderboard, setTopSupportersLeaderboard] = useState<
    { rank: number; name: string; initials: string; totalAmount: string; contributions: number }[]
  >([]);
  const [weeklyTopGifter, setWeeklyTopGifter] = useState<{ name: string; initials: string; amount: string } | null>(null);
  const [pinningItemId, setPinningItemId] = useState<string | null>(null);

  async function handleTogglePin(projectId: string, target: ProjectItem) {
    if (pinningItemId) return;
    const next = !target.pinned;
    setPinningItemId(target.id);
    const res = await projectApi.setItemPinned(projectId, target.id, next);
    if (res.success) {
      Sounds.softClick();
      // Mirror the server's single-pin-per-project rule locally.
      setProjects((prev) =>
        prev.map((p) =>
          p.id !== projectId
            ? p
            : {
                ...p,
                items: p.items.map((it) =>
                  it.id === target.id
                    ? { ...it, pinned: next }
                    : next
                      ? { ...it, pinned: false }
                      : it,
                ),
              },
        ),
      );
    }
    setPinningItemId(null);
  }

  // Fetch recent supporters when an item is selected
  useEffect(() => {
    if (selectedItemIndex === null || selectedProjectId === null) {
      setItemSupporters([]);
      return;
    }
    const currentProject = projects.find(w => w.id === selectedProjectId);
    if (!currentProject) return;
    const item = currentProject.items[selectedItemIndex];
    if (!item) return;

    let cancelled = false;
    setItemSupportersLoading(true);
    giftApi.getRecentSupportersByItem(item.id, 5).then(res => {
      if (cancelled) return;
      if (res.success && res.data) {
        setItemSupporters(
          res.data.map((s: RecentSupporterResponse) => ({
            name: s.supporterDisplayName,
            amount: `$${s.amount}`,
            initials: s.supporterInitials,
            timeAgo: s.timeAgo,
          }))
        );
      }
    }).catch(() => {
      if (!cancelled) setItemSupporters([]);
    }).finally(() => {
      if (!cancelled) setItemSupportersLoading(false);
    });
    return () => { cancelled = true; };
  }, [selectedItemIndex, selectedProjectId, projects]);

  // Fire funded sound + confetti once when projects load with a completed item
  useEffect(() => {
    if (firedFunded.current) return;
    const funded = projects.flatMap((p) => p.items).find((i) => i.status === "completed");
    if (funded) {
      firedFunded.current = true;
      setTimeout(() => Sounds.achievement(), 300);
      setTimeout(() => Sounds.funded(), 800);
      setConfettiTitle(funded.title);
      setTimeout(() => setConfettiTitle(null), 3500);
    }
  // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [projects]);

  useEffect(() => {
    let cancelled = false;
    async function loadData() {
      setDataLoading(true);
      setDataError(null);

      try {
        const [projectRes, recentRes, topRes, weeklyTopRes, eventRes, postsRes] = await Promise.all([
          projectApi.getMyProjects(),
          giftApi.getRecentSupporters(username, 5),
          giftApi.getTopSupporters(username, 10),
          giftApi.getTopSupporters(username, 1, "week"),
          eventApi.getMyEvents(),
          feedApi.getMyPosts(0, 12),
        ]);

        if (cancelled) return;

        if (projectRes.success && projectRes.data) {
          setProjects(
            projectRes.data.map((w: ProjectResponse) => ({
              id: w.id,
              name: w.name,
              description: w.description,
              coverImage: w.coverImageUrl,
              items: w.items.map((item) => ({
                id: item.id,
                title: item.title,
                description: item.description,
                goal: formatCurrency(item.goalAmount),
                raised: formatCurrency(item.raisedAmount),
                progress: item.progress,
                status: item.status === "ACTIVE" ? "active" as const : "completed" as const,
                thumbnail: item.thumbnailUrl,
                pinned: item.pinned,
              })),
            }))
          );
        }

        if (recentRes.success && recentRes.data) {
          setRecentSupporters(
            recentRes.data.map((s: RecentSupporterResponse) => ({
              name: s.supporterDisplayName,
              amount: formatCurrency(s.amount),
              initials: s.supporterInitials,
              timeAgo: s.timeAgo,
            }))
          );
        }

        if (topRes.success && topRes.data) {
          setTopSupportersLeaderboard(
            topRes.data.map((s: TopSupporterResponse) => ({
              rank: s.rank,
              name: s.supporterDisplayName,
              initials: s.supporterInitials,
              totalAmount: formatCurrency(s.totalAmount),
              contributions: s.contributionCount,
            }))
          );
        }

        if (weeklyTopRes.success && weeklyTopRes.data && weeklyTopRes.data.length > 0) {
          const t = weeklyTopRes.data[0];
          setWeeklyTopGifter({
            name: t.supporterDisplayName || t.supporterUsername || "a supporter",
            initials: t.supporterInitials,
            amount: formatCurrency(t.totalAmount),
          });
        } else if (!cancelled) {
          setWeeklyTopGifter(null);
        }

        if (eventRes.success && eventRes.data) {
          setEvents(eventRes.data);
        }

        if (postsRes.success && postsRes.data) {
          setMyPosts(postsRes.data.content);
          setPostsPage(postsRes.data.page);
          setPostsTotalPages(postsRes.data.totalPages);
          setPostsTotalElements(postsRes.data.totalElements);
          setPostsLoaded(true);
        }
      } catch {
        if (!cancelled) setDataError("Failed to load dashboard data. Please refresh.");
      }

      if (!cancelled) setDataLoading(false);
    }
    loadData();
    return () => { cancelled = true; };
  }, [username]);

  const totalRaised = formatCurrency(
    projects.flatMap((w) => w.items).reduce((sum, i) => sum + parseMoney(i.raised), 0)
  );
  const totalActiveItems = projects.flatMap(w => w.items).filter(i => i.status === "active").length;
  const totalSupporters = recentSupporters.length;

  if (dataLoading) {
    return (
      <div className="min-h-screen bg-background text-foreground">
        <div className="flex flex-col lg:grid lg:grid-cols-[320px_1fr] gap-0 min-h-screen pt-[57px]">
          {/* Sidebar skeleton */}
          <aside className="w-full lg:h-[calc(100vh-57px)] bg-muted p-6 flex flex-col gap-8 border-r border-border">
            <div className="flex items-center gap-4">
              <div className="w-14 h-14 rounded-full skeleton" />
              <div className="flex-1 space-y-2">
                <div className="h-4 w-28 skeleton" />
                <div className="h-2 w-16 skeleton" />
              </div>
            </div>
            <div className="space-y-2">
              {Array.from({ length: 3 }).map((_, i) => <div key={i} className="h-12 w-full skeleton" />)}
            </div>
            <div className="space-y-2">
              {Array.from({ length: 4 }).map((_, i) => <div key={i} className="h-9 w-full skeleton" />)}
            </div>
          </aside>
          {/* Main skeleton */}
          <main className="flex-1 p-8 space-y-8">
            <div className="h-28 w-full skeleton" />
            <div className="grid grid-cols-1 sm:grid-cols-2 xl:grid-cols-3 gap-4">
              {Array.from({ length: 6 }).map((_, i) => <div key={i} className="h-44 w-full skeleton" />)}
            </div>
          </main>
        </div>
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-background text-foreground">
      {/* Main Layout */}
      <div className="flex flex-col lg:grid lg:grid-cols-[320px_1fr] gap-0 min-h-screen pt-[57px]">
        {/* Left Sidebar */}
        <aside className="order-2 lg:order-1 w-full lg:sticky lg:top-[57px] lg:h-[calc(100vh-57px)] bg-muted p-6 flex flex-col overflow-y-auto border-r border-border">
          {/* Profile */}
          <motion.div {...fadeUp} className="flex items-center gap-4 mb-8 pb-8 border-b border-border">
            <div className="w-14 h-14 rounded-full bg-secondary border border-border flex items-center justify-center flex-shrink-0">
              <User className="w-6 h-6 text-muted-foreground" />
            </div>
            <div className="flex-1 min-w-0">
              <div className="flex items-center gap-2">
                <h1 className="text-base font-black text-foreground leading-tight truncate">{username}</h1>
                <div className="w-4 h-4 bg-accent flex items-center justify-center flex-shrink-0">
                  <Check className="w-2.5 h-2.5 text-white" />
                </div>
              </div>
              <p className="text-xs text-subtle uppercase tracking-wide font-bold mt-0.5">Creator</p>
              <div className="flex gap-3 mt-2">
                <a href="#" className="text-subtle hover:text-[#1d9bf0] transition-colors"><Twitter className="w-3.5 h-3.5" /></a>
                <a href="#" className="text-subtle hover:text-[#e1306c] transition-colors"><Instagram className="w-3.5 h-3.5" /></a>
                <a href="#" className="text-subtle hover:text-[#ff0000] transition-colors"><Youtube className="w-3.5 h-3.5" /></a>
                <a href="#" className="text-subtle hover:text-[#9146ff] transition-colors"><Twitch className="w-3.5 h-3.5" /></a>
              </div>
            </div>
          </motion.div>

          {/* Linked Shopify Store */}
          {shopifyStore && (
            <motion.div {...fadeUp} transition={{ duration: 0.5, delay: 0.05 }} className="mb-8 pb-8 border-b border-border">
              <SectionLabel>Linked Store</SectionLabel>
              <a
                href={shopifyStore.url}
                target="_blank"
                rel="noopener noreferrer"
                className="flex items-center gap-3 p-3 bg-background border border-border hover:border-accent/50 transition-colors group"
              >
                <div className="w-8 h-8 bg-[#95BF47]/15 flex items-center justify-center flex-shrink-0">
                  <ShoppingBag className="w-4 h-4 text-[#95BF47]" />
                </div>
                <div className="flex-1 min-w-0">
                  <p className="text-foreground font-bold text-sm truncate group-hover:text-accent transition-colors">{shopifyStore.name}</p>
                  <p className="text-subtle text-[10px] uppercase tracking-wide font-bold">Shopify</p>
                </div>
                <div className="w-2 h-2 rounded-full bg-success flex-shrink-0" title="Connected" />
              </a>
            </motion.div>
          )}
          {/* Stats */}
          <motion.div {...fadeUp} transition={{ duration: 0.5, delay: 0.1 }} className="mb-8">
            <SectionLabel>Overview</SectionLabel>
            <div className="space-y-2">
              <StatMiniCard label="Total Raised" value={totalRaised} icon={TrendingUp} valueStyle={{ color: "var(--accent)" }} />
              <StatMiniCard label="Active Items" value={totalActiveItems} icon={Gift} />
              <StatMiniCard label="Supporters" value={totalSupporters} icon={User} />
            </div>
          </motion.div>

          {/* Recent Supporters */}
          <motion.div {...fadeUp} transition={{ duration: 0.5, delay: 0.2 }} className="mb-auto">
            <SectionLabel>Recent Supporters</SectionLabel>
            <ul className="space-y-2">
              {recentSupporters.slice(0, 5).map((supporter, index) => (
                <motion.li key={index} {...staggerSlideLeft(index)} className="py-0.5">
                  <UserListItem
                    initials={supporter.initials}
                    name={supporter.name}
                    subtitle={supporter.timeAgo}
                    metric={supporter.amount}
                    className="border-0 bg-transparent p-2"
                  />
                </motion.li>
              ))}
            </ul>
          </motion.div>

          {/* Action Buttons */}
          <div className="mt-6 space-y-2">
            <motion.button
              {...staggerFadeUp(0, 0.3)} {...btnHover}
              onClick={() => { Sounds.click(); onAddItem?.(); }}
              className="w-full flex items-center justify-center gap-2 px-6 py-3 btn-cta text-white font-black text-xs uppercase tracking-widest"
            >
              <Plus className="w-4 h-4" />
              Add Item
            </motion.button>
            <motion.button
              {...staggerFadeUp(1, 0.3)} {...btnHover}
              onClick={() => { Sounds.softClick(); onCreateProject?.(); }}
              className="w-full flex items-center justify-center gap-2 px-6 py-3 border border-border bg-background hover:bg-muted text-foreground font-bold text-xs uppercase tracking-wide transition-colors"
            >
              <List className="w-4 h-4" />
              New Project
            </motion.button>
            <motion.button
              {...staggerFadeUp(2, 0.3)} {...btnHover}
              onClick={() => { Sounds.softClick(); onCreateEvent?.(); }}
              className="w-full flex items-center justify-center gap-2 px-6 py-3 border border-border bg-background hover:bg-muted text-foreground font-bold text-xs uppercase tracking-wide transition-colors"
            >
              <Calendar className="w-4 h-4" />
              New Event
            </motion.button>

            {/* Post Management */}
            <div className="pt-4 mt-4 border-t border-border space-y-2">
              <SectionLabel className="mb-2">Content</SectionLabel>
              <motion.button
                {...staggerFadeUp(3, 0.3)} {...btnHover}
                onClick={async () => {
                  setSyncing(true);
                  setSyncResult(null);
                  const res = await feedApi.syncPosts();
                  if (res.success && res.data) {
                    setSyncResult({ newPosts: res.data.newPosts });
                    // Reload posts from page 0
                    const postsRes = await feedApi.getMyPosts(0, 12);
                    if (postsRes.success && postsRes.data) {
                      setMyPosts(postsRes.data.content);
                      setPostsPage(0);
                      setPostsTotalPages(postsRes.data.totalPages);
                      setPostsTotalElements(postsRes.data.totalElements);
                      setPostsLoaded(true);
                    }
                  }
                  setSyncing(false);
                }}
                disabled={syncing}
                className="w-full flex items-center justify-center gap-2 px-6 py-3 border border-border bg-background hover:bg-muted text-foreground font-bold text-xs uppercase tracking-wide transition-colors disabled:opacity-50"
              >
                {syncing ? <Loader2 className="w-4 h-4 animate-spin" /> : <RefreshCw className="w-4 h-4" />}
                {syncing ? "Syncing..." : "Sync Posts"}
              </motion.button>
              <motion.button
                {...staggerFadeUp(4, 0.3)} {...btnHover}
                onClick={() => { Sounds.softClick(); setAddPostOpen(true); }}
                className="w-full flex items-center justify-center gap-2 px-6 py-3 border border-border bg-background hover:bg-muted text-foreground font-bold text-xs uppercase tracking-wide transition-colors"
              >
                <Link2 className="w-4 h-4" />
                Add Post
              </motion.button>
              {syncResult && (
                <motion.p
                  initial={{ opacity: 0 }}
                  animate={{ opacity: 1 }}
                  className="text-[11px] text-center text-green-600 font-medium"
                >
                  {syncResult.newPosts > 0 ? `${syncResult.newPosts} new post${syncResult.newPosts !== 1 ? "s" : ""} synced!` : "All posts up to date"}
                </motion.p>
              )}
            </div>
          </div>
        </aside>

        {/* Main Content */}
        <main className="order-1 lg:order-2 flex-1 p-8 bg-background">
          {dataError && (
            <div className="mb-6 p-4 border border-destructive/30 bg-destructive/10 text-destructive text-sm font-medium">
              {dataError}
            </div>
          )}

          {/* Earnings + primary CTA — the first thing a creator should see */}
          <motion.div
            initial={{ opacity: 0, y: 16 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ duration: 0.4 }}
            className="mb-8 p-6 border border-border bg-muted"
          >
            <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-5">
              <div>
                <SectionLabel className="mb-1">Total Earned</SectionLabel>
                <p className="text-4xl font-black tracking-tight text-accent">{totalRaised}</p>
                <p className="text-xs text-subtle font-medium mt-1">You keep 100% — Rory never takes a cut.</p>
              </div>
              <motion.button
                {...btnHover}
                onClick={() => { Sounds.click(); onAddItem?.(); }}
                className="flex items-center justify-center gap-2 px-6 py-4 btn-cta text-white font-black text-xs uppercase tracking-widest whitespace-nowrap"
              >
                <Plus className="w-4 h-4" />
                Create a New Gift
              </motion.button>
            </div>

            {/* Fan spotlight */}
            {weeklyTopGifter && (
              <div className="mt-5 pt-5 border-t border-border flex items-center gap-3">
                <div className="w-9 h-9 rounded-full bg-accent/15 text-accent flex items-center justify-center flex-shrink-0">
                  <Trophy className="w-4 h-4" />
                </div>
                <p className="text-sm text-foreground">
                  Your top gifter this week is{" "}
                  <span className="font-black text-accent">{weeklyTopGifter.name}</span>
                  <span className="text-subtle font-medium"> — {weeklyTopGifter.amount} contributed this week</span>
                </p>
              </div>
            )}
          </motion.div>

          <AnimatePresence mode="wait">
            {selectedProjectId === null ? (
              <motion.div
                key="grid"
                initial={{ opacity: 0, y: 16 }}
                animate={{ opacity: 1, y: 0 }}
                exit={{ opacity: 0, y: -8 }}
                transition={{ duration: 0.3 }}
              >
                <div className="flex items-center justify-between mb-8">
                  <div className="flex items-center gap-3">
                    <h2 className="text-2xl font-black text-foreground tracking-tight">My Projects</h2>
                    <span className="px-2 py-0.5 border border-border text-subtle text-xs font-bold">{projects.length}</span>
                  </div>
                  <motion.button
                    {...btnHover}
                    onClick={onCreateProject}
                    className="hidden sm:flex items-center gap-2 px-4 py-2 border border-border hover:bg-muted text-foreground font-bold text-xs uppercase tracking-wide transition-colors"
                  >
                    <Plus className="w-3.5 h-3.5" />
                    New Project
                  </motion.button>
                </div>

                <div className="grid grid-cols-1 sm:grid-cols-2 xl:grid-cols-3 gap-4">
                  {projects.map((project, wIndex) => {
                    const activeCount = project.items.filter(i => i.status === "active").length;
                    const totalGoalAmt = project.items.reduce((sum, i) => sum + parseMoney(i.goal), 0);
                    const totalRaisedAmt = project.items.reduce((sum, i) => sum + parseMoney(i.raised), 0);

                    return (
                      <motion.div
                        key={project.id}
                        initial={{ opacity: 0, y: 20 }}
                        animate={{ opacity: 1, y: 0 }}
                        transition={{ duration: 0.35, delay: wIndex * 0.07 }}
                        whileHover={{ y: -2 }}
                        onClick={() => { Sounds.softClick(); setSelectedProjectId(project.id); setSelectedItemIndex(null); setItemTab("active"); }}
                        className="bg-background border border-border rounded-xl overflow-hidden cursor-pointer group card-game"
                      >
                        <div className="relative h-32 overflow-hidden bg-muted">
                          {project.coverImage ? (
                            <ImageWithFallback src={project.coverImage} alt={project.name} className="w-full h-full object-cover group-hover:scale-105 transition-transform duration-500" />
                          ) : (
                            <div className="w-full h-full flex items-center justify-center gap-3">
                              {[...Array(3)].map((_, i) => (
                                <div key={i} className="w-12 h-12 border border-border bg-background flex items-center justify-center">
                                  <Gift className="w-6 h-6 text-subtle" />
                                </div>
                              ))}
                            </div>
                          )}
                          <button
                            onClick={(e) => { e.stopPropagation(); setDeleteTarget({ type: "project", projectId: project.id }); }}
                            className="absolute top-2 left-2 w-7 h-7 bg-background/80 backdrop-blur-sm border border-border hover:bg-destructive hover:border-destructive hover:text-white text-subtle flex items-center justify-center opacity-0 group-hover:opacity-100 transition-all"
                            title="Delete project"
                          >
                            <Trash2 className="w-3.5 h-3.5" />
                          </button>
                          <div className="absolute top-2 right-2 px-2 py-0.5 bg-background border border-border text-[10px] font-black uppercase tracking-wide text-muted-foreground">
                            {project.items.length} {project.items.length === 1 ? "item" : "items"}
                          </div>
                        </div>

                        <div className="p-5">
                          <h3 className="text-base font-black text-foreground mb-1 group-hover:text-accent transition-colors">
                            {project.name}
                          </h3>
                          <p className="text-muted-foreground text-xs mb-4 line-clamp-2">{project.description}</p>

                          <div className="flex items-center gap-4 text-[10px] text-subtle mb-3 font-bold uppercase tracking-wide">
                            <span className="flex items-center gap-1">
                              <span className="w-1.5 h-1.5 rounded-full bg-accent inline-block" />
                              {activeCount} active
                            </span>
                            <span className="flex items-center gap-1">
                              <span className="w-1.5 h-1.5 rounded-full bg-success-strong inline-block" />
                              {project.items.filter(i => i.status === "completed").length} funded
                            </span>
                          </div>

                          <div className="flex items-center justify-between mb-2">
                            <span className="text-[10px] font-bold uppercase tracking-widest text-subtle">Funding Goal</span>
                            <span className="text-foreground font-black text-sm">{formatCurrency(totalGoalAmt)}</span>
                          </div>

                          {(() => {
                            const pct = calcProgress(totalRaisedAmt, totalGoalAmt);
                            return (
                              <div>
                                <ProgressBar value={pct} className="w-full h-1 bg-secondary" duration={1} delay={0.3 + wIndex * 0.1} />
                                <div className="flex items-center justify-between mt-1">
                                  <span className="text-[10px] text-subtle font-bold">{formatCurrency(totalRaisedAmt)} raised</span>
                                  <span className="text-[10px] text-subtle font-bold">{pct}%</span>
                                </div>
                              </div>
                            );
                          })()}
                        </div>
                      </motion.div>
                    );
                  })}
                </div>

                {/* My Top Supporters Leaderboard */}
                <motion.div {...fadeUp} transition={{ duration: 0.5, delay: 0.2 }} className="mt-10">
                  <div className="flex items-center justify-between mb-6">
                    <div className="flex items-center gap-3">
                      <Trophy className="w-5 h-5 text-accent" />
                      <h2 className="text-2xl font-black text-foreground tracking-tight">My Top Supporters</h2>
                    </div>
                  </div>

                  <div className="border border-border overflow-hidden">
                    {/* Header */}
                    <div className="grid grid-cols-[48px_1fr_100px_100px] sm:grid-cols-[48px_1fr_120px_120px] gap-3 px-5 py-3 bg-muted border-b border-border">
                      <span className="eyebrow">#</span>
                      <span className="eyebrow">Supporter</span>
                      <span className="eyebrow text-right">Tips</span>
                      <span className="eyebrow text-right">Total</span>
                    </div>

                    {/* Rows */}
                    {topSupportersLeaderboard.map((supporter, index) => {
                      const rankColors: Record<number, string> = {
                        1: "bg-medal-gold text-black",
                        2: "bg-medal-silver text-black",
                        3: "bg-medal-bronze text-white",
                      };
                      const rankClass = rankColors[supporter.rank] || "bg-muted text-subtle";

                      return (
                        <motion.div
                          key={supporter.rank}
                          {...staggerSlideLeft(index, 0.25, 0.04)}
                          className={`grid grid-cols-[48px_1fr_100px_100px] sm:grid-cols-[48px_1fr_120px_120px] gap-3 px-5 py-3 items-center border-b border-border last:border-b-0 hover:bg-muted/50 transition-colors ${
                            supporter.rank <= 3 ? "bg-accent/[0.03]" : ""
                          }`}
                        >
                          <div className={`w-7 h-7 flex items-center justify-center text-xs font-black ${rankClass}`}>
                            {supporter.rank}
                          </div>
                          <div className="flex items-center gap-3 min-w-0">
                            <div className="w-8 h-8 bg-secondary flex items-center justify-center text-foreground font-bold text-xs flex-shrink-0">
                              {supporter.initials}
                            </div>
                            <span className="text-sm font-bold text-foreground truncate">{supporter.name}</span>
                          </div>
                          <span className="text-sm text-subtle text-right">{supporter.contributions}</span>
                          <span className="text-sm font-black text-accent text-right">{supporter.totalAmount}</span>
                        </motion.div>
                      );
                    })}
                  </div>
                </motion.div>

                {/* My Posts - Per-post project dropdown */}
                {postsLoaded && myPosts.length > 0 && (
                  <motion.div {...fadeUp} transition={{ duration: 0.4, delay: 0.2 }} className="mt-10">
                    <div className="flex items-center justify-between mb-4">
                      <div className="flex items-center gap-3">
                        <h2 className="text-2xl font-black text-foreground tracking-tight">My Posts</h2>
                        <span className="px-2 py-0.5 border border-border text-subtle text-xs font-bold">{postsTotalElements}</span>
                      </div>
                    </div>

                    {/* Platform filter tabs */}
                    <div className="flex gap-1.5 mb-4 overflow-x-auto pb-1">
                      {["ALL", "YOUTUBE", "TWITCH", "TWITTER", "INSTAGRAM", "TIKTOK"].map((p) => {
                        const count = p === "ALL" ? myPosts.length : myPosts.filter(post => post.platform === p).length;
                        if (p !== "ALL" && count === 0) return null;
                        const colors: Record<string, string> = { YOUTUBE: "#FF0000", TWITCH: "#9146FF", TWITTER: "#1DA1F2", INSTAGRAM: "#E4405F", TIKTOK: "#00f2ea" };
                        const isActive = postsPlatformFilter === p;
                        return (
                          <button
                            key={p}
                            onClick={() => setPostsPlatformFilter(p)}
                            className={`px-3 py-1.5 text-[10px] font-black uppercase tracking-wider flex-shrink-0 border transition-colors ${
                              isActive
                                ? p !== "ALL" ? "text-white" : "bg-foreground text-background border-foreground"
                                : "border-border text-subtle hover:text-foreground hover:border-foreground/30"
                            }`}
                            style={isActive && p !== "ALL" ? { backgroundColor: colors[p], borderColor: colors[p] } : undefined}
                          >
                            {p === "ALL" ? "All" : p}
                          </button>
                        );
                      })}
                    </div>

                    <div className="grid grid-cols-1 sm:grid-cols-2 xl:grid-cols-3 gap-4">
                      {myPosts
                        .filter(post => postsPlatformFilter === "ALL" || post.platform === postsPlatformFilter)
                        .map((post) => (
                            <div key={post.id} className="bg-background border border-border rounded-xl overflow-hidden group hover:border-accent/30 transition-colors">
                              {/* Thumbnail */}
                              <div className="relative h-36 bg-muted overflow-hidden">
                                {post.thumbnailUrl ? (
                                  <ImageWithFallback src={post.thumbnailUrl} alt="" className="w-full h-full object-cover group-hover:scale-105 transition-transform duration-300" />
                                ) : (
                                  <div className="w-full h-full flex items-center justify-center text-subtle">
                                    <Plus className="w-6 h-6 rotate-45" />
                                  </div>
                                )}
                                <div className="absolute top-2 left-2 flex items-center gap-1.5 px-2 py-1 bg-black/60 backdrop-blur-sm rounded-sm">
                                  <span className="text-white text-[9px] font-bold uppercase tracking-wide">{post.platform}</span>
                                </div>
                                {post.platformUrl && (
                                  <a
                                    href={post.platformUrl}
                                    target="_blank"
                                    rel="noopener noreferrer"
                                    className="absolute top-2 right-2 p-1.5 bg-black/40 backdrop-blur-sm text-white/80 hover:text-white rounded-sm transition-colors"
                                    onClick={(e) => e.stopPropagation()}
                                  >
                                    <Link2 className="w-3 h-3" />
                                  </a>
                                )}
                              </div>

                              {/* Content */}
                              <div className="p-3 space-y-2.5">
                                <p className="text-xs font-bold text-foreground line-clamp-2 leading-snug min-h-[2.25rem]">
                                  {post.caption || "Untitled"}
                                </p>

                                {/* Stats row */}
                                <div className="flex items-center gap-3 text-[10px] text-subtle">
                                  {post.platformViews > 0 && (
                                    <span className="flex items-center gap-0.5"><Eye className="w-3 h-3" />{formatCompact(post.platformViews)}</span>
                                  )}
                                  {post.platformLikes > 0 && (
                                    <span className="flex items-center gap-0.5"><Heart className="w-3 h-3" />{formatCompact(post.platformLikes)}</span>
                                  )}
                                  {post.platformCreatedAt && (
                                    <span className="ml-auto">{formatShortDate(post.platformCreatedAt)}</span>
                                  )}
                                </div>

                                {/* Project dropdown */}
                                <div className="relative">
                                  <select
                                    value={post.linkedProject?.projectId || ""}
                                    onChange={async (e) => {
                                      const projectId = e.target.value || null;
                                      const res = await feedApi.linkPostToProject(post.id, projectId);
                                      if (res.success && res.data) {
                                        setMyPosts(prev => prev.map(p => p.id === post.id ? res.data! : p));
                                      }
                                    }}
                                    className="w-full px-3 py-2.5 text-xs font-bold border border-border rounded-lg bg-muted text-foreground focus:outline-none focus:border-accent transition-colors cursor-pointer appearance-none pr-8"
                                  >
                                    <option value="">— Assign to project —</option>
                                    {projects.map((p) => (
                                      <option key={p.id} value={p.id}>{p.name}</option>
                                    ))}
                                  </select>
                                  <ChevronDown className="absolute right-2.5 top-1/2 -translate-y-1/2 w-3.5 h-3.5 text-subtle pointer-events-none" />
                                </div>

                                {/* Linked project badge */}
                                {post.linkedProject && (
                                  <div className="flex items-center gap-1.5 text-[10px] font-bold px-2 py-1 border border-accent/30 bg-accent/5 text-accent rounded-md">
                                    <Check className="w-3 h-3" />
                                    {post.linkedProject.projectName}
                                    <span className="ml-auto opacity-60">{Math.round(post.linkedProject.progress * 100)}%</span>
                                  </div>
                                )}
                              </div>
                            </div>
                        ))}
                    </div>

                    {/* Pagination */}
                    {postsTotalPages > 1 && (
                      <div className="flex items-center justify-center gap-3 mt-6">
                        <button
                          onClick={async () => {
                            if (postsPage <= 0 || postsLoadingPage) return;
                            setPostsLoadingPage(true);
                            const res = await feedApi.getMyPosts(postsPage - 1, 12);
                            if (res.success && res.data) {
                              setMyPosts(res.data.content);
                              setPostsPage(res.data.page);
                              setPostsTotalPages(res.data.totalPages);
                              setPostsTotalElements(res.data.totalElements);
                            }
                            setPostsLoadingPage(false);
                          }}
                          disabled={postsPage <= 0 || postsLoadingPage}
                          className="flex items-center gap-1 px-3 py-2 text-xs font-bold border border-border hover:bg-muted text-foreground disabled:opacity-30 disabled:cursor-not-allowed transition-colors"
                        >
                          <ChevronLeft className="w-3.5 h-3.5" />
                          Prev
                        </button>
                        <span className="text-xs text-subtle font-bold">
                          {postsLoadingPage ? (
                            <Loader2 className="w-3.5 h-3.5 animate-spin" />
                          ) : (
                            `${postsPage + 1} / ${postsTotalPages}`
                          )}
                        </span>
                        <button
                          onClick={async () => {
                            if (postsPage >= postsTotalPages - 1 || postsLoadingPage) return;
                            setPostsLoadingPage(true);
                            const res = await feedApi.getMyPosts(postsPage + 1, 12);
                            if (res.success && res.data) {
                              setMyPosts(res.data.content);
                              setPostsPage(res.data.page);
                              setPostsTotalPages(res.data.totalPages);
                              setPostsTotalElements(res.data.totalElements);
                            }
                            setPostsLoadingPage(false);
                          }}
                          disabled={postsPage >= postsTotalPages - 1 || postsLoadingPage}
                          className="flex items-center gap-1 px-3 py-2 text-xs font-bold border border-border hover:bg-muted text-foreground disabled:opacity-30 disabled:cursor-not-allowed transition-colors"
                        >
                          Next
                          <ChevronRight className="w-3.5 h-3.5" />
                        </button>
                      </div>
                    )}
                  </motion.div>
                )}

                {/* My Events */}
                <motion.div {...fadeUp} transition={{ duration: 0.5, delay: 0.3 }} className="mt-10">
                  <div className="flex items-center justify-between mb-6">
                    <div className="flex items-center gap-3">
                      <Calendar className="w-5 h-5 text-accent" />
                      <h2 className="text-2xl font-black text-foreground tracking-tight">My Events</h2>
                      <span className="px-2 py-0.5 border border-border text-subtle text-xs font-bold">{events.length}</span>
                    </div>
                    <motion.button
                      {...btnHover}
                      onClick={onCreateEvent}
                      className="hidden sm:flex items-center gap-2 px-4 py-2 border border-border hover:bg-muted text-foreground font-bold text-xs uppercase tracking-wide transition-colors"
                    >
                      <Plus className="w-3.5 h-3.5" />
                      New Event
                    </motion.button>
                  </div>

                  {events.length === 0 ? (
                    <EmptyState icon={Calendar} message="No events yet" sub="Create an event to show on your public profile." />
                  ) : (
                    <div className="grid grid-cols-1 sm:grid-cols-2 xl:grid-cols-3 gap-4">
                      {events.map((event, eIndex) => {
                        const eventDate = new Date(event.eventDate + "T00:00:00");
                        const isPast = eventDate < new Date(new Date().toDateString());
                        const formattedDate = formatEventDate(event.eventDate);
                        return (
                          <motion.div
                            key={event.id}
                            initial={{ opacity: 0, y: 20 }}
                            animate={{ opacity: 1, y: 0 }}
                            transition={{ duration: 0.35, delay: eIndex * 0.07 }}
                            className={`bg-background border border-border rounded-xl overflow-hidden group card-game ${isPast ? "opacity-60" : ""}`}
                          >
                            <div className="relative h-28 overflow-hidden bg-muted">
                              {event.imageUrl ? (
                                <ImageWithFallback src={event.imageUrl} alt={event.title} className="w-full h-full object-cover" />
                              ) : (
                                <div className="w-full h-full bg-gradient-to-br from-accent/10 to-accent/5 flex items-center justify-center">
                                  <Calendar className="w-10 h-10 text-accent/30" />
                                </div>
                              )}
                              <button
                                onClick={() => {
                                  setDeleteTarget(null);
                                  (async () => {
                                    const res = await eventApi.delete(event.id);
                                    if (res.success) setEvents(prev => prev.filter(e => e.id !== event.id));
                                  })();
                                }}
                                className="absolute top-2 left-2 w-7 h-7 bg-background/80 backdrop-blur-sm border border-border hover:bg-destructive hover:border-destructive hover:text-white text-subtle flex items-center justify-center opacity-0 group-hover:opacity-100 transition-all"
                                title="Delete event"
                              >
                                <Trash2 className="w-3.5 h-3.5" />
                              </button>
                              {isPast && (
                                <div className="absolute top-2 right-2 px-2 py-0.5 bg-muted border border-border text-[10px] font-black uppercase tracking-wide text-subtle">
                                  Past
                                </div>
                              )}
                            </div>
                            <div className="p-4">
                              <h4 className="text-sm font-black text-foreground mb-2">{event.title}</h4>
                              <div className="space-y-1 text-xs text-muted-foreground">
                                <div className="flex items-center gap-1.5">
                                  <Calendar className="w-3 h-3 text-accent" />
                                  {formattedDate}
                                </div>
                                {event.eventTime && (
                                  <div className="flex items-center gap-1.5">
                                    <Clock className="w-3 h-3 text-accent" />
                                    {event.eventTime}
                                  </div>
                                )}
                                {event.location && (
                                  <div className="flex items-center gap-1.5">
                                    <MapPin className="w-3 h-3 text-accent" />
                                    {event.location}
                                  </div>
                                )}
                              </div>
                              {event.description && (
                                <p className="text-xs text-subtle mt-2 line-clamp-2">{event.description}</p>
                              )}
                            </div>
                          </motion.div>
                        );
                      })}
                    </div>
                  )}
                </motion.div>
              </motion.div>
            ) : selectedItemIndex !== null ? (
              (() => {
                const currentProject = projects.find(w => w.id === selectedProjectId)!;
                const item = currentProject.items[selectedItemIndex];
                return (
                  <motion.div
                    key={`item-${selectedProjectId}-${selectedItemIndex}`}
                    initial={{ opacity: 0, y: 16 }}
                    animate={{ opacity: 1, y: 0 }}
                    exit={{ opacity: 0, y: -8 }}
                    transition={{ duration: 0.3 }}
                  >
                    <div className="flex items-center gap-2 mb-8 text-sm">
                      <button onClick={() => setSelectedProjectId(null)} className="text-subtle hover:text-foreground transition-colors font-medium">My Projects</button>
                      <span className="text-subtle">/</span>
                      <button onClick={() => setSelectedItemIndex(null)} className="text-subtle hover:text-foreground transition-colors font-medium">{currentProject.name}</button>
                      <span className="text-subtle">/</span>
                      <span className="text-foreground font-bold truncate max-w-[200px]">{item.title}</span>
                    </div>

                    <div className="flex flex-col sm:flex-row gap-6 mb-10">
                      <div className="w-full sm:w-48 h-48 flex-shrink-0 bg-muted border border-border flex items-center justify-center">
                        {item.thumbnail ? (
                          <ImageWithFallback src={item.thumbnail} alt={item.title} className="w-full h-full object-cover" />
                        ) : (
                          <Gift className="w-16 h-16 text-subtle" />
                        )}
                      </div>
                      <div className="flex-1">
                        <div className="flex items-center gap-3 mb-2 flex-wrap">
                          <h2 className="text-3xl font-black text-foreground tracking-tight">{item.title}</h2>
                          <div className={`px-2 py-1 flex items-center gap-1.5 text-[10px] font-black uppercase tracking-widest border ${
                            item.status === "completed"
                              ? "tag-funded"
                              : "tag-active"
                          }`}>
                            {item.status === "completed" ? <><Check className="w-3 h-3" />Funded</> : <><ArrowUp className="w-3 h-3" />Active</>}
                          </div>
                          <button
                            onClick={() => handleTogglePin(currentProject.id, item)}
                            disabled={pinningItemId === item.id}
                            title={item.pinned ? "Unpin from top of your profile" : "Pin to top of your profile"}
                            className={`px-2 py-1 flex items-center gap-1.5 text-[10px] font-black uppercase tracking-widest border transition-colors disabled:opacity-50 ${
                              item.pinned
                                ? "bg-accent border-accent text-white"
                                : "border-border text-subtle hover:border-accent hover:text-accent"
                            }`}
                          >
                            {pinningItemId === item.id ? <Loader2 className="w-3 h-3 animate-spin" /> : <Pin className="w-3 h-3" />}
                            {item.pinned ? "Pinned" : "Pin"}
                          </button>
                        </div>
                        <p className="text-muted-foreground mb-6 leading-relaxed text-sm">{item.description}</p>
                        <div className="p-4 bg-muted border border-border">
                          <div className="flex items-center justify-between">
                            <span className="text-[10px] font-bold uppercase tracking-widest text-subtle">Funding Goal</span>
                            <span className="text-2xl font-black text-foreground">{item.goal}</span>
                          </div>
                        </div>
                      </div>
                    </div>

                    <div>
                      <div className="flex items-center gap-2 mb-4">
                        <span className="w-3 h-px bg-accent" />
                        <SectionLabel className="mb-0">Recent Supporters</SectionLabel>
                      </div>
                      <div className="space-y-2">
                        {itemSupportersLoading ? (
                          <div className="flex items-center justify-center py-8">
                            <Loader2 className="w-5 h-5 animate-spin text-subtle" />
                          </div>
                        ) : itemSupporters.length === 0 ? (
                          <p className="text-subtle text-sm py-4">No supporters yet</p>
                        ) : (
                          itemSupporters.map((s, i) => (
                            <motion.div key={i} {...staggerSlideLeft(i, 0, 0.06)}>
                              <UserListItem initials={s.initials} name={s.name} subtitle={s.timeAgo} metric={s.amount} />
                            </motion.div>
                          ))
                        )}
                      </div>
                    </div>
                  </motion.div>
                );
              })()
            ) : (
              (() => {
                const currentProject = projects.find(w => w.id === selectedProjectId)!;
                const filteredItems = currentProject.items.filter(item => {
                  if (itemTab === "active") return item.status === "active";
                  if (itemTab === "completed") return item.status === "completed";
                  return true;
                });
                return (
                  <motion.div
                    key="detail"
                    initial={{ opacity: 0, y: 16 }}
                    animate={{ opacity: 1, y: 0 }}
                    exit={{ opacity: 0, y: -8 }}
                    transition={{ duration: 0.3 }}
                  >
                    <div className="flex items-center justify-between mb-8">
                      <div className="flex items-center gap-2 min-w-0">
                        <button
                          onClick={() => { setSelectedProjectId(null); setSelectedItemIndex(null); }}
                          className="flex items-center gap-1.5 text-subtle hover:text-foreground transition-colors text-sm font-medium flex-shrink-0"
                        >
                          <ChevronDown className="w-4 h-4 rotate-90" />
                          My Projects
                        </button>
                        <span className="text-subtle">/</span>
                        <span className="text-foreground font-bold text-sm truncate">{currentProject.name}</span>
                      </div>
                      <div className="hidden sm:flex items-center gap-2">
                        <motion.button
                          whileHover={{ scale: 1.01 }}
                          whileTap={{ scale: 0.99 }}
                          onClick={() => setDeleteTarget({ type: "project", projectId: currentProject.id })}
                          className="flex items-center gap-2 px-4 py-2 border border-border hover:bg-destructive hover:border-destructive hover:text-white text-subtle font-bold text-xs uppercase tracking-wide transition-colors"
                        >
                          <Trash2 className="w-3.5 h-3.5" />
                          Delete
                        </motion.button>
                        <motion.button
                          whileHover={{ scale: 1.01 }}
                          whileTap={{ scale: 0.99 }}
                          onClick={onAddItem}
                          className="flex items-center gap-2 px-4 py-2 btn-cta text-white font-bold text-xs uppercase tracking-wide"
                        >
                          <Plus className="w-3.5 h-3.5" />
                          Add Item
                        </motion.button>
                      </div>
                    </div>

                    <div className="mb-8">
                      <h2 className="text-3xl font-black text-foreground mb-1 tracking-tight">{currentProject.name}</h2>
                      <p className="text-muted-foreground text-sm">{currentProject.description}</p>
                    </div>

                    <div className="flex gap-6 mb-8 border-b border-border">
                      {(["active", "completed", "all"] as const).map(t => (
                        <button
                          key={t}
                          onClick={() => { Sounds.softClick(); setItemTab(t); }}
                          className={`pb-4 text-sm font-bold capitalize transition-colors relative ${
                            itemTab === t ? "text-foreground" : "text-subtle hover:text-foreground"
                          }`}
                        >
                          {t}
                          {itemTab === t && (
                            <motion.div layoutId="itemTab" className="absolute bottom-0 left-0 right-0 h-0.5 bg-accent" />
                          )}
                        </button>
                      ))}
                    </div>

                    {filteredItems.length === 0 ? (
                      <EmptyState icon={Gift} message={`No ${itemTab === "all" ? "" : itemTab} items yet`.replace(/\s+/g, " ")} sub="Add a gift item for supporters to fund." />
                    ) : (
                      <div className="grid grid-cols-1 sm:grid-cols-2 xl:grid-cols-3 gap-4">
                        {filteredItems.map((item, index) => (
                          <motion.div
                            key={index}
                            initial={{ opacity: 0, y: 16 }}
                            animate={{ opacity: 1, y: 0 }}
                            transition={{ duration: 0.3, delay: index * 0.05 }}
                            whileHover={{ y: -2 }}
                            onClick={() => setSelectedItemIndex(currentProject.items.indexOf(item))}
                            className="relative bg-background border border-border rounded-xl overflow-hidden cursor-pointer group card-game"
                          >
                            {/* Confetti burst for funded item */}
                            <ConfettiBurst active={confettiTitle === item.title} mode="local" count={30} />
                            <div className="relative w-full h-36 flex items-center justify-center bg-muted">
                              <Gift className="w-12 h-12 text-subtle" />
                              <button
                                onClick={(e) => { e.stopPropagation(); setDeleteTarget({ type: "item", projectId: currentProject.id, itemId: item.id }); }}
                                className="absolute top-2 left-2 w-7 h-7 bg-background/80 backdrop-blur-sm border border-border hover:bg-destructive hover:border-destructive hover:text-white text-subtle flex items-center justify-center opacity-0 group-hover:opacity-100 transition-all"
                                title="Delete item"
                              >
                                <Trash2 className="w-3.5 h-3.5" />
                              </button>
                              <div className={`absolute top-2 right-2 px-2 py-1 flex items-center gap-1 border text-[10px] font-black uppercase tracking-widest ${
                                item.status === "completed"
                                  ? "tag-funded"
                                  : "tag-active"
                              }`}>
                                {item.status === "completed" ? <><Check className="w-2.5 h-2.5" />Done</> : <><ArrowUp className="w-2.5 h-2.5" />Active</>}
                              </div>
                            </div>

                            <div className="p-4">
                              <h4 className="text-sm font-black text-foreground mb-1 group-hover:text-accent transition-colors">
                                {item.title}
                              </h4>
                              <p className="text-subtle text-xs mb-4 line-clamp-2">{item.description}</p>
                              <div className="flex items-center justify-between">
                                <span className="text-[10px] font-bold uppercase tracking-widest text-subtle">Goal</span>
                                <span className="text-foreground font-black text-sm">{item.goal}</span>
                              </div>
                            </div>
                          </motion.div>
                        ))}
                      </div>
                    )}
                  </motion.div>
                );
              })()
            )}
          </AnimatePresence>
        </main>
      </div>

      {/* Delete Confirmation Modal */}
      <AnimatePresence>
        {deleteTarget && (
          <motion.div
            {...fadeIn}
            className="fixed inset-0 z-[100] flex items-center justify-center bg-black/60 backdrop-blur-sm p-4"
            onClick={() => !deleteLoading && setDeleteTarget(null)}
          >
            <motion.div
              {...scaleIn}
              className="bg-background border border-border w-full max-w-sm overflow-hidden"
              onClick={(e) => e.stopPropagation()}
            >
              <div className="flex items-center justify-between p-5 border-b border-border">
                <div className="flex items-center gap-3">
                  <div className="w-8 h-8 bg-destructive/10 flex items-center justify-center">
                    <Trash2 className="w-4 h-4 text-destructive" />
                  </div>
                  <h3 className="text-sm font-black text-foreground">
                    Delete {deleteTarget.type === "project" ? "Project" : "Item"}
                  </h3>
                </div>
                <button
                  onClick={() => setDeleteTarget(null)}
                  disabled={deleteLoading}
                  className="w-8 h-8 flex items-center justify-center text-subtle hover:text-foreground"
                >
                  <X className="w-5 h-5" />
                </button>
              </div>
              <div className="p-5">
                <p className="text-sm text-muted-foreground mb-1">
                  Are you sure you want to delete this {deleteTarget.type}?
                </p>
                <p className="text-xs text-subtle">
                  {deleteTarget.type === "project"
                    ? "All items in this project will also be deleted. This cannot be undone."
                    : "This cannot be undone."}
                </p>
              </div>
              <div className="flex gap-2 p-5 pt-0">
                <button
                  onClick={() => setDeleteTarget(null)}
                  disabled={deleteLoading}
                  className="flex-1 py-2.5 border border-border text-foreground text-xs font-bold uppercase tracking-widest hover:bg-muted transition-colors"
                >
                  Cancel
                </button>
                <button
                  onClick={handleDelete}
                  disabled={deleteLoading}
                  className="flex-1 py-2.5 bg-destructive hover:bg-destructive disabled:opacity-50 text-white text-xs font-black uppercase tracking-widest transition-colors flex items-center justify-center gap-2"
                >
                  {deleteLoading ? <Loader2 className="w-4 h-4 animate-spin" /> : <Trash2 className="w-3.5 h-3.5" />}
                  {deleteLoading ? "Deleting..." : "Delete"}
                </button>
              </div>
            </motion.div>
          </motion.div>
        )}
      </AnimatePresence>

      {/* Add Post Dialog */}
      <AddPostDialog
        open={addPostOpen}
        onClose={() => setAddPostOpen(false)}
        onPostCreated={async () => {
          const postsRes = await feedApi.getMyPosts(0, 12);
          if (postsRes.success && postsRes.data) {
            setMyPosts(postsRes.data.content);
            setPostsPage(0);
            setPostsTotalPages(postsRes.data.totalPages);
            setPostsTotalElements(postsRes.data.totalElements);
            setPostsLoaded(true);
          }
        }}
        projects={projects.map(p => ({ id: p.id, name: p.name, description: p.description, coverImageUrl: p.coverImage ?? null, isPublic: true, goalAmount: 0, raisedAmount: 0, progress: 0, items: [], createdAt: "" }))}
      />
    </div>
  );
}
