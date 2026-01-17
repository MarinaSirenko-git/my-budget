import { supabase } from '@/lib/supabase';

/**
 * Конвертирует сумму из одной валюты в другую через RPC
 * @param amount - Сумма для конвертации
 * @param fromCurrency - Исходная валюта
 * @param toCurrency - Целевая валюта
 * @throws Error если конвертация не удалась
 * @returns Конвертированная сумма
 */
export async function convertCurrency(
  amount: number,
  fromCurrency: string,
  toCurrency: string
): Promise<number> {
  if (fromCurrency === toCurrency) {
    return amount;
  }

  const { data, error } = await supabase.rpc('convert_amount', {
    p_amount: amount,
    p_from_currency: fromCurrency,
    p_to_currency: toCurrency,
  });

  if (error) {
    throw new Error(`Currency conversion failed: ${error.message}`, { cause: error });
  }

  if (Array.isArray(data) && data.length > 0 && data[0]?.converted_amount) {
    return data[0].converted_amount;
  }

  throw new Error('Currency conversion returned invalid data');
}








