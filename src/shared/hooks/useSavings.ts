import { useState, useCallback, useEffect } from 'react';
import type { Saving } from '@/shared/utils/savings';
import { fetchSavings, createSaving, updateSaving, deleteSaving, type CreateSavingParams, type UpdateSavingParams } from '@/shared/utils/savings';
import { useCurrencyConversion } from './useCurrencyConversion';
import { reportErrorToTelegram } from '@/shared/utils/errorReporting';
import type { CurrencyCode } from '@/shared/constants/currencies';

interface UseSavingsProps {
  userId: string | undefined;
  scenarioId: string | null;
  settingsCurrency?: CurrencyCode | null;
}

interface UseSavingsReturn {
  savings: Saving[];
  loading: boolean;
  error: string | null;
  submitting: boolean;
  deletingId: string | null;
  formError: string | null;
  
  // Actions
  refreshSavings: () => Promise<void>;
  handleCreateSaving: (params: Omit<CreateSavingParams, 'userId' | 'scenarioId'>) => Promise<void>;
  handleUpdateSaving: (params: Omit<UpdateSavingParams, 'userId'>) => Promise<void>;
  handleDeleteSaving: (savingId: string, confirmMessage?: string) => Promise<void>;
  
  // Setters
  setFormError: (error: string | null) => void;
  setSubmitting: (value: boolean) => void;
}

export function useSavings({
  userId,
  scenarioId,
  settingsCurrency,
}: UseSavingsProps): UseSavingsReturn {
  const [savings, setSavings] = useState<Saving[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [submitting, setSubmitting] = useState(false);
  const [deletingId, setDeletingId] = useState<string | null>(null);
  const [formError, setFormError] = useState<string | null>(null);
  
  const { convertAmount } = useCurrencyConversion();

  const refreshSavings = useCallback(async () => {
    if (!userId) return;
    
    try {
      const fetchedSavings = await fetchSavings({
        userId,
        scenarioId,
        settingsCurrency,
        convertAmount,
      });
      
      setSavings(fetchedSavings);
      window.dispatchEvent(new CustomEvent('savingUpdated'));
    } catch (err) {
      await reportErrorToTelegram({
        action: 'refreshSavings',
        error: err,
        userId,
        context: { scenarioId }
      });
      throw err;
    }
  }, [userId, scenarioId, settingsCurrency, convertAmount]);

  const handleCreateSaving = useCallback(async (params: Omit<CreateSavingParams, 'userId' | 'scenarioId'>) => {
    if (!userId) return;
    
    try {
      setSubmitting(true);
      setFormError(null);
      
      await createSaving({
        ...params,
        userId,
        scenarioId,
      });
      
      await refreshSavings();
    } catch (err) {
      await reportErrorToTelegram({
        action: 'createSaving',
        error: err,
        userId,
        context: { scenarioId }
      });
      throw err;
    } finally {
      setSubmitting(false);
    }
  }, [userId, scenarioId, refreshSavings]);

  const handleUpdateSaving = useCallback(async (params: Omit<UpdateSavingParams, 'userId'>) => {
    if (!userId) return;
    
    try {
      setSubmitting(true);
      setFormError(null);
      
      await updateSaving({
        ...params,
        userId,
      });
      
      await refreshSavings();
    } catch (err) {
      await reportErrorToTelegram({
        action: 'updateSaving',
        error: err,
        userId,
        context: { savingId: params.savingId, scenarioId }
      });
      throw err;
    } finally {
      setSubmitting(false);
    }
  }, [userId, scenarioId, refreshSavings]);

  const handleDeleteSaving = useCallback(async (savingId: string, confirmMessage?: string) => {
    if (!userId) return;

    if (confirmMessage && !window.confirm(confirmMessage)) {
      return;
    }

    try {
      setDeletingId(savingId);
      await deleteSaving({ savingId, userId });
      await refreshSavings();
    } catch (err) {
      await reportErrorToTelegram({
        action: 'deleteSaving',
        error: err,
        userId,
        context: { savingId, scenarioId }
      });
      throw err;
    } finally {
      setDeletingId(null);
    }
  }, [userId, scenarioId, refreshSavings]);

  // Initial load
  useEffect(() => {
    async function loadSavings() {
      if (!userId || !scenarioId) {
        setLoading(false);
        return;
      }

      try {
        setLoading(true);
        setError(null);
        
        const fetchedSavings = await fetchSavings({
          userId,
          scenarioId,
          settingsCurrency,
          convertAmount,
        });
        
        setSavings(fetchedSavings);
      } catch (err) {
        await reportErrorToTelegram({
          action: 'fetchSavings',
          error: err,
          userId,
          context: { scenarioId }
        });
        setError(err instanceof Error ? err.message : 'Failed to load savings');
      } finally {
        setLoading(false);
      }
    }

    loadSavings();
  }, [userId, scenarioId, settingsCurrency, convertAmount]);

  return {
    savings,
    loading,
    error,
    submitting,
    deletingId,
    formError,
    refreshSavings,
    handleCreateSaving,
    handleUpdateSaving,
    handleDeleteSaving,
    setFormError,
    setSubmitting,
  };
}

