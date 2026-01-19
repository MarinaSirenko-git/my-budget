import { useQuery } from '@tanstack/react-query';
import { supabase } from '@/lib/supabase';
import { useScenario } from './useScenario';

export interface Saving {
  id: string;
  comment: string;
  amount: number;
  currency: string;
  createdAt: string;
  amountInDefaultCurrency?: number;
}

interface SupabaseSavingRow {
  id: string;
  created_at: string;
  comment: string | null;
  amount: number;
  currency: string;
  scenario_id: string;
  user_id: string;
}

async function fetchSavingsData(scenarioId: string | null): Promise<Saving[]> {
  if (!scenarioId) {
    return [];
  }

  const { data, error } = await supabase
    .from('savings')
    .select('id, created_at, comment, amount, currency, scenario_id, user_id')
    .eq('scenario_id', scenarioId)
    .order('created_at', { ascending: false })
    .order('id', { ascending: false });

  if (error) {
    throw new Error(`Failed to fetch savings: ${error.message}`);
  }

  if (!data || data.length === 0) {
    return [];
  }

  return data.map((item: SupabaseSavingRow): Saving => {
    return {
      id: item.id,
      comment: item.comment || '',
      amount: item.amount || 0,
      currency: item.currency,
      createdAt: item.created_at,
    };
  });
}

export function useSavings() {
  const { currentScenario } = useScenario();

  const { data: savings = [], isLoading: loading, error } = useQuery<Saving[]>({
    queryKey: ['savings', currentScenario?.id],
    queryFn: () => fetchSavingsData(currentScenario?.id || null),
    
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
    
    enabled: !!currentScenario?.id,
  });

  return {
    savings,
    loading,
    error,
  };
}
