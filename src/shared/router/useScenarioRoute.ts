import { useQueryClient } from '@tanstack/react-query';


export function useScenarioRoute() {
  const queryClient = useQueryClient();
  const currentScenario = queryClient.getQueryData(['currentScenario']) as { 
    id?: string | null; 
    slug?: string | null; 
    baseCurrency?: string | null;
  } | null;
  const slug = currentScenario?.slug ?? null;
  const currentScenarioId = currentScenario?.id ?? null;
  
  return {
    scenarioSlug: slug,
    scenarioId: currentScenarioId,
    loading: false,
    error: null,
  };
}

