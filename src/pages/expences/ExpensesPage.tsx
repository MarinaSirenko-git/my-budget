import { useState, useMemo } from 'react';
import EmptyState from '@/shared/ui/atoms/EmptyState';
import { ArrowTrendingDownIcon } from '@heroicons/react/24/outline';
import Tag from '@/shared/ui/atoms/Tag';
import { expenseCategories, mockExpenses } from '@/mocks/pages/expenses.mock';
import type { ExpenseCategory, Expense } from '@/mocks/pages/expenses.mock';
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

const currencyOptions = [
  { label: 'USD', value: 'USD' },
  { label: 'EUR', value: 'EUR' },
  { label: 'RUB', value: 'RUB' },
];

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
  const [open, setOpen] = useState(false);
  const [categoryId, setCategoryId] = useState(expenseCategories[0]?.id || '');
  const [currency, setCurrency] = useState(currencyOptions[0].value);
  const [frequency, setFrequency] = useState(frequencyOptions[0].value);

  function handleTagClick(category: ExpenseCategory) {
    setCategoryId(category.id);
    setOpen(true);
  }

  function handleAddExpenseClick() {
    setCategoryId(expenseCategories[0]?.id || '');
    setOpen(true);
  }

  function handleModalClose() {
    setOpen(false);
    setCategoryId(expenseCategories[0]?.id || '');
  }

  // Get the selected category object
  const selectedCategory = expenseCategories.find(c => c.id === categoryId);

  // Calculate totals
  const monthlyTotal = useMemo(() => {
    return mockExpenses
      .filter(expense => expense.frequency === 'monthly')
      .reduce((sum, expense) => sum + expense.amount, 0);
  }, []);

  const annualTotal = useMemo(() => {
    return mockExpenses
      .filter(expense => expense.frequency === 'annual')
      .reduce((sum, expense) => sum + expense.amount, 0);
  }, []);

  const oneTimeTotal = useMemo(() => {
    return mockExpenses
      .filter(expense => expense.frequency === 'one-time')
      .reduce((sum, expense) => sum + expense.amount, 0);
  }, []);

  // Transform data for pie chart (group by category, sum amounts)
  const pieChartData = useMemo(() => {
    const grouped = mockExpenses.reduce((acc, expense) => {
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
  }, []);

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

  if (!mockExpenses || mockExpenses.length === 0) {
    return (
      <div className="flex h-full items-center justify-center min-h-[calc(100vh-100px)]">
        <div className="flex flex-col items-center justify-center gap-6">
          <EmptyState icon={<ArrowTrendingDownIcon className="w-16 h-16" />}>
            Вы еще не добавили расходы.
          </EmptyState>
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
            <Form>
              <SelectInput 
                value={categoryId} 
                options={expenseCategoryOptions} 
                onChange={setCategoryId} 
                label="Категория расхода" 
              />
              <TextInput 
                defaultValue={selectedCategory?.label || ''} 
                placeholder="Название расхода" 
              />
              <MoneyInput placeholder="Сумма" />
              <SelectInput 
                value={currency} 
                options={currencyOptions} 
                onChange={setCurrency} 
                label="Валюта" 
              />
              <SelectInput 
                value={frequency} 
                options={frequencyOptions} 
                onChange={setFrequency} 
                label="Частота" 
              />
              <TextButton 
                className="bg-blue-600 text-white mt-4" 
                disabled
                aria-label="Добавить расход"
              >
                Добавить
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
                <div className="flex justify-between items-center text-sm text-gray-600 dark:text-gray-400">
                  <span>Ежемесячный итог: <strong className="text-gray-900 dark:text-gray-100">{monthlyTotal.toLocaleString()} USD</strong></span>
                  <span>Годовой итог: <strong className="text-gray-900 dark:text-gray-100">{annualTotal.toLocaleString()} USD</strong></span>
                  <span>Разовая сумма: <strong className="text-gray-900 dark:text-gray-100">{oneTimeTotal.toLocaleString()} USD</strong></span>
                </div>
                <Table columns={tableColumns} data={mockExpenses} />
              </div>
            )
          },
          {
            id: 'chart',
            label: 'График',
            content: (
              <div className="space-y-4">
                <div className="text-sm text-gray-600 dark:text-gray-400 text-center">
                  Ежемесячный итог: <strong className="text-gray-900 dark:text-gray-100">{monthlyTotal.toLocaleString()} USD</strong>
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
        <Form>
          <SelectInput 
            value={categoryId} 
            options={expenseCategoryOptions} 
            onChange={setCategoryId} 
            label="Категория расхода" 
          />
          <TextInput 
            defaultValue={selectedCategory?.label || ''} 
            placeholder="Название расхода" 
          />
          <MoneyInput placeholder="Сумма" />
          <SelectInput 
            value={currency} 
            options={currencyOptions} 
            onChange={setCurrency} 
            label="Валюта" 
          />
          <SelectInput 
            value={frequency} 
            options={frequencyOptions} 
            onChange={setFrequency} 
            label="Частота" 
          />
          <TextButton 
            className="bg-blue-600 text-white mt-4" 
            disabled
            aria-label="Добавить расход"
          >
            Добавить
          </TextButton>
        </Form>
      </ModalWindow>
    </div>
  );
}
