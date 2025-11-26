// Centralized source of the base currency from DB for the current scenario
// Subscribes to currencyChanged event to reload currency from DB when settings are updated

import { useState, useEffect, useCallback } from 'react';
import { supabase } from '@/lib/supabase';
import { useAuth } from '@/shared/store/auth';
import { currencyOptions, DEFAULT_CURRENCY, type CurrencyCode } from '@/shared/constants/currencies';
import { reportErrorToTelegram } from '@/shared/utils/errorReporting';


function validateCurrency(currency: string | null): CurrencyCode | null {
  if (!currency) return null;
  const validCurrency = currencyOptions.find(opt => opt.value === currency);
  return validCurrency ? (validCurrency.value as CurrencyCode) : null;
}


export function useCurrency() {
  const { user, currentScenarioId } = useAuth();
  const [currency, setCurrency] = useState<CurrencyCode | null>(null);
  const [loading, setLoading] = useState(true);

  const loadCurrency = useCallback(async (userId: string) => {
    setLoading(true);

    try {
      const { data, error: dbError } = await supabase
        .from('scenarios')
        .select('base_currency')
        .eq('id', currentScenarioId)
        .eq('user_id', userId)
        .single();

      if (dbError && dbError.code !== 'PGRST116') {
        await reportErrorToTelegram({
          action: 'loadCurrency',
          error: dbError,
          userId,
          context: { scenarioId: currentScenarioId, errorCode: dbError.code },
        });
        setCurrency(DEFAULT_CURRENCY);
        throw dbError;
      } else if (data?.base_currency) {
        const validatedCurrency = validateCurrency(data.base_currency);
        setCurrency(validatedCurrency || DEFAULT_CURRENCY);
      } else {
        setCurrency(DEFAULT_CURRENCY);
      }
    } catch (err) {
      await reportErrorToTelegram({
        action: 'loadCurrency',
        error: err,
        userId,
        context: { scenarioId: currentScenarioId },
      });
      setCurrency(DEFAULT_CURRENCY);
    } finally {
      setLoading(false);
    }
  }, [currentScenarioId]);


  useEffect(() => {
    if (user?.id) {
      loadCurrency(user.id);
    }

    const handleCurrencyChanged = () => {
      if (user?.id) {
        loadCurrency(user.id);
      }
    };

    window.addEventListener('currencyChanged', handleCurrencyChanged);

    return () => {
      window.removeEventListener('currencyChanged', handleCurrencyChanged);
    };
  }, [user?.id, loadCurrency]);

  const reload = useCallback(() => {
    if (user?.id) {
      loadCurrency(user.id);
    }
  }, [user?.id, loadCurrency]);

  return {
    currency,
    loading,
    reload,
  };
}

