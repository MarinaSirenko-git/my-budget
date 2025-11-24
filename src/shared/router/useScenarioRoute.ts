import { useEffect, useState } from 'react';
import { useParams, useNavigate } from 'react-router-dom';
import { useAuth } from '@/shared/store/auth';
import { supabase } from '@/lib/supabase';
import { isValidSlug } from '@/shared/utils/slug';

/**
 * Хук для работы с scenario из URL параметров
 * Возвращает scenarioId из store (установлен ScenarioRouteGuard)
 * и scenarioSlug из URL
 */
export function useScenarioRoute() {
  const { scenarioSlug } = useParams<{ scenarioSlug: string }>();
  const { currentScenarioId } = useAuth();

  return {
    scenarioSlug: scenarioSlug || null,
    scenarioId: currentScenarioId,
    loading: false, // ScenarioRouteGuard уже загрузил данные
    error: null,
  };
}

