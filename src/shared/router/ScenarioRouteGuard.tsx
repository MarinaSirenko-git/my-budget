// validate scenario id/slug on route change

import { useEffect, useState } from 'react';
import { useParams, useNavigate, Outlet } from 'react-router-dom';
import { useAuth, useAuth as useAuthStore } from '@/shared/store/auth';
import { supabase } from '@/lib/supabase';
import { createSlug } from '@/shared/utils/slug';
import { reportErrorToTelegram } from '@/shared/utils/errorReporting';
import { validateScenarioBySlug } from '@/shared/utils/scenarios';

export default function ScenarioRouteGuard() {
  const { scenarioSlug } = useParams<{ scenarioSlug: string }>();
  const navigate = useNavigate();
  const { user, loadCurrentScenarioId, loadCurrentScenarioSlug } = useAuth();
  const [loading, setLoading] = useState(true);
  const [isValid, setIsValid] = useState(false);

  useEffect(() => {
    async function validateScenario() {
      if (!user || !scenarioSlug) {
        setLoading(false);
        setIsValid(false);
        return;
      }

      setLoading(true);

      const scenarioId = await validateScenarioBySlug(scenarioSlug, user.id);

      if (!scenarioId) {
        await redirectToCurrentScenario(user.id);
        return;
      }

      const authStore = useAuthStore.getState();
      authStore.setCurrentScenarioId(scenarioId);

      setIsValid(true);
      setLoading(false);
    }

    async function redirectToCurrentScenario(userId: string) {
      try {
        await loadCurrentScenarioId();
        await loadCurrentScenarioSlug();
        
        const authState = useAuth.getState();
        const currentId = authState.currentScenarioId;
        const currentSlug = authState.currentScenarioSlug;
        
        if (currentId && currentSlug) {
          const currentPath = window.location.pathname;
          const pathWithoutSlug = currentPath.replace(/^\/[^/]+/, '') || '/income';
          navigate(`/${currentSlug}${pathWithoutSlug}`, { replace: true });
          return;
        }
        
        if (currentId) {
          const { data: scenario, error: scenarioError } = await supabase
            .from('scenarios')
            .select('name')
            .eq('id', currentId)
            .eq('user_id', userId)
            .single();

          if (!scenarioError && scenario) {
            const slug = createSlug(scenario.name);
            const currentPath = window.location.pathname;
            const pathWithoutSlug = currentPath.replace(/^\/[^/]+/, '') || '/income';
            navigate(`/${slug}${pathWithoutSlug}`, { replace: true });
            return;
          }
        }
        
        // If no current scenario, try to find any scenario for user
        const { data: scenarios, error: scenariosError } = await supabase
          .from('scenarios')
          .select('name, id')
          .eq('user_id', userId)
          .limit(1);

        if (!scenariosError && scenarios && scenarios.length > 0) {
          const slug = createSlug(scenarios[0].name);
          navigate(`/${slug}/goals`, { replace: true });
          return;
        }
        
        // If no scenarios exist, redirect to auth
        navigate('/auth', { replace: true });
      } catch (err) {
        await reportErrorToTelegram({
          action: 'redirectToCurrentScenario',
          error: err,
          userId: userId,
          context: { currentPath: window.location.pathname },
        });
        navigate('/auth', { replace: true });
      }
    }

    validateScenario();
  }, [scenarioSlug, user, navigate, loadCurrentScenarioId, loadCurrentScenarioSlug]);

  if (loading) {
    return (
      <div className="flex items-center justify-center min-h-screen">
        <div className="text-textColor dark:text-textColor">Loading...</div>
      </div>

    );
  }

  if (!isValid) return null

  return <Outlet />;
}

