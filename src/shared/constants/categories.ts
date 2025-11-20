import type { IncomeType } from '@/mocks/pages/income.mock';
import type { ExpenseCategory } from '@/mocks/pages/expenses.mock';

/**
 * Константы категорий доходов
 * label будет добавляться динамически через i18n
 */
export const INCOME_CATEGORY_IDS: Omit<IncomeType, 'label'>[] = [
  {
    id: 'salary',
    value: 'salary',
    isCustom: false,
  },
  {
    id: 'bonuses',
    value: 'bonuses',
    isCustom: false,
  },
  {
    id: 'rental-income',
    value: 'rental-income',
    isCustom: false,
  },
  {
    id: 'dividends',
    value: 'dividends',
    isCustom: false,
  },
  {
    id: 'digital-product-sales',
    value: 'digital-product-sales',
    isCustom: false,
  },
  {
    id: 'tax-refunds',
    value: 'tax-refunds',
    isCustom: false,
  },
  {
    id: 'government-benefits',
    value: 'government-benefits',
    isCustom: false,
  },
  {
    id: 'custom',
    value: 'Custom',
    isCustom: true,
  },
];

/**
 * Константы категорий расходов
 * label будет добавляться динамически через i18n
 */
export const EXPENSE_CATEGORY_IDS: Omit<ExpenseCategory, 'label'>[] = [
  {
    id: 'kids-school-receipt',
    value: 'kids-school-receipt',
    isCustom: false,
  },
  {
    id: 'food-household',
    value: 'food-household',
    isCustom: false,
  },
  {
    id: 'car',
    value: 'car',
    isCustom: false,
  },
  {
    id: 'personal-pocket-money',
    value: 'personal-pocket-money',
    isCustom: false,
  },
  {
    id: 'parties',
    value: 'parties',
    isCustom: false,
  },
  {
    id: 'internet',
    value: 'internet',
    isCustom: false,
  },
  {
    id: 'electricity',
    value: 'electricity',
    isCustom: false,
  },
  {
    id: 'water',
    value: 'water',
    isCustom: false,
  },
  {
    id: 'kids-hobbies',
    value: 'kids-hobbies',
    isCustom: false,
  },
  {
    id: 'fix-repair',
    value: 'fix-repair',
    isCustom: false,
  },
  {
    id: 'credit',
    value: 'credit',
    isCustom: false,
  },
  {
    id: 'custom',
    value: 'Custom',
    isCustom: true,
  },
];

