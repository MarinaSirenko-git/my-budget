import type { TFunction } from 'i18next';
import type { IncomeType } from '@/shared/constants/categories';
import type { ExpenseCategory } from '@/mocks/pages/expenses.mock';
import { INCOME_CATEGORY_IDS, EXPENSE_CATEGORY_IDS } from '@/shared/constants/categories';
import { frequencyOptions as INCOME_FREQUENCY_VALUES, type IncomeFrequency } from '@/shared/constants/frequencies';
import { languageValues, type LanguageCode } from '@/shared/constants/languages';

export function getIncomeCategories(t: TFunction): IncomeType[] {
  return INCOME_CATEGORY_IDS.map((category) => ({
    ...category,
    label: t(`incomeCategories.${category.id}`),
  }));
}

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

export function getIncomeFrequencyOptions(t: TFunction): FrequencyOption[] {
  return INCOME_FREQUENCY_VALUES.map((frequency) => ({
    label: t(`incomeForm.${frequency}`),
    value: frequency,
  }));
}

export interface LanguageOption {
  label: string;
  value: LanguageCode;
}

export function getLanguageOptions(t: TFunction): LanguageOption[] {
  return languageValues.map((lang) => ({
    label: t(`settingsForm.${lang === 'ru' ? 'russian' : 'english'}`),
    value: lang,
  }));
}

