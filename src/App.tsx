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
import { useEffect, useState } from 'react';
import { useTheme } from './shared/store/theme';
import AuthCallback from './shared/router/AuthCallback';
import Feedback from './shared/ui/Feedback';
import NotFoundPage from './pages/404/NotFoundPage';
import { loadLanguageFromProfile } from './shared/i18n';
import { useQueryClient } from '@tanstack/react-query';

function App() {
  const initTheme = useTheme(s => s.init);
  useEffect(() => {
    initTheme();
  }, []);

  const queryClient = useQueryClient();

  const profile = queryClient.getQueryData(['profile']) as { language?: string } | null;
  const language = profile?.language;
  if (language) loadLanguageFromProfile(language);
  
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
  const queryClient = useQueryClient();
  const [loading, setLoading] = useState(true);
  const [targetPath, setTargetPath] = useState<string | null>(null);

  useEffect(() => {
    const currentScenario = queryClient.getQueryData(['currentScenario']) as { 
      id?: string | null; 
      slug?: string | null; 
      baseCurrency?: string | null;
    } | null;
    
    const slug = currentScenario?.slug;
    
    if (slug) {
      setTargetPath(`/${slug}/income`);
    }
    setLoading(false);
  }, [queryClient]);

  if (loading || !targetPath) {
    return (
      <div className="flex items-center justify-center min-h-screen bg:white dark:bg-black">
        <div className="text-textColor dark:text-textColor">Loading scenarios...</div>
      </div>
    );
  }

  return <Navigate to={targetPath} replace />;
}

export default App
