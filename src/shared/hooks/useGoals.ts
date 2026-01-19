import { useQuery } from '@tanstack/react-query';
import { useScenario } from './useScenario';
import { useUser } from './useUser';
import { fetchGoals, type Goal } from '@/shared/utils/goals';

async function fetchGoalsData(scenarioId: string | null, userId: string | null): Promise<Goal[]> {
  if (!scenarioId || !userId) {
    return [];
  }

  try {
    return await fetchGoals({ userId, scenarioId });
  } catch (error) {
    throw new Error(`Failed to fetch goals: ${error instanceof Error ? error.message : 'Unknown error'}`);
  }
}

export function useGoals() {
  const { currentScenario } = useScenario();
  const { user } = useUser();

  const { data: goals = [], isLoading: loading, error } = useQuery<Goal[]>({
    queryKey: ['goals', currentScenario?.id, user?.id],
    queryFn: () => fetchGoalsData(currentScenario?.id || null, user?.id || null),
    
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
    
    enabled: !!currentScenario?.id && !!user?.id,
  });

  return {
    goals,
    loading,
    error,
  };
}

