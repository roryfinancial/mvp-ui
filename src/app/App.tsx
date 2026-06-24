import { type ReactNode, useCallback, useEffect, useState } from "react";
import { Routes, Route, useNavigate, useLocation, useParams, useSearchParams, Outlet, Navigate } from "react-router-dom";
import { Helmet } from "react-helmet-async";
import { Loader2 } from "lucide-react";
import Navbar from "./components/Navbar";
import { useAuth } from "../contexts/AuthContext";
import { gamificationApi } from "../lib/api";
import type { GamificationState, LeagueTier, BadgeId } from "../lib/types";

import Home from "./pages/Home";
import Auth from "./components/Auth";
import ConnectPlatforms from "./components/ConnectPlatforms";
import OnboardingChoice from "./components/OnboardingChoice";
import CreatorDashboard from "./components/CreatorDashboard";
import CommunityHub from "./components/CommunityHub";
import CreateProject from "./components/CreateProject";
import CreateProjectPage from "./components/CreateProjectPage";
import ProjectOverview from "./components/ProjectOverview";
import CreatorProfile from "./components/CreatorProfile";
import Settings from "./components/Settings";
import Analytics from "./components/Analytics";
import Referrals from "./components/Referrals";
import Leaderboard from "./components/Leaderboard";
import PublicWishlist from "./components/PublicWishlist";
import SupporterProfile from "./components/SupporterProfile";
import CreateEventPage from "./components/CreateEventPage";
import FounderSuggestions from "./components/FounderSuggestions";

type UserType = "creator" | "supporter";

const DEMO_SHOPIFY_STORE = { name: "My Creator Store", url: "https://my-creator-store.myshopify.com" };

// ─── Loading screen while Supabase session initializes ───────────────────────
function AuthLoading() {
  return (
    <div className="min-h-screen flex items-center justify-center bg-muted">
      <Loader2 className="w-8 h-8 animate-spin text-accent" />
    </div>
  );
}

// ─── Route guard — redirects unauthenticated users to /auth ──────────────────
function RequireAuth({ children }: { children: ReactNode }) {
  const { isAuthenticated, loading, user } = useAuth();
  if (loading) return <AuthLoading />;
  if (!isAuthenticated) return <Navigate to="/login" replace />;
  // New users with provisional profile get redirected to onboarding
  if (user && !user.isProfileComplete) return <Navigate to="/onboarding" replace />;
  return <>{children}</>;
}

// ─── Layout: always requires auth, always shows Navbar ───────────────────────
function AuthenticatedLayout({ creditBalance, userType, gamification }: { creditBalance: number; userType: UserType; gamification?: GamificationState }) {
  const { isAuthenticated, loading, user } = useAuth();
  if (loading) return <AuthLoading />;
  if (!isAuthenticated) return <Navigate to="/login" replace />;
  // New users with provisional profile get redirected to onboarding
  if (user && !user.isProfileComplete) return <Navigate to="/onboarding" replace />;
  return (
    <>
      <Navbar creditBalance={creditBalance} userType={userType} gamification={gamification} />
      <Outlet />
    </>
  );
}

// ─── Layout: public pages that show the Navbar only when logged in ────────────
function PublicLayout({ creditBalance, userType, gamification }: { creditBalance: number; userType: UserType; gamification?: GamificationState }) {
  const { isAuthenticated } = useAuth();
  return (
    <>
      {isAuthenticated && <Navbar creditBalance={creditBalance} userType={userType} gamification={gamification} />}
      <Outlet />
    </>
  );
}

// ─── Route wrappers inject navigation via useNavigate ────────────────────────

function HomeRoute() {
  const navigate = useNavigate();
  return (
    <>
      <Helmet>
        <title>Rory — Fan Gifts. Low Fees.</title>
        <meta name="description" content="Rory lets creators set goals for their projects and fans donate to help achieve them — with low platform fees." />
        <link rel="canonical" href="https://rory.com/" />
      </Helmet>
      <Home
        onNavigateToAuth={() => navigate("/login")}
        onNavigateToLogin={() => navigate("/login")}
        onNavigateToSignUp={() => navigate("/signup")}
      />
    </>
  );
}

function LoginRoute() {
  const navigate = useNavigate();
  const { user } = useAuth();
  function handleAuthComplete(type: "creator" | "supporter") {
    if (user && !user.isProfileComplete) {
      navigate(type === "creator" ? "/connect-platforms" : "/onboarding");
    } else {
      navigate(type === "creator" ? "/dashboard" : "/supporter");
    }
  }
  return (
    <>
      <Helmet>
        <title>Log In — Rory</title>
        <meta name="description" content="Sign in to your Rory account." />
      </Helmet>
      <Auth
        mode="login"
        onBack={() => navigate("/")}
        onAuthComplete={handleAuthComplete}
        onSwitchMode={() => navigate("/signup")}
      />
    </>
  );
}

function SignUpRoute() {
  const navigate = useNavigate();
  return (
    <>
      <Helmet>
        <title>Sign Up — Rory</title>
        <meta name="description" content="Create your Rory account to start gifting or building your project." />
      </Helmet>
      <Auth
        mode="signup"
        onBack={() => navigate("/")}
        onAuthComplete={(type) => navigate(type === "creator" ? "/connect-platforms" : "/onboarding")}
        onSwitchMode={() => navigate("/login")}
      />
    </>
  );
}

function ConnectPlatformsRoute({ userType }: { userType: UserType }) {
  const navigate = useNavigate();
  return (
    <>
      <Helmet>
        <title>Connect Platforms — Rory</title>
      </Helmet>
      <ConnectPlatforms
        userType={userType}
        onBack={() => navigate("/auth")}
        onContinue={() => navigate("/onboarding")}
      />
    </>
  );
}

function OnboardingRoute({ userType }: { userType: UserType }) {
  const navigate = useNavigate();
  return (
    <>
      <Helmet>
        <title>Get Started — Rory</title>
      </Helmet>
      <OnboardingChoice
        userType={userType}
        onBack={() => navigate("/connect-platforms")}
        onComplete={() => navigate(userType === "creator" ? "/dashboard" : "/supporter")}
        onViewCreator={() => navigate("/creator/username")}
        onMakeProject={() => navigate("/dashboard/new-item")}
      />
    </>
  );
}

function CreatorDashboardRoute() {
  const navigate = useNavigate();
  const location = useLocation();
  return (
    <>
      <Helmet>
        <title>Dashboard — Rory</title>
        <meta name="robots" content="noindex" />
      </Helmet>
      <CreatorDashboard
        key={location.key}
        shopifyStore={{ name: "My Creator Store", url: "https://my-creator-store.myshopify.com" }}
        onCreateProject={() => navigate("/dashboard/new-project")}
        onAddItem={() => navigate("/dashboard/new-item")}
        onCreateEvent={() => navigate("/dashboard/new-event")}
      />
    </>
  );
}

function CommunityHubRoute({
  gamification,
  onGamificationUpdate,
}: {
  gamification: GamificationState;
  onGamificationUpdate: (g: GamificationState) => void;
}) {
  return (
    <>
      <Helmet>
        <title>Community — Rory</title>
        <meta name="robots" content="noindex" />
      </Helmet>
      <CommunityHub gamification={gamification} onGamificationUpdate={onGamificationUpdate} />
    </>
  );
}

function CreateProjectListRoute() {
  const navigate = useNavigate();
  return (
    <>
      <Helmet>
        <title>New Project — Rory</title>
        <meta name="robots" content="noindex" />
      </Helmet>
      <CreateProjectPage
        onBack={() => navigate("/dashboard")}
        onComplete={() => navigate("/dashboard")}
      />
    </>
  );
}

function CreateProjectRoute() {
  const navigate = useNavigate();
  return (
    <>
      <Helmet>
        <title>Add Item — Rory</title>
        <meta name="robots" content="noindex" />
      </Helmet>
      <CreateProject
        onBack={() => navigate("/dashboard")}
        onCreateProject={() => navigate("/dashboard")}
      />
    </>
  );
}

function CreateEventRoute() {
  const navigate = useNavigate();
  return (
    <>
      <Helmet>
        <title>New Event — Rory</title>
        <meta name="robots" content="noindex" />
      </Helmet>
      <CreateEventPage
        onBack={() => navigate("/dashboard")}
        onComplete={() => navigate("/dashboard")}
      />
    </>
  );
}

function ProjectOverviewRoute({ userType }: { userType: UserType }) {
  const navigate = useNavigate();
  return (
    <>
      <Helmet>
        <title>Project — Rory</title>
        <meta name="description" content="Support this creator's project on Rory." />
      </Helmet>
      <ProjectOverview
        onBack={() => navigate(-1 as never)}
        onBackToProject={() => navigate("/dashboard")}
        onViewCreator={() => navigate("/creator/username")}
      />
    </>
  );
}

function CreatorProfileRoute() {
  const navigate = useNavigate();
  const { username } = useParams<{ username: string }>();
  return (
    <>
      <Helmet>
        <title>Creator Profile — Rory</title>
        <meta name="description" content="Support this creator on Rory — donate to their projects." />
      </Helmet>
      <CreatorProfile
        routeUsername={username ?? ""}
        onViewProject={(projectId) => navigate(`/creator/${username}/project/${projectId}`)}
      />
    </>
  );
}

function PublicProjectRoute() {
  const navigate = useNavigate();
  const { username, projectId } = useParams<{ username: string; projectId: string }>();
  return (
    <>
      <Helmet>
        <title>Project — Rory</title>
        <meta name="description" content="Browse and donate to this creator's project." />
      </Helmet>
      <PublicWishlist
        projectId={projectId ?? ""}
        creatorUsername={username ?? ""}
        onBack={() => navigate(-1 as never)}
        onViewCreator={() => navigate(`/creator/${username}`)}
        onViewProject={(itemId) => navigate(`/project/${itemId}`)}
      />
    </>
  );
}

function SettingsRoute({
  creditBalance,
  onUpdateBalance,
}: {
  creditBalance: number;
  onUpdateBalance: (n: number) => void;
}) {
  const navigate = useNavigate();
  const [searchParams, setSearchParams] = useSearchParams();
  const platformConnected = searchParams.get("platform_connected");
  const platformError = searchParams.get("platform_error");
  const hasPlatformParam = platformConnected || platformError;
  const initialSection = hasPlatformParam
    ? "platforms" as const
    : (searchParams.get("section") as "profile" | "account" | "notifications" | "privacy" | "balance" | "customization") ?? "profile";

  const [toast, setToast] = useState<{ message: string; type: "success" | "error" } | null>(null);

  useEffect(() => {
    if (platformConnected) {
      setToast({ message: `${platformConnected.charAt(0).toUpperCase() + platformConnected.slice(1)} connected successfully!`, type: "success" });
      searchParams.delete("platform_connected");
      setSearchParams(searchParams, { replace: true });
    } else if (platformError) {
      const reason = searchParams.get("reason") || "unknown";
      setToast({ message: `Failed to connect ${platformError}: ${reason}`, type: "error" });
      searchParams.delete("platform_error");
      searchParams.delete("reason");
      setSearchParams(searchParams, { replace: true });
    }
  }, []);

  useEffect(() => {
    if (!toast) return;
    const id = setTimeout(() => setToast(null), 5000);
    return () => clearTimeout(id);
  }, [toast]);

  return (
    <>
      <Helmet>
        <title>Settings — Rory</title>
        <meta name="robots" content="noindex" />
      </Helmet>
      {toast && (
        <div className={`fixed top-4 right-4 z-50 px-4 py-3 text-sm font-medium border shadow-lg ${
          toast.type === "success"
            ? "bg-emerald-500/10 border-emerald-500/30 text-emerald-500"
            : "bg-red-500/10 border-red-500/30 text-red-500"
        }`}>
          {toast.message}
        </div>
      )}
      <Settings
        creditBalance={creditBalance}
        onUpdateBalance={onUpdateBalance}
        initialSection={initialSection}
      />
    </>
  );
}

function AnalyticsRoute() {
  const navigate = useNavigate();
  return (
    <>
      <Helmet>
        <title>Analytics — Rory</title>
        <meta name="robots" content="noindex" />
      </Helmet>
      <Analytics />
    </>
  );
}

function ReferralsRoute() {
  return (
    <>
      <Helmet>
        <title>Referrals — Rory</title>
        <meta name="robots" content="noindex" />
      </Helmet>
      <Referrals />
    </>
  );
}

function LeaderboardRoute() {
  const navigate = useNavigate();
  return (
    <>
      <Helmet>
        <title>Leaderboard — Rory</title>
        <meta name="description" content="See the top creators and supporters on Rory." />
      </Helmet>
      <Leaderboard
        onViewCreator={(username) => navigate(`/creator/${username}`)}
      />
    </>
  );
}

function AuthCallbackRoute() {
  const navigate = useNavigate();
  const { isAuthenticated, loading, user } = useAuth();

  useEffect(() => {
    if (!loading && isAuthenticated && user) {
      if (!user.isProfileComplete) {
        navigate("/onboarding", { replace: true });
      } else {
        navigate(user.role === "supporter" ? "/supporter" : "/dashboard", { replace: true });
      }
    } else if (!loading && !isAuthenticated) {
      navigate("/login", { replace: true });
    }
  }, [loading, isAuthenticated, user, navigate]);

  return <AuthLoading />;
}

function SupporterProfileRoute() {
  const navigate = useNavigate();
  return (
    <>
      <Helmet>
        <title>Supporter Profile — Rory</title>
        <meta name="description" content="See what this supporter is following and contributing to on Rory." />
      </Helmet>
      <SupporterProfile
        onViewCreator={(creatorId) => navigate(`/creator/${creatorId}`)}
      />
    </>
  );
}

const DEFAULT_GAMIFICATION: GamificationState = {
  xp: 0, level: 1, streakDays: 0, lastActivityDate: "",
  leagueTier: "bronze", weeklyGifted: 0, badges: [], questsCompletedToday: [],
};

export default function App() {
  const { user, isAuthenticated, updateBalance } = useAuth();
  const userType: UserType = user?.role ?? "creator";
  const creditBalance = user?.creditBalance ?? 0;
  const [gamification, setGamification] = useState<GamificationState>(DEFAULT_GAMIFICATION);

  const refreshGamification = useCallback(async () => {
    try {
      const res = await gamificationApi.getState();
      if (res.success && res.data) {
        setGamification({
          xp: res.data.xp,
          level: res.data.level,
          streakDays: res.data.streakDays,
          lastActivityDate: res.data.lastActivityDate ?? "",
          leagueTier: (res.data.leagueTier as LeagueTier) ?? "bronze",
          weeklyGifted: res.data.weeklyGifted,
          badges: res.data.badges as BadgeId[],
          questsCompletedToday: res.data.questsCompletedToday,
        });
      }
    } catch {
      // Backend unavailable — keep current state
    }
  }, []);

  useEffect(() => {
    if (isAuthenticated) {
      refreshGamification();
    }
  }, [isAuthenticated, refreshGamification]);

  return (
    <>
      <Routes>
        {/* Fully public — no navbar */}
        <Route path="/" element={<HomeRoute />} />
        <Route path="/auth" element={<Navigate to="/login" replace />} />
        <Route path="/login" element={<LoginRoute />} />
        <Route path="/signup" element={<SignUpRoute />} />
        <Route path="/auth/callback" element={<AuthCallbackRoute />} />
        <Route path="/connect-platforms" element={<ConnectPlatformsRoute userType={userType} />} />
        <Route path="/onboarding" element={<OnboardingRoute userType={userType} />} />

        {/* Publicly browseable — navbar shown only when logged in */}
        <Route element={<PublicLayout creditBalance={creditBalance} userType={userType} gamification={userType === "supporter" ? gamification : undefined} />}>
          <Route path="/creator/:username" element={<CreatorProfileRoute />} />
          <Route path="/creator/:username/project/:projectId" element={<PublicProjectRoute />} />
          <Route path="/leaderboard" element={<LeaderboardRoute />} />
          <Route path="/supporter/:username" element={<SupporterProfileRoute />} />
        </Route>

        {/* Authenticated only — navbar always visible */}
        <Route element={<AuthenticatedLayout creditBalance={creditBalance} userType={userType} gamification={userType === "supporter" ? gamification : undefined} />}>
          <Route path="/dashboard" element={<CreatorDashboardRoute />} />
          <Route path="/supporter" element={<CommunityHubRoute gamification={gamification} onGamificationUpdate={setGamification} />} />
          <Route path="/dashboard/new-wishlist" element={<CreateProjectListRoute />} />
          <Route path="/dashboard/new-project" element={<CreateProjectListRoute />} />
          <Route path="/dashboard/new-item" element={<CreateProjectRoute />} />
          <Route path="/dashboard/new-event" element={<CreateEventRoute />} />
          <Route path="/project/:id" element={<ProjectOverviewRoute userType={userType} />} />
          <Route path="/settings" element={<SettingsRoute creditBalance={creditBalance} onUpdateBalance={updateBalance} />} />
          <Route path="/analytics" element={<AnalyticsRoute />} />
          <Route path="/referrals" element={<ReferralsRoute />} />
        </Route>
      </Routes>

      {/* Temporary cofounder feedback widget — visible on every page */}
      <FounderSuggestions />
    </>
  );
}
