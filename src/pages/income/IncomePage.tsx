import { useState, useMemo } from 'react';
import EmptyState from '@/shared/ui/atoms/EmptyState';
import { ArrowTrendingUpIcon } from '@heroicons/react/24/outline';
import Tag from '@/shared/ui/atoms/Tag';
import { incomeTypes, mockIncomes } from '@/mocks/pages/income.mock';
import type { IncomeType, Income } from '@/mocks/pages/income.mock';
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
];

// Convert incomeTypes to SelectInput options
const incomeTypeOptions = incomeTypes.map(type => ({
  label: type.label,
  value: type.id,
}));

export default function IncomePage() {
  const [open, setOpen] = useState(false);
  const [incomeTypeId, setIncomeTypeId] = useState(incomeTypes[0]?.id || '');
  const [currency, setCurrency] = useState(currencyOptions[0].value);
  const [frequency, setFrequency] = useState(frequencyOptions[0].value);

  function handleTagClick(type: IncomeType) {
    setIncomeTypeId(type.id);
    setOpen(true);
  }

  function handleAddIncomeClick() {
    setIncomeTypeId(incomeTypes[0]?.id || '');
    setOpen(true);
  }

  function handleModalClose() {
    setOpen(false);
    setIncomeTypeId(incomeTypes[0]?.id || '');
  }

  // Get the selected income type object
  const selectedIncomeType = incomeTypes.find(t => t.id === incomeTypeId);

  // Calculate totals
  const monthlyTotal = useMemo(() => {
    return mockIncomes
      .filter(income => income.frequency === 'monthly')
      .reduce((sum, income) => sum + income.amount, 0);
  }, []);

  const annualTotal = useMemo(() => {
    return mockIncomes
      .filter(income => income.frequency === 'annual')
      .reduce((sum, income) => sum + income.amount, 0);
  }, []);

  // Transform data for pie chart (group by type, sum amounts)
  const pieChartData = useMemo(() => {
    const grouped = mockIncomes.reduce((acc, income) => {
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
  }, []);

  // Table columns
  const tableColumns = [
    { key: 'title', label: 'Название' },
    { 
      key: 'type', 
      label: 'Тип',
      render: (value: string) => {
        const type = incomeTypes.find(t => t.id === value);
        return type?.label || value;
      }
    },
    { 
      key: 'amount', 
      label: 'Сумма',
      align: 'right' as const,
      render: (value: number, row: Income) => `${value.toLocaleString()} ${row.currency}`
    },
    { key: 'frequency', label: 'Частота', align: 'center' as const },
    { key: 'date', label: 'Дата' },
    {
      key: 'actions',
      label: 'Действия',
      align: 'center' as const,
      render: () => (
        <div className="flex gap-2 justify-center">
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

  if (!mockIncomes || mockIncomes.length === 0) {
    return (
      <div className="flex h-full items-center justify-center min-h-[calc(100vh-100px)]">
        <div className="flex flex-col items-center justify-center gap-6">
          <EmptyState icon={<ArrowTrendingUpIcon className="w-16 h-16" />}>
            Вы еще не добавили доходы.
          </EmptyState>
          <div className="flex flex-wrap gap-2 justify-center max-w-2xl px-4">
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
            <Form>
              <SelectInput 
                value={incomeTypeId} 
                options={incomeTypeOptions} 
                onChange={setIncomeTypeId} 
                label="Категория дохода" 
              />
              <TextInput 
                defaultValue={selectedIncomeType?.label || ''} 
                placeholder="Название дохода" 
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
                aria-label="Добавить доход"
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
              <div className="space-y-4">
                <div className="flex justify-between items-center text-sm text-gray-600 dark:text-gray-400">
                  <span>Ежемесячный итог: <strong className="text-gray-900 dark:text-gray-100">{monthlyTotal.toLocaleString()} USD</strong></span>
                  <span>Годовой итог: <strong className="text-gray-900 dark:text-gray-100">{annualTotal.toLocaleString()} USD</strong></span>
                </div>
                <Table columns={tableColumns} data={mockIncomes} />
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
        <Form>
          <SelectInput 
            value={incomeTypeId} 
            options={incomeTypeOptions} 
            onChange={setIncomeTypeId} 
            label="Категория дохода" 
          />
          <TextInput 
            defaultValue={selectedIncomeType?.label || ''} 
            placeholder="Название дохода" 
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
            aria-label="Добавить доход"
          >
            Добавить
          </TextButton>
        </Form>
      </ModalWindow>
    </div>
  );
}
