import { useCallback } from 'react';
import { supabase } from '@/lib/supabase';
import { useCurrency } from './useCurrency';
import { reportErrorToTelegram } from '@/shared/utils/errorReporting';
import { convertCurrency } from '@/shared/utils/currencyConversion';

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
      return await convertCurrency(amount, fromCurrency, targetCurrency);
    } catch (err) {
      await reportErrorToTelegram({
        action: 'convertAmount',
        error: err,
        context: {
          fromCurrency,
          toCurrency: targetCurrency,
          amount,
        },
      });
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
        await reportErrorToTelegram({
          action: 'convertAmountsBulk',
          error: error,
          context: {
            toCurrency: targetCurrency,
            itemsCount: items.length,
            errorCode: error.code,
          },
        });
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
      await reportErrorToTelegram({
        action: 'convertAmountsBulk',
        error: err,
        context: {
          toCurrency: targetCurrency,
          itemsCount: items.length,
        },
      });
      return null;
    }
  }, [settingsCurrency]);

  return { convertAmount, convertAmountsBulk };
}

