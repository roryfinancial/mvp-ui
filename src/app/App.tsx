import { Routes, Route, useNavigate, useSearchParams, Outlet } from "react-router-dom";
import { Helmet } from "react-helmet-async";
import { useState } from "react";
import ThemeToggle from "./components/ThemeToggle";
import Navbar from "./components/Navbar";

import Home from "./pages/Home";
import Auth from "./components/Auth";
import ConnectPlatforms from "./components/ConnectPlatforms";
import OnboardingChoice from "./components/OnboardingChoice";
import CreatorDashboard from "./components/CreatorDashboard";
import SupporterDashboard from "./components/SupporterDashboard";
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

// ─── Layout with persistent Navbar ──────────────────────────────────────────
function AuthenticatedLayout({ creditBalance, userType }: { creditBalance: number; userType: UserType }) {
  return (
    <>
      <Navbar creditBalance={creditBalance} userType={userType} />
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
      <Home onNavigateToAuth={() => navigate("/auth")} />
    </>
  );
}

function AuthRoute({ onAuth }: { onAuth: (t: UserType) => void }) {
  const navigate = useNavigate();
  return (
    <>
      <Helmet>
        <title>Sign In — TipFlow</title>
        <meta name="description" content="Sign in or create your TipFlow account to start gifting or building your wishlist." />
      </Helmet>
      <Auth
        onBack={() => navigate("/")}
        onAuthComplete={(type) => {
          onAuth(type);
          navigate("/connect-platforms");
        }}
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
  return (
    <>
      <Helmet>
        <title>Dashboard — TipFlow</title>
        <meta name="robots" content="noindex" />
      </Helmet>
      <CreatorDashboard
        shopifyStore={{ name: "My Creator Store", url: "https://my-creator-store.myshopify.com" }}
        onCreateWishlist={() => navigate("/dashboard/new-wishlist")}
        onAddItem={() => navigate("/dashboard/new-item")}
      />
    </>
  );
}

function SupporterDashboardRoute() {
  const navigate = useNavigate();
  return (
    <>
      <Helmet>
        <title>My Dashboard — TipFlow</title>
        <meta name="robots" content="noindex" />
      </Helmet>
      <SupporterDashboard
        onViewProject={() => navigate("/project/1")}
        onViewCreator={() => navigate("/creator/username")}
      />
    </>
  );
}

function CreateWishlistRoute() {
  const navigate = useNavigate();
  return (
    <>
      <Helmet>
        <title>New Wishlist — TipFlow</title>
        <meta name="robots" content="noindex" />
      </Helmet>
      <CreateWishlist
        onBack={() => navigate("/dashboard")}
        onCreateWishlist={() => navigate("/dashboard")}
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
        <meta name="description" content="Support this creator's wishlist item on TipFlow." />
      </Helmet>
      <ProjectOverview
        isCreator={userType === "creator"}
        onBack={() => navigate(-1 as never)}
        onBackToWishlist={() => navigate("/dashboard")}
        onViewCreator={() => navigate("/creator/username")}
      />
    </>
  );
}

function CreatorProfileRoute() {
  const navigate = useNavigate();
  return (
    <>
      <Helmet>
        <title>Creator Profile — TipFlow</title>
        <meta name="description" content="Support this creator on TipFlow — gift items from their wishlist." />
      </Helmet>
      <CreatorProfile
        onViewWishlist={(wishlistId) => navigate(`/creator/username/wishlist/${wishlistId}`)}
      />
    </>
  );
}

function PublicWishlistRoute() {
  const navigate = useNavigate();
  return (
    <>
      <Helmet>
        <title>Wishlist — TipFlow</title>
        <meta name="description" content="Browse and support items on this creator's wishlist." />
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
  const initialSection = (searchParams.get("section") as "profile" | "account" | "notifications" | "privacy" | "balance") ?? "profile";
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
  const [userType, setUserType] = useState<UserType>("creator");
  const [creditBalance, setCreditBalance] = useState(0);
  return (
    <>
      <ThemeToggle />
      <Routes>
        {/* Public routes — no navbar */}
        <Route path="/" element={<HomeRoute />} />
        <Route path="/auth" element={<AuthRoute onAuth={setUserType} />} />
        <Route path="/connect-platforms" element={<ConnectPlatformsRoute userType={userType} />} />
        <Route path="/onboarding" element={<OnboardingRoute userType={userType} />} />

        {/* Authenticated routes — shared navbar with credit balance, search, logout */}
        <Route element={<AuthenticatedLayout creditBalance={creditBalance} userType={userType} />}>
          <Route path="/dashboard" element={<CreatorDashboardRoute />} />
          <Route path="/supporter" element={<SupporterDashboardRoute />} />
          <Route path="/dashboard/new-wishlist" element={<CreateWishlistRoute />} />
          <Route path="/dashboard/new-item" element={<CreateProjectRoute />} />
          <Route path="/project/:id" element={<ProjectOverviewRoute userType={userType} />} />
          <Route path="/creator/:username" element={<CreatorProfileRoute />} />
          <Route path="/creator/:username/wishlist/:wishlistId" element={<PublicWishlistRoute />} />
          <Route path="/supporter/:username" element={<SupporterProfileRoute />} />
          <Route path="/settings" element={<SettingsRoute creditBalance={creditBalance} onUpdateBalance={setCreditBalance} />} />
          <Route path="/analytics" element={<AnalyticsRoute />} />
          <Route path="/referrals" element={<ReferralsRoute />} />
          <Route path="/leaderboard" element={<LeaderboardRoute />} />
        </Route>
      </Routes>
    </>
  );
}
