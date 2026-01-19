import { useQuery } from '@tanstack/react-query';
import { supabase } from '@/lib/supabase';
import { useScenario } from './useScenario';
import type { Expense } from '@/mocks/pages/expenses.mock';

interface SupabaseExpenseRow {
  id: string;
  created_at: string;
  amount: number;
  currency: string;
  type: string;
  frequency: string | null;
  scenario_id: string;
}

async function fetchExpensesData(scenarioId: string | null): Promise<Expense[]> {
  if (!scenarioId) {
    return [];
  }

  const { data, error } = await supabase
    .from('expenses')
    .select('id, created_at, amount, currency, type, frequency, scenario_id')
    .eq('scenario_id', scenarioId)
    .order('created_at', { ascending: false })
    .order('id', { ascending: false });

  if (error) {
    throw new Error(`Failed to fetch expenses: ${error.message}`);
  }

  if (!data || data.length === 0) {
    return [];
  }

  return data.map((item: SupabaseExpenseRow): Expense => {
    // Map 'yearly' back to 'annual' for frontend consistency
    const frontendFrequency = item.frequency === 'yearly' ? 'annual' : (item.frequency || 'monthly');
    
    return {
      id: item.id,
      type: item.type,
      category: item.type,
      amount: item.amount,
      currency: item.currency,
      frequency: frontendFrequency as 'monthly' | 'annual',
      date: item.created_at?.split('T')[0] || new Date().toISOString().split('T')[0],
      createdAt: item.created_at,
    };
  });
}

export function useExpenses() {
  const { currentScenario } = useScenario();

  const { data: expenses = [], isLoading: loading, error } = useQuery<Expense[]>({
    queryKey: ['expenses', currentScenario?.id],
    queryFn: () => fetchExpensesData(currentScenario?.id || null),
    
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
    expenses,
    loading,
    error,
  };
}

