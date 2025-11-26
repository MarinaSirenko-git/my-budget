import { useState, useEffect, useCallback } from 'react';
import { supabase } from '@/lib/supabase';
import { useAuth } from '@/shared/store/auth';
import { useScenarioRoute } from '@/shared/router/useScenarioRoute';
import { useCurrency, useCurrencyConversion } from '@/shared/hooks';
import { fetchIncomes } from '@/shared/utils/income';
import { fetchExpenses } from '@/shared/utils/expenses';
import { fetchSavings } from '@/shared/utils/savings';
import { reportErrorToTelegram } from '@/shared/utils/errorReporting';

interface UseFinancialSummaryProps {
  scenarioId?: string | null; // Если не передан, использует из useScenarioRoute. Если null, показывает все сценарии
}

interface UseFinancialSummaryReturn {
  totalIncome: number;
  totalExpenses: number;
  totalSavings: number;
  totalGoals: number;
  remainder: number;
  loading: boolean;
  error: string | null;
  refreshSummary: () => Promise<void>;
}

/**
 * Хук для получения агрегированных финансовых данных
 * Используется в LeftSidebar для отображения финансовой сводки
 */
export function useFinancialSummary(
  props?: UseFinancialSummaryProps
): UseFinancialSummaryReturn {
  const { user } = useAuth();
  const { scenarioId: routeScenarioId } = useScenarioRoute();
  const { currency: settingsCurrency } = useCurrency();
  const { convertAmount } = useCurrencyConversion();
  
  // Используем scenarioId из пропсов или из роута. Если null, показываем все сценарии
  const scenarioId = props?.scenarioId !== undefined ? props.scenarioId : routeScenarioId;

  const [totalIncome, setTotalIncome] = useState(0);
  const [totalExpenses, setTotalExpenses] = useState(0);
  const [totalSavings, setTotalSavings] = useState(0);
  const [totalGoals, setTotalGoals] = useState(0);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);

  const calculateTotalIncome = useCallback(async () => {
    if (!user) {
      setTotalIncome(0);
      return;
    }

    try {
      const incomes = await fetchIncomes({
        userId: user.id,
        scenarioId,
        settingsCurrency,
        convertAmount,
      });

      // Рассчитываем месячный доход
      const monthlyTotal = incomes
        .filter(income => income.frequency === 'monthly')
        .reduce((sum, income) => {
          const amount = income.amountInDefaultCurrency ?? income.amount;
          return sum + amount;
        }, 0);

      const annualTotal = incomes
        .filter(income => income.frequency === 'annual')
        .reduce((sum, income) => {
          const amount = income.amountInDefaultCurrency ?? income.amount;
          return sum + (amount / 12);
        }, 0);

      setTotalIncome(monthlyTotal + annualTotal);
    } catch (err) {
      await reportErrorToTelegram({
        action: 'calculateTotalIncome',
        error: err,
        userId: user.id,
        context: { scenarioId },
      });
      setTotalIncome(0);
    }
  }, [user, scenarioId, settingsCurrency, convertAmount]);

  const calculateTotalExpenses = useCallback(async () => {
    if (!user) {
      setTotalExpenses(0);
      return;
    }

    try {
      const expenses = await fetchExpenses({
        userId: user.id,
        scenarioId,
        settingsCurrency,
        convertAmount,
      });

      const total = expenses.reduce((sum, expense) => {
        const amount = expense.amountInDefaultCurrency ?? expense.amount;
        
        if (expense.frequency === 'annual') {
          return sum + (amount / 12);
        } else if (expense.frequency === 'one-time') {
          // One-time expenses не учитываем в месячном расчете
          return sum;
        } else {
          return sum + amount;
        }
      }, 0);

      setTotalExpenses(total);
    } catch (err) {
      await reportErrorToTelegram({
        action: 'calculateTotalExpenses',
        error: err,
        userId: user.id,
        context: { scenarioId },
      });
      setTotalExpenses(0);
    }
  }, [user, scenarioId, settingsCurrency, convertAmount]);

  const calculateTotalSavings = useCallback(async () => {
    if (!user) {
      setTotalSavings(0);
      return;
    }

    try {
      const savings = await fetchSavings({
        userId: user.id,
        scenarioId,
        settingsCurrency,
        convertAmount,
      });

      const total = savings.reduce((sum, saving) => {
        const amount = saving.amountInDefaultCurrency ?? saving.amount;
        return sum + amount;
      }, 0);

      setTotalSavings(total);
    } catch (err) {
      await reportErrorToTelegram({
        action: 'calculateTotalSavings',
        error: err,
        userId: user.id,
        context: { scenarioId },
      });
      setTotalSavings(0);
    }
  }, [user, scenarioId, settingsCurrency, convertAmount]);

  const calculateTotalGoals = useCallback(async () => {
    if (!user) {
      setTotalGoals(0);
      return;
    }

    try {
      // Получаем данные напрямую из БД, так как нам нужен created_at
      let query = supabase
        .from('goals_decrypted')
        .select('target_amount, target_date, created_at')
        .eq('user_id', user.id);

      if (scenarioId) {
        query = query.eq('scenario_id', scenarioId);
      }

      const { data, error: fetchError } = await query;

      if (fetchError) {
        throw fetchError;
      }

      if (!data || data.length === 0) {
        setTotalGoals(0);
        return;
      }

      const total = data.reduce((sum, goal) => {
        const targetAmount = goal.target_amount || 0;
        const targetDate = goal.target_date;
        const createdAt = goal.created_at;
        
        // Skip goals without target date or creation date
        if (!targetDate || !createdAt) {
          return sum;
        }
        
        // Skip goals with zero or negative amount
        if (targetAmount <= 0) {
          return sum;
        }
        
        // Calculate months from creation date to target date
        const created = new Date(createdAt);
        created.setHours(0, 0, 0, 0);
        
        const target = new Date(targetDate);
        target.setHours(0, 0, 0, 0);
        
        const diffTime = target.getTime() - created.getTime();
        
        // If target date is before or equal to creation date, skip
        if (diffTime <= 0) {
          return sum;
        }
        
        // Calculate total months from creation to target
        const diffDays = Math.ceil(diffTime / (1000 * 60 * 60 * 24));
        const totalMonths = Math.max(1, Math.ceil(diffDays / 30.44)); // 30.44 = average days per month
        
        // Calculate monthly contribution: target_amount / total_months
        const monthlyContribution = targetAmount / totalMonths;
        
        return sum + monthlyContribution;
      }, 0);
      
      setTotalGoals(Math.round(total * 100) / 100); // Round to 2 decimal places
    } catch (err) {
      await reportErrorToTelegram({
        action: 'calculateTotalGoals',
        error: err,
        userId: user.id,
        context: { scenarioId },
      });
      setTotalGoals(0);
    }
  }, [user, scenarioId]);

  const refreshSummary = useCallback(async () => {
    if (!user) {
      setTotalIncome(0);
      setTotalExpenses(0);
      setTotalSavings(0);
      setTotalGoals(0);
      setLoading(false);
      return;
    }

    try {
      setLoading(true);
      setError(null);

      await Promise.all([
        calculateTotalIncome(),
        calculateTotalExpenses(),
        calculateTotalSavings(),
        calculateTotalGoals(),
      ]);
    } catch (err) {
      await reportErrorToTelegram({
        action: 'refreshFinancialSummary',
        error: err,
        userId: user.id,
        context: { scenarioId },
      });
      setError(err instanceof Error ? err.message : 'Failed to load financial summary');
    } finally {
      setLoading(false);
    }
  }, [user, calculateTotalIncome, calculateTotalExpenses, calculateTotalSavings, calculateTotalGoals]);

  // Initial load
  useEffect(() => {
    refreshSummary();
  }, [refreshSummary]);

  // Subscribe to update events
  useEffect(() => {
    const handleIncomeUpdated = () => calculateTotalIncome();
    const handleExpenseUpdated = () => calculateTotalExpenses();
    const handleSavingUpdated = () => calculateTotalSavings();
    const handleGoalUpdated = () => calculateTotalGoals();

    window.addEventListener('incomeUpdated', handleIncomeUpdated);
    window.addEventListener('expenseUpdated', handleExpenseUpdated);
    window.addEventListener('savingUpdated', handleSavingUpdated);
    window.addEventListener('goalUpdated', handleGoalUpdated);

    return () => {
      window.removeEventListener('incomeUpdated', handleIncomeUpdated);
      window.removeEventListener('expenseUpdated', handleExpenseUpdated);
      window.removeEventListener('savingUpdated', handleSavingUpdated);
      window.removeEventListener('goalUpdated', handleGoalUpdated);
    };
  }, [calculateTotalIncome, calculateTotalExpenses, calculateTotalSavings, calculateTotalGoals]);

  const remainder = totalIncome - totalExpenses - totalGoals;

  return {
    totalIncome,
    totalExpenses,
    totalSavings,
    totalGoals,
    remainder,
    loading,
    error,
    refreshSummary,
  };
}

