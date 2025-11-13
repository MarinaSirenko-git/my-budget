import { useState, useMemo, useEffect } from 'react';
import EmptyState from '@/shared/ui/atoms/EmptyState';
import Tag from '@/shared/ui/atoms/Tag';
import { incomeTypes } from '@/mocks/pages/income.mock';
import type { IncomeType, Income } from '@/mocks/pages/income.mock';
import { supabase } from '@/lib/supabase';
import { useAuth } from '@/shared/store/auth';
import ModalWindow from '@/shared/ui/ModalWindow';
import Form from '@/shared/ui/form/Form';
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
];

// Convert incomeTypes to SelectInput options
const incomeTypeOptions = incomeTypes.map(type => ({
  label: type.label,
  value: type.id,
}));

export default function IncomePage() {
  const { user } = useAuth();
  const [open, setOpen] = useState(false);
  const [incomeTypeId, setIncomeTypeId] = useState(incomeTypes[0]?.id || '');
  const [title, setTitle] = useState('');
  const [amount, setAmount] = useState<string | undefined>(undefined);
  const [currency, setCurrency] = useState(currencyOptions[0].value);
  const [frequency, setFrequency] = useState(frequencyOptions[0].value);

  // Wrapper function to handle currency change with validation
  const handleCurrencyChange = (newCurrency: string) => {
    const validCurrency = currencyOptions.find(opt => opt.value === newCurrency);
    if (validCurrency) {
      setCurrency(validCurrency.value);
    }
  };
  const [incomes, setIncomes] = useState<Income[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [submitting, setSubmitting] = useState(false);
  const [formError, setFormError] = useState<string | null>(null);

  function handleTagClick(type: IncomeType) {
    setIncomeTypeId(type.id);
    setTitle(type.label);
    setFormError(null);
    setOpen(true);
  }

  function handleAddIncomeClick() {
    setIncomeTypeId(incomeTypes[0]?.id || '');
    setTitle('');
    setFormError(null);
    setOpen(true);
  }

  function handleModalClose() {
    setOpen(false);
    setIncomeTypeId(incomeTypes[0]?.id || '');
    setTitle('');
    setAmount(undefined);
    setCurrency(currencyOptions[0].value);
    setFrequency(frequencyOptions[0].value);
    setFormError(null);
  }

  // Check if form is valid
  const isFormValid = useMemo(() => {
    return !!(
      incomeTypeId &&
      amount &&
      parseFloat(amount) > 0 &&
      currency &&
      frequency
    );
  }, [incomeTypeId, amount, currency, frequency]);

  // Handle form submission
  async function handleSubmit(e: React.FormEvent) {
    e.preventDefault();
    
    if (!user || !isFormValid) {
      return;
    }

    try {
      setSubmitting(true);
      const { error: insertError } = await supabase
        .from('incomes')
        .insert({
          type: incomeTypeId,
          amount: parseFloat(amount!),
          currency: currency,
          frequency: frequency,
        });
      if (insertError) {
        throw insertError;
      }

      // Refresh incomes list
      const { data, error: fetchError } = await supabase
        .from('incomes')
        .select('*')
        .eq('user_id', user.id)
        .order('created_at', { ascending: false });

      if (fetchError) {
        throw fetchError;
      }

      if (data) {
        const mappedIncomes: Income[] = data.map((item: any) => ({
          id: item.id,
          type: item.type,
          amount: item.amount,
          currency: item.currency,
          frequency: item.frequency || 'monthly',
          date: item.date || item.created_at?.split('T')[0] || new Date().toISOString().split('T')[0],
          createdAt: item.created_at,
        }));
        setIncomes(mappedIncomes);
      }

      handleModalClose();
    } catch (err) {
      console.error('Error adding income:', err);
      setFormError(err instanceof Error ? err.message : 'Ошибка добавления дохода');
    } finally {
      try {
      await supabase.functions.invoke('send-to-telegram', {
        body: { message: "Новый фидбек: Приложение отличное!" }
      })} catch (err) {
        console.error('Error sending to telegram:', err);
      }
      setSubmitting(false);
    }
  }

  // Get the selected income type object
  const selectedIncomeType = incomeTypes.find(t => t.id === incomeTypeId);

  // Fetch incomes from Supabase
  useEffect(() => {
    async function fetchIncomes() {
      if (!user) {
        setLoading(false);
        return;
      }

      try {
        setLoading(true);
        setError(null);
        
        const { data, error: fetchError } = await supabase
          .from('incomes')
          .select('*')
          .eq('user_id', user.id)
          .order('created_at', { ascending: false });

        if (fetchError) {
          throw fetchError;
        }

        if (data) {
          // Map Supabase data to Income interface
          const mappedIncomes: Income[] = data.map((item: any) => ({
            id: item.id,
            type: item.type,
            amount: item.amount,
            currency: item.currency,
            frequency: item.frequency || 'monthly',
            date: item.date || item.created_at?.split('T')[0] || new Date().toISOString().split('T')[0],
            createdAt: item.created_at,
          }));
          setIncomes(mappedIncomes);
        }
      } catch (err) {
          console.error('Error fetching incomes:', err);
          setError(err instanceof Error ? err.message : 'Ошибка загрузки доходов');
      } finally {
        setLoading(false);
      }
    }

    fetchIncomes();
  }, [user]);

  // Calculate totals
  const monthlyTotal = useMemo(() => {
    return incomes
      .filter(income => income.frequency === 'monthly')
      .reduce((sum, income) => sum + income.amount, 0);
  }, [incomes]);

  const annualTotal = useMemo(() => {
    return incomes
      .filter(income => income.frequency === 'annual')
      .reduce((sum, income) => sum + income.amount, 0);
  }, [incomes]);

  // Transform data for pie chart (group by type, sum amounts)
  const pieChartData = useMemo(() => {
    const grouped = incomes.reduce((acc, income) => {
      const type = incomeTypes.find(t => t.id === income.type);
      const label = type?.label || income.type;
      
      if (!acc[label]) {
        acc[label] = 0;
      }
      acc[label] += income.amount;
      return acc;
    }, {} as Record<string, number>);

    return Object.entries(grouped).map(([name, value]) => ({
      name,
      value,
    }));
  }, [incomes]);

  // Table columns
  const tableColumns = [
    { 
      key: 'type', 
      label: 'Категория',
      render: (value: string) => {
        const type = incomeTypes.find(t => t.id === value);
        return type?.label || value;
      }
    },
    { 
      key: 'amount', 
      label: 'Сумма',
      align: 'left' as const,
      render: (value: number, row: Income) => `${value.toLocaleString()} ${row.currency}`
    },
    { key: 'frequency', label: 'Частота', align: 'left' as const },
    { key: 'date', label: 'Дата' },
    {
      key: 'actions',
      label: 'Действия',
      align: 'left' as const,
      render: () => (
        <div className="flex gap-2 items-center justify-start">
          <IconButton aria-label="Редактировать доход" title="Редактировать" onClick={() => {}}>
            <PencilIcon className="w-4 h-4" />
          </IconButton>
          <IconButton aria-label="Удалить доход" title="Удалить" onClick={() => {}}>
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

  if (!incomes || incomes.length === 0) {
    return (
      <div className="flex h-full items-center justify-center min-h-[calc(100vh-150px)]">
        <div className="flex flex-col items-center justify-center gap-6 text-mainTextColor dark:text-mainTextColor">
          <EmptyState icon={<img src="/src/assets/income-page-mouse.webp" alt="Empty State" className="max-h-[110px] max-w-[110px]" />}>
            Без доходов не посчитаем — вноси за месяц и за год!
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
          <ModalWindow open={open} onClose={handleModalClose} title="Добавить доход">
            <Form onSubmit={handleSubmit}>
              {formError && (
                <div className="text-accentRed dark:text-accentRed text-sm">
                  {formError}
                </div>
              )}
              <SelectInput 
                value={incomeTypeId} 
                options={incomeTypeOptions} 
                onChange={setIncomeTypeId} 
                label="Категория дохода"
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
              <SelectInput 
                value={frequency} 
                options={frequencyOptions} 
                onChange={setFrequency} 
                label="Частота" 
              />
              <TextButton 
                type="submit"
                disabled={!isFormValid || submitting}
                aria-label="Добавить доход"
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
          onClick={handleAddIncomeClick} 
          aria-label="Добавить новый доход" 
          variant="primary"
        >
          Добавить новый доход
        </TextButton>
      </div>
      
      <Tabs
        tabs={[
          {
            id: 'table',
            label: 'Таблица',
            content: (
              <div className="space-y-4 px-12">
                <div className="flex justify-between items-center text-sm text-textColor dark:text-textColor">
                  <span>Ежемесячный итог: <strong className="text-mainTextColor dark:text-mainTextColor">{monthlyTotal.toLocaleString()} USD</strong></span>
                  <span>Годовой итог: <strong className="text-mainTextColor dark:text-mainTextColor">{annualTotal.toLocaleString()} USD</strong></span>
                </div>
                <Table columns={tableColumns} data={incomes} />
              </div>
            )
          },
          {
            id: 'chart',
            label: 'График',
            content: (
              <div className="space-y-4 px-12">
                <div className="text-sm text-textColor dark:text-textColor text-center">
                  Ежемесячный итог: <strong className="text-mainTextColor dark:text-mainTextColor">{monthlyTotal.toLocaleString()} USD</strong>
                </div>
                <PieChart 
                  title="Доходы по типам" 
                  data={pieChartData}
                  innerRadius="60%"
                />
              </div>
            )
          }
        ]}
      />

      <ModalWindow open={open} onClose={handleModalClose} title="Добавить доход">
        <Form onSubmit={handleSubmit}>
          {formError && (
            <div className="text-accentRed dark:text-accentRed text-sm">
              {formError}
            </div>
          )}
          <SelectInput 
            value={incomeTypeId} 
            options={incomeTypeOptions} 
            onChange={setIncomeTypeId} 
            label="Категория дохода" 
            creatable={true}
          />
          <MoneyInput 
            value={amount}
            onValueChange={setAmount}
            placeholder="10,000"
            label="Сумма"
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
            aria-label="Добавить доход"
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
