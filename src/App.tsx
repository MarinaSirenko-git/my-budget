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
import ReportPage from "./pages/report/ReportPage";
import { useEffect, useState } from 'react';
import { useTheme } from './shared/store/theme';
import { useAuth } from './shared/store/auth'
import AuthCallback from './shared/router/AuthCallback';
import Feedback from './shared/ui/Feedback';
import NotFoundPage from './pages/404/NotFoundPage';
import { loadLanguageFromProfile } from './shared/i18n';

function App() {
  const initTheme = useTheme(s => s.init);
  const initAuth = useAuth(s => s.init);
  const user = useAuth( s => s.user );
  
  useEffect(() => {
    initTheme();
  }, []);
  
  useEffect(() => {
    initAuth();
  }, []);
  
  useEffect(() => {
    if (user?.id) loadLanguageFromProfile(user.id);
  }, [user?.id]);

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
              <Route path="report" element={<ReportPage />} />
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
  const { loadCurrentScenarioData } = useAuth();
  const [loading, setLoading] = useState(true);
  const [targetPath, setTargetPath] = useState<string | null>(null);

  useEffect(() => {
    async function redirectToScenario() {
      await loadCurrentScenarioData();
      
      const authState = useAuth.getState();
      const slug = authState.currentScenarioSlug;
      
      if (slug) {
        setTargetPath(`/${slug}/income`);
      } 
      setLoading(false);
    }

    redirectToScenario();
  }, [loadCurrentScenarioData]);

  if (loading || !targetPath) {
    return (
      <div className="flex items-center justify-center min-h-screen">
        <div className="text-textColor dark:text-textColor">Loading scenarios...</div>
      </div>
    );
  }

  return <Navigate to={targetPath} replace />;
}

export default App
