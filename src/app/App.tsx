import { type ReactNode, useEffect } from "react";
import { Routes, Route, useNavigate, useLocation, useParams, useSearchParams, Outlet, Navigate } from "react-router-dom";
import { Helmet } from "react-helmet-async";
import { Loader2 } from "lucide-react";
import Navbar from "./components/Navbar";
import { useAuth } from "../contexts/AuthContext";
import { Store } from "../lib/store";
import type { GamificationState } from "../lib/types";

import Home from "./pages/Home";
import Auth from "./components/Auth";
import ConnectPlatforms from "./components/ConnectPlatforms";
import OnboardingChoice from "./components/OnboardingChoice";
import CreatorDashboard from "./components/CreatorDashboard";
import CommunityHub from "./components/CommunityHub";
import CreateProject from "./components/CreateProject";
import CreateWishlist from "./components/CreateWishlist";
import ProjectOverview from "./components/ProjectOverview";
import CreatorProfile from "./components/CreatorProfile";
import Settings from "./components/Settings";
import Analytics from "./components/Analytics";
import Referrals from "./components/Referrals";
import Leaderboard from "./components/Leaderboard";
import PublicWishlist from "./components/PublicWishlist";
import SupporterProfile from "./components/SupporterProfile";

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
function AuthenticatedLayout({ creditBalance, userType }: { creditBalance: number; userType: UserType }) {
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
        <title>TipFlow — Fan Gifts. Zero Fees.</title>
        <meta name="description" content="TipFlow lets fans fund the gear, software, and essentials creators actually need — with zero platform fees." />
        <link rel="canonical" href="https://tipflow.com/" />
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
      navigate("/onboarding");
    } else {
      navigate(type === "creator" ? "/dashboard" : "/supporter");
    }
  }
  return (
    <>
      <Helmet>
        <title>Log In — TipFlow</title>
        <meta name="description" content="Sign in to your TipFlow account." />
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
        <title>Sign Up — TipFlow</title>
        <meta name="description" content="Create your TipFlow account to start gifting or building your project." />
      </Helmet>
      <Auth
        mode="signup"
        onBack={() => navigate("/")}
        onAuthComplete={() => navigate("/onboarding")}
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
        <title>Connect Platforms — TipFlow</title>
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
        <title>Get Started — TipFlow</title>
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
        <title>Dashboard — TipFlow</title>
        <meta name="robots" content="noindex" />
      </Helmet>
      <CreatorDashboard
        key={location.key}
        shopifyStore={{ name: "My Creator Store", url: "https://my-creator-store.myshopify.com" }}
        onCreateProject={() => navigate("/dashboard/new-project")}
        onAddItem={() => navigate("/dashboard/new-item")}
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
        <title>Community — TipFlow</title>
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
        <title>New Project — TipFlow</title>
        <meta name="robots" content="noindex" />
      </Helmet>
      <CreateWishlist
        onBack={() => navigate("/dashboard")}
        onCreateProject={() => navigate("/dashboard")}
      />
    </>
  );
}

function CreateProjectRoute() {
  const navigate = useNavigate();
  return (
    <>
      <Helmet>
        <title>Add Item — TipFlow</title>
        <meta name="robots" content="noindex" />
      </Helmet>
      <CreateProject
        onBack={() => navigate("/dashboard")}
        onCreateProject={() => navigate("/dashboard")}
      />
    </>
  );
}

function ProjectOverviewRoute({ userType }: { userType: UserType }) {
  const navigate = useNavigate();
  return (
    <>
      <Helmet>
        <title>Project — TipFlow</title>
        <meta name="description" content="Support this creator's project on TipFlow." />
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
        <title>Creator Profile — TipFlow</title>
        <meta name="description" content="Support this creator on TipFlow — donate to their projects." />
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
  return (
    <>
      <Helmet>
        <title>Project — TipFlow</title>
        <meta name="description" content="Browse and donate to this creator's project." />
      </Helmet>
      <PublicWishlist
        onBack={() => navigate(-1 as never)}
        onViewCreator={() => navigate(-1 as never)}
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
  const [searchParams] = useSearchParams();
  const initialSection = (searchParams.get("section") as "profile" | "account" | "notifications" | "privacy" | "balance" | "customization") ?? "profile";
  return (
    <>
      <Helmet>
        <title>Settings — TipFlow</title>
        <meta name="robots" content="noindex" />
      </Helmet>
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
        <title>Analytics — TipFlow</title>
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
        <title>Referrals — TipFlow</title>
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
        <title>Leaderboard — TipFlow</title>
        <meta name="description" content="See the top creators and supporters on TipFlow." />
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
        <title>Supporter Profile — TipFlow</title>
        <meta name="description" content="See what this supporter is following and contributing to on TipFlow." />
      </Helmet>
      <SupporterProfile
        onViewCreator={(creatorId) => navigate(`/creator/${creatorId}`)}
      />
    </>
  );
}

export default function App() {
  const { user, updateBalance } = useAuth();
  const userType: UserType = user?.role ?? "creator";
  const creditBalance = user?.creditBalance ?? 0;
  const [gamification, setGamification] = useState<GamificationState>(() => {
    try {
      const saved = localStorage.getItem("tipflow_gamification");
      return saved ? (JSON.parse(saved) as GamificationState) : Store.getGamificationState();
    } catch {
      return Store.getGamificationState();
    }
  });

  useEffect(() => {
    localStorage.setItem("tipflow_gamification", JSON.stringify(gamification));
  }, [gamification]);

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
          <Route path="/dashboard/new-wishlist" element={<CreateWishlistRoute />} />
          <Route path="/dashboard/new-item" element={<CreateProjectRoute />} />
          <Route path="/project/:id" element={<ProjectOverviewRoute userType={userType} />} />
          <Route path="/settings" element={<SettingsRoute creditBalance={creditBalance} onUpdateBalance={updateBalance} />} />
          <Route path="/analytics" element={<AnalyticsRoute />} />
          <Route path="/referrals" element={<ReferralsRoute />} />
        </Route>
      </Routes>
    </>
  );
}
