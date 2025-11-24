import { useState, useEffect, useCallback } from 'react';
import { supabase } from '@/lib/supabase';
import { useAuth } from '@/shared/store/auth';
import { currencyOptions, type CurrencyCode } from '@/shared/constants/currencies';

const CURRENCY_STORAGE_KEY = 'user_currency';
const DEFAULT_CURRENCY: CurrencyCode = 'USD';

/**
 * Валидирует код валюты
 */
function validateCurrency(currency: string | null): CurrencyCode | null {
  if (!currency) return null;
  const validCurrency = currencyOptions.find(opt => opt.value === currency);
  return validCurrency ? (validCurrency.value as CurrencyCode) : null;
}

/**
 * Хук для работы с валютой пользователя
 * Загружает валюту из scenarios.base_currency с fallback на localStorage
 */
export function useCurrency() {
  const { user, currentScenarioId } = useAuth();
  const [currency, setCurrency] = useState<CurrencyCode | null>(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<Error | null>(null);

  // Загрузка валюты из базы данных или localStorage
  const loadCurrency = useCallback(async () => {
    setLoading(true);
    setError(null);

    try {
      if (!user) {
        // Fallback to localStorage if no user
        const savedCurrency = localStorage.getItem(CURRENCY_STORAGE_KEY);
        const validatedCurrency = validateCurrency(savedCurrency);
        setCurrency(validatedCurrency || DEFAULT_CURRENCY);
        setLoading(false);
        return;
      }

      if (!currentScenarioId) {
        // Если сценарий еще не загружен, используем localStorage
        const savedCurrency = localStorage.getItem(CURRENCY_STORAGE_KEY);
        const validatedCurrency = validateCurrency(savedCurrency);
        setCurrency(validatedCurrency || DEFAULT_CURRENCY);
        setLoading(false);
        return;
      }

      // Загружаем валюту из текущего сценария
      const { data, error: dbError } = await supabase
        .from('scenarios')
        .select('base_currency')
        .eq('id', currentScenarioId)
        .eq('user_id', user.id)
        .single();

      if (dbError && dbError.code !== 'PGRST116') {
        // PGRST116 = no rows returned (acceptable)
        console.error('Error loading currency from scenarios:', dbError);
        // Fallback to localStorage on error
        const savedCurrency = localStorage.getItem(CURRENCY_STORAGE_KEY);
        const validatedCurrency = validateCurrency(savedCurrency);
        setCurrency(validatedCurrency || DEFAULT_CURRENCY);
      } else if (data?.base_currency) {
        const validatedCurrency = validateCurrency(data.base_currency);
        setCurrency(validatedCurrency || DEFAULT_CURRENCY);
        // Синхронизируем с localStorage
        if (validatedCurrency) {
          localStorage.setItem(CURRENCY_STORAGE_KEY, validatedCurrency);
        }
      } else {
        // No currency in database, try localStorage
        const savedCurrency = localStorage.getItem(CURRENCY_STORAGE_KEY);
        const validatedCurrency = validateCurrency(savedCurrency);
        setCurrency(validatedCurrency || DEFAULT_CURRENCY);
      }
    } catch (err) {
      console.error('Error loading currency:', err);
      setError(err instanceof Error ? err : new Error('Unknown error'));
      // Fallback to localStorage
      const savedCurrency = localStorage.getItem(CURRENCY_STORAGE_KEY);
      const validatedCurrency = validateCurrency(savedCurrency);
      setCurrency(validatedCurrency || DEFAULT_CURRENCY);
    } finally {
      setLoading(false);
    }
  }, [user, currentScenarioId]);

  // Инициализация при монтировании
  useEffect(() => {
    loadCurrency();

    // Listen for currency changes in localStorage (cross-tab)
    const handleStorageChange = (e: StorageEvent) => {
      if (e.key === CURRENCY_STORAGE_KEY && e.newValue) {
        const validatedCurrency = validateCurrency(e.newValue);
        if (validatedCurrency) {
          setCurrency(validatedCurrency);
        }
      }
    };

    // Listen for custom event (same-tab)
    const handleCustomStorageChange = () => {
      const savedCurrency = localStorage.getItem(CURRENCY_STORAGE_KEY);
      const validatedCurrency = validateCurrency(savedCurrency);
      if (validatedCurrency) {
        setCurrency(validatedCurrency);
      }
    };

    window.addEventListener('storage', handleStorageChange);
    window.addEventListener('currencyChanged', handleCustomStorageChange);

    return () => {
      window.removeEventListener('storage', handleStorageChange);
      window.removeEventListener('currencyChanged', handleCustomStorageChange);
    };
  }, [loadCurrency]);

  return {
    currency: currency || DEFAULT_CURRENCY,
    loading,
    error,
    reload: loadCurrency,
  };
}

