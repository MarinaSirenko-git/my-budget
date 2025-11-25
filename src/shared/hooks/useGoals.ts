import { useState, useCallback, useEffect } from 'react';
import type { Goal } from '@/shared/utils/goals';
import { fetchGoals, createGoal, updateGoal, deleteGoal, type CreateGoalParams, type UpdateGoalParams } from '@/shared/utils/goals';
import { reportErrorToTelegram } from '@/shared/utils/errorReporting';

interface UseGoalsProps {
  userId: string | undefined;
  scenarioId: string | null;
}

interface UseGoalsReturn {
  goals: Goal[];
  loading: boolean;
  error: string | null;
  submitting: boolean;
  deletingId: string | null;
  formError: string | null;
  
  // Actions
  refreshGoals: () => Promise<void>;
  handleCreateGoal: (params: Omit<CreateGoalParams, 'userId' | 'scenarioId'>) => Promise<void>;
  handleUpdateGoal: (params: Omit<UpdateGoalParams, 'userId'>) => Promise<void>;
  handleDeleteGoal: (goalId: string, confirmMessage?: string) => Promise<void>;
  
  // Setters
  setFormError: (error: string | null) => void;
  setSubmitting: (value: boolean) => void;
}

export function useGoals({
  userId,
  scenarioId,
}: UseGoalsProps): UseGoalsReturn {
  const [goals, setGoals] = useState<Goal[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [submitting, setSubmitting] = useState(false);
  const [deletingId, setDeletingId] = useState<string | null>(null);
  const [formError, setFormError] = useState<string | null>(null);

  const refreshGoals = useCallback(async () => {
    if (!userId || !scenarioId) return;
    
    try {
      const fetchedGoals = await fetchGoals({
        userId,
        scenarioId,
      });
      
      setGoals(fetchedGoals);
      // Trigger event to update sidebar
      window.dispatchEvent(new Event('goalUpdated'));
    } catch (err) {
      await reportErrorToTelegram({
        action: 'refreshGoals',
        error: err,
        userId,
        context: { scenarioId }
      });
      throw err;
    }
  }, [userId, scenarioId]);

  const handleCreateGoal = useCallback(async (params: Omit<CreateGoalParams, 'userId' | 'scenarioId'>) => {
    if (!userId) return;
    
    try {
      setSubmitting(true);
      setFormError(null);
      
      await createGoal({
        ...params,
        userId,
        scenarioId,
      });
      
      await refreshGoals();
    } catch (err) {
      await reportErrorToTelegram({
        action: 'createGoal',
        error: err,
        userId,
        context: { scenarioId }
      });
      throw err;
    } finally {
      setSubmitting(false);
    }
  }, [userId, scenarioId, refreshGoals]);

  const handleUpdateGoal = useCallback(async (params: Omit<UpdateGoalParams, 'userId'>) => {
    if (!userId) return;
    
    try {
      setSubmitting(true);
      setFormError(null);
      
      await updateGoal({
        ...params,
        userId,
      });
      
      await refreshGoals();
    } catch (err) {
      await reportErrorToTelegram({
        action: 'updateGoal',
        error: err,
        userId,
        context: { goalId: params.goalId, scenarioId }
      });
      throw err;
    } finally {
      setSubmitting(false);
    }
  }, [userId, scenarioId, refreshGoals]);

  const handleDeleteGoal = useCallback(async (goalId: string, confirmMessage?: string) => {
    if (!userId) return;

    if (confirmMessage && !window.confirm(confirmMessage)) {
      return;
    }

    try {
      setDeletingId(goalId);
      await deleteGoal(goalId, userId);
      await refreshGoals();
    } catch (err) {
      await reportErrorToTelegram({
        action: 'deleteGoal',
        error: err,
        userId,
        context: { goalId, scenarioId }
      });
      throw err;
    } finally {
      setDeletingId(null);
    }
  }, [userId, scenarioId, refreshGoals]);

  // Initial load
  useEffect(() => {
    async function loadGoals() {
      if (!userId || !scenarioId) {
        setLoading(false);
        return;
      }

      try {
        setLoading(true);
        setError(null);
        
        const fetchedGoals = await fetchGoals({
          userId,
          scenarioId,
        });
        
        setGoals(fetchedGoals);
      } catch (err) {
        await reportErrorToTelegram({
          action: 'fetchGoals',
          error: err,
          userId,
          context: { scenarioId }
        });
        setError(err instanceof Error ? err.message : 'Failed to load goals');
      } finally {
        setLoading(false);
      }
    }

    loadGoals();
  }, [userId, scenarioId]);

  return {
    goals,
    loading,
    error,
    submitting,
    deletingId,
    formError,
    refreshGoals,
    handleCreateGoal,
    handleUpdateGoal,
    handleDeleteGoal,
    setFormError,
    setSubmitting,
  };
}

