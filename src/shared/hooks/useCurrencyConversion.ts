import { useCallback } from 'react';
import { supabase } from '@/lib/supabase';
import { useCurrency } from './useCurrency';

/**
 * Хук для конвертации валют
 * Предоставляет функции для конвертации одной суммы и множества сумм
 */
export function useCurrencyConversion() {
  const { currency: settingsCurrency } = useCurrency();

  const convertAmount = useCallback(async (
    amount: number,
    fromCurrency: string,
    toCurrency?: string
  ): Promise<number | null> => {
    const targetCurrency = toCurrency || settingsCurrency;
    if (!targetCurrency || fromCurrency === targetCurrency) {
      return null;
    }

    try {
      const { data, error } = await supabase.rpc('convert_amount', {
        p_amount: amount,
        p_from_currency: fromCurrency,
        p_to_currency: targetCurrency,
      });

      if (error) {
        console.error('Error converting amount:', error);
        return null;
      }

      if (Array.isArray(data) && data.length > 0 && data[0]?.converted_amount) {
        return data[0].converted_amount;
      }

      return null;
    } catch (err) {
      console.error('Error calling convert_amount RPC:', err);
      return null;
    }
  }, [settingsCurrency]);

  const convertAmountsBulk = useCallback(async (
    items: Array<{ amount: number; currency: string }>,
    toCurrency?: string
  ): Promise<Map<number, number> | null> => {
    const targetCurrency = toCurrency || settingsCurrency;
    if (!targetCurrency || items.length === 0) {
      return null;
    }

    try {
      const { data, error } = await supabase.rpc('convert_amount_bulk', {
        p_items: items,
        p_to_currency: targetCurrency,
      });

      if (error) {
        console.error('Error converting amounts bulk:', error);
        return null;
      }

      const resultMap = new Map<number, number>();
      
      if (Array.isArray(data)) {
        data.forEach((item: any, index: number) => {
          if (item.converted_amount !== undefined && items[index]) {
            resultMap.set(index, item.converted_amount);
          }
        });
      }

      return resultMap;
    } catch (err) {
      console.error('Error calling convert_amount_bulk RPC:', err);
      return null;
    }
  }, [settingsCurrency]);

  return { convertAmount, convertAmountsBulk };
}

