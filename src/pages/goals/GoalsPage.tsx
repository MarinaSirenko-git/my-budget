import { useState, useMemo, useEffect } from 'react';
import type { FormEvent } from 'react';
import { useQueryClient, useMutation } from '@tanstack/react-query';
// reusable global components
import EmptyState from '@/shared/ui/atoms/EmptyState';
import AddButton from '@/shared/ui/atoms/AddButton';
import GoalCard from '@/shared/ui/molecules/GoalCard';
import ModalWindow from '@/shared/ui/ModalWindow';
// reusable local components
import AddGoalForm from '@/features/goals/AddGoalForm';
// custom hooks
import { useTranslation } from '@/shared/i18n';
import { useCurrency, useConvertedGoals, useUser, useScenario } from '@/shared/hooks';
// constants
import { currencyOptions, type CurrencyCode } from '@/shared/constants/currencies';
// utils
import { createGoal, updateGoal, deleteGoal } from '@/shared/utils/goals';
// types
import type { Goal } from '@/shared/utils/goals';

export default function GoalsPage() {
  const { t } = useTranslation('components');
  const queryClient = useQueryClient();
  const { currency: settingsCurrency } = useCurrency();
  const { convertedGoals: goals, loading: goalsLoading } = useConvertedGoals();
  const { user } = useUser();
  const { currentScenario } = useScenario();
  
  // Modal state
  const [open, setOpen] = useState(false);
  const [editingId, setEditingId] = useState<string | null>(null);
  
  // Form state
  const [name, setName] = useState('');
  const [amount, setAmount] = useState<string | undefined>(undefined);
  const [currency, setCurrency] = useState<CurrencyCode>(currencyOptions[0].value);
  const [startDate, setStartDate] = useState<string | undefined>(undefined);
  const [targetDate, setTargetDate] = useState<string | undefined>(undefined);
  const [formError, setFormError] = useState<string | null>(null);
  const [submitting, setSubmitting] = useState(false);
  const [deletingId, setDeletingId] = useState<string | null>(null);

  // Set default currency from settings when loaded
  useEffect(() => {
    if (settingsCurrency) {
      const validCurrency = currencyOptions.find(opt => opt.value === settingsCurrency);
      if (validCurrency && currency === currencyOptions[0].value) {
        setCurrency(validCurrency.value);
      }
    }
  }, [settingsCurrency, currency]);

  // Form validation
  const isFormValid = useMemo(() => {
    return !!(
      name.trim() &&
      amount &&
      parseFloat(amount) > 0 &&
      currency &&
      targetDate
    );
  }, [name, amount, currency, targetDate]);

  const hasChanges = true; // Always true for now since we don't track original values

  // Delete goal mutation with optimistic updates
  const deleteGoalMutation = useMutation({
    mutationFn: (goalId: string) => {
      if (!user?.id) {
        throw new Error('User not found');
      }
      return deleteGoal(goalId);
    },
    
    onMutate: async (goalId) => {
      if (!currentScenario?.id) {
        return { previousGoals: null };
      }
      
      await queryClient.cancelQueries({ queryKey: ['goals', currentScenario.id] });
      const previousGoals = queryClient.getQueryData<Goal[]>(['goals', currentScenario.id, user?.id]);
      queryClient.setQueryData<Goal[]>(
        ['goals', currentScenario.id, user?.id],
        (old) => old?.filter(goal => goal.id !== goalId) ?? []
      );
      setDeletingId(goalId);
      return { previousGoals };
    },
    
    onError: (error, _goalId, context) => {
      if (context?.previousGoals && currentScenario?.id && user?.id) {
        queryClient.setQueryData(['goals', currentScenario.id, user.id], context.previousGoals);
      }
      setDeletingId(null);
      console.error('Failed to delete goal:', error);
    },
    
    onSettled: () => {
      if (currentScenario?.id) {
        queryClient.invalidateQueries({ queryKey: ['goals', currentScenario.id] });
      }
      setDeletingId(null);
    },
  });

  // Event handlers
  function handleCreateGoalClick() {
    setName('');
    setAmount(undefined);
    const defaultCurrencyValue = settingsCurrency || currencyOptions[0].value;
    const validCurrency = currencyOptions.find(opt => opt.value === defaultCurrencyValue);
    setCurrency(validCurrency ? validCurrency.value : currencyOptions[0].value);
    setStartDate(undefined);
    setTargetDate(undefined);
    setFormError(null);
    setEditingId(null);
    setOpen(true);
  }

  async function handleSubmit(e: FormEvent) {
    e.preventDefault();
    
    if (!isFormValid || submitting) {
      return;
    }

    if (!user?.id) {
      setFormError(t('goalsForm.errorMessage') || 'User not found');
      return;
    }

    if (!currentScenario?.id) {
      setFormError(t('goalsForm.errorMessage') || 'Scenario not found');
      return;
    }

    setSubmitting(true);
    setFormError(null);

    try {
      const targetAmountValue = parseFloat(amount || '0');
      if (isNaN(targetAmountValue) || targetAmountValue <= 0) {
        throw new Error(t('goalsForm.errorMessage') || 'Invalid amount');
      }

      if (!startDate) {
        throw new Error(t('goalsForm.errorMessage') || 'Start date is required');
      }

      if (!targetDate) {
        throw new Error(t('goalsForm.errorMessage') || 'Target date is required');
      }

      if (editingId) {
        // Update existing goal
        const currentGoal = goals.find(g => g.id === editingId);
        const currentAmount = currentGoal?.saved ?? 0;

        await updateGoal({
          goalId: editingId,
          userId: user.id,
          name: name.trim(),
          targetAmount: targetAmountValue,
          currentAmount: currentAmount,
          startDate: startDate,
          targetDate: targetDate,
          currency,
        });

        // Invalidate React Query cache to refetch goals
        queryClient.invalidateQueries({ queryKey: ['goals', currentScenario.id] });
      } else {
        // Create new goal
        await createGoal({
          userId: user.id,
          scenarioId: currentScenario.id,
          name: name.trim(),
          targetAmount: targetAmountValue,
          currentAmount: 0, // New goals start with 0 saved
          startDate: startDate,
          targetDate: targetDate,
          currency,
        });
        
        // Invalidate React Query cache to refetch goals
        queryClient.invalidateQueries({ queryKey: ['goals', currentScenario.id] });
      }

      // Close modal and reset form
      handleModalClose();
    } catch (error) {
      setFormError(
        error instanceof Error 
          ? error.message 
          : (t('goalsForm.errorMessage') || 'Failed to save goal')
      );
    } finally {
      setSubmitting(false);
    }
  }

  function handleEditGoal(goal: Goal) {
    setEditingId(goal.id);
    setName(goal.name || '');
    setAmount(goal.amount.toString());
    const validCurrency = currencyOptions.find(opt => opt.value === goal.currency);
    setCurrency(validCurrency ? validCurrency.value : currencyOptions[0].value);
    setStartDate(goal.startDate);
    setTargetDate(goal.targetDate);
    setFormError(null);
    setOpen(true);
  }

  function handleDeleteGoalClick(goal: Goal) {
    deleteGoalMutation.mutate(goal.id);
  }

  function handleModalClose() {
    setOpen(false);
    setEditingId(null);
    setName('');
    setAmount(undefined);
    const defaultCurrencyValue = settingsCurrency || currencyOptions[0].value;
    const validCurrency = currencyOptions.find(opt => opt.value === defaultCurrencyValue);
    setCurrency(validCurrency ? validCurrency.value : currencyOptions[0].value);
    setStartDate(undefined);
    setTargetDate(undefined);
    setFormError(null);
  }

  function handleCurrencyChange(newCurrency: string) {
    const validCurrency = currencyOptions.find(opt => opt.value === newCurrency);
    if (validCurrency) {
      setCurrency(validCurrency.value);
    }
  }

  const modal = (
    <ModalWindow open={open} onClose={handleModalClose} title={editingId ? t('goalsForm.editTitle') : t('goalsForm.createTitle')}>
      <AddGoalForm
        handleSubmit={handleSubmit}
        handleCurrencyChange={handleCurrencyChange}
        isFormValid={isFormValid}
        hasChanges={hasChanges}
        formError={formError}
        name={name}
        setName={setName}
        amount={amount}
        setAmount={setAmount}
        currency={currency}
        startDate={startDate}
        setStartDate={setStartDate}
        targetDate={targetDate}
        setTargetDate={setTargetDate}
        submitting={submitting}
        editingId={editingId}
        t={t}
      />
    </ModalWindow>
  );

  // Render states - show empty state if no goals and not loading
  if (!goalsLoading && goals.length === 0) {
    const emptyMessage = t('goalsForm.emptyStateMessage');
    const safeMessage = emptyMessage.replace(/<br\s*\/?>/gi, '\n');

    return (
      <div className="flex h-full items-center justify-center min-h-[calc(100vh-150px)]">
        <div className="flex flex-col items-center justify-center gap-8 text-mainTextColor dark:text-mainTextColor">
          <EmptyState>
            <div style={{ whiteSpace: 'pre-line' }}>{safeMessage}</div>
          </EmptyState>
          <AddButton 
            onClick={handleCreateGoalClick} 
            aria-label={t('goalsForm.createAriaLabel')} 
            className="mt-3"
          >
            {t('goalsForm.createButton')}
          </AddButton>
          {modal}
        </div>
      </div>
    );
  }

  return (
    <div className="flex flex-col p-2 lg:p-0 gap-4 lg:gap-6 min-h-[calc(100vh-100px)]">
      {modal}
      <div className="flex w-full justify-center lg:justify-end px-4 lg:px-0 py-4 lg:py-0">
        <AddButton 
          onClick={handleCreateGoalClick} 
          aria-label={t('goalsForm.addNewAriaLabel')}
          className="w-full lg:w-auto justify-center lg:justify-start"
        >
          {t('goalsForm.addNewButton')}
        </AddButton>
      </div>
      <div className="grid grid-cols-1 md:grid-cols-2 gap-3 lg:gap-4 w-full items-center justify-center">
        {goals.map((goal: Goal) => {
          return (
            <GoalCard
              key={goal.id}
              title={goal.name}
              saved={goal.saved || 0}
              target={goal.amount}
              currency={goal.currency}
              monthsLeft={goal.monthsLeft}
              monthlyPayment={goal.monthlyPayment}
              monthlyPaymentInDefaultCurrency={goal.monthlyPaymentInDefaultCurrency}
              onEdit={() => handleEditGoal(goal)}
              onDelete={() => handleDeleteGoalClick(goal)}
              deleting={deletingId === goal.id}
            />
          );
        })}
      </div>
    </div>
  );
}