import './App.css'
import { Routes, Route, Navigate } from "react-router-dom";
import Layout from "./app/layout/Layout";
import AuthPage from "./pages/auth/AuthPage";
import IncomePage from "./pages/income/IncomePage";
import ExpensesPage from "./pages/expences/ExpensesPage";
import GoalsPage from "./pages/goals/GoalsPage";
import DocsPage from "./pages/docs/DocsPage";
import { useEffect } from 'react';
import { useTheme } from './shared/store/theme';

function App() {
  const init = useTheme(s => s.init);
  useEffect(() => { init(); }, [init]);
  return (
    <Routes>
      {/* Без лейаута */}
      <Route path="/auth" element={<AuthPage />} />

      {/* Всё под общим лейаутом */}
      <Route element={<Layout />}>
        <Route index element={<Navigate to="/goals" replace />} />
        <Route path="/income" element={<IncomePage />} />
        <Route path="/expenses" element={<ExpensesPage />} />
        <Route path="/goals" element={<GoalsPage />} />
        <Route path="/docs" element={<DocsPage />} />
      </Route>

      {/* 404 / редирект */}
      <Route path="*" element={<Navigate to="/goals" replace />} />
    </Routes>
  );
}

export default App
