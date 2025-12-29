// Business problem: 
// users need to organize their expenses
// This page allows users to enter expenses into the system, have a list of expenses at hand, view expenses in the form of a chart, edit and delete expenses.
// This page calculates expenses per month, per year, one-time expenses, shows a convertible equivalent of expenses.

// Test cases:
// 1. User can add expense
// 2. User can edit expense
// 3. User can delete expense
// 4. User can see expenses in the form of a chart
// 5. User can see expenses in the form of a table
// 6. User can enter expense in any currency from the list and get a convertible equivalent of expense in an additional column in the table.
// 7. User can see monthly, annual and one-time expenses in the selected currency in the settings.
// 8. User can recalculate amounts in any currency from the list.

// UI interface:
// 1. EmptyState component for showing empty state
// 2. Tag component for showing expense categories
// 3. ModalWindow component for showing modal window
// 4. AddExpenseForm component for showing add expense form
// 5. Tabs component for showing table and chart
// 6. Table component for showing table
// 7. PieChart component for showing pie chart
// 8. LoadingState component for showing loading state
// 9. ErrorState component for showing error state

// Event handlers
// 1. On click expense tag button
// 2. On click add expense button
// 3. On click submit button in add expense form
// 4. On click edit expense button
// 5. On click delete expense button
// 6. On change currency in add expense form

// List of potential vulnerabilities and performance issues
// 1. Excessive currency conversion requests, missing debounce
// 2. Heavy logic, poor readability
// 3. No error monitoring, errors exposed to browser console
// 4. Insecure passing of IDs to the DB
// 5. Missing sanitization of user input for categories
// 6. Infinite loops during component render (useExpenseCurrencyConversion, tableColumns)
// 7. Redundant requests during navigation, missing caching

import { useMemo, useState } from 'react';
import type { FormEvent } from 'react';
// reusable global components
import EmptyState from '@/shared/ui/atoms/EmptyState';
import Tag from '@/shared/ui/atoms/Tag';
import LoadingState from '@/shared/ui/atoms/LoadingState';
import ErrorState from '@/shared/ui/atoms/ErrorState';
import ModalWindow from '@/shared/ui/ModalWindow';
import SelectInput from '@/shared/ui/form/SelectInput';
import AddButton from '@/shared/ui/atoms/AddButton';
import Tabs from '@/shared/ui/molecules/Tabs';
import Table from '@/shared/ui/molecules/Table';
import PieChart from '@/shared/ui/molecules/PieChart';
// reusable local components
import AddExpenseForm from '@/features/expenses/AddExpenseForm';
// custom hooks
import { useAuth } from '@/shared/store/auth';
import { useScenarioRoute } from '@/shared/router/useScenarioRoute';
import { useTranslation } from '@/shared/i18n';
import {
  useCurrency,
  useExpenseForm,
  useExpenses,
  useExpenseCurrencyConversion,
  useExpenseCalculations,
} from '@/shared/hooks';
// constants
import { currencyOptions } from '@/shared/constants/currencies';
import { getExpenseCategories } from '@/shared/utils/categories';
// types
import type { Expense, ExpenseCategory } from '@/mocks/pages/expenses.mock';

export default function ExpensesPage() {
  const { t } = useTranslation('components');
  const { user } = useAuth();
  const { scenarioId } = useScenarioRoute();
  const { currency: settingsCurrency } = useCurrency();
  
  // Modal state
  const [open, setOpen] = useState(false);
  const [editingId, setEditingId] = useState<string | null>(null);
  
  // Types and options
  const expenseCategories = useMemo(() => getExpenseCategories(t), [t]);
  const expenseCategoryOptions = useMemo(() => expenseCategories.map(category => ({
    label: category.label,
    value: category.id,
  })), [expenseCategories]);
  
  const frequencyOptions = useMemo<Array<{ label: string; value: Expense['frequency'] }>>(() => [
    { label: t('expensesForm.monthly'), value: 'monthly' as const },
    { label: t('expensesForm.annual'), value: 'annual' as const },
  ], [t]);
  
  // Custom hooks
  const expenseForm = useExpenseForm({
    expenseCategories,
    settingsCurrency,
  });

  const {
    expenses,
    loading,
    error,
    submitting,
    deletingId,
    formError,
    handleCreateExpense,
    handleUpdateExpense,
    handleDeleteExpense,
    setFormError,
  } = useExpenses({
    userId: user?.id,
    scenarioId,
    settingsCurrency,
  });

  const {
    selectedConversionCurrency,
    convertedAmountsCache,
    convertingIds,
    handleConversionCurrencyChange,
  } = useExpenseCurrencyConversion({
    expenses,
    settingsCurrency,
    userId: user?.id,
    scenarioId,
  });

  const {
    monthlyTotal,
    annualTotal,
    pieChartData,
    tableColumns,
  } = useExpenseCalculations({
    expenses,
    expenseCategories,
    selectedConversionCurrency,
    settingsCurrency,
    convertedAmountsCache,
    convertingIds,
    t,
    onEdit: handleEditExpense,
    onDelete: handleDeleteExpenseClick,
    deletingId,
  });

  // Event handlers
  function handleTagClick(category: ExpenseCategory) {
    expenseForm.initializeForTag(category);
    setFormError(null);
    setEditingId(null);
    setOpen(true);
  }

  function handleAddExpenseClick() {
    expenseForm.initializeForCreate();
    setFormError(null);
    setEditingId(null);
    setOpen(true);
  }

  async function handleSubmit(e: FormEvent) {
    e.preventDefault();
    if (submitting) {
      console.warn('Submit already in progress, ignoring duplicate request');
      return;
    }
    if (!user || !expenseForm.isFormValid || !expenseForm.amount) return;

    try {
      const finalType = expenseForm.getFinalCategory();
      const expenseAmount = parseFloat(expenseForm.amount);
      
      if (editingId) {
        await handleUpdateExpense({
          expenseId: editingId,
            type: finalType,
            amount: expenseAmount,
          currency: expenseForm.currency,
          frequency: expenseForm.frequency,
        });
      } else {
        await handleCreateExpense({
            type: finalType,
            amount: expenseAmount,
          currency: expenseForm.currency,
          frequency: expenseForm.frequency,
        });
      }

      handleModalClose();
    } catch (err) {
      const errorKey = editingId ? 'expensesForm.updateErrorMessage' : 'expensesForm.errorMessage';
      setFormError(err instanceof Error ? err.message : t(errorKey));
    }
  }

  function handleEditExpense(expense: Expense) {
    setEditingId(expense.id);
    expenseForm.initializeForEdit(expense);
    setFormError(null);
    setOpen(true);
  }

  async function handleDeleteExpenseClick(expenseId: string) {
    const confirmMessage = t('expensesForm.deleteConfirm') ?? 'Are you sure you want to delete this expense?';
    try {
      await handleDeleteExpense(expenseId, confirmMessage);
    } catch (err) {
      const errorMessage = err instanceof Error ? err.message : (t('expensesForm.deleteError') ?? 'Error deleting expense');
      alert(errorMessage);
    }
  }

  function handleModalClose() {
    setOpen(false);
    setEditingId(null);
    expenseForm.resetForm();
    setFormError(null);
        }
        
  const modal = (
    <ModalWindow open={open} onClose={handleModalClose} title={editingId ? t('expensesForm.editTitle') : t('expensesForm.title')}>
      <AddExpenseForm
        handleSubmit={handleSubmit}
        handleCurrencyChange={expenseForm.handleCurrencyChange}
        isFormValid={expenseForm.isFormValid}
        hasChanges={expenseForm.hasChanges}
        formError={formError}
        categoryId={expenseForm.categoryId}
        isTagSelected={expenseForm.isTagSelected}
        customCategoryText={expenseForm.customCategoryText}
        setCustomCategoryText={expenseForm.setCustomCategoryText}
        expenseCategoryOptions={expenseCategoryOptions}
        handleCategoryChange={expenseForm.handleCategoryChange}
        amount={expenseForm.amount}
        setAmount={expenseForm.setAmount}
        currency={expenseForm.currency}
        frequency={expenseForm.frequency}
        setFrequency={expenseForm.setFrequency}
        frequencyOptions={frequencyOptions}
        submitting={submitting}
        editingId={editingId}
        t={t}
      />
    </ModalWindow>
  );

  // Render states
  if (loading) {
    return <LoadingState message={t('expensesForm.loading')} />;
  }

  if (error) {
    return <ErrorState message={`${t('expensesForm.errorPrefix')} ${error}`} />;
  }

  if (!expenses || expenses.length === 0) {
    return (
      <div className="flex h-full items-center justify-center lg:min-h-[calc(100vh-150px)]">
        <div className="flex flex-col items-center justify-center gap-6">
          <EmptyState icon={<img src="/src/assets/expenses-page-mouse.webp" alt="Empty State" className="max-h-[200px] max-w-[200px]" />}>
            {t('expensesForm.emptyStateMessage')}
          </EmptyState>
           <p className="max-w-[600px] text-center text-textColor dark:text-mainTextColor">{t('expensesForm.emptyStateDescription')}</p>
          <div className="flex flex-wrap gap-2 justify-center max-w-2xl px-4">
            {expenseCategories.map((category) => (
              <Tag 
                key={category.id} 
                title={category.label} 
                isCustom={category.isCustom}
                onClick={() => handleTagClick(category)}
              />
            ))}
          </div>
          {modal}
        </div>
      </div>
    );
  }

  const totalCurrency = selectedConversionCurrency || settingsCurrency || 'USD';

  return (
    <div className="flex flex-col gap-6 min-h-[calc(100vh-100px)]">
      <div className="flex w-full justify-end">
        <AddButton
          onClick={handleAddExpenseClick}
          aria-label={t('expensesForm.addNewAriaLabel')}
        >
          {t('expensesForm.addNewButton')}
        </AddButton>
      </div>
      
      <Tabs
        tabs={[
          {
            id: 'table',
            label: t('expensesForm.tabs.table'),
            content: (
              <div className="space-y-2 lg:px-2">
                <div className="flex justify-between items-center text-sm text-textColor dark:text-textColor">
                  <div className="flex flex-wrap gap-3">
                    <span>{t('expensesForm.totals.monthly')} <strong className="text-mainTextColor dark:text-mainTextColor">{monthlyTotal.toLocaleString('en-US', { minimumFractionDigits: 2, maximumFractionDigits: 2 })} {totalCurrency}</strong></span>
                    <span>{t('expensesForm.totals.annual')} <strong className="text-mainTextColor dark:text-mainTextColor">{annualTotal.toLocaleString('en-US', { minimumFractionDigits: 2, maximumFractionDigits: 2 })} {totalCurrency}</strong></span>
                  </div>
                  {settingsCurrency && expenses.length > 0 && (
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
                <Table columns={tableColumns} data={expenses} />
              </div>
            )
          },
          {
            id: 'chart',
            label: t('expensesForm.tabs.chart'),
            content: (
              <div className="space-y-2 lg:px-2">
                <div className="text-sm text-textColor dark:text-textColor text-right">
                  {t('expensesForm.totals.monthly')} <strong className="text-mainTextColor dark:text-mainTextColor">{monthlyTotal.toLocaleString('en-US', { minimumFractionDigits: 2, maximumFractionDigits: 2 })} {totalCurrency}</strong>
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

      {modal}
    </div>
  );
}