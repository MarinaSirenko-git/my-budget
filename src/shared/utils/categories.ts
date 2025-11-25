import type { TFunction } from 'i18next';
import type { IncomeType } from '@/mocks/pages/income.mock';
import type { ExpenseCategory } from '@/mocks/pages/expenses.mock';
import { INCOME_CATEGORY_IDS, EXPENSE_CATEGORY_IDS } from '@/shared/constants/categories';
import { frequencyOptions as INCOME_FREQUENCY_VALUES, type IncomeFrequency } from '@/shared/constants/frequencies';

/**
 * Генерирует массив категорий доходов с переведенными labels
 * @param t - функция перевода из i18next
 * @returns массив категорий доходов с переведенными labels
 */
export function getIncomeCategories(t: TFunction): IncomeType[] {
  return INCOME_CATEGORY_IDS.map((category) => ({
    ...category,
    label: t(`incomeCategories.${category.id}`),
  }));
}

/**
 * Генерирует массив категорий расходов с переведенными labels
 * @param t - функция перевода из i18next
 * @returns массив категорий расходов с переведенными labels
 */
export function getExpenseCategories(t: TFunction): ExpenseCategory[] {
  return EXPENSE_CATEGORY_IDS.map((category) => ({
    ...category,
    label: t(`expenseCategories.${category.id}`),
  }));
}

export interface FrequencyOption {
  label: string;
  value: IncomeFrequency;
}

/**
 * Генерирует массив опций частоты дохода с переведенными labels
 * @param t - функция перевода из i18next
 * @returns массив опций частоты дохода с переведенными labels
 */
export function getIncomeFrequencyOptions(t: TFunction): FrequencyOption[] {
  return INCOME_FREQUENCY_VALUES.map((frequency) => ({
    label: t(`incomeForm.${frequency}`),
    value: frequency,
  }));
}

