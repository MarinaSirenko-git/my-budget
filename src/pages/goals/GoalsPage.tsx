// Business problem: 
// users need to organize their goals
// This page allows users to enter goals into the system, have a list of goals at hand, view goals progress, edit and delete goals.
// This page calculates saved amount based on months passed since goal creation, shows months left until target date.

// Test cases:
// 1. User can add goal
// 2. User can edit goal
// 3. User can delete goal
// 4. User can see goal progress in the form of cards
// 5. User can see saved amount calculated based on time passed
// 6. User can enter goal in any currency from the list
// 7. User can set target date and see months left
// 8. User can see progress bar for each goal

// UI interface:
// 1. EmptyState component for showing empty state
// 2. ModalWindow component for showing modal window
// 3. AddGoalForm component for showing add goal form
// 4. GoalCard component for showing goal cards with progress
// 5. LoadingState component for showing loading state
// 6. ErrorState component for showing error state

// Event handlers
// 1. On click add goal button
// 2. On click submit button in add goal form
// 3. On click edit goal button
// 4. On click delete goal button
// 5. On change currency in add goal form

// List of potential vulnerabilities and performance issues
// 1. Heavy logic, poor readability
// 2. No error monitoring, errors exposed to browser console
// 3. Insecure passing of IDs to the DB
// 4. Missing sanitization of user input for goal name
// 5. Redundant requests during navigation, missing caching
// 6. Date calculations may have timezone issues

import { useState } from 'react';
// reusable global components
import EmptyState from '@/shared/ui/atoms/EmptyState';
import TextButton from '@/shared/ui/atoms/TextButton';
import LoadingState from '@/shared/ui/atoms/LoadingState';
import ErrorState from '@/shared/ui/atoms/ErrorState';
import GoalCard from '@/shared/ui/molecules/GoalCard';
import ModalWindow from '@/shared/ui/ModalWindow';
// reusable local components
import AddGoalForm from '@/features/goals/AddGoalForm';
// custom hooks
import { useAuth } from '@/shared/store/auth';
import { useScenarioRoute } from '@/shared/router/useScenarioRoute';
import { useTranslation } from '@/shared/i18n';
import { useCurrency } from '@/shared/hooks';
import { 
  useGoalForm,
  useGoals,
} from '@/shared/hooks';
// types
import type { Goal } from '@/shared/utils/goals';

export default function GoalsPage() {
  const { user } = useAuth();
  const { scenarioId } = useScenarioRoute();
  const { t } = useTranslation('components');
  const { currency: settingsCurrency } = useCurrency();
  
  // Modal state
  const [open, setOpen] = useState(false);
  const [editingId, setEditingId] = useState<string | null>(null);

  // Custom hooks
  const goalForm = useGoalForm({
    settingsCurrency,
  });

  const {
    goals,
    loading,
    error,
    submitting,
    formError,
    handleCreateGoal,
    handleUpdateGoal,
    handleDeleteGoal,
    setFormError,
  } = useGoals({
    userId: user?.id,
    scenarioId,
  });

  // Event handlers
  function handleEditGoal(goal: Goal) {
    setEditingId(goal.id);
    goalForm.initializeForEdit(goal);
    setFormError(null);
    setOpen(true);
  }

  function handleCreateGoalClick() {
    goalForm.initializeForCreate();
    setFormError(null);
    setEditingId(null);
    setOpen(true);
  }

  async function handleDeleteGoalClick(goal: Goal) {
    const confirmMessage = t('goalsForm.deleteConfirm') ?? `Вы уверены, что хотите удалить цель "${goal.name}"?`;
    try {
      await handleDeleteGoal(goal.id, confirmMessage);
    } catch (err) {
      const errorMessage = err instanceof Error ? err.message : (t('goalsForm.deleteError') ?? 'Ошибка при удалении цели');
      alert(errorMessage);
    }
  }

  async function handleSubmit(e: React.FormEvent) {
    e.preventDefault();
    if (submitting) {
      console.warn('Submit already in progress, ignoring duplicate request');
      return;
    }
    if (!user || !goalForm.isFormValid) return;

    try {
      const goalData = {
        name: goalForm.name.trim(),
        targetAmount: parseFloat(goalForm.amount!),
        currentAmount: goals.find((g: Goal) => g.id === editingId)?.saved || 0,
        targetDate: goalForm.targetDate!,
        currency: goalForm.currency,
      };

      if (editingId) {
        await handleUpdateGoal({
          goalId: editingId,
          ...goalData,
        });
      } else {
        await handleCreateGoal(goalData);
      }

      handleModalClose();
    } catch (err) {
      setFormError(err instanceof Error ? err.message : t('goalsForm.errorMessage'));
    }
  }

  function handleModalClose() {
    setOpen(false);
    setEditingId(null);
    goalForm.resetForm();
    setFormError(null);
  }

  // Render states
  if (loading) {
    return <LoadingState message={t('goalsForm.loading')} />;
  }

  if (error) {
    return <ErrorState message={`${t('goalsForm.errorPrefix')} ${error}`} />;
  }

  if (!goals || goals.length === 0) {
    const emptyMessage = t('goalsForm.emptyStateMessage');
    const safeMessage = emptyMessage.replace(/<br\s*\/?>/gi, '\n');

    return (
      <div className="flex h-full items-center justify-center min-h-[calc(100vh-150px)]">
        <div className="flex flex-col items-center justify-center gap-8 text-mainTextColor dark:text-mainTextColor">
          <EmptyState icon={<img src="/src/assets/goal-page-mouse.webp" alt="Empty State" className="max-h-[240px] max-w-[240px] lg:max-h-[200px] lg:max-w-[200px]" />}>
            <div style={{ whiteSpace: 'pre-line' }}>{safeMessage}</div>
          </EmptyState>
          <TextButton 
            onClick={handleCreateGoalClick} 
            aria-label={t('goalsForm.createAriaLabel')} 
            variant="primary"
            className="mt-3"
          >
            {t('goalsForm.createButton')}
          </TextButton>
          <ModalWindow open={open} onClose={handleModalClose} title={editingId ? t('goalsForm.editTitle') : t('goalsForm.createTitle')}>
            <AddGoalForm
              handleSubmit={handleSubmit}
              handleCurrencyChange={goalForm.handleCurrencyChange}
              isFormValid={goalForm.isFormValid}
              hasChanges={goalForm.hasChanges}
              formError={formError}
              name={goalForm.name}
              setName={goalForm.setName}
              amount={goalForm.amount}
              setAmount={goalForm.setAmount}
              currency={goalForm.currency}
              targetDate={goalForm.targetDate}
              setTargetDate={goalForm.setTargetDate}
              submitting={submitting}
              editingId={editingId}
              t={t}
            />
          </ModalWindow>
        </div>
      </div>
    );
  }

  return (
    <div className="flex flex-col p-2 lg:p-6 gap-4 lg:gap-6 min-h-[calc(100vh-100px)]">
      <ModalWindow open={open} onClose={handleModalClose} title={editingId ? t('goalsForm.editTitle') : t('goalsForm.createTitle')}>
        <AddGoalForm
          handleSubmit={handleSubmit}
          handleCurrencyChange={goalForm.handleCurrencyChange}
          isFormValid={goalForm.isFormValid}
          hasChanges={goalForm.hasChanges}
          formError={formError}
          name={goalForm.name}
          setName={goalForm.setName}
          amount={goalForm.amount}
          setAmount={goalForm.setAmount}
          currency={goalForm.currency}
          targetDate={goalForm.targetDate}
          setTargetDate={goalForm.setTargetDate}
          submitting={submitting}
          editingId={editingId}
          t={t}
        />
      </ModalWindow>
      <div className="flex w-full justify-end">
        <TextButton 
          onClick={handleCreateGoalClick} 
          aria-label={t('goalsForm.addNewAriaLabel')} 
          variant="primary"
        >
          {t('goalsForm.addNewButton')}
        </TextButton>
      </div>
      <div className="grid grid-cols-1 md:grid-cols-2 xl:grid-cols-3 gap-3 lg:gap-6 w-full">
        {goals.map((goal: Goal) => {
          return (
            <GoalCard
              key={goal.id}
              title={goal.name}
              saved={goal.saved || 0}
              target={goal.amount}
              currency={goal.currency}
              monthsLeft={goal.monthsLeft}
              onEdit={() => handleEditGoal(goal)}
              onDelete={() => handleDeleteGoalClick(goal)}
            />
          );
        })}
      </div>
    </div>
  );
}
