import { supabase } from '@/lib/supabase';
import type { Income } from '@/mocks/pages/income.mock';
import type { CurrencyCode } from '@/shared/constants/currencies';

export interface UpdateIncomeParams {
  incomeId: string;
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
  scenarioId: string | null;
  settingsCurrency?: CurrencyCode | null;
  convertAmount: (amount: number, fromCurrency: string, toCurrency?: string) => Promise<number | null>;
}

export async function updateIncome(params: UpdateIncomeParams): Promise<void> {
  const { incomeId, type, amount, currency, frequency } = params;

  // Map 'annual' to 'yearly' for database constraint
  const dbFrequency = frequency === 'annual' ? 'yearly' : frequency;

  const { error } = await supabase
    .from('incomes')
    .update({
      type,
      amount,
      currency,
      frequency: dbFrequency,
    })
    .eq('id', incomeId)

  if (error) {
    throw error;
  }
}

export async function createIncome(params: CreateIncomeParams): Promise<void> {
  const { scenarioId, type, amount, currency, frequency, settingsCurrency } = params;

  if (settingsCurrency && currency !== settingsCurrency) {
    await supabase.rpc('convert_amount', {
      p_amount: amount,
      p_from_currency: currency,
      p_to_currency: settingsCurrency,
    });
  }

  // Map 'annual' to 'yearly' for database constraint
  const dbFrequency = frequency === 'annual' ? 'yearly' : frequency;

  const { error } = await supabase
    .from('incomes')
    .insert({
      type,
      amount,
      currency,
      frequency: dbFrequency,
      scenario_id: scenarioId,
    });

  if (error) {
    throw error;
  }
}

export async function fetchIncomes(params: FetchIncomesParams): Promise<Income[]> {
  const { scenarioId, settingsCurrency, convertAmount } = params;
  const { data, error } = await supabase
  .from('incomes')
  .select('id, created_at, amount, currency, type, frequency, payment_day, scenario_id')
  .eq('scenario_id', scenarioId)
  .order('created_at', { ascending: false })
  .order('id', { ascending: false });

  if (error) throw error;
  if (!data) return [];

  const mappedIncomesPromises = data.map(async (item: any) => {
    // Map 'yearly' back to 'annual' for frontend consistency
    const frontendFrequency = item.frequency === 'yearly' ? 'annual' : (item.frequency || 'monthly');
    
    const income: Income = {
      id: item.id,
      type: item.type,
      amount: item.amount,
      currency: item.currency,
      frequency: frontendFrequency as 'monthly' | 'annual',
      date: item.date || item.created_at?.split('T')[0] || new Date().toISOString().split('T')[0],
      createdAt: item.created_at,
    };

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
}

export async function deleteIncome(params: DeleteIncomeParams): Promise<void> {
  const { incomeId } = params;

  const { error } = await supabase
    .from('incomes')
    .delete()
    .eq('id', incomeId)

  if (error) {
    throw error;
  }
}

