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
import Referrals from "./components/Referrals";
import { useState } from "react";

type AppView = "home" | "auth" | "onboarding" | "creatorDashboard" | "supporterDashboard" | "createProject" | "createWishlist" | "projectOverview" | "creatorProfile" | "settings" | "analytics" | "referrals";
type UserType = "creator" | "supporter";

export default function App() {
  const [currentView, setCurrentView] = useState<AppView>("home");
  const [userType, setUserType] = useState<UserType>("creator");
  const [returnWishlistId, setReturnWishlistId] = useState<number | null>(null);
  const [creditBalance, setCreditBalance] = useState<number>(1240);
  const [settingsSection, setSettingsSection] = useState<"profile" | "account" | "notifications" | "privacy" | "balance">("profile");

  const goToSettings = (section: "profile" | "account" | "notifications" | "privacy" | "balance" = "profile") => {
    setSettingsSection(section);
    setCurrentView("settings");
  };

  const goToDashboard = (wishlistId: number | null = null) => {
    setReturnWishlistId(wishlistId);
    setCurrentView("creatorDashboard");
  };

  if (currentView === "auth") {
    return (
      <Auth
        onBack={() => setCurrentView("home")}
        onAuthComplete={(type) => {
          setUserType(type);
          setCurrentView("onboarding");
        }}
      />
    );
  }

  if (currentView === "onboarding") {
    return (
      <OnboardingChoice
        userType={userType}
        onBack={() => setCurrentView("auth")}
        onComplete={() => {
          if (userType === "creator") {
            setCurrentView("creatorDashboard");
          } else {
            setCurrentView("supporterDashboard");
          }
        }}
        onViewCreator={() => setCurrentView("creatorProfile")}
        onMakeProject={() => setCurrentView("createProject")}
      />
    );
  }

  if (currentView === "creatorDashboard") {
    return (
      <CreatorDashboard
        initialWishlistId={returnWishlistId}
        creditBalance={creditBalance}
        onLogout={() => setCurrentView("home")}
        onCreateWishlist={() => setCurrentView("createWishlist")}
        onAddItem={() => setCurrentView("createProject")}
        onViewProject={() => setCurrentView("projectOverview")}
        onViewAnalytics={() => setCurrentView("analytics")}
        onViewReferrals={() => setCurrentView("referrals")}
        onViewSettings={() => goToSettings()}
        onViewBalance={() => goToSettings("balance")}
      />
    );
  }

  if (currentView === "supporterDashboard") {
    return (
      <SupporterDashboard
        creditBalance={creditBalance}
        onLogout={() => setCurrentView("home")}
        onViewProject={() => setCurrentView("projectOverview")}
        onViewCreator={() => setCurrentView("creatorProfile")}
        onViewSettings={() => goToSettings()}
        onViewBalance={() => goToSettings("balance")}
      />
    );
  }

  if (currentView === "createWishlist") {
    return (
      <CreateWishlist
        onBack={() => setCurrentView("creatorDashboard")}
        onCreateWishlist={() => setCurrentView("creatorDashboard")}
      />
    );
  }

  if (currentView === "createProject") {
    return (
      <CreateProject
        onBack={() => setCurrentView("creatorDashboard")}
        onCreateProject={() => setCurrentView("creatorDashboard")}
      />
    );
  }

  if (currentView === "projectOverview") {
    return (
      <ProjectOverview
        isCreator={userType === "creator"}
        onBack={() => goToDashboard(null)}
        onBackToWishlist={(id) => goToDashboard(id)}
        onNavigateDashboard={() => goToDashboard(null)}
        onNavigateAnalytics={() => setCurrentView("analytics")}
        onNavigateSettings={() => setCurrentView("settings")}
        onLogout={() => setCurrentView("home")}
        onViewCreator={() => setCurrentView("creatorProfile")}
      />
    );
  }

  if (currentView === "creatorProfile") {
    return (
      <CreatorProfile
        creditBalance={creditBalance}
        onBack={() => {
          if (userType === "creator") {
            setCurrentView("creatorDashboard");
          } else {
            setCurrentView("supporterDashboard");
          }
        }}
        onViewProject={() => setCurrentView("projectOverview")}
        onViewSettings={() => setCurrentView("settings")}
      />
    );
  }

  if (currentView === "settings") {
    return (
      <Settings
        creditBalance={creditBalance}
        onUpdateBalance={setCreditBalance}
        onNavigateDashboard={() => setCurrentView("creatorDashboard")}
        onNavigateAnalytics={() => setCurrentView("analytics")}
        onLogout={() => setCurrentView("home")}
        initialSection={settingsSection}
      />
    );
  }

  if (currentView === "analytics") {
    return (
      <Analytics
        onNavigateDashboard={() => setCurrentView("creatorDashboard")}
        onNavigateSettings={() => setCurrentView("settings")}
        onNavigateReferrals={() => setCurrentView("referrals")}
        onLogout={() => setCurrentView("home")}
      />
    );
  }

  if (currentView === "referrals") {
    return (
      <Referrals
        onNavigateDashboard={() => setCurrentView("creatorDashboard")}
        onNavigateAnalytics={() => setCurrentView("analytics")}
        onNavigateSettings={() => goToSettings()}
        onLogout={() => setCurrentView("home")}
      />
    );
  }

  return <Home onNavigateToAuth={() => setCurrentView("auth")} />;
}
