import { supabase } from '@/lib/supabase';
import type { Expense } from '@/mocks/pages/expenses.mock';
import type { CurrencyCode } from '@/shared/constants/currencies';

export interface UpdateExpenseParams {
  expenseId: string;
  type: string;
  amount: number;
  currency: CurrencyCode;
  frequency: Expense['frequency'];
}

export interface CreateExpenseParams {
  scenarioId: string | null;
  type: string;
  amount: number;
  currency: CurrencyCode;
  frequency: Expense['frequency'];
  settingsCurrency?: CurrencyCode | null;
}

export interface FetchExpensesParams {
  scenarioId: string | null;
  settingsCurrency?: CurrencyCode | null;
  convertAmount: (amount: number, fromCurrency: string, toCurrency?: string) => Promise<number | null>;
}

export async function updateExpense(params: UpdateExpenseParams): Promise<void> {
  const { expenseId, type, amount, currency, frequency } = params;

  // Map 'annual' to 'yearly' for database constraint
  const dbFrequency = frequency === 'annual' ? 'yearly' : frequency;

  const { error } = await supabase
    .from('expenses')
    .update({
      type,
      amount,
      currency,
      frequency: dbFrequency,
    })
    .eq('id', expenseId);

  if (error) {
    throw error;
  }
}

export async function createExpense(params: CreateExpenseParams): Promise<void> {
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
    .from('expenses')
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

export async function fetchExpenses(params: FetchExpensesParams): Promise<Expense[]> {
  const { scenarioId, settingsCurrency, convertAmount } = params;
  const { data, error } = await supabase
    .from('expenses')
    .select('id, created_at, amount, currency, type, frequency, scenario_id')
    .eq('scenario_id', scenarioId)
    .order('created_at', { ascending: false })
    .order('id', { ascending: false });

  if (error) throw error;
  if (!data) return [];

  const mappedExpensesPromises = data.map(async (item: any) => {
    // Map 'yearly' back to 'annual' for frontend consistency
    const frontendFrequency = item.frequency === 'yearly' ? 'annual' : (item.frequency || 'monthly');
    
    const expense: Expense = {
      id: item.id,
      type: item.type,
      category: item.type,
      amount: item.amount,
      currency: item.currency,
      frequency: frontendFrequency as 'monthly' | 'annual',
      date: item.created_at?.split('T')[0] || new Date().toISOString().split('T')[0],
      createdAt: item.created_at,
    };

    if (settingsCurrency && expense.currency !== settingsCurrency) {
      const convertedAmount = await convertAmount(expense.amount, expense.currency);
      if (convertedAmount !== null) {
        expense.amountInDefaultCurrency = convertedAmount;
      }
    }

    return expense;
  });

  return Promise.all(mappedExpensesPromises);
}

export interface DeleteExpenseParams {
  expenseId: string;
}

export async function deleteExpense(params: DeleteExpenseParams): Promise<void> {
  const { expenseId } = params;

  const { error } = await supabase
    .from('expenses')
    .delete()
    .eq('id', expenseId);

  if (error) {
    throw error;
  }
}



