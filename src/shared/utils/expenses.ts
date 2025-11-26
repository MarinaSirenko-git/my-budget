import { supabase } from '@/lib/supabase';
import type { Expense } from '@/mocks/pages/expenses.mock';
import type { CurrencyCode } from '@/shared/constants/currencies';

export interface UpdateExpenseParams {
  expenseId: string;
  userId: string;
  type: string;
  amount: number;
  currency: CurrencyCode;
  frequency: Expense['frequency'];
}

export interface CreateExpenseParams {
  userId: string;
  scenarioId: string | null;
  type: string;
  amount: number;
  currency: CurrencyCode;
  frequency: Expense['frequency'];
  settingsCurrency?: CurrencyCode | null;
}

export interface FetchExpensesParams {
  userId: string;
  scenarioId: string | null;
  settingsCurrency?: CurrencyCode | null;
  convertAmount: (amount: number, fromCurrency: string, toCurrency?: string) => Promise<number | null>;
}

/**
 * Обновляет существующий расход
 */
export async function updateExpense(params: UpdateExpenseParams): Promise<void> {
  const { expenseId, userId, type, amount, currency, frequency } = params;

  const { error } = await supabase
    .from('expenses')
    .update({
      type,
      amount,
      currency,
      frequency,
    })
    .eq('id', expenseId)
    .eq('user_id', userId);

  if (error) {
    throw error;
  }
}

/**
 * Создает новый расход
 * Выполняет конвертацию валюты если она отличается от валюты настроек
 */
export async function createExpense(params: CreateExpenseParams): Promise<void> {
  const { userId, scenarioId, type, amount, currency, frequency, settingsCurrency } = params;

  if (settingsCurrency && currency !== settingsCurrency) {
    await supabase.rpc('convert_amount', {
      p_amount: amount,
      p_from_currency: currency,
      p_to_currency: settingsCurrency,
    });
  }

  const { error } = await supabase
    .from('expenses')
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
 * Получает список расходов с конвертацией валют
 */
export async function fetchExpenses(params: FetchExpensesParams): Promise<Expense[]> {
  const { userId, scenarioId, settingsCurrency, convertAmount } = params;

  let query = supabase
    .from('expenses_decrypted')
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

  const mappedExpensesPromises = data.map(async (item: any) => {
    const expense: Expense = {
      id: item.id,
      type: item.type,
      category: item.type,
      amount: item.amount,
      currency: item.currency,
      frequency: item.frequency || 'monthly',
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
  userId: string;
}

/**
 * Удаляет расход
 */
export async function deleteExpense(params: DeleteExpenseParams): Promise<void> {
  const { expenseId, userId } = params;

  const { error } = await supabase
    .from('expenses')
    .delete()
    .eq('id', expenseId)
    .eq('user_id', userId);

  if (error) {
    throw error;
  }
}


