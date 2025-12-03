import type { Income } from '@/mocks/pages/income.mock';
import type { CurrencyCode } from '@/shared/constants/currencies';
import { useCurrencyConversionForItems } from './useCurrencyConversionForItems';

interface UseIncomeCurrencyConversionProps {
  incomes: Income[];
  settingsCurrency?: CurrencyCode | null;
  userId?: string;
  scenarioId?: string | null;
}

interface UseIncomeCurrencyConversionReturn {
  selectedConversionCurrency: CurrencyCode | null;
  convertedAmountsCache: Record<string, number>;
  convertingIds: Set<string>;
  isCurrencyManuallySelected: boolean;
  
  // Actions
  handleConversionCurrencyChange: (newCurrency: string) => Promise<void>;
  setSelectedConversionCurrency: (currency: CurrencyCode | null) => void;
  setIsCurrencyManuallySelected: (value: boolean) => void;
}

/**
 * Хук для конвертации валют доходов
 * Использует универсальный useCurrencyConversionForItems
 */
export function useIncomeCurrencyConversion({
  incomes,
  settingsCurrency,
  userId,
  scenarioId,
}: UseIncomeCurrencyConversionProps): UseIncomeCurrencyConversionReturn {
  return useCurrencyConversionForItems<Income>({
    items: incomes,
    settingsCurrency,
    userId,
    scenarioId,
  });
}

