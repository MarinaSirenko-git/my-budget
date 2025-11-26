import type { Expense } from '@/mocks/pages/expenses.mock';
import type { CurrencyCode } from '@/shared/constants/currencies';
import { useCurrencyConversionForItems } from './useCurrencyConversionForItems';

interface UseExpenseCurrencyConversionProps {
  expenses: Expense[];
  settingsCurrency?: CurrencyCode | null;
  userId?: string;
}

interface UseExpenseCurrencyConversionReturn {
  selectedConversionCurrency: CurrencyCode | null;
  convertedAmountsCache: Record<string, number>;
  convertingIds: Set<string>;
  isCurrencyManuallySelected: boolean;

  handleConversionCurrencyChange: (newCurrency: string) => Promise<void>;
  setSelectedConversionCurrency: (currency: CurrencyCode | null) => void;
  setIsCurrencyManuallySelected: (value: boolean) => void;
}

export function useExpenseCurrencyConversion({
  expenses,
  settingsCurrency,
  userId,
}: UseExpenseCurrencyConversionProps): UseExpenseCurrencyConversionReturn {
  return useCurrencyConversionForItems<Expense>({
    items: expenses,
    settingsCurrency,
    userId,
  });
}


