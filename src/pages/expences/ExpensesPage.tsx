import { useState, useMemo, useEffect } from 'react';
import type { FormEvent } from 'react';
import EmptyState from '@/shared/ui/atoms/EmptyState';
import Tag from '@/shared/ui/atoms/Tag';
import { expenseCategories } from '@/mocks/pages/expenses.mock';
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

const frequencyOptions = [
  { label: 'Ежемесячно', value: 'monthly' },
  { label: 'Ежегодно', value: 'annual' },
  { label: 'Разовая', value: 'one-time' },
];

// Convert expenseCategories to SelectInput options
const expenseCategoryOptions = expenseCategories.map(category => ({
  label: category.label,
  value: category.id,
}));

export default function ExpensesPage() {
  const { user } = useAuth();
  const [open, setOpen] = useState(false);
  const [categoryId, setCategoryId] = useState(expenseCategories[0]?.id || '');
  const [title, setTitle] = useState('');
  const [amount, setAmount] = useState<string | undefined>(undefined);
  const [currency, setCurrency] = useState(currencyOptions[0].value);
  const [frequency, setFrequency] = useState(frequencyOptions[0].value);
  const [expenses, setExpenses] = useState<Expense[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [submitting, setSubmitting] = useState(false);
  const [formError, setFormError] = useState<string | null>(null);

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
    setFrequency(frequencyOptions[0].value);
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
      setFormError(err instanceof Error ? err.message : 'Ошибка добавления расхода');
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
        setError(err instanceof Error ? err.message : 'Ошибка загрузки расходов');
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
  }, [expenses]);

  // Table columns
  const tableColumns = [
    { key: 'title', label: 'Название' },
    { 
      key: 'category', 
      label: 'Категория',
      render: (value: string) => {
        const category = expenseCategories.find(c => c.id === value);
        return category?.label || value;
      }
    },
    { 
      key: 'amount', 
      label: 'Сумма',
      align: 'right' as const,
      render: (value: number, row: Expense) => `${value.toLocaleString()} ${row.currency}`
    },
    { key: 'frequency', label: 'Частота', align: 'center' as const },
    { key: 'date', label: 'Дата' },
    {
      key: 'actions',
      label: 'Действия',
      align: 'center' as const,
      render: () => (
        <div className="flex gap-2 justify-center">
          <IconButton aria-label="Редактировать расход" title="Редактировать" onClick={() => {}}>
            <PencilIcon className="w-4 h-4" />
          </IconButton>
          <IconButton aria-label="Удалить расход" title="Удалить" onClick={() => {}}>
            <TrashIcon className="w-4 h-4" />
          </IconButton>
        </div>
      )
    }
  ];

  if (loading) {
    return (
      <div className="flex h-full items-center justify-center min-h-[calc(100vh-100px)]">
        <div className="text-textColor dark:text-textColor">Загрузка...</div>
      </div>
    );
  }

  if (error) {
    return (
      <div className="flex h-full items-center justify-center min-h-[calc(100vh-100px)]">
        <div className="text-accentRed dark:text-accentRed">Ошибка: {error}</div>
      </div>
    );
  }

  if (!expenses || expenses.length === 0) {
    return (
      <div className="flex h-full items-center justify-center min-h-[calc(100vh-150px)]">
        <div className="flex flex-col items-center justify-center gap-6">
          <EmptyState icon={<img src="/src/assets/expenses-page-mouse.webp" alt="Empty State" className="max-h-[200px] max-w-[200px]" />}>
            Теперь самое важное - добавляй планируемые расходы.
          </EmptyState>
           <p className="max-w-[600px] text-center text-textColor dark:text-mainTextColor">Сформируй бюджет по категориям с фиксированными лимитами. Используй метод «конвертов» или отдельные накопительные счета/цели в приложении банка. При систематическом превышении пересмотри лимиты; повторяй корректировку, пока бюджет не станет управляемым.</p>
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
          <ModalWindow open={open} onClose={handleModalClose} title="Добавить расход">
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
                label="Категория расхода" 
                creatable={true}
              />
              <MoneyInput 
                value={amount}
                onValueChange={setAmount}
                placeholder="1,000" 
                label="Сумма (в любой валюте)"
              />
              <SelectInput 
                value={currency} 
                options={currencyOptions} 
                onChange={handleCurrencyChange} 
                label="Валюта" 
              />
              <TextButton 
                type="submit"
                disabled={!isFormValid || submitting}
                aria-label="Добавить расход"
                variant="primary"
                className="mt-4"
              >
                {submitting ? 'Добавление...' : 'Добавить'}
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
          aria-label="Добавить новый расход" 
          variant="primary"
        >
          Добавить новый расход
        </TextButton>
      </div>
      
      <Tabs
        tabs={[
          {
            id: 'table',
            label: 'Таблица',
            content: (
              <div className="space-y-4">
                <div className="flex justify-between items-center text-sm text-textColor dark:text-textColor">
                  <span>Ежемесячный итог: <strong className="text-mainTextColor dark:text-mainTextColor">{monthlyTotal.toLocaleString()} USD</strong></span>
                  <span>Годовой итог: <strong className="text-mainTextColor dark:text-mainTextColor">{annualTotal.toLocaleString()} USD</strong></span>
                  <span>Разовая сумма: <strong className="text-mainTextColor dark:text-mainTextColor">{oneTimeTotal.toLocaleString()} USD</strong></span>
                </div>
                <Table columns={tableColumns} data={expenses} />
              </div>
            )
          },
          {
            id: 'chart',
            label: 'График',
            content: (
              <div className="space-y-4">
                <div className="text-sm text-textColor dark:text-textColor text-center">
                  Ежемесячный итог: <strong className="text-mainTextColor dark:text-mainTextColor">{monthlyTotal.toLocaleString()} USD</strong>
                </div>
                <PieChart 
                  title="Расходы по категориям" 
                  data={pieChartData}
                  innerRadius="60%"
                />
              </div>
            )
          }
        ]}
      />

          <ModalWindow open={open} onClose={handleModalClose} title="Добавить расход">
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
                label="Категория расхода" 
              />
              <TextInput 
                value={title || selectedCategory?.label || ''}
                onChange={(e) => setTitle(e.target.value)}
                placeholder="Название расхода" 
              />
              <MoneyInput 
                value={amount}
                onValueChange={setAmount}
                placeholder="Сумма" 
              />
              <SelectInput 
                value={currency} 
                options={currencyOptions} 
                onChange={handleCurrencyChange} 
                label="Валюта" 
              />
              <SelectInput 
                value={frequency} 
                options={frequencyOptions} 
                onChange={setFrequency} 
                label="Частота" 
              />
              <TextButton 
                type="submit"
                disabled={!isFormValid || submitting}
                aria-label="Добавить расход"
                variant="primary"
                className="mt-4"
              >
                {submitting ? 'Добавление...' : 'Добавить'}
              </TextButton>
            </Form>
          </ModalWindow>
    </div>
  );
}
