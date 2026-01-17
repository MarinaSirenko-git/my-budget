import { useState, useMemo, useEffect } from 'react';
import type { FormEvent } from 'react';
// reusable global components
import EmptyState from '@/shared/ui/atoms/EmptyState';
import AddButton from '@/shared/ui/atoms/AddButton';
import GoalCard from '@/shared/ui/molecules/GoalCard';
import ModalWindow from '@/shared/ui/ModalWindow';
// reusable local components
import AddGoalForm from '@/features/goals/AddGoalForm';
// custom hooks
import { useTranslation } from '@/shared/i18n';
import { useCurrency } from '@/shared/hooks';
// constants
import { currencyOptions, type CurrencyCode } from '@/shared/constants/currencies';
// types
import type { Goal } from '@/shared/utils/goals';

export default function GoalsPage() {
  const { t } = useTranslation('components');
  const { currency: settingsCurrency } = useCurrency();
  
  // Goals data - empty array
  const goals: Goal[] = [];
  
  // Modal state
  const [open, setOpen] = useState(false);
  const [editingId, setEditingId] = useState<string | null>(null);
  
  // Form state
  const [name, setName] = useState('');
  const [amount, setAmount] = useState<string | undefined>(undefined);
  const [currency, setCurrency] = useState<CurrencyCode>(currencyOptions[0].value);
  const [targetDate, setTargetDate] = useState<string | undefined>(undefined);
  const [formError, setFormError] = useState<string | null>(null);
  
  // Data placeholders
  const submitting = false;

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

  // Event handlers
  function handleCreateGoalClick() {
    setName('');
    setAmount(undefined);
    const defaultCurrencyValue = settingsCurrency || currencyOptions[0].value;
    const validCurrency = currencyOptions.find(opt => opt.value === defaultCurrencyValue);
    setCurrency(validCurrency ? validCurrency.value : currencyOptions[0].value);
    setTargetDate(undefined);
    setFormError(null);
    setEditingId(null);
    setOpen(true);
  }

  function handleSubmit(e: FormEvent) {
    e.preventDefault();
    // Empty stub - no business logic
  }

  function handleEditGoal(goal: Goal) {
    setEditingId(goal.id);
    setName(goal.name || '');
    setAmount(goal.amount.toString());
    const validCurrency = currencyOptions.find(opt => opt.value === goal.currency);
    setCurrency(validCurrency ? validCurrency.value : currencyOptions[0].value);
    setTargetDate(goal.targetDate);
    setFormError(null);
    setOpen(true);
  }

  function handleDeleteGoalClick(_goal: Goal) {
    // Empty stub - no business logic
  }

  function handleModalClose() {
    setOpen(false);
    setEditingId(null);
    setName('');
    setAmount(undefined);
    const defaultCurrencyValue = settingsCurrency || currencyOptions[0].value;
    const validCurrency = currencyOptions.find(opt => opt.value === defaultCurrencyValue);
    setCurrency(validCurrency ? validCurrency.value : currencyOptions[0].value);
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
        targetDate={targetDate}
        setTargetDate={setTargetDate}
        submitting={submitting}
        editingId={editingId}
        t={t}
      />
    </ModalWindow>
  );

  // Render states - goals is always empty, so show empty state
  if (goals.length === 0) {
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
              onEdit={() => handleEditGoal(goal)}
              onDelete={() => handleDeleteGoalClick(goal)}
            />
          );
        })}
      </div>
    </div>
  );
}
