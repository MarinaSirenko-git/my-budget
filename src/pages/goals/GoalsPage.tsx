import { useState } from 'react';
// reusable global components
import EmptyState from '@/shared/ui/atoms/EmptyState';
import AddButton from '@/shared/ui/atoms/AddButton';
import LoadingState from '@/shared/ui/atoms/LoadingState';
import ErrorState from '@/shared/ui/atoms/ErrorState';
import GoalCard from '@/shared/ui/molecules/GoalCard';
import ModalWindow from '@/shared/ui/ModalWindow';
// reusable local components
import AddGoalForm from '@/features/goals/AddGoalForm';
// custom hooks
import { useQueryClient } from '@tanstack/react-query';
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
  const queryClient = useQueryClient();
  const user = queryClient.getQueryData(['user']) as { id?: string; email?: string } | null;
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
    <div className="flex flex-col p-2 lg:p-0 gap-4 lg:gap-6 min-h-[calc(100vh-100px)]">
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
              onEdit={() => handleEditGoal(goal)}
              onDelete={() => handleDeleteGoalClick(goal)}
            />
          );
        })}
      </div>
    </div>
  );
}
