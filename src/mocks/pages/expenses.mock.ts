export interface ExpenseCategory {
  id: string;
  label: string;
  value: string;
  isCustom?: boolean;
}

export const expenseCategories: ExpenseCategory[] = [
  {
    id: 'kids-school-receipt',
    label: 'Обучение детей',
    value: 'kids-school-receipt',
    isCustom: false,
  },
  {
    id: 'food-household',
    label: 'Еда и товары для дома',
    value: 'food-household',
    isCustom: false,
  },
  {
    id: 'car',
    label: 'Автомобиль',
    value: 'car',
    isCustom: false,
  },
  {
    id: 'personal-pocket-money',
    label: 'Личные карманные деньги',
    value: 'personal-pocket-money',
    isCustom: false,
  },
  {
    id: 'parties',
    label: 'Развлечения',
    value: 'parties',
    isCustom: false,
  },
  {
    id: 'internet',
    label: 'Интернет',
    value: 'internet',
    isCustom: false,
  },
  {
    id: 'electricity',
    label: 'Электричество',
    value: 'electricity',
    isCustom: false,
  },
  {
    id: 'water',
    label: 'Вода',
    value: 'water',
    isCustom: false,
  },
  {
    id: 'kids-hobbies',
    label: 'Детские кружки',
    value: 'kids-hobbies',
    isCustom: false,
  },
  {
    id: 'fix-repair',
    label: 'Ремонт и обслуживание',
    value: 'fix-repair',
    isCustom: false,
  },
  {
    id: 'credit',
    label: 'Кредиты',
    value: 'credit',
    isCustom: false,
  },
  {
    id: 'custom',
    label: 'Прочий расход',
    value: 'Custom',
    isCustom: true,
  },
];

export interface Expense {
  id: string;
  category: string;
  title: string;
  amount: number;
  currency: string;
  frequency: 'monthly' | 'annual' | 'one-time';
  date: string; // YYYY-MM-DD
  createdAt?: string;
}

export const mockExpenses: Expense[] = [
  {
    id: '1',
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
    category: 'fix-repair',
    title: 'Устранение протечки крыши',
    amount: 800,
    currency: 'USD',
    frequency: 'one-time',
    date: '2025-01-18',
    createdAt: '2025-01-16',
  },
];

