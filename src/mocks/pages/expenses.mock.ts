export interface ExpenseCategory {
  id: string;
  label: string;
  value: string;
  isCustom?: boolean;
}

export interface Expense {
  id: string;
  type: string;
  category?: string;
  title?: string;
  amount: number;
  currency: string;
  frequency: 'monthly' | 'annual' | 'one-time';
  date?: string;
  createdAt?: string;
  amountInDefaultCurrency?: number; // Конвертированная сумма в дефолтной валюте
}

export const mockExpenses: Expense[] = [
  {
    id: '1',
    type: 'kids-school-receipt',
    category: 'kids-school-receipt',
    title: 'Школьная плата',
    amount: 500,
    currency: 'USD',
    frequency: 'monthly',
    date: '2025-01-15',
    createdAt: '2025-01-10',
  },
  {
    id: '2',
    type: 'kids-school-receipt',
    category: 'kids-school-receipt',
    title: 'Школьные принадлежности',
    amount: 120,
    currency: 'USD',
    frequency: 'one-time',
    date: '2025-01-05',
    createdAt: '2025-01-03',
  },
  {
    id: '3',
    type: 'food-household',
    category: 'food-household',
    title: 'Еженедельные продукты',
    amount: 200,
    currency: 'USD',
    frequency: 'monthly',
    date: '2025-01-20',
    createdAt: '2025-01-18',
  },
  {
    id: '4',
    type: 'food-household',
    category: 'food-household',
    title: 'Товары для дома',
    amount: 85,
    currency: 'USD',
    frequency: 'monthly',
    date: '2025-01-12',
    createdAt: '2025-01-10',
  },
  {
    id: '5',
    type: 'car',
    category: 'car',
    title: 'Страховка автомобиля',
    amount: 150,
    currency: 'USD',
    frequency: 'monthly',
    date: '2025-01-01',
    createdAt: '2024-12-28',
  },
  {
    id: '6',
    type: 'car',
    category: 'car',
    title: 'Бензин и топливо',
    amount: 300,
    currency: 'USD',
    frequency: 'monthly',
    date: '2025-01-15',
    createdAt: '2025-01-14',
  },
  {
    id: '7',
    type: 'car',
    category: 'car',
    title: 'Обслуживание автомобиля',
    amount: 450,
    currency: 'USD',
    frequency: 'one-time',
    date: '2025-01-08',
    createdAt: '2025-01-06',
  },
  {
    id: '8',
    type: 'personal-pocket-money',
    category: 'personal-pocket-money',
    title: 'Личные карманные деньги',
    amount: 200,
    currency: 'USD',
    frequency: 'monthly',
    date: '2025-01-01',
    createdAt: '2024-12-30',
  },
  {
    id: '9',
    type: 'parties',
    category: 'parties',
    title: 'День рождения',
    amount: 350,
    currency: 'USD',
    frequency: 'one-time',
    date: '2025-01-10',
    createdAt: '2025-01-08',
  },
  {
    id: '10',
    type: 'internet',
    category: 'internet',
    title: 'Интернет',
    amount: 60,
    currency: 'USD',
    frequency: 'monthly',
    date: '2025-01-01',
    createdAt: '2024-12-28',
  },
  {
    id: '11',
    type: 'electricity',
    category: 'electricity',
    title: 'Электричество',
    amount: 120,
    currency: 'USD',
    frequency: 'monthly',
    date: '2025-01-05',
    createdAt: '2025-01-03',
  },
  {
    id: '12',
    type: 'water',
    category: 'water',
    title: 'Вода',
    amount: 45,
    currency: 'USD',
    frequency: 'monthly',
    date: '2025-01-05',
    createdAt: '2025-01-03',
  },
  {
    id: '13',
    type: 'kids-hobbies',
    category: 'kids-hobbies',
    title: 'Уроки фортепиано',
    amount: 180,
    currency: 'USD',
    frequency: 'monthly',
    date: '2025-01-15',
    createdAt: '2025-01-12',
  },
  {
    id: '14',
    type: 'kids-hobbies',
    category: 'kids-hobbies',
    title: 'Футбольная экипировка',
    amount: 95,
    currency: 'USD',
    frequency: 'one-time',
    date: '2025-01-07',
    createdAt: '2025-01-05',
  },
  {
    id: '15',
    type: 'fix-repair',
    category: 'fix-repair',
    title: 'Ремонт кухонной раковины',
    amount: 250,
    currency: 'USD',
    frequency: 'one-time',
    date: '2025-01-12',
    createdAt: '2025-01-10',
  },
  {
    id: '16',
    type: 'fix-repair',
    category: 'fix-repair',
    title: 'Устранение протечки крыши',
    amount: 800,
    currency: 'USD',
    frequency: 'one-time',
    date: '2025-01-18',
    createdAt: '2025-01-16',
  },
];

