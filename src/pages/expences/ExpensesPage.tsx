import { useState, useMemo, useEffect } from 'react';
import type { FormEvent } from 'react';
import EmptyState from '@/shared/ui/atoms/EmptyState';
import Tag from '@/shared/ui/atoms/Tag';
import type { ExpenseCategory, Expense } from '@/mocks/pages/expenses.mock';
import { supabase } from '@/lib/supabase';
import { useAuth } from '@/shared/store/auth';
import ModalWindow from '@/shared/ui/ModalWindow';
import Form from '@/shared/ui/form/Form';
import TextInput from '@/shared/ui/form/TextInput';
import MoneyInput from '@/shared/ui/form/MoneyInput';
import SelectInput from '@/shared/ui/form/SelectInput';
import TextButton from '@/shared/ui/atoms/TextButton';
import Tabs from '@/shared/ui/molecules/Tabs';
import Table from '@/shared/ui/molecules/Table';
import PieChart from '@/shared/ui/molecules/PieChart';
import IconButton from '@/shared/ui/atoms/IconButton';
import { PencilIcon, TrashIcon } from '@heroicons/react/24/outline';
import { currencyOptions } from '@/shared/constants/currencies';
import { useTranslation } from '@/shared/i18n';
import { getExpenseCategories } from '@/shared/utils/categories';

export default function ExpensesPage() {
  const { user } = useAuth();
  const { t } = useTranslation('components');
  const [open, setOpen] = useState(false);
  const [title, setTitle] = useState('');
  const [amount, setAmount] = useState<string | undefined>(undefined);
  const [currency, setCurrency] = useState(currencyOptions[0].value);
  
  // Генерируем категории расходов с переводами
  const expenseCategories = useMemo(() => getExpenseCategories(t), [t]);
  
  const [categoryId, setCategoryId] = useState('');
  
  // Convert expenseCategories to SelectInput options
  const expenseCategoryOptions = useMemo(() => expenseCategories.map(category => ({
    label: category.label,
    value: category.id,
  })), [expenseCategories]);
  
  const frequencyOptions = useMemo(() => [
    { label: t('expensesForm.monthly'), value: 'monthly' },
    { label: t('expensesForm.annual'), value: 'annual' },
    { label: t('expensesForm.oneTime'), value: 'one-time' },
  ], [t]);
  
  const [frequency, setFrequency] = useState('monthly');
  const [expenses, setExpenses] = useState<Expense[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [submitting, setSubmitting] = useState(false);
  const [formError, setFormError] = useState<string | null>(null);

  // Инициализируем categoryId после создания категорий
  useEffect(() => {
    if (expenseCategories.length > 0 && !categoryId) {
      setCategoryId(expenseCategories[0].id);
    }
  }, [expenseCategories, categoryId]);

  // Wrapper function to handle currency change with validation
  const handleCurrencyChange = (newCurrency: string) => {
    const validCurrency = currencyOptions.find(opt => opt.value === newCurrency);
    if (validCurrency) {
      setCurrency(validCurrency.value);
    }
  };

  function handleTagClick(category: ExpenseCategory) {
    setCategoryId(category.id);
    setTitle(category.label);
    setFormError(null);
    setOpen(true);
  }

  function handleAddExpenseClick() {
    setCategoryId(expenseCategories[0]?.id || '');
    setTitle('');
    setFormError(null);
    setOpen(true);
  }

  function handleModalClose() {
    setOpen(false);
    setCategoryId(expenseCategories[0]?.id || '');
    setTitle('');
    setAmount(undefined);
    setCurrency(currencyOptions[0].value);
    setFrequency('monthly');
    setFormError(null);
  }

  // Check if form is valid
  const isFormValid = useMemo(() => {
    return !!(
      categoryId &&
      title.trim() &&
      amount &&
      parseFloat(amount) > 0 &&
      currency
    );
  }, [categoryId, title, amount, currency]);

  // Handle form submission
  async function handleSubmit(e: FormEvent) {
    e.preventDefault();
    
    if (!user || !isFormValid) {
      return;
    }

    try {
      setSubmitting(true);
      setFormError(null);
      
      const selectedCategory = expenseCategories.find(c => c.id === categoryId);
      const categoryName = selectedCategory?.label || categoryId;
      
      const { error: insertError } = await supabase
        .from('expenses')
        .insert({
          user_id: user.id,
          category_name: categoryName,
          category: categoryId,
          name: title.trim(),
          planned_amount: parseFloat(amount!),
          amount: parseFloat(amount!),
          currency: currency,
          frequency: frequency || 'monthly',
          date: new Date().toISOString().split('T')[0],
        });

      if (insertError) {
        throw insertError;
      }

      // Refresh expenses list
      const { data, error: fetchError } = await supabase
        .from('expenses')
        .select('*')
        .eq('user_id', user.id)
        .order('created_at', { ascending: false });

      if (fetchError) {
        throw fetchError;
      }

      if (data) {
        const mappedExpenses: Expense[] = data.map((item: any) => ({
          id: item.id,
          category: item.category || item.category_name,
          title: item.name || item.title,
          amount: item.planned_amount || item.amount,
          currency: item.currency,
          frequency: item.frequency || 'monthly',
          date: item.date || item.created_at?.split('T')[0] || new Date().toISOString().split('T')[0],
          createdAt: item.created_at,
        }));
        setExpenses(mappedExpenses);
      }

      handleModalClose();
    } catch (err) {
      console.error('Error adding expense:', err);
      setFormError(err instanceof Error ? err.message : t('expensesForm.errorMessage'));
    } finally {
      setSubmitting(false);
    }
  }

  // Get the selected category object
  const selectedCategory = expenseCategories.find(c => c.id === categoryId);

  // Fetch expenses from Supabase
  useEffect(() => {
    async function fetchExpenses() {
      if (!user) {
        setLoading(false);
        return;
      }

      try {
        setLoading(true);
        setError(null);
        
        const { data, error: fetchError } = await supabase
          .from('expenses')
          .select('*')
          .eq('user_id', user.id)
          .order('created_at', { ascending: false });

        if (fetchError) {
          throw fetchError;
        }

        if (data) {
          // Map Supabase data to Expense interface
          const mappedExpenses: Expense[] = data.map((item: any) => ({
            id: item.id,
            category: item.category || item.category_name,
            title: item.name || item.title,
            amount: item.planned_amount || item.amount,
            currency: item.currency,
            frequency: item.frequency || 'monthly',
            date: item.date || item.created_at?.split('T')[0] || new Date().toISOString().split('T')[0],
            createdAt: item.created_at,
          }));
          setExpenses(mappedExpenses);
        }
      } catch (err) {
        console.error('Error fetching expenses:', err);
        setError(err instanceof Error ? err.message : t('expensesForm.loadingError'));
      } finally {
        setLoading(false);
      }
    }

    fetchExpenses();
  }, [user]);

  // Calculate totals
  const monthlyTotal = useMemo(() => {
    return expenses
      .filter(expense => expense.frequency === 'monthly')
      .reduce((sum, expense) => sum + expense.amount, 0);
  }, [expenses]);

  const annualTotal = useMemo(() => {
    return expenses
      .filter(expense => expense.frequency === 'annual')
      .reduce((sum, expense) => sum + expense.amount, 0);
  }, [expenses]);

  const oneTimeTotal = useMemo(() => {
    return expenses
      .filter(expense => expense.frequency === 'one-time')
      .reduce((sum, expense) => sum + expense.amount, 0);
  }, [expenses]);

  // Transform data for pie chart (group by category, sum amounts)
  const pieChartData = useMemo(() => {
    const grouped = expenses.reduce((acc, expense) => {
      const category = expenseCategories.find(c => c.id === expense.category);
      const label = category?.label || expense.category;
      
      if (!acc[label]) {
        acc[label] = 0;
      }
      acc[label] += expense.amount;
      return acc;
    }, {} as Record<string, number>);

    return Object.entries(grouped).map(([name, value]) => ({
      name,
      value,
    }));
  }, [expenses, expenseCategories]);

  // Table columns
  const tableColumns = useMemo(() => [
    { key: 'title', label: t('expensesForm.tableColumns.title') },
    { 
      key: 'category', 
      label: t('expensesForm.tableColumns.category'),
      render: (value: string) => {
        const category = expenseCategories.find(cat => cat.id === value);
        return category?.label || value;
      }
    },
    { 
      key: 'amount', 
      label: t('expensesForm.tableColumns.amount'),
      align: 'right' as const,
      render: (value: number, row: Expense) => `${value.toLocaleString()} ${row.currency}`
    },
    { key: 'frequency', label: t('expensesForm.tableColumns.frequency'), align: 'center' as const },
    { key: 'date', label: t('expensesForm.tableColumns.date') },
    {
      key: 'actions',
      label: t('expensesForm.tableColumns.actions'),
      align: 'center' as const,
      render: () => (
        <div className="flex gap-2 justify-center">
          <IconButton aria-label={t('expensesForm.actions.editAriaLabel')} title={t('expensesForm.actions.edit')} onClick={() => {}}>
            <PencilIcon className="w-4 h-4" />
          </IconButton>
          <IconButton aria-label={t('expensesForm.actions.deleteAriaLabel')} title={t('expensesForm.actions.delete')} onClick={() => {}}>
            <TrashIcon className="w-4 h-4" />
          </IconButton>
        </div>
      )
    }
  ], [t, expenseCategories]);

  if (loading) {
    return (
      <div className="flex h-full items-center justify-center min-h-[calc(100vh-100px)]">
        <div className="text-textColor dark:text-textColor">{t('expensesForm.loading')}</div>
      </div>
    );
  }

  if (error) {
    return (
      <div className="flex h-full items-center justify-center min-h-[calc(100vh-100px)]">
        <div className="text-accentRed dark:text-accentRed">{t('expensesForm.errorPrefix')} {error}</div>
      </div>
    );
  }

  if (!expenses || expenses.length === 0) {
    return (
      <div className="flex h-full items-center justify-center min-h-[calc(100vh-150px)]">
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
          <ModalWindow open={open} onClose={handleModalClose} title={t('expensesForm.title')}>
            <Form onSubmit={handleSubmit}>
              {formError && (
                <div className="text-accentRed dark:text-accentRed text-sm">
                  {formError}
                </div>
              )}
              <SelectInput 
                value={categoryId} 
                options={expenseCategoryOptions} 
                onChange={setCategoryId} 
                label={t('expensesForm.categoryLabel')} 
                creatable={true}
              />
              <MoneyInput 
                value={amount}
                onValueChange={setAmount}
                placeholder="1,000" 
                label={t('expensesForm.amountLabelFull')}
              />
              <SelectInput 
                value={currency} 
                options={currencyOptions} 
                onChange={handleCurrencyChange} 
                label={t('expensesForm.currencyLabel')} 
              />
              <TextButton 
                type="submit"
                disabled={!isFormValid || submitting}
                aria-label={t('expensesForm.submitAriaLabel')}
                variant="primary"
                className="mt-4"
              >
                {submitting ? t('expensesForm.submittingButton') : t('expensesForm.submitButton')}
              </TextButton>
            </Form>
          </ModalWindow>
        </div>
      </div>
    );
  }

  return (
    <div className="flex flex-col gap-6 min-h-[calc(100vh-100px)]">
      <div className="flex w-full justify-end">
        <TextButton 
          onClick={handleAddExpenseClick} 
          aria-label={t('expensesForm.addNewAriaLabel')} 
          variant="primary"
        >
          {t('expensesForm.addNewButton')}
        </TextButton>
      </div>
      
      <Tabs
        tabs={[
          {
            id: 'table',
            label: t('expensesForm.tabs.table'),
            content: (
              <div className="space-y-4">
                <div className="flex justify-between items-center text-sm text-textColor dark:text-textColor">
                  <span>{t('expensesForm.totals.monthly')} <strong className="text-mainTextColor dark:text-mainTextColor">{monthlyTotal.toLocaleString()} USD</strong></span>
                  <span>{t('expensesForm.totals.annual')} <strong className="text-mainTextColor dark:text-mainTextColor">{annualTotal.toLocaleString()} USD</strong></span>
                  <span>{t('expensesForm.totals.oneTime')} <strong className="text-mainTextColor dark:text-mainTextColor">{oneTimeTotal.toLocaleString()} USD</strong></span>
                </div>
                <Table columns={tableColumns} data={expenses} />
              </div>
            )
          },
          {
            id: 'chart',
            label: t('expensesForm.tabs.chart'),
            content: (
              <div className="space-y-4">
                <div className="text-sm text-textColor dark:text-textColor text-center">
                  {t('expensesForm.totals.monthly')} <strong className="text-mainTextColor dark:text-mainTextColor">{monthlyTotal.toLocaleString()} USD</strong>
                </div>
                <PieChart 
                  title={t('expensesForm.chartTitle')} 
                  data={pieChartData}
                  innerRadius="60%"
                />
              </div>
            )
          }
        ]}
      />

          <ModalWindow open={open} onClose={handleModalClose} title={t('expensesForm.title')}>
            <Form onSubmit={handleSubmit}>
              {formError && (
                <div className="text-accentRed dark:text-accentRed text-sm">
                  {formError}
                </div>
              )}
              <SelectInput 
                value={categoryId} 
                options={expenseCategoryOptions} 
                onChange={setCategoryId} 
                label={t('expensesForm.categoryLabel')} 
              />
              <TextInput 
                value={title || selectedCategory?.label || ''}
                onChange={(e) => setTitle(e.target.value)}
                placeholder={t('expensesForm.titlePlaceholder')} 
              />
              <MoneyInput 
                value={amount}
                onValueChange={setAmount}
                placeholder={t('expensesForm.amountPlaceholder')} 
              />
              <SelectInput 
                value={currency} 
                options={currencyOptions} 
                onChange={handleCurrencyChange} 
                label={t('expensesForm.currencyLabel')} 
              />
              <SelectInput 
                value={frequency} 
                options={frequencyOptions} 
                onChange={setFrequency} 
                label={t('expensesForm.frequencyLabel')} 
              />
              <TextButton 
                type="submit"
                disabled={!isFormValid || submitting}
                aria-label={t('expensesForm.submitAriaLabel')}
                variant="primary"
                className="mt-4"
              >
                {submitting ? t('expensesForm.submittingButton') : t('expensesForm.submitButton')}
              </TextButton>
            </Form>
          </ModalWindow>
    </div>
  );
}
