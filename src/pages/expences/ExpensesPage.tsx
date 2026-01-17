import { useMemo, useState } from 'react';
import type { FormEvent } from 'react';
// reusable global components
import EmptyState from '@/shared/ui/atoms/EmptyState';
import Tag from '@/shared/ui/atoms/Tag';
import ModalWindow from '@/shared/ui/ModalWindow';
import SelectInput from '@/shared/ui/form/SelectInput';
import AddButton from '@/shared/ui/atoms/AddButton';
import Tabs from '@/shared/ui/molecules/Tabs';
import Table from '@/shared/ui/molecules/Table';
import PieChart from '@/shared/ui/molecules/PieChart';
import IconButton from '@/shared/ui/atoms/IconButton';
import { PencilIcon, TrashIcon } from '@heroicons/react/24/outline';
// reusable local components
import AddExpenseForm from '@/features/expenses/AddExpenseForm';
// custom hooks
import { useTranslation } from '@/shared/i18n';
import { useCurrency } from '@/shared/hooks';
// constants
import { currencyOptions, type CurrencyCode } from '@/shared/constants/currencies';
import { getExpenseCategories } from '@/shared/utils/categories';
// types
import type { Expense, ExpenseCategory } from '@/mocks/pages/expenses.mock';
import type { TableColumn } from '@/shared/ui/molecules/Table';

export default function ExpensesPage() {
  
  const { t } = useTranslation('components');
  const { currency: settingsCurrency } = useCurrency();
  
  // Expenses data - empty array
  const expenses: Expense[] = [];
  
  // Modal state
  const [open, setOpen] = useState(false);
  const [editingId, setEditingId] = useState<string | null>(null);
  
  // Form state
  const [categoryId, setCategoryId] = useState('');
  const [customCategoryText, setCustomCategoryText] = useState('');
  const [amount, setAmount] = useState<string | undefined>(undefined);
  const [currency, setCurrency] = useState<CurrencyCode>(currencyOptions[0].value);
  const [frequency, setFrequency] = useState<Expense['frequency']>('monthly');
  const [isTagSelected, setIsTagSelected] = useState(false);
  const [formError, setFormError] = useState<string | null>(null);
  
  // Data placeholders
  const submitting = false;
  const deletingId: string | null = null;
  const monthlyTotal = 0;
  const annualTotal = 0;
  const pieChartData: Array<{ name: string; value: number }> = [];
  const selectedConversionCurrency: CurrencyCode | null = null;
  
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

  // Form validation
  const isFormValid = useMemo(() => {
    const hasValidCategory = (categoryId === 'custom' || isTagSelected)
      ? customCategoryText.trim().length > 0
      : categoryId;

    return !!(
      hasValidCategory &&
      amount &&
      parseFloat(amount) > 0 &&
      currency &&
      frequency
    );
  }, [categoryId, isTagSelected, customCategoryText, amount, currency, frequency]);

  const hasChanges = true; // Always true for now since we don't track original values

  // Table columns
  const tableColumns = useMemo<TableColumn<Expense>[]>(() => {
    const columns: TableColumn<Expense>[] = [
      { 
        key: 'type', 
        label: t('expensesForm.tableColumns.category'),
        render: (value: string) => {
          const category = expenseCategories.find(cat => cat.id === value);
          return category?.label || value;
        }
      },
      { 
        key: 'amount', 
        label: t('expensesForm.tableColumns.amount'),
        align: 'left' as const,
        render: (value: number, row: Expense) => `${value.toLocaleString('en-US', { minimumFractionDigits: 2, maximumFractionDigits: 2 })} ${row.currency}`
      },
    ];

    if (settingsCurrency) {
      const hasDifferentCurrency = expenses.some(expense => expense.currency !== settingsCurrency);
      if (hasDifferentCurrency) {
        const targetCurrency = selectedConversionCurrency || settingsCurrency;

        columns.push({
          key: 'amountInSettingsCurrency',
          label: t('expensesForm.tableColumns.amountInSettingsCurrency'),
          align: 'left' as const,
          render: (_value: any, row: Expense) => {
            if (row.currency === targetCurrency) {
              return '-';
            }

            const displayAmount = row.amountInDefaultCurrency !== undefined 
              ? row.amountInDefaultCurrency 
              : row.amount;

            return (
              <span className="text-sm">
                {displayAmount !== null ? (
                  `${displayAmount.toLocaleString('en-US', { minimumFractionDigits: 2, maximumFractionDigits: 2 })} ${targetCurrency}`
                ) : (
                  `... ${targetCurrency}`
                )}
              </span>
            );
          }
        });
      }
    }

    columns.push(
      { key: 'frequency', label: t('expensesForm.tableColumns.frequency'), align: 'left' as const },
      {
        key: 'actions',
        label: t('expensesForm.tableColumns.actions'),
        align: 'left' as const,
        render: (_value: any, row: Expense) => (
          <div className="flex gap-2 items-center justify-start" onClick={(e) => e.stopPropagation()}>
            <IconButton 
              aria-label={t('expensesForm.actions.editAriaLabel')} 
              title={t('expensesForm.actions.edit')} 
              onClick={() => handleEditExpense(row)}
            >
              <PencilIcon className="w-4 h-4" />
            </IconButton>
            <IconButton 
              aria-label={t('expensesForm.actions.deleteAriaLabel')} 
              title={t('expensesForm.actions.delete')} 
              onClick={() => handleDeleteExpenseClick(row.id)}
              disabled={deletingId === row.id}
            >
              <TrashIcon className="w-4 h-4" />
            </IconButton>
          </div>
        )
      }
    );

    return columns;
  }, [t, expenseCategories, settingsCurrency, expenses, deletingId, selectedConversionCurrency]);

  // Event handlers
  function handleTagClick(category: ExpenseCategory) {
    setCategoryId('custom');
    setCustomCategoryText(category.label);
    setIsTagSelected(true);
    setFormError(null);
    setEditingId(null);
    setOpen(true);
  }

  function handleAddExpenseClick() {
    setCategoryId(expenseCategories[0]?.id || '');
    setCustomCategoryText('');
    setIsTagSelected(false);
    setAmount(undefined);
    const defaultCurrencyValue = settingsCurrency || currencyOptions[0].value;
    const validCurrency = currencyOptions.find(opt => opt.value === defaultCurrencyValue);
    setCurrency(validCurrency ? validCurrency.value : currencyOptions[0].value);
    setFrequency('monthly');
    setFormError(null);
    setEditingId(null);
    setOpen(true);
  }

  function handleSubmit(e: FormEvent) {
    e.preventDefault();
    // Empty stub - no business logic
  }

  function handleEditExpense(expense: Expense) {
    setEditingId(expense.id);
    setCategoryId('custom');
    setCustomCategoryText(expense.type);
    setIsTagSelected(true);
    setAmount(expense.amount.toString());
    const validCurrency = currencyOptions.find(opt => opt.value === expense.currency);
    setCurrency(validCurrency ? validCurrency.value : currencyOptions[0].value);
    setFrequency(expense.frequency);
    setFormError(null);
    setOpen(true);
  }

  function handleDeleteExpenseClick(_expenseId: string) {
    // Empty stub - no business logic
  }

  function handleConversionCurrencyChange(_newCurrency: string) {
    // Empty stub - no business logic
  }

  function handleModalClose() {
    setOpen(false);
    setEditingId(null);
    setCategoryId(expenseCategories[0]?.id || '');
    setCustomCategoryText('');
    setIsTagSelected(false);
    setAmount(undefined);
    const defaultCurrencyValue = settingsCurrency || currencyOptions[0].value;
    const validCurrency = currencyOptions.find(opt => opt.value === defaultCurrencyValue);
    setCurrency(validCurrency ? validCurrency.value : currencyOptions[0].value);
    setFrequency('monthly');
    setFormError(null);
  }

  function handleCurrencyChange(newCurrency: string) {
    const validCurrency = currencyOptions.find(opt => opt.value === newCurrency);
    if (validCurrency) {
      setCurrency(validCurrency.value);
    }
  }

  function handleCategoryChange(newCategoryId: string) {
    setCategoryId(newCategoryId);
    if (newCategoryId === 'custom') {
      setCustomCategoryText('');
    } else {
      const selectedCategory = expenseCategories.find(category => category.id === newCategoryId);
      if (selectedCategory) {
        setCustomCategoryText(selectedCategory.label);
        setCategoryId('custom');
        setIsTagSelected(true);
      } else {
        setCustomCategoryText('');
      }
    }
  }
        
  const modal = (
    <ModalWindow open={open} onClose={handleModalClose} title={editingId ? t('expensesForm.editTitle') : t('expensesForm.title')}>
      <AddExpenseForm
        handleSubmit={handleSubmit}
        handleCurrencyChange={handleCurrencyChange}
        isFormValid={isFormValid}
        hasChanges={hasChanges}
        formError={formError}
        categoryId={categoryId}
        isTagSelected={isTagSelected}
        customCategoryText={customCategoryText}
        setCustomCategoryText={setCustomCategoryText}
        expenseCategoryOptions={expenseCategoryOptions}
        handleCategoryChange={handleCategoryChange}
        amount={amount}
        setAmount={setAmount}
        currency={currency}
        frequency={frequency}
        setFrequency={setFrequency}
        frequencyOptions={frequencyOptions}
        submitting={submitting}
        editingId={editingId}
        t={t}
      />
    </ModalWindow>
  );

  // Render states - expenses is always empty, so show empty state
  if (expenses.length === 0) {
    return (
      <div className="flex h-full items-center justify-center lg:min-h-[calc(100vh-150px)]">
        <div className="flex flex-col items-center justify-center gap-6">
          <EmptyState>
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
      <div className="flex w-full justify-center lg:justify-end px-4 lg:px-0 py-4 lg:py-0">
        <AddButton
          onClick={handleAddExpenseClick}
          aria-label={t('expensesForm.addNewAriaLabel')}
          className="w-full lg:w-auto justify-center lg:justify-start"
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
