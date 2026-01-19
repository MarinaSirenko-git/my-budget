export interface IncomeType {
  id: string;
  label: string;
  value: string;
  isCustom?: boolean;
}

export const incomeTypes: IncomeType[] = [
  {
    id: 'salary',
    label: 'Зарплата',
    value: 'salary',
    isCustom: false,
  },
  {
    id: 'bonuses',
    label: 'Бонусы',
    value: 'bonuses',
    isCustom: false,
  },
  {
    id: 'rental-income',
    label: 'Доход от сдачи в аренду',
    value: 'rental-income',
    isCustom: false,
  },
  {
    id: 'dividends',
    label: 'Дивиденды',
    value: 'dividends',
    isCustom: false,
  },
  {
    id: 'digital-product-sales',
    label: 'Продажа товаров',
    value: 'digital-product-sales',
    isCustom: false,
  },
  {
    id: 'tax-refunds',
    label: 'Налоговые возвраты',
    value: 'tax-refunds',
    isCustom: false,
  },
  {
    id: 'government-benefits',
    label: 'Государственные пособия',
    value: 'government-benefits',
    isCustom: false,
  },
  {
    id: 'custom',
    label: 'Твой вариант',
    value: 'Custom',
    isCustom: true,
  },
];

export interface Income {
  id: string;
  type: string;
  amount: number;
  currency: string;
  frequency: 'monthly' | 'annual';
  date: string; // YYYY-MM-DD
  createdAt?: string;
  amountInDefaultCurrency?: number;
}

export const mockIncomes: Income[] = [
  {
    id: '1',
    type: 'salary',
    amount: 7500,
    currency: 'USD',
    frequency: 'monthly',
    date: '2025-01-15',
    createdAt: '2025-01-10',
  },
  {
    id: '2',
    type: 'bonuses',
    amount: 2500,
    currency: 'USD',
    frequency: 'annual',
    date: '2024-12-31',
    createdAt: '2025-01-05',
  },
  {
    id: '3',
    type: 'rental-income',
    amount: 1200,
    currency: 'USD',
    frequency: 'monthly',
    date: '2025-01-01',
    createdAt: '2024-12-28',
  },
  {
    id: '4',
    type: 'dividends',
    amount: 450,
    currency: 'USD',
    frequency: 'annual',
    date: '2025-01-10',
    createdAt: '2025-01-08',
  },
  {
    id: '5',
    type: 'small-business-profit',
    amount: 3200,
    currency: 'USD',
    frequency: 'monthly',
    date: '2025-01-20',
    createdAt: '2025-01-18',
  },
  {
    id: '6',
    type: 'digital-product-sales',
    amount: 850,
    currency: 'USD',
    frequency: 'monthly',
    date: '2025-01-15',
    createdAt: '2025-01-12',
  },
  {
    id: '7',
    type: 'tax-refunds',
    amount: 1200,
    currency: 'USD',
    frequency: 'annual',
    date: '2025-01-05',
    createdAt: '2025-01-03',
  },
  {
    id: '8',
    type: 'royalties',
    amount: 600,
    currency: 'USD',
    frequency: 'annual',
    date: '2025-01-01',
    createdAt: '2024-12-30',
  },
];

