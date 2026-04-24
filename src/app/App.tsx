import { Routes, Route, useNavigate } from "react-router-dom";
import { Helmet } from "react-helmet-async";
import { useState } from "react";
import ThemeToggle from "./components/ThemeToggle";

import Home from "./pages/Home";
import Auth from "./components/Auth";
import OnboardingChoice from "./components/OnboardingChoice";
import CreatorDashboard from "./components/CreatorDashboard";
import SupporterDashboard from "./components/SupporterDashboard";
import CreateProject from "./components/CreateProject";
import CreateWishlist from "./components/CreateWishlist";
import ProjectOverview from "./components/ProjectOverview";
import CreatorProfile from "./components/CreatorProfile";
import Settings from "./components/Settings";
import Analytics from "./components/Analytics";

type UserType = "creator" | "supporter";

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
          navigate("/onboarding");
        }}
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
        onBack={() => navigate("/auth")}
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
        onLogout={() => navigate("/")}
        onCreateWishlist={() => navigate("/dashboard/new-list")}
        onAddItem={() => navigate("/dashboard/new-item")}
        onViewProject={() => navigate("/project/1")}
        onViewAnalytics={() => navigate("/analytics")}
        onViewSettings={() => navigate("/settings")}
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
        onLogout={() => navigate("/")}
        onViewProject={() => navigate("/project/1")}
        onViewCreator={() => navigate("/creator/username")}
        onViewSettings={() => navigate("/settings")}
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
        onNavigateDashboard={() => navigate("/dashboard")}
        onNavigateAnalytics={() => navigate("/analytics")}
        onNavigateSettings={() => navigate("/settings")}
        onLogout={() => navigate("/")}
        onViewCreator={() => navigate("/creator/username")}
      />
    </>
  );
}

function CreatorProfileRoute({ userType }: { userType: UserType }) {
  const navigate = useNavigate();
  return (
    <>
      <Helmet>
        <title>Creator Profile — TipFlow</title>
        <meta name="description" content="Support this creator on TipFlow — gift items from their wishlist." />
      </Helmet>
      <CreatorProfile
        onBack={() => navigate(userType === "creator" ? "/dashboard" : "/supporter")}
        onViewProject={() => navigate("/project/1")}
      />
    </>
  );
}

function SettingsRoute() {
  const navigate = useNavigate();
  return (
    <>
      <Helmet>
        <title>Settings — TipFlow</title>
        <meta name="robots" content="noindex" />
      </Helmet>
      <Settings
        onNavigateDashboard={() => navigate("/dashboard")}
        onNavigateAnalytics={() => navigate("/analytics")}
        onLogout={() => navigate("/")}
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
      <Analytics
        onNavigateDashboard={() => navigate("/dashboard")}
        onNavigateSettings={() => navigate("/settings")}
        onLogout={() => navigate("/")}
      />
    </>
  );
}

// ─── Root App ────────────────────────────────────────────────────────────────

export default function App() {
  const [userType, setUserType] = useState<UserType>("creator");

  return (
    <>
      <ThemeToggle />
      <Routes>
        <Route path="/" element={<HomeRoute />} />
        <Route path="/auth" element={<AuthRoute onAuth={setUserType} />} />
        <Route path="/onboarding" element={<OnboardingRoute userType={userType} />} />
        <Route path="/dashboard" element={<CreatorDashboardRoute />} />
        <Route path="/dashboard/new-list" element={<CreateWishlistRoute />} />
        <Route path="/dashboard/new-item" element={<CreateProjectRoute />} />
        <Route path="/supporter" element={<SupporterDashboardRoute />} />
        <Route path="/project/:id" element={<ProjectOverviewRoute userType={userType} />} />
        <Route path="/creator/:username" element={<CreatorProfileRoute userType={userType} />} />
        <Route path="/settings" element={<SettingsRoute />} />
        <Route path="/analytics" element={<AnalyticsRoute />} />
        <Route path="*" element={<HomeRoute />} />
      </Routes>
    </>
  );
}
