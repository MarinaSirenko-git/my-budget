// Business problem: 
// users need to organize their savings
// This page allows users to enter savings into the system, have a list of savings at hand, view savings in the form of a chart, edit and delete savings.
// This page calculates total savings, shows a convertible equivalent of savings.

// Test cases:
// 1. User can add savings
// 2. User can edit savings
// 3. User can delete savings
// 4. User can see savings in the form of a chart
// 5. User can see savings in the form of a table
// 6. User can enter savings in any currency from the list and get a convertible equivalent of savings in an additional column in the table.
// 7. User can see total savings in the selected currency in the settings.
// 8. User can recalculate amounts in any currency from the list.

// UI interface:
// 1. EmptyState component for showing empty state
// 2. ModalWindow component for showing modal window
// 3. AddSavingForm component for showing add savings form
// 4. Tabs component for showing table and chart
// 5. Table component for showing table
// 6. PieChart component for showing pie chart
// 7. LoadingState component for showing loading state
// 8. ErrorState component for showing error state

// Event handlers
// 1. On click add savings button
// 2. On click submit button in add savings form
// 3. On click edit savings button
// 4. On click delete savings button
// 5. On change currency in add savings form

// List of potential vulnerabilities and performance issues
// 1. Excessive currency conversion requests, missing debounce
// 2. Heavy logic, poor readability
// 3. No error monitoring, errors exposed to browser console
// 4. Insecure passing of IDs to the DB
// 5. Missing sanitization of user input for savings name/comment
// 6. Infinite loops during component render (useCurrencyConversionForItems, tableColumns)
// 7. Redundant requests during navigation, missing caching


import { useState } from 'react';
// reusable global components
import EmptyState from '@/shared/ui/atoms/EmptyState';
import TextButton from '@/shared/ui/atoms/TextButton';
import LoadingState from '@/shared/ui/atoms/LoadingState';
import ErrorState from '@/shared/ui/atoms/ErrorState';
import ModalWindow from '@/shared/ui/ModalWindow';
import SelectInput from '@/shared/ui/form/SelectInput';
import Tabs from '@/shared/ui/molecules/Tabs';
import Table from '@/shared/ui/molecules/Table';
import PieChart from '@/shared/ui/molecules/PieChart';
// reusable local components
import AddSavingForm from '@/features/savings/AddSavingForm';
// custom hooks
import { useAuth } from '@/shared/store/auth';
import { useScenarioRoute } from '@/shared/router/useScenarioRoute';
import { useTranslation } from '@/shared/i18n';
import { useCurrency } from '@/shared/hooks';
import { 
  useSavingsForm,
  useSavings,
  useCurrencyConversionForItems,
  useSavingsCalculations,
} from '@/shared/hooks';
// constants
import { currencyOptions } from '@/shared/constants/currencies';
// types
import type { Saving } from '@/shared/utils/savings';

export default function SavingsPage() {
  const { user } = useAuth();
  const { scenarioId } = useScenarioRoute();
  const { t } = useTranslation('components');
  const { currency: settingsCurrency } = useCurrency();
  
  // Modal state
  const [open, setOpen] = useState(false);
  const [editingId, setEditingId] = useState<string | null>(null);

  // Custom hooks
  const savingsForm = useSavingsForm({
    settingsCurrency,
  });

  const {
    savings,
    loading,
    error,
    submitting,
    deletingId,
    formError,
    handleCreateSaving,
    handleUpdateSaving,
    handleDeleteSaving,
    setFormError,
  } = useSavings({
    userId: user?.id,
    scenarioId,
    settingsCurrency,
  });

  const {
    selectedConversionCurrency,
    convertedAmountsCache,
    convertingIds,
    handleConversionCurrencyChange,
  } = useCurrencyConversionForItems<Saving>({
    items: savings,
    settingsCurrency,
    userId: user?.id,
  });

  const {
    totalSavings,
    pieChartData,
    tableColumns,
  } = useSavingsCalculations({
    savings,
    selectedConversionCurrency,
    settingsCurrency,
    convertedAmountsCache,
    convertingIds,
    t,
    onEdit: handleEditSaving,
    onDelete: handleDeleteSavingClick,
    deletingId,
  });

  // Event handlers
  function handleEditSaving(saving: Saving) {
    setEditingId(saving.id);
    savingsForm.initializeForEdit(saving);
    setFormError(null);
    setOpen(true);
  }

  function handleCreateSavingClick() {
    savingsForm.initializeForCreate();
    setFormError(null);
    setEditingId(null);
    setOpen(true);
  }

  async function handleDeleteSavingClick(savingId: string) {
    const confirmMessage = t('savingsForm.deleteConfirm') ?? 'Are you sure you want to delete this savings?';
    try {
      await handleDeleteSaving(savingId, confirmMessage);
    } catch (err) {
      const errorMessage = err instanceof Error ? err.message : (t('savingsForm.deleteError') ?? 'Error deleting savings');
      alert(errorMessage);
    }
  }

  async function handleSubmit(e: React.FormEvent) {
    e.preventDefault();
    if (!user || !savingsForm.isFormValid) return;
    
    try {
      const savingData = {
        comment: savingsForm.comment.trim(),
        amount: parseFloat(savingsForm.amount!),
        currency: savingsForm.currency,
      };

      if (editingId) {
        await handleUpdateSaving({
          savingId: editingId,
          ...savingData,
        });
      } else {
        await handleCreateSaving(savingData);
      }

      handleModalClose();
    } catch (err) {
      setFormError(err instanceof Error ? err.message : t('savingsForm.errorMessage'));
    }
  }

  function handleModalClose() {
    setOpen(false);
    setEditingId(null);
    savingsForm.resetForm();
    setFormError(null);
  }

  // Render states
  if (loading) {
    return <LoadingState message={t('savingsForm.loading')} />;
  }

  if (error) {
    return <ErrorState message={`${t('savingsForm.errorPrefix')} ${error}`} />;
  }

  if (!savings || savings.length === 0) {
    const emptyMessage = t('savingsForm.emptyStateMessage');
    const safeMessage = emptyMessage.replace(/<br\s*\/?>/gi, '\n');

    return (
      <div className="flex h-full items-center justify-center min-h-[calc(100vh-150px)]">
        <div className="flex flex-col items-center justify-center gap-8 text-mainTextColor dark:text-mainTextColor">
          <EmptyState icon={<img src="/src/assets/savings-page-mouse.webp" alt="Empty State" className="max-h-[200px] max-w-[200px]" />}>
            <div style={{ whiteSpace: 'pre-line' }}>{safeMessage}</div>
          </EmptyState>
          <TextButton 
            onClick={handleCreateSavingClick} 
            aria-label={t('savingsForm.createAriaLabel')} 
            variant="primary"
            className="mt-3"
          >
            {t('savingsForm.createButton')}
          </TextButton>
          <ModalWindow open={open} onClose={handleModalClose} title={editingId ? t('savingsForm.editTitle') : t('savingsForm.createTitle')}>
            <AddSavingForm
              handleSubmit={handleSubmit}
              handleCurrencyChange={savingsForm.handleCurrencyChange}
              isFormValid={savingsForm.isFormValid}
              formError={formError}
              comment={savingsForm.comment}
              setComment={savingsForm.setComment}
              amount={savingsForm.amount}
              setAmount={savingsForm.setAmount}
              currency={savingsForm.currency}
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
    <div className="flex flex-col gap-6 min-h-[calc(100vh-100px)]">
      <div className="flex w-full justify-end">
        <TextButton 
          onClick={handleCreateSavingClick} 
          aria-label={t('savingsForm.addNewAriaLabel')} 
          variant="primary"
        >
          {t('savingsForm.addNewButton')}
        </TextButton>
      </div>
      
      <Tabs
        tabs={[
          {
            id: 'table',
            label: t('savingsForm.tabs.table'),
            content: (
              <div className="space-y-2 px-12">
                <div className="flex justify-between items-center text-sm text-textColor dark:text-textColor">
                  <div>
                    <span>{t('savingsForm.totals.total')} <strong className="text-mainTextColor dark:text-mainTextColor">{totalSavings.toLocaleString('en-US', { minimumFractionDigits: 2, maximumFractionDigits: 2 })} {selectedConversionCurrency || settingsCurrency || 'USD'}</strong></span>
                  </div>
                  {settingsCurrency && savings.some(saving => saving.currency !== settingsCurrency) && (
                    <div className="flex items-center gap-2">
                      <SelectInput
                        value={selectedConversionCurrency || settingsCurrency}
                        options={currencyOptions}
                        onChange={handleConversionCurrencyChange}
                        className="w-30"
                      />
                    </div>
                  )}
                </div>
                <Table columns={tableColumns} data={savings} />
              </div>
            )
          },
          {
            id: 'chart',
            label: t('savingsForm.tabs.chart'),
            content: (
              <div className="space-y-2 px-12">
                <div className="text-sm text-textColor dark:text-textColor text-right">
                  {t('savingsForm.totals.total')} <strong className="text-mainTextColor dark:text-mainTextColor">{totalSavings.toLocaleString('en-US', { minimumFractionDigits: 2, maximumFractionDigits: 2 })} {selectedConversionCurrency || settingsCurrency || 'USD'}</strong>
                </div>
                <PieChart 
                  data={pieChartData}
                  innerRadius="40%"
                />
              </div>
            )
          }
        ]}
      />

      <ModalWindow open={open} onClose={handleModalClose} title={editingId ? t('savingsForm.editTitle') : t('savingsForm.createTitle')}>
        <AddSavingForm
          handleSubmit={handleSubmit}
          handleCurrencyChange={savingsForm.handleCurrencyChange}
          isFormValid={savingsForm.isFormValid}
          formError={formError}
          comment={savingsForm.comment}
          setComment={savingsForm.setComment}
          amount={savingsForm.amount}
          setAmount={savingsForm.setAmount}
          currency={savingsForm.currency}
          submitting={submitting}
          editingId={editingId}
          t={t}
        />
      </ModalWindow>
    </div>
  );
}
