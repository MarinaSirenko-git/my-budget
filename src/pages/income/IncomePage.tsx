// Business problem: 
// users need to organize their incomes
// This page allows users to enter incomes into the system, have a list of incomes at hand, view incomes in the form of a chart, edit and delete incomes.
// This page calculates income per month, per year, shows a convertible equivalent of income.

// Test cases:
// 1. User can add income
// 2. User can edit income
// 3. User can delete income
// 4. User can see income in the form of a chart
// 5. User can see income in the form of a table
// 6. User can enter income in any currency from the list and get a convertible equivalent of income in an additional column in the table.
// 7. User can see monthly and annual income in the selected currency in the settings.
// 8. User can recalculate amounts in any currency from the list.

// UI interface:
// 1. EmptyState component for showing empty state
// 2. Tag component for showing income categories
// 3. ModalWindow component for showing modal window
// 4. AddIncomeForm component for showing add income form
// 5. Tabs component for showing table and chart
// 6. Table component for showing table
// 7. PieChart component for showing pie chart
// 8. LoadingState component for showing loading state
// 9. ErrorState component for showing error state

// Event handlers
// 1. On click income tag button
// 2. On click add income button
// 3. On click submit button in add income form
// 4. On click edit income button
// 5. On click delete income button
// 6. On change currency in add income form

// List of potential vulnerabilities and performance issues
// 1. Excessive currency conversion requests, missing debounce
// 2. Heavy logic, poor readability
// 3. No error monitoring, errors exposed to browser console
// 4. Insecure passing of IDs to the DB
// 5. Missing sanitization of user input for categories
// 6. Infinite loops during component render (useIncomeCurrencyConversion, tableColumns)
// 7. Redundant requests during navigation, missing caching


import { useState } from 'react';
// reusable global components
import EmptyState from '@/shared/ui/atoms/EmptyState';
import LoadingState from '@/shared/ui/atoms/LoadingState';
import ErrorState from '@/shared/ui/atoms/ErrorState';
import ModalWindow from '@/shared/ui/ModalWindow';
import SelectInput from '@/shared/ui/form/SelectInput';
import Tag from '@/shared/ui/atoms/Tag';
import TextButton from '@/shared/ui/atoms/TextButton';
import Tabs from '@/shared/ui/molecules/Tabs';
import Table from '@/shared/ui/molecules/Table';
import PieChart from '@/shared/ui/molecules/PieChart';
// reusable local components
import AddIncomeForm from '@/features/income/AddIncomeForm';
// custom hooks
import { useAuth } from '@/shared/store/auth';
import { 
  useCurrency,
  useIncomeForm,
  useIncomes,
  useIncomeCurrencyConversion,
  useIncomeCalculations,
} from '@/shared/hooks';
import { useScenarioRoute } from '@/shared/router/useScenarioRoute';
import { useTranslation } from '@/shared/i18n';
// constants
import { currencyOptions } from '@/shared/constants/currencies';
import { getIncomeCategories, getIncomeFrequencyOptions } from '@/shared/utils/categories';
// data types
import type { IncomeType, Income } from '@/mocks/pages/income.mock';

export default function IncomePage() {
  const { t } = useTranslation('components');
  const { user } = useAuth();
  const { scenarioId } = useScenarioRoute();
  const { currency: settingsCurrency } = useCurrency();
  
  // Modal state
  const [open, setOpen] = useState(false);
  const [editingId, setEditingId] = useState<string | null>(null);

  // Types and options
  const incomeTypes = getIncomeCategories(t);
  const frequencyOptions = getIncomeFrequencyOptions(t);
  const incomeTypeOptions = incomeTypes.map(type => ({
    label: type.label,
    value: type.id,
  }));

  // Custom hooks
  const incomeForm = useIncomeForm({
    incomeTypes,
    settingsCurrency,
  });

  const {
    incomes,
    loading,
    error,
    submitting,
    deletingId,
    formError,
    handleCreateIncome,
    handleUpdateIncome,
    handleDeleteIncome,
    setFormError,
  } = useIncomes({
    userId: user?.id,
    scenarioId,
    settingsCurrency,
  });

  const {
    selectedConversionCurrency,
    convertedAmountsCache,
    convertingIds,
    handleConversionCurrencyChange,
  } = useIncomeCurrencyConversion({
    incomes,
    settingsCurrency,
    userId: user?.id,
  });

  const {
    monthlyTotal,
    annualTotal,
    pieChartData,
    tableColumns,
  } = useIncomeCalculations({
    incomes,
    incomeTypes,
    selectedConversionCurrency,
    settingsCurrency,
    convertedAmountsCache,
    convertingIds,
    t,
    onEdit: handleEditIncome,
    onDelete: handleDeleteIncomeClick,
    deletingId,
  });

  // Event handlers
  function handleTagClick(type: IncomeType) {
    incomeForm.initializeForTag(type);
    setFormError(null);
    setEditingId(null);
    setOpen(true);
  }

  function handleAddIncomeClick() {
    incomeForm.initializeForCreate();
    setFormError(null);
    setEditingId(null);
    setOpen(true);
  }

  async function handleSubmit(e: React.FormEvent) {
    e.preventDefault();
    if (!user || !incomeForm.isFormValid) return;
    
    try {
      const finalType = incomeForm.getFinalType();
      const incomeAmount = parseFloat(incomeForm.amount!);

      if (editingId) {
        await handleUpdateIncome({
          incomeId: editingId,
          type: finalType,
          amount: incomeAmount,
          currency: incomeForm.currency,
          frequency: incomeForm.frequency,
        });
      } else {
        await handleCreateIncome({
          type: finalType,
          amount: incomeAmount,
          currency: incomeForm.currency,
          frequency: incomeForm.frequency,
        });
      }

      handleModalClose();
    } catch (err) {
      const errorKey = editingId ? 'incomeForm.updateErrorMessage' : 'incomeForm.errorMessage';
      setFormError(err instanceof Error ? err.message : t(errorKey));
    }
  }

  function handleEditIncome(income: Income) {
    setEditingId(income.id);
    incomeForm.initializeForEdit(income);
    setFormError(null);
    setOpen(true);
  }

  async function handleDeleteIncomeClick(incomeId: string) {
    const confirmMessage = t('incomeForm.deleteConfirm') ?? 'Are you sure you want to delete this income?';
    try {
      await handleDeleteIncome(incomeId, confirmMessage);
    } catch (err) {
      const errorMessage = err instanceof Error ? err.message : (t('incomeForm.deleteError') ?? 'Error deleting income');
      alert(errorMessage);
    }
  }

  function handleModalClose() {
    setOpen(false);
    setEditingId(null);
    incomeForm.resetForm();
    setFormError(null);
  }

  // Render states
  if (loading) {
    return <LoadingState message={t('incomeForm.loading')} />;
  }
  
  if (error) {
    return <ErrorState message={`${t('incomeForm.errorPrefix')} ${error}`} />;
  }
  
  if (!incomes || incomes.length === 0) {
    return (
      <div className="flex h-full items-center justify-center min-h-[calc(100vh-150px)]">
        <div className="flex flex-col items-center justify-center gap-6 text-mainTextColor dark:text-mainTextColor">
          <EmptyState icon={<img src="/src/assets/income-page-mouse.webp" alt="Empty State" className="max-h-[110px] max-w-[110px]" />}>
            {t('incomeForm.emptyStateMessage')}
          </EmptyState>
          <div className="flex flex-wrap gap-2 justify-center max-w-2xl px-4 mt-4">
            {incomeTypes.map((type) => (
              <Tag 
                key={type.id} 
                title={type.label} 
                isCustom={type.isCustom}
                onClick={() => handleTagClick(type)}
              />
            ))}
          </div>
          <ModalWindow open={open} onClose={handleModalClose} title={editingId ? t('incomeForm.editTitle') : t('incomeForm.title')}>
            <AddIncomeForm
              handleSubmit={handleSubmit}
              handleCurrencyChange={incomeForm.handleCurrencyChange}
              isFormValid={incomeForm.isFormValid}
              formError={formError}
              incomeTypeId={incomeForm.incomeTypeId}
              isTagSelected={incomeForm.isTagSelected}
              customCategoryText={incomeForm.customCategoryText}
              setCustomCategoryText={incomeForm.setCustomCategoryText}
              incomeTypeOptions={incomeTypeOptions}
              handleIncomeTypeChange={incomeForm.handleIncomeTypeChange}
              amount={incomeForm.amount}
              setAmount={incomeForm.setAmount}
              currency={incomeForm.currency}
              frequency={incomeForm.frequency}
              setFrequency={incomeForm.setFrequency}
              frequencyOptions={frequencyOptions}
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
          onClick={handleAddIncomeClick} 
          aria-label={t('incomeForm.addNewAriaLabel')} 
          variant="primary"
        >
          {t('incomeForm.addNewButton')}
        </TextButton>
      </div>
      
      <Tabs
        tabs={[
          {
            id: 'table',
            label: t('incomeForm.tabs.table'),
            content: (
              <div className="space-y-2 px-12">
                <div className="flex justify-between items-center text-sm text-textColor dark:text-textColor">
                  <div className="flex gap-3">
                    <span>{t('incomeForm.totals.monthly')} <strong className="text-mainTextColor dark:text-mainTextColor">{monthlyTotal.toLocaleString('en-US', { minimumFractionDigits: 2, maximumFractionDigits: 2 })} {selectedConversionCurrency || settingsCurrency || 'USD'}</strong></span>
                    <span>{t('incomeForm.totals.annual')} <strong className="text-mainTextColor dark:text-mainTextColor">{annualTotal.toLocaleString('en-US', { minimumFractionDigits: 2, maximumFractionDigits: 2 })} {selectedConversionCurrency || settingsCurrency || 'USD'}</strong></span>
                  </div>
                  {settingsCurrency && incomes.some(income => income.currency !== settingsCurrency) && (
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
                <Table columns={tableColumns} data={incomes} />
              </div>
            )
          },
          {
            id: 'chart',
            label: t('incomeForm.tabs.chart'),
            content: (
              <div className="space-y-2 px-12">
                <div className="text-sm text-textColor dark:text-textColor text-right">
                  {t('incomeForm.totals.monthly')} <strong className="text-mainTextColor dark:text-mainTextColor">{monthlyTotal.toLocaleString('en-US', { minimumFractionDigits: 2, maximumFractionDigits: 2 })} {selectedConversionCurrency || settingsCurrency || 'USD'}</strong>
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

      <ModalWindow open={open} onClose={handleModalClose} title={editingId ? t('incomeForm.editTitle') : t('incomeForm.title')}>
        <AddIncomeForm
          handleSubmit={handleSubmit}
          handleCurrencyChange={incomeForm.handleCurrencyChange}
          isFormValid={incomeForm.isFormValid}
          formError={formError}
          incomeTypeId={incomeForm.incomeTypeId}
          isTagSelected={incomeForm.isTagSelected}
          customCategoryText={incomeForm.customCategoryText}
          setCustomCategoryText={incomeForm.setCustomCategoryText}
          incomeTypeOptions={incomeTypeOptions}
          handleIncomeTypeChange={incomeForm.handleIncomeTypeChange}
          amount={incomeForm.amount}
          setAmount={incomeForm.setAmount}
          currency={incomeForm.currency}
          frequency={incomeForm.frequency}
          setFrequency={incomeForm.setFrequency}
          frequencyOptions={frequencyOptions}
          submitting={submitting}
          editingId={editingId}
          t={t}
        />
      </ModalWindow>
    </div>
  );
}
