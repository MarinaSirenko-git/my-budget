import { useEffect, useState } from 'react';
import { useParams, useNavigate, Outlet } from 'react-router-dom';
import { useAuth, useAuth as useAuthStore } from '@/shared/store/auth';
import { supabase } from '@/lib/supabase';
import { isValidSlug, createSlug } from '@/shared/utils/slug';

/**
 * Компонент-обертка для валидации scenario slug
 * Проверяет существование сценария по slug и права доступа
 * Редиректит на текущий сценарий пользователя при невалидном slug
 */
export default function ScenarioRouteGuard() {
  const { scenarioSlug } = useParams<{ scenarioSlug: string }>();
  const navigate = useNavigate();
  const { user, currentScenarioId, loadCurrentScenarioId, loadCurrentScenarioSlug } = useAuth();
  const [loading, setLoading] = useState(true);
  const [isValid, setIsValid] = useState(false);

  useEffect(() => {
    async function validateScenario() {
      if (!user || !scenarioSlug) {
        setLoading(false);
        setIsValid(false);
        return;
      }

      // Валидация формата slug
      if (!isValidSlug(scenarioSlug)) {
        await redirectToCurrentScenario();
        return;
      }

      try {
        setLoading(true);

        // Получаем все сценарии пользователя
        const { data: scenarios, error: fetchError } = await supabase
          .from('scenarios')
          .select('id, name, user_id')
          .eq('user_id', user.id);

        if (fetchError) {
          throw fetchError;
        }

        // Ищем сценарий по slug
        const matchingScenario = scenarios?.find(scenario => {
          const scenarioSlugFromName = createSlug(scenario.name);
          return scenarioSlugFromName === scenarioSlug;
        });

        if (!matchingScenario) {
          // Сценарий не найден, редирект на текущий
          await redirectToCurrentScenario();
          return;
        }

        // Проверяем права доступа (scenario принадлежит пользователю)
        if (matchingScenario.user_id !== user.id) {
          // Нет прав доступа, редирект на текущий сценарий
          await redirectToCurrentScenario();
          return;
        }

        // Устанавливаем currentScenarioId в store для использования на страницах
        const authStore = useAuthStore.getState();
        authStore.setCurrentScenarioId(matchingScenario.id);

        // Валидация пройдена
        setIsValid(true);
        setLoading(false);
      } catch (err) {
        console.error('Error validating scenario:', err);
        await redirectToCurrentScenario();
      }
    }

    async function redirectToCurrentScenario() {
      try {
        // Загружаем текущий сценарий пользователя
        await loadCurrentScenarioId();
        await loadCurrentScenarioSlug();
        
        const authState = useAuth.getState();
        const currentId = authState.currentScenarioId;
        const currentSlug = authState.currentScenarioSlug;
        
        if (currentId && currentSlug) {
          const currentPath = window.location.pathname;
          // Заменяем текущий slug на правильный
          const pathWithoutSlug = currentPath.replace(/^\/[^/]+/, '') || '/goals';
          navigate(`/${currentSlug}${pathWithoutSlug}`, { replace: true });
        } else if (currentId) {
          // Если slug не загружен, получаем имя сценария
          const { data: scenario, error: scenarioError } = await supabase
            .from('scenarios')
            .select('name')
            .eq('id', currentId)
            .eq('user_id', user.id)
            .single();

          if (!scenarioError && scenario) {
            const slug = createSlug(scenario.name);
            const currentPath = window.location.pathname;
            const pathWithoutSlug = currentPath.replace(/^\/[^/]+/, '') || '/goals';
            navigate(`/${slug}${pathWithoutSlug}`, { replace: true });
          } else {
            navigate('/scenario/goals', { replace: true });
          }
        } else {
          navigate('/scenario/goals', { replace: true });
        }
      } catch (err) {
        console.error('Error redirecting to current scenario:', err);
        navigate('/scenario/goals', { replace: true });
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

  if (!isValid) {
    return null; // Редирект в процессе
  }

  return <Outlet />;
}

