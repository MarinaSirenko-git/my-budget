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
import { useAuth } from './shared/store/auth'
import AuthCallback from './shared/router/AuthCallback';
import Feedback from './shared/ui/Feedback';
import NotFoundPage from './pages/404/NotFoundPage';
import { loadLanguageFromProfile } from './shared/i18n';

function App() {
  const initTheme = useTheme(s => s.init);
  const initAuth = useAuth(s => s.init);
  const { user } = useAuth();

  useEffect(() => { initTheme(); }, [initTheme]);
  useEffect(() => { initAuth(); }, [initAuth]);
  
  // Загружаем язык из профиля после инициализации auth
  useEffect(() => {
    if (user?.id) {
      loadLanguageFromProfile(user.id).catch(error => {
        console.warn('Failed to load language from profile:', error);
      });
    }
  }, [user?.id]);

  return (
    <>
      <Routes>
        {/* Без лейаута */}
        <Route path="/auth-callback" element={<AuthCallback />} />
        <Route path="/auth" element={<AuthPage />} />

        {/* Всё под общим лейаутом с динамическими роутами по scenario slug */}
        <Route element={<ProtectedRoute />}>
          <Route element={<Layout />}>
            {/* Редирект index на текущий сценарий */}
            <Route index element={<ScenarioIndexRedirect />} />
            
            {/* Динамические роуты с scenario slug */}
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
        {/* 404 */}
        <Route path="*" element={<NotFoundPage />} />
      </Routes>
      <Feedback />
    </>
  );
}

// Компонент для редиректа index на текущий сценарий
function ScenarioIndexRedirect() {
  const { loadCurrentScenarioId, loadCurrentScenarioSlug } = useAuth();
  const [loading, setLoading] = useState(true);
  const [targetPath, setTargetPath] = useState<string | null>(null);

  useEffect(() => {
    async function redirectToScenario() {
      await loadCurrentScenarioId();
      await loadCurrentScenarioSlug();
      
      const authState = useAuth.getState();
      const slug = authState.currentScenarioSlug;
      
      if (slug) {
        setTargetPath(`/${slug}/goals`);
      } else {
        setTargetPath('/scenario/goals');
      }
      setLoading(false);
    }

    redirectToScenario();
  }, [loadCurrentScenarioId, loadCurrentScenarioSlug]);

  if (loading || !targetPath) {
    return (
      <div className="flex items-center justify-center min-h-screen">
        <div className="text-textColor dark:text-textColor">Loading...</div>
      </div>
    );
  }

  return <Navigate to={targetPath} replace />;
}

export default App
