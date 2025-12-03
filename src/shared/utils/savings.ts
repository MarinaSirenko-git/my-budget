import { supabase } from '@/lib/supabase';
import type { CurrencyCode } from '@/shared/constants/currencies';

export interface Saving {
  id: string;
  comment: string;
  amount: number;
  currency: string;
  createdAt: string;
  amountInDefaultCurrency?: number;
}

export interface UpdateSavingParams {
  savingId: string;
  userId: string;
  comment: string;
  amount: number;
  currency: CurrencyCode;
}

export interface CreateSavingParams {
  userId: string;
  scenarioId: string | null;
  comment: string;
  amount: number;
  currency: CurrencyCode;
}

export interface FetchSavingsParams {
  userId: string;
  scenarioId: string | null;
  settingsCurrency?: CurrencyCode | null;
  convertAmount: (amount: number, fromCurrency: string, toCurrency?: string) => Promise<number | null>;
}

export async function updateSaving(params: UpdateSavingParams): Promise<void> {
  const { savingId, userId, comment, amount, currency } = params;

  const { error } = await supabase
    .from('savings')
    .update({
      comment,
      amount,
      currency,
    })
    .eq('id', savingId)
    .eq('user_id', userId);

  if (error) {
    throw error;
  }
}

export async function createSaving(params: CreateSavingParams): Promise<void> {
  const { scenarioId, comment, amount, currency } = params;

  const { error } = await supabase
    .from('savings')
    .insert({
      comment,
      amount,
      currency,
      scenario_id: scenarioId,
    });

  if (error) {
    throw error;
  }
}

export async function fetchSavings(params: FetchSavingsParams): Promise<Saving[]> {
  const { userId, scenarioId, settingsCurrency, convertAmount } = params;

  let query = supabase
    .from('savings_decrypted')
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

  const mappedSavingsPromises = data.map(async (item: any) => {
    const saving: Saving = {
      id: item.id,
      comment: item.comment || '',
      amount: item.amount || 0,
      currency: item.currency,
      createdAt: item.created_at,
    };

  if (settingsCurrency && saving.currency !== settingsCurrency) {
    const convertedAmount = await convertAmount(saving.amount, saving.currency);
    if (convertedAmount !== null) {
      saving.amountInDefaultCurrency = convertedAmount;
}
 }

   return saving;
  });

  return Promise.all(mappedSavingsPromises);
}

export interface DeleteSavingParams {
  savingId: string;
  userId: string;
}

export async function deleteSaving(params: DeleteSavingParams): Promise<void> {
  const { savingId, userId } = params;

  const { error } = await supabase
    .from('savings')
    .delete()
    .eq('id', savingId)
    .eq('user_id', userId);

  if (error) {
    throw error;
  }
}

