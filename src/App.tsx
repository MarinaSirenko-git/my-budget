import './App.css'
import { Routes, Route, Navigate } from "react-router-dom";
import ProtectedRoute from '@/shared/router/ProtectedRoute';
import Layout from "./app/layout/Layout";
import AuthPage from "./pages/auth/AuthPage";
import IncomePage from "./pages/income/IncomePage";
import ExpensesPage from "./pages/expences/ExpensesPage";
import GoalsPage from "./pages/goals/GoalsPage";
import DocsPage from "./pages/docs/DocsPage";
import SettingsPage from "./pages/settings/SettingsPage";
import { useEffect } from 'react';
import { useTheme } from './shared/store/theme';
import { useAuth } from '@/shared/store/auth'
import AuthCallback from './shared/router/AuthCallback';

function App() {
  const initTheme = useTheme(s => s.init);
  const initAuth = useAuth(s => s.init);

  useEffect(() => { initTheme(); }, [initTheme]);
  useEffect(() => { initAuth(); }, [initAuth]);

  return (
    <Routes>
      {/* Без лейаута */}
      <Route path="/auth-callback" element={<AuthCallback />} />
      <Route path="/auth" element={<AuthPage />} />

      {/* Всё под общим лейаутом */}
      <Route element={<ProtectedRoute />}>
        <Route element={<Layout />}>
          <Route index element={<Navigate to="/goals" replace />} />
          <Route path="/income" element={<IncomePage />} />
          <Route path="/expenses" element={<ExpensesPage />} />
          <Route path="/goals" element={<GoalsPage />} />
          <Route path="/docs" element={<DocsPage />} />
          <Route path="/settings" element={<SettingsPage />} />
        </Route>
      </Route>
      {/* 404 / редирект */}
      <Route path="*" element={<Navigate to="/goals" replace />} />
    </Routes>
  );
}

export default App
