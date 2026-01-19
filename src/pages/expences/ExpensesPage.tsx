import { useMemo, useState, useEffect } from 'react';
import type { FormEvent } from 'react';
import { useQueryClient, useMutation } from '@tanstack/react-query';
// reusable global components
import EmptyState from '@/shared/ui/atoms/EmptyState';
import Tag from '@/shared/ui/atoms/Tag';
import ModalWindow from '@/shared/ui/ModalWindow';
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
import { useCurrency, useConvertedExpenses, useUser, useScenario } from '@/shared/hooks';
// constants
import { currencyOptions, type CurrencyCode } from '@/shared/constants/currencies';
import { getExpenseCategories } from '@/shared/utils/categories';
// utils
import { createExpense, updateExpense, deleteExpense } from '@/shared/utils/expenses';
// types
import type { Expense, ExpenseCategory } from '@/mocks/pages/expenses.mock';
import type { TableColumn } from '@/shared/ui/molecules/Table';

export default function ExpensesPage() {
  
  const { t } = useTranslation('components');
  const queryClient = useQueryClient();
  const { currency: settingsCurrency } = useCurrency();
  const { convertedExpenses: expenses, monthlyTotal, annualTotal, expenseTotal, loading: expensesLoading } = useConvertedExpenses();
  const { user } = useUser();
  const { currentScenario } = useScenario();
  
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

  // Initialize categoryId when expenseCategories are available
  useEffect(() => {
    if (expenseCategories.length > 0 && !categoryId) {
      setCategoryId(expenseCategories[0].id);
    }
  }, [expenseCategories, categoryId]);

  // Set default currency from settings when loaded
  useEffect(() => {
    if (settingsCurrency) {
      const validCurrency = currencyOptions.find(opt => opt.value === settingsCurrency);
      if (validCurrency) {
        setCurrency(validCurrency.value);
      }
    }
  }, [settingsCurrency]);

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

  const selectedConversionCurrency: CurrencyCode | null = null;

  // Prepare pie chart data grouped by expense category
  const pieChartData = useMemo<Array<{ name: string; value: number }>>(() => {
    if (!expenses || expenses.length === 0) {
      return [];
    }

    const targetCurrency = selectedConversionCurrency || settingsCurrency;
    
    // Group expenses by category and calculate monthly totals
    const categoryTotals = new Map<string, number>();
    
    expenses.forEach((expense) => {
      // Use converted amount if available, otherwise use original amount
      const amount = targetCurrency && expense.amountInDefaultCurrency !== undefined
        ? expense.amountInDefaultCurrency
        : expense.amount;
      
      // Calculate monthly amount based on frequency
      let monthlyAmount = 0;
      if (expense.frequency === 'monthly') {
        monthlyAmount = amount;
      } else if (expense.frequency === 'annual') {
        monthlyAmount = amount / 12;
      }
      
      // Add to category total
      const categoryName = expense.type;
      const currentTotal = categoryTotals.get(categoryName) || 0;
      categoryTotals.set(categoryName, currentTotal + monthlyAmount);
    });
    
    // Convert map to array and sort by value (descending)
    return Array.from(categoryTotals.entries())
      .map(([name, value]) => ({ name, value }))
      .sort((a, b) => b.value - a.value);
  }, [expenses, settingsCurrency, selectedConversionCurrency]);

  // Loading states
  const [submitting, setSubmitting] = useState(false);
  const [deletingId, setDeletingId] = useState<string | null>(null);

  // Delete expense mutation with optimistic updates
  const deleteExpenseMutation = useMutation({
    mutationFn: (expenseId: string) => deleteExpense({ expenseId }),
    
    onMutate: async (expenseId) => {
      if (!currentScenario?.id) {
        return { previousExpenses: null };
      }
      
      await queryClient.cancelQueries({ queryKey: ['expenses', currentScenario.id] });
      const previousExpenses = queryClient.getQueryData<Expense[]>(['expenses', currentScenario.id]);
      queryClient.setQueryData<Expense[]>(
        ['expenses', currentScenario.id],
        (old) => old?.filter(expense => expense.id !== expenseId) ?? []
      );
      setDeletingId(expenseId);
      return { previousExpenses };
    },
    
    onError: (error, _expenseId, context) => {
      if (context?.previousExpenses && currentScenario?.id) {
        queryClient.setQueryData(['expenses', currentScenario.id], context.previousExpenses);
      }
      setDeletingId(null);
      console.error('Failed to delete expense:', error);
    },
    
    onSettled: () => {
      if (currentScenario?.id) {
        queryClient.invalidateQueries({ queryKey: ['expenses', currentScenario.id] });
      }
      setDeletingId(null);
    },
  });

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

  async function handleSubmit(e: FormEvent) {
    e.preventDefault();
    
    if (!isFormValid || submitting) {
      return;
    }

    if (!user?.id) {
      setFormError(t('expensesForm.errorMessage') || 'User not found');
      return;
    }

    if (!currentScenario?.id) {
      setFormError(t('expensesForm.errorMessage') || 'Scenario not found');
      return;
    }

    setSubmitting(true);
    setFormError(null);

    try {
      const amountValue = parseFloat(amount || '0');
      if (isNaN(amountValue) || amountValue <= 0) {
        throw new Error(t('expensesForm.invalidAmount') || 'Invalid amount');
      }

      const expenseType = (categoryId === 'custom' || isTagSelected)
        ? customCategoryText.trim()
        : expenseCategories.find(category => category.id === categoryId)?.label || categoryId;

      if (editingId) {
        // Update existing expense
        await updateExpense({
          expenseId: editingId,
          type: expenseType,
          amount: amountValue,
          currency,
          frequency,
        });

        // Invalidate React Query cache to refetch expenses
        queryClient.invalidateQueries({ queryKey: ['expenses', currentScenario.id] });
      } else {
        // Create new expense
        await createExpense({
          scenarioId: currentScenario.id,
          type: expenseType,
          amount: amountValue,
          currency,
          frequency,
          settingsCurrency: settingsCurrency || undefined,
        });
        // Invalidate React Query cache to refetch expenses
        queryClient.invalidateQueries({ queryKey: ['expenses', currentScenario.id] });
      }

      // Close modal and reset form
      handleModalClose();
    } catch (error) {
      setFormError(
        error instanceof Error 
          ? error.message 
          : (t('expensesForm.errorMessage') || 'Failed to save expense')
      );
    } finally {
      setSubmitting(false);
    }
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

  function handleDeleteExpenseClick(expenseId: string) {
    deleteExpenseMutation.mutate(expenseId);
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

  // Render states - show empty state if no expenses
  if(!expensesLoading && !deleteExpenseMutation.isPending && expenses.length === 0) {
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
              <div className="lg:space-y-2 lg:px-2">
                <div className="flex justify-between items-center text-sm text-textColor dark:text-textColor mb-4 lg:mb-0">
                  <div className="flex flex-wrap gap-3">
                    <span>{t('expensesForm.totals.monthly')} <strong className="text-mainTextColor dark:text-mainTextColor">{monthlyTotal.toLocaleString('en-US', { minimumFractionDigits: 2, maximumFractionDigits: 2 })} {totalCurrency}</strong></span>
                    <span>{t('expensesForm.totals.annual')} <strong className="text-mainTextColor dark:text-mainTextColor">{annualTotal.toLocaleString('en-US', { minimumFractionDigits: 2, maximumFractionDigits: 2 })} {totalCurrency}</strong></span>
                    <span>{t('expensesForm.totals.count')} <strong className="text-mainTextColor dark:text-mainTextColor">{expenseTotal}</strong></span>
                  </div>
                 
                </div>
                <Table columns={tableColumns} data={expenses} />
              </div>
            )
          },
          {
            id: 'chart',
            label: t('expensesForm.tabs.chart'),
            content: (
              <div className="lg:space-y-2 lg:px-2">
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
