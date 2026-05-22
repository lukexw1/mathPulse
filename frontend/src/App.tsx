import { Routes, Route, Navigate, useLocation } from "react-router-dom";
import { useTranslation } from "react-i18next";
import { TabBar } from "./components/TabBar";
import { HomePage } from "./pages/HomePage";
import { PracticePage } from "./pages/PracticePage";
import { ProfilePage } from "./pages/ProfilePage";
import { TheoryPage } from "./pages/TheoryPage";
import { CalculatorPage } from "./pages/CalculatorPage";
import { OnboardingPage } from "./pages/OnboardingPage";
import { useAuthStore } from "./stores/authStore";
import { useDashboardStore } from "./stores/dashboardStore";
import { useProfileStore } from "./stores/profileStore";
import { useTheoryStore } from "./stores/theoryStore";
import { usePracticeStore } from "./stores/practiceStore";
import { useEffect } from "react";

export function App() {
  const { t } = useTranslation();
  const { authenticate, isAuthenticated, isLoading, error, user } = useAuthStore();
  const location = useLocation();

  useEffect(() => {
    authenticate();
  }, [authenticate]);

  // Prefetch all tab data after auth — instant tab switches, no skeletons
  useEffect(() => {
    if (isAuthenticated && !user?.is_new) {
      useDashboardStore.getState().load();
      useProfileStore.getState().load();
      useTheoryStore.getState().prefetch();
      usePracticeStore.getState().prefetch();
    }
  }, [isAuthenticated, user?.is_new]);

  if (isLoading) {
    return (
      <div className="min-h-screen flex items-center justify-center pt-safe">
        <div className="flex flex-col items-center gap-4">
          <div className="skeleton w-48 h-6" />
          <div className="skeleton w-32 h-4" />
        </div>
      </div>
    );
  }
  if (!isAuthenticated) {
    return (
      <div className="min-h-screen flex flex-col items-center justify-center gap-4 px-6 pt-safe">
        <h1 className="font-headline text-2xl font-bold text-primary lowercase tracking-tight">
          mathpulse
        </h1>
        <p className="text-on-surface-variant text-sm">
          {t("auth.not_authenticated")}
        </p>
        {error && (
          <p className="text-xs text-on-surface-variant/70 max-w-xs text-center break-all">
            {error}
          </p>
	)}
      </div>
    );
  }
  // FR-10: If new user, show onboarding first
  if (user?.is_new) {
    return <OnboardingPage />;
  }

  // Hide tab bar on practice page (uses Telegram BackButton)
  const isPracticePage = location.pathname === "/practice";

  return (
    <>
      <a href="#main-content" className="skip-to-content">
        {t("app.skip_to_content")}
      </a>

      <main id="main-content" className="animate-page-enter">
        <Routes>
          <Route path="/" element={<HomePage />} />
          <Route path="/practice" element={<PracticePage />} />
          <Route path="/calculator" element={<CalculatorPage />} />
          <Route path="/theory" element={<TheoryPage />} />
          <Route path="/profile" element={<ProfilePage />} />
          <Route path="*" element={<Navigate to="/" replace />} />
        </Routes>
      </main>

      {!isPracticePage && <TabBar />}
    </>
  );
}
