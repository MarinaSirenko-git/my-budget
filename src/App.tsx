import './App.css'
import { Routes, Route, Navigate } from "react-router-dom";
import ProtectedRoute from '@/shared/router/ProtectedRoute';
import ScenarioRouteGuard from '@/shared/router/ScenarioRouteGuard';
import Layout from "./app/layout/Layout";
import AuthPage from "./pages/auth/AuthPage";
import IncomePage from "./pages/income/IncomePage";
import ExpensesPage from "./pages/expences/ExpensesPage";
import GoalsPage from "./pages/goals/GoalsPage";
import SavingsPage from "./pages/savings/SavingsPage";
import DocsPage from "./pages/docs/DocsPage";
import SettingsPage from "./pages/settings/SettingsPage";
import { useEffect } from 'react';
import { useTheme } from './shared/store/theme';
import AuthCallback from './shared/router/AuthCallback';
import Feedback from './shared/ui/Feedback';
import NotFoundPage from './pages/404/NotFoundPage';
import { loadLanguageFromProfile } from './shared/i18n';
import { useLanguage } from './shared/hooks/useLanguage';
import { useScenario } from './shared/hooks/useScenario';

function App() {
  const initTheme = useTheme(s => s.init);
  const { language } = useLanguage();

  useEffect(() => {
    initTheme();
  }, []);

  useEffect(() => {
    if (language) {
      loadLanguageFromProfile(language);
    }
  }, [language]);
  
  return (
    <>
      <Routes>
        <Route path="/auth-callback" element={<AuthCallback />} />
        <Route path="/auth" element={<AuthPage />} />

        <Route element={<ProtectedRoute />}>
          <Route element={<Layout />}>
            <Route index element={<ScenarioIndexRedirect />} />
            
            <Route path="/:scenarioSlug" element={<ScenarioRouteGuard />}>
              <Route path="income" element={<IncomePage />} />
              <Route path="expenses" element={<ExpensesPage />} />
              <Route path="goals" element={<GoalsPage />} />
              <Route path="savings" element={<SavingsPage />} />
              <Route path="docs" element={<DocsPage />} />
              <Route path="settings" element={<SettingsPage />} />
            </Route>
          </Route>
        </Route>
        <Route path="*" element={<NotFoundPage />} />
      </Routes>
      <Feedback />
    </>
  );
}

function ScenarioIndexRedirect() {
  const { currentScenario, loading } = useScenario();

  if (loading) {
    return (
      <div className="flex items-center justify-center min-h-screen bg:white dark:bg-black">
        <div className="text-textColor dark:text-textColor">Loading scenarios...</div>
      </div>
    );
  }

  if (currentScenario?.slug) {
    return <Navigate to={`/${currentScenario.slug}/income`} replace />;
  }

  return (
    <div className="flex items-center justify-center min-h-screen bg:white dark:bg-black">
      <div className="text-textColor dark:text-textColor">No scenario found</div>
    </div>
  );
}

export default App
