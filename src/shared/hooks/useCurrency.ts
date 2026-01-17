import { useCallback } from 'react';
import { useQueryClient } from '@tanstack/react-query';
import { currencyOptions, DEFAULT_CURRENCY, type CurrencyCode } from '@/shared/constants/currencies';
import { useScenario } from './useScenario';

function validateCurrency(currency: string | null | undefined): CurrencyCode {
  if (!currency) return DEFAULT_CURRENCY;
  const validCurrency = currencyOptions.find(opt => opt.value === currency);
  return validCurrency ? (validCurrency.value as CurrencyCode) : DEFAULT_CURRENCY;
}

export function useCurrency() {
  const queryClient = useQueryClient();
  const { currentScenario, loading } = useScenario();

  const currency = validateCurrency(currentScenario?.baseCurrency);

  const reload = useCallback(() => {
    queryClient.invalidateQueries({ queryKey: ['scenarios', 'current'] });
    queryClient.invalidateQueries({ queryKey: ['profile'] });
  }, [queryClient]);

  return {
    currency,
    loading,
    reload,
  };
}

