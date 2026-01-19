import { supabase } from '@/lib/supabase';
import type { CurrencyCode } from '@/shared/constants/currencies';

export interface Goal {
  id: string;
  name: string;
  amount: number;
  currency: string;
  startDate: string;
  targetDate: string;
  saved?: number;
  monthsLeft?: number;
  amountInDefaultCurrency?: number;
  savedInDefaultCurrency?: number;
  monthlyPayment?: number;
  monthlyPaymentInDefaultCurrency?: number;
}

export interface UpdateGoalParams {
  goalId: string;
  userId: string;
  name: string;
  targetAmount: number;
  currentAmount: number;
  startDate: string;
  targetDate: string;
  currency: CurrencyCode;
}

export interface CreateGoalParams {
  userId: string;
  scenarioId: string | null;
  name: string;
  targetAmount: number;
  currentAmount: number;
  startDate: string;
  targetDate: string;
  currency: CurrencyCode;
}

export interface FetchGoalsParams {
  userId: string;
  scenarioId: string | null;
}

/**
 * Calculates saved amount based on months passed since goal creation
 */
export function calculateSaved(targetAmount: number, targetDate: string, createdAt: string): number {
  const today = new Date();
  today.setHours(0, 0, 0, 0);
  
  const created = new Date(createdAt);
  created.setHours(0, 0, 0, 0);
  
  const target = new Date(targetDate);
  target.setHours(0, 0, 0, 0);
  
  // Calculate months until target date
  const diffTime = target.getTime() - today.getTime();
  if (diffTime <= 0) {
    // If target date is in the past, return full amount
    return targetAmount;
  }
  
  const diffDays = Math.ceil(diffTime / (1000 * 60 * 60 * 24));
  const monthsLeft = Math.max(1, Math.ceil(diffDays / 30.44)); // 30.44 = average days per month
  
  // Calculate monthly contribution
  const monthlyContribution = targetAmount / monthsLeft;
  
  // Calculate months passed since creation
  const monthsPassed = Math.floor((today.getTime() - created.getTime()) / (1000 * 60 * 60 * 24 * 30.44));
  
  // Calculate saved amount: monthly contribution * months passed
  const saved = monthlyContribution * Math.max(0, monthsPassed);
  
  // Don't exceed target amount
  return Math.min(saved, targetAmount);
}

/**
 * Calculates months left until target date
 */
export function calculateMonthsLeft(startDate: string, targetDate: string): number | undefined {
  if (!targetDate) {
    return undefined;
  }
  
  const start = new Date(startDate);
  const target = new Date(targetDate);
  const diffTime = target.getTime() - start.getTime();
  
  if (diffTime > 0) {
    const diffDays = Math.ceil(diffTime / (1000 * 60 * 60 * 24));
    return Math.max(1, Math.ceil(diffDays / 30.44));
  }
  
  return undefined;
}

/**
 * Maps Supabase data to Goal interface
 */
export function mapGoalFromDb(item: any): Goal {
  const startDate = item.start_date || item.startDate;
  const targetAmount = item.target_amount || item.amount || 0;
  const targetDate = item.target_date || item.targetDate;
  const createdAt = item.created_at;
  
  // Calculate saved amount based on months passed
  const saved = (targetDate && createdAt) 
    ? calculateSaved(targetAmount, targetDate, createdAt)
    : 0;
  
  // Calculate months left if not provided
  let monthsLeft = item.months_left;
  if (!monthsLeft && targetDate) {
    monthsLeft = calculateMonthsLeft(startDate,targetDate);
  }
  
  return {
    id: item.id,
    name: item.name,
    amount: targetAmount,
    currency: item.currency,
    startDate: item.start_date,
    targetDate: targetDate,
    saved: saved,
    monthsLeft: monthsLeft,
  };
}

/**
 * Fetches goals from Supabase
 */
export async function fetchGoals(params: FetchGoalsParams): Promise<Goal[]> {
  const { scenarioId } = params;

  let query = supabase
    .from('goals')
    .select('*')
  
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

  return data.map(mapGoalFromDb);
}

/**
 * Creates a new goal
 */
export async function createGoal(params: CreateGoalParams): Promise<void> {
  const { userId, scenarioId, name, targetAmount, currentAmount, startDate, targetDate, currency } = params;

  const { error } = await supabase
    .from('goals')
    .insert({
      user_id: userId,
      name: name.trim(),
      target_amount: targetAmount,
      current_amount: currentAmount,
      start_date: startDate,
      target_date: targetDate,
      currency: currency,
      scenario_id: scenarioId,
    });

  if (error) {
    throw error;
  }
}

/**
 * Updates an existing goal
 */
export async function updateGoal(params: UpdateGoalParams): Promise<void> {
  const { goalId, name, targetAmount, currentAmount, startDate, targetDate, currency } = params;

  const { error } = await supabase
    .from('goals')
    .update({
      name: name.trim(),
      target_amount: targetAmount,
      current_amount: currentAmount,
      start_date: startDate,
      target_date: targetDate,
      currency: currency,
    })
    .eq('id', goalId)

  if (error) {
    throw error;
  }
}

/**
 * Deletes a goal
 */
export async function deleteGoal(goalId: string): Promise<void> {
  const { error } = await supabase
    .from('goals')
    .delete()
    .eq('id', goalId)

  if (error) {
    throw error;
  }
}

