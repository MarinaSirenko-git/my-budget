import { useState, useCallback, useEffect } from 'react';
import type { Expense } from '@/mocks/pages/expenses.mock';
import type { CurrencyCode } from '@/shared/constants/currencies';
import { useCurrencyConversion } from './useCurrencyConversion';
import { reportErrorToTelegram } from '@/shared/utils/errorReporting';
import {
  fetchExpenses,
  createExpense,
  updateExpense,
  deleteExpense,
  type CreateExpenseParams,
  type UpdateExpenseParams,
} from '@/shared/utils/expenses';

interface UseExpensesProps {
  userId: string | undefined;
  scenarioId: string | null;
  settingsCurrency?: CurrencyCode | null;
}

interface UseExpensesReturn {
  expenses: Expense[];
  loading: boolean;
  error: string | null;
  submitting: boolean;
  deletingId: string | null;
  formError: string | null;

  refreshExpenses: () => Promise<void>;
  handleCreateExpense: (params: Omit<CreateExpenseParams, 'userId' | 'scenarioId' | 'settingsCurrency'>) => Promise<void>;
  handleUpdateExpense: (params: Omit<UpdateExpenseParams, 'userId'>) => Promise<void>;
  handleDeleteExpense: (expenseId: string, confirmMessage?: string) => Promise<void>;

  setFormError: (error: string | null) => void;
  setSubmitting: (value: boolean) => void;
}

export function useExpenses({
  userId,
  scenarioId,
  settingsCurrency,
}: UseExpensesProps): UseExpensesReturn {
  const [expenses, setExpenses] = useState<Expense[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [submitting, setSubmitting] = useState(false);
  const [deletingId, setDeletingId] = useState<string | null>(null);
  const [formError, setFormError] = useState<string | null>(null);

  const { convertAmount } = useCurrencyConversion();

  const refreshExpenses = useCallback(async () => {
    if (!userId) return;

    try {
      const fetchedExpenses = await fetchExpenses({
        userId,
        scenarioId,
        settingsCurrency,
        convertAmount,
      });

      setExpenses(fetchedExpenses);
      window.dispatchEvent(new CustomEvent('expenseUpdated'));
    } catch (err) {
      await reportErrorToTelegram({
        action: 'refreshExpenses',
        error: err,
        userId,
        context: { scenarioId },
      });
      throw err;
    }
  }, [userId, scenarioId, settingsCurrency, convertAmount]);

  const handleCreateExpense = useCallback(async (params: Omit<CreateExpenseParams, 'userId' | 'scenarioId' | 'settingsCurrency'>) => {
    if (!userId) return;

    try {
      setSubmitting(true);
      setFormError(null);

      await createExpense({
        ...params,
        userId,
        scenarioId,
        settingsCurrency,
      });

      await refreshExpenses();
    } catch (err) {
      await reportErrorToTelegram({
        action: 'createExpense',
        error: err,
        userId,
        context: { scenarioId },
      });
      throw err;
    } finally {
      setSubmitting(false);
    }
  }, [userId, scenarioId, settingsCurrency, refreshExpenses]);

  const handleUpdateExpense = useCallback(async (params: Omit<UpdateExpenseParams, 'userId'>) => {
    if (!userId) return;

    try {
      setSubmitting(true);
      setFormError(null);

      await updateExpense({
        ...params,
        userId,
      });

      await refreshExpenses();
    } catch (err) {
      await reportErrorToTelegram({
        action: 'updateExpense',
        error: err,
        userId,
        context: { expenseId: params.expenseId, scenarioId },
      });
      throw err;
    } finally {
      setSubmitting(false);
    }
  }, [userId, scenarioId, refreshExpenses]);

  const handleDeleteExpense = useCallback(async (expenseId: string, confirmMessage?: string) => {
    if (!userId) return;

    if (confirmMessage && !window.confirm(confirmMessage)) {
      return;
    }

    try {
      setDeletingId(expenseId);
      await deleteExpense({ expenseId, userId });
      await refreshExpenses();
    } catch (err) {
      await reportErrorToTelegram({
        action: 'deleteExpense',
        error: err,
        userId,
        context: { expenseId, scenarioId },
      });
      throw err;
    } finally {
      setDeletingId(null);
    }
  }, [userId, scenarioId, refreshExpenses]);

  useEffect(() => {
    async function loadExpenses() {
      if (!userId) {
        setLoading(false);
        return;
      }

      try {
        setLoading(true);
        setError(null);

        const fetchedExpenses = await fetchExpenses({
          userId,
          scenarioId,
          settingsCurrency,
          convertAmount,
        });

        setExpenses(fetchedExpenses);
      } catch (err) {
        await reportErrorToTelegram({
          action: 'fetchExpenses',
          error: err,
          userId,
          context: { scenarioId },
        });
        setError(err instanceof Error ? err.message : 'Failed to load expenses');
      } finally {
        setLoading(false);
      }
    }

    loadExpenses();
  }, [userId, scenarioId, settingsCurrency, convertAmount]);

  return {
    expenses,
    loading,
    error,
    submitting,
    deletingId,
    formError,
    refreshExpenses,
    handleCreateExpense,
    handleUpdateExpense,
    handleDeleteExpense,
    setFormError,
    setSubmitting,
  };
}








