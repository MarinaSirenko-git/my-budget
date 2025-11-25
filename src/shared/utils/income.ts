import { supabase } from '@/lib/supabase';
import type { Income } from '@/mocks/pages/income.mock';
import type { CurrencyCode } from '@/shared/constants/currencies';

export interface UpdateIncomeParams {
  incomeId: string;
  userId: string;
  type: string;
  amount: number;
  currency: CurrencyCode;
  frequency: string;
}

export interface CreateIncomeParams {
  userId: string;
  scenarioId: string | null;
  type: string;
  amount: number;
  currency: CurrencyCode;
  frequency: string;
  settingsCurrency?: CurrencyCode | null;
}

export interface FetchIncomesParams {
  userId: string;
  scenarioId: string | null;
  settingsCurrency?: CurrencyCode | null;
  convertAmount: (amount: number, fromCurrency: string, toCurrency?: string) => Promise<number | null>;
}

/**
 * Обновляет существующий доход
 */
export async function updateIncome(params: UpdateIncomeParams): Promise<void> {
  const { incomeId, userId, type, amount, currency, frequency } = params;

  const { error } = await supabase
    .from('incomes')
    .update({
      type,
      amount,
      currency,
      frequency,
    })
    .eq('id', incomeId)
    .eq('user_id', userId);

  if (error) {
    throw error;
  }
}

/**
 * Создает новый доход
 * Выполняет конвертацию валюты если она отличается от валюты настроек
 */
export async function createIncome(params: CreateIncomeParams): Promise<void> {
  const { userId, scenarioId, type, amount, currency, frequency, settingsCurrency } = params;

  // Вызываем RPC конвертацию если валюта отличается от дефолтной
  if (settingsCurrency && currency !== settingsCurrency) {
    await supabase.rpc('convert_amount', {
      p_amount: amount,
      p_from_currency: currency,
      p_to_currency: settingsCurrency,
    });
  }

  const { error } = await supabase
    .from('incomes')
    .insert({
      type,
      amount,
      currency,
      frequency,
      scenario_id: scenarioId,
    });

  if (error) {
    throw error;
  }
}

/**
 * Получает список доходов с конвертацией валют
 */
export async function fetchIncomes(params: FetchIncomesParams): Promise<Income[]> {
  const { userId, scenarioId, settingsCurrency, convertAmount } = params;

  let query = supabase
    .from('incomes_decrypted')
    .select('*')
    .eq('user_id', userId);

  if (scenarioId) {
    query = query.eq('scenario_id', scenarioId);
  }

  const { data, error } = await query.order('created_at', { ascending: false });

  if (error) {
    throw error;
  }

  if (!data) {
    return [];
  }

  // Map Supabase data to Income interface and convert amounts if needed
  const mappedIncomesPromises = data.map(async (item: any) => {
    const income: Income = {
      id: item.id,
      type: item.type,
      amount: item.amount,
      currency: item.currency,
      frequency: item.frequency || 'monthly',
      date: item.date || item.created_at?.split('T')[0] || new Date().toISOString().split('T')[0],
      createdAt: item.created_at,
    };

    // Конвертируем сумму если валюта отличается от дефолтной
    if (settingsCurrency && income.currency !== settingsCurrency) {
      const convertedAmount = await convertAmount(income.amount, income.currency);
      if (convertedAmount !== null) {
        income.amountInDefaultCurrency = convertedAmount;
      }
    }

    return income;
  });

  return Promise.all(mappedIncomesPromises);
}

export interface DeleteIncomeParams {
  incomeId: string;
  userId: string;
}

/**
 * Удаляет доход
 */
export async function deleteIncome(params: DeleteIncomeParams): Promise<void> {
  const { incomeId, userId } = params;

  const { error } = await supabase
    .from('incomes')
    .delete()
    .eq('id', incomeId)
    .eq('user_id', userId);

  if (error) {
    throw error;
  }
}

