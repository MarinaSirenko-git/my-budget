import { useQuery } from '@tanstack/react-query';
import { supabase } from '@/lib/supabase';
import type { Scenario } from '@/shared/utils/scenarios';

export type CurrentScenario = {
  id: string;
  name: string;
  slug: string;
  baseCurrency: string;
} | null;

async function fetchCurrentScenario(): Promise<CurrentScenario> {
  const { data: profileCtx } = await supabase
    .from('profiles')
    .select(`
      current_scenario_id,
      current_scenario_slug,
      current_scenario:scenarios!profiles_current_scenario_fkey (
        id,
        name,
        slug,
        base_currency
      )
    `)
    .maybeSingle();

  if (!profileCtx || !profileCtx.current_scenario_id || !profileCtx.current_scenario_slug) {
    return null;
  }

  const currentScenarioData = Array.isArray(profileCtx.current_scenario)
    ? profileCtx.current_scenario[0] ?? null
    : profileCtx.current_scenario ?? null;

  if (!currentScenarioData || !currentScenarioData.name || !currentScenarioData.base_currency) {
    return null;
  }

  return {
    id: profileCtx.current_scenario_id,
    slug: profileCtx.current_scenario_slug,
    name: currentScenarioData.name,
    baseCurrency: currentScenarioData.base_currency,
  };
}

async function fetchAllUserScenarios(): Promise<Scenario[]> {
  const { data: scenarios, error } = await supabase
    .from('scenarios')
    .select('id, name, slug, base_currency')
    .order('created_at', { ascending: false });

  if (error) {
    throw new Error('Failed to load user scenarios');
  }

  return scenarios || [];
}

export function useScenario() {
  const { data: currentScenario, isLoading: loadingCurrent, error: currentError } = useQuery<CurrentScenario>({
    queryKey: ['scenarios', 'current'],
    queryFn: fetchCurrentScenario,
    
    staleTime: 1000 * 60 * 5, // 5 minutes
    gcTime: 1000 * 60 * 10, // 10 minutes
    
    refetchOnMount: 'always',
    refetchOnWindowFocus: false,
    refetchOnReconnect: true,
    
    retry: 1,
    retryDelay: 1000,
    
    networkMode: 'online',
    throwOnError: false,
    structuralSharing: true,
  });

  const { data: allScenarios = [], isLoading: loadingList, error: listError } = useQuery<Scenario[]>({
    queryKey: ['scenarios', 'list'],
    queryFn: fetchAllUserScenarios,
    
    staleTime: 1000 * 60 * 5, // 5 minutes
    gcTime: 1000 * 60 * 10, // 10 minutes
    
    refetchOnMount: 'always',
    refetchOnWindowFocus: false,
    refetchOnReconnect: true,
    
    retry: 1,
    retryDelay: 1000,
    
    networkMode: 'online',
    throwOnError: false,
    structuralSharing: true,
  });

  return {
    currentScenario: currentScenario ?? null,
    allScenarios,
    scenariosCount: allScenarios.length,
    loading: loadingCurrent || loadingList,
    error: currentError || listError,
  };
}

