import { useState, useEffect, useCallback } from 'react';
import { supabase } from '@/lib/supabase';
import { useQueryClient } from '@tanstack/react-query';
import { useCurrency, useCurrencyConversion } from '@/shared/hooks';
import { fetchIncomes } from '@/shared/utils/income';
import { fetchExpenses } from '@/shared/utils/expenses';
import { fetchSavings } from '@/shared/utils/savings';
import { reportErrorToTelegram } from '@/shared/utils/errorReporting';

interface UseFinancialSummaryReturn {
  totalIncome: number;
  totalExpenses: number;
  totalSavings: number;
  totalGoals: number;
  remainder: number;
}

export function useFinancialSummary(): UseFinancialSummaryReturn {
  const queryClient = useQueryClient();
  const user = queryClient.getQueryData(['user']) as { id?: string; email?: string } | null;
  const currentScenario = queryClient.getQueryData(['currentScenario']) as { 
    id?: string | null; 
    slug?: string | null; 
    baseCurrency?: string | null;
  } | null;
  const scenarioId = currentScenario?.id ?? null;
  const { currency: settingsCurrency } = useCurrency();
  const { convertAmount } = useCurrencyConversion();
  
  const [totalIncome, setTotalIncome] = useState(0);
  const [totalExpenses, setTotalExpenses] = useState(0);
  const [totalSavings, setTotalSavings] = useState(0);
  const [totalGoals, setTotalGoals] = useState(0);

  const calculateTotalIncome = useCallback(async () => {
    if (!user?.id || !scenarioId || !settingsCurrency) {
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

  const calculateTotalSavings = useCallback(async () => {
    if (!user?.id || !scenarioId || !settingsCurrency) {
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

  const calculateTotalExpenses = useCallback(async () => {
    if (!user?.id || !scenarioId || !settingsCurrency) {
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

  const calculateTotalGoals = useCallback(async () => {
    if (!user?.id || !scenarioId || !settingsCurrency) {
      setTotalGoals(0);
      return;
    }

    try {
      let query = supabase
        .from('goals_decrypted')
        .select('target_amount, target_date, created_at, currency')
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

      // Конвертируем все цели в базовую валюту сценария
      const convertedGoals = await Promise.all(
        data.map(async (goal) => {
          const targetAmount = goal.target_amount || 0;
          const goalCurrency = goal.currency;
          
          if (!goalCurrency || targetAmount <= 0) {
            return { ...goal, convertedAmount: 0 };
          }

          // Если валюта цели совпадает с базовой валютой, конвертация не нужна
          if (goalCurrency === settingsCurrency) {
            return { ...goal, convertedAmount: targetAmount };
          }

          // Конвертируем в базовую валюту сценария
          const convertedAmount = await convertAmount(targetAmount, goalCurrency, settingsCurrency);
          
          // Если конвертация не удалась, используем исходную сумму (или 0)
          return { ...goal, convertedAmount: convertedAmount ?? targetAmount };
        })
      );

      const today = new Date();
      today.setHours(0, 0, 0, 0);

      const total = convertedGoals.reduce((sum, goal) => {
        const targetAmount = goal.convertedAmount;
        const targetDate = goal.target_date;
        
        if (!targetDate) {
          return sum;
        }
        if (targetAmount <= 0) {
          return sum;
        }
        
        const target = new Date(targetDate);
        target.setHours(0, 0, 0, 0);
        
        // Считаем месяцы от сегодняшнего дня до целевой даты
        const diffTime = target.getTime() - today.getTime();
        
        if (diffTime <= 0) {
          // Если целевая дата уже прошла, не учитываем эту цель
          return sum;
        }
        
        const diffDays = Math.ceil(diffTime / (1000 * 60 * 60 * 24));
        const totalMonths = Math.max(1, Math.ceil(diffDays / 30.44));
        
        const monthlyContribution = targetAmount / totalMonths;
        
        return sum + monthlyContribution;
      }, 0);
      
      setTotalGoals(Math.round(total * 100) / 100); 
    } catch (err) {
      await reportErrorToTelegram({
        action: 'calculateTotalGoals',
        error: err,
        userId: user.id,
        context: { scenarioId },
      });
      setTotalGoals(0);
    }
  }, [user, scenarioId, settingsCurrency, convertAmount]);

  const refreshSummary = useCallback(async () => {
    if (!user?.id || !scenarioId) {
      setTotalIncome(0);
      setTotalExpenses(0);
      setTotalSavings(0);
      setTotalGoals(0);
      return;
    }

    try {
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
    }
  }, [user, scenarioId, calculateTotalIncome, calculateTotalExpenses, calculateTotalSavings, calculateTotalGoals]);

  // Reset all values when scenario changes
  useEffect(() => {
    setTotalIncome(0);
    setTotalExpenses(0);
    setTotalSavings(0);
    setTotalGoals(0);
  }, [scenarioId]);

  // Refresh summary when scenario or currency changes
  useEffect(() => {
    refreshSummary();
  }, [refreshSummary, settingsCurrency]);

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
  };
}


