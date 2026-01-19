import { useQuery } from '@tanstack/react-query';
import { supabase } from '@/lib/supabase';
import { useScenario } from './useScenario';

export interface Income {
  id: string;
  type: string;
  amount: number;
  currency: string;
  frequency: 'monthly' | 'annual';
  date: string;
  createdAt: string;
  amountInDefaultCurrency?: number;
}

interface SupabaseIncomeRow {
  id: string;
  created_at: string;
  amount: number;
  currency: string;
  type: string;
  frequency: string | null;
  payment_day: number | null;
  scenario_id: string;
}

async function fetchIncomesData(scenarioId: string | null): Promise<Income[]> {
  if (!scenarioId) {
    return [];
  }

  const { data, error } = await supabase
    .from('incomes')
    .select('id, created_at, amount, currency, type, frequency, payment_day, scenario_id')
    .eq('scenario_id', scenarioId)
    .order('created_at', { ascending: false })
    .order('id', { ascending: false });

  if (error) {
    throw new Error(`Failed to fetch incomes: ${error.message}`);
  }

  if (!data || data.length === 0) {
    return [];
  }

  return data.map((item: SupabaseIncomeRow): Income => {
    // Map 'yearly' back to 'annual' for frontend consistency
    const frontendFrequency = item.frequency === 'yearly' ? 'annual' : (item.frequency || 'monthly');
    
    return {
      id: item.id,
      type: item.type,
      amount: item.amount,
      currency: item.currency,
      frequency: frontendFrequency as 'monthly' | 'annual',
      date: item.created_at?.split('T')[0] || new Date().toISOString().split('T')[0],
      createdAt: item.created_at,
    };
  });
}

export function useIncomes() {
  const { currentScenario } = useScenario();

  const { data: incomes = [], isLoading: loading, error } = useQuery<Income[]>({
    queryKey: ['incomes', currentScenario?.id],
    queryFn: () => fetchIncomesData(currentScenario?.id || null),
    
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
    incomes,
    loading,
    error,
  };
}

