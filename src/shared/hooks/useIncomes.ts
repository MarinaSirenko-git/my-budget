import { useState, useCallback, useEffect } from 'react';
import type { Income } from '@/mocks/pages/income.mock';
import { fetchIncomes, createIncome, updateIncome, deleteIncome, type CreateIncomeParams, type UpdateIncomeParams } from '@/shared/utils/income';
import { useCurrencyConversion } from './useCurrencyConversion';
import { reportErrorToTelegram } from '@/shared/utils/errorReporting';
import type { CurrencyCode } from '@/shared/constants/currencies';

interface UseIncomesProps {
  userId: string | undefined;
  scenarioId: string | null;
  settingsCurrency?: CurrencyCode | null;
}

interface UseIncomesReturn {
  incomes: Income[];
  loading: boolean;
  error: string | null;
  submitting: boolean;
  deletingId: string | null;
  formError: string | null;
  
  // Actions
  refreshIncomes: () => Promise<void>;
  handleCreateIncome: (params: Omit<CreateIncomeParams, 'userId' | 'scenarioId' | 'settingsCurrency'>) => Promise<void>;
  handleUpdateIncome: (params: Omit<UpdateIncomeParams, 'userId'>) => Promise<void>;
  handleDeleteIncome: (incomeId: string, confirmMessage?: string) => Promise<void>;
  
  // Setters
  setFormError: (error: string | null) => void;
  setSubmitting: (value: boolean) => void;
}

export function useIncomes({
  userId,
  scenarioId,
  settingsCurrency,
}: UseIncomesProps): UseIncomesReturn {
  const [incomes, setIncomes] = useState<Income[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [submitting, setSubmitting] = useState(false);
  const [deletingId, setDeletingId] = useState<string | null>(null);
  const [formError, setFormError] = useState<string | null>(null);
  
  const { convertAmount } = useCurrencyConversion();

  const refreshIncomes = useCallback(async () => {
    if (!userId) return;
    try {
      const fetchedIncomes = await fetchIncomes({
        userId,
        scenarioId,
        settingsCurrency,
        convertAmount,
      });
      
      setIncomes(fetchedIncomes);
      window.dispatchEvent(new CustomEvent('incomeUpdated'));
    } catch (err) {
      await reportErrorToTelegram({
        action: 'refreshIncomes',
        error: err,
        userId,
        context: { scenarioId }
      });
      throw err;
    }
  }, [userId, scenarioId, settingsCurrency, convertAmount]);

  const handleCreateIncome = useCallback(async (params: Omit<CreateIncomeParams, 'userId' | 'scenarioId' | 'settingsCurrency'>) => {
    if (!userId) return;
    
    try {
      setSubmitting(true);
      setFormError(null);
      
      await createIncome({
        ...params,
        userId,
        scenarioId,
        settingsCurrency,
      });
      
      await refreshIncomes();
    } catch (err) {
      await reportErrorToTelegram({
        action: 'createIncome',
        error: err,
        userId,
        context: { scenarioId }
      });
      throw err;
    } finally {
      setSubmitting(false);
    }
  }, [userId, scenarioId, settingsCurrency, refreshIncomes]);

  const handleUpdateIncome = useCallback(async (params: Omit<UpdateIncomeParams, 'userId'>) => {
    if (!userId) return;
    
    try {
      setSubmitting(true);
      setFormError(null);
      
      await updateIncome({
        ...params,
        userId,
      });
      
      await refreshIncomes();
    } catch (err) {
      await reportErrorToTelegram({
        action: 'updateIncome',
        error: err,
        userId,
        context: { incomeId: params.incomeId, scenarioId }
      });
      throw err;
    } finally {
      setSubmitting(false);
    }
  }, [userId, scenarioId, refreshIncomes]);

  const handleDeleteIncome = useCallback(async (incomeId: string, confirmMessage?: string) => {
    if (!userId) return;

    if (confirmMessage && !window.confirm(confirmMessage)) {
      return;
    }

    try {
      setDeletingId(incomeId);
      await deleteIncome({ incomeId, userId });
      await refreshIncomes();
    } catch (err) {
      await reportErrorToTelegram({
        action: 'deleteIncome',
        error: err,
        userId,
        context: { incomeId, scenarioId }
      });
      throw err;
    } finally {
      setDeletingId(null);
    }
  }, [userId, scenarioId, refreshIncomes]);

  // Initial load
  useEffect(() => {
    async function loadIncomes() {
      if (!userId || !scenarioId) {
        setLoading(false);
        return;
      }

      try {
        setLoading(true);
        setError(null);
        
        const fetchedIncomes = await fetchIncomes({
          userId,
          scenarioId,
          settingsCurrency,
          convertAmount,
        });
        
        setIncomes(fetchedIncomes);
      } catch (err) {
        await reportErrorToTelegram({
          action: 'fetchIncomes',
          error: err,
          userId,
          context: { scenarioId }
        });
        setError(err instanceof Error ? err.message : 'Failed to load incomes');
      } finally {
        setLoading(false);
      }
    }

    loadIncomes();
  }, []);

  return {
    incomes,
    loading,
    error,
    submitting,
    deletingId,
    formError,
    refreshIncomes,
    handleCreateIncome,
    handleUpdateIncome,
    handleDeleteIncome,
    setFormError,
    setSubmitting,
  };
}

