import { supabase } from '@/lib/supabase';
import { getIncomeCategories } from './categories';
import { convertCurrency } from './currencyConversion';
import { reportErrorToTelegram } from './errorReporting';
import type { TFunction } from 'i18next';

interface IncomeData {
  amount: number;
  type: string;
  frequency: 'monthly' | 'annual';
  currency: string;
}

interface ExpenseData {
  amount: number;
  type: string;
  frequency: 'monthly' | 'annual' | 'one-time';
  currency: string;
}

interface SavingData {
  amount: number;
  comment: string;
  currency: string;
}

interface GoalData {
  target_amount: number;
  name: string;
  currency: string;
}

interface ExportData {
  incomes: IncomeData[];
  savings: SavingData[];
  goals: GoalData[];
  expenses: ExpenseData[];
  defaultCurrency: string;
  userId: string;
}

async function convertToDefaultCurrency(
  amount: number,
  fromCurrency: string,
  defaultCurrency: string,
  userId?: string
): Promise<number | null> {
  try {
    return await convertCurrency(amount, fromCurrency, defaultCurrency);
  } catch (err) {
    await reportErrorToTelegram({
      action: 'convertToDefaultCurrency',
      error: err,
      userId: userId,
      context: {
        amount,
        fromCurrency,
        defaultCurrency,
      },
    });
    return null;
  }
}

export async function loadExportData(
  userId: string,
  scenarioId: string,
  defaultCurrency: string
): Promise<ExportData | null> {
  try {
    const { data: incomesData, error: incomesError } = await supabase
      .from('incomes_decrypted')
      .select('amount, type, frequency, currency')
      .eq('user_id', userId)
      .eq('scenario_id', scenarioId)
      .order('created_at', { ascending: false });

    if (incomesError) {
      await reportErrorToTelegram({
        action: 'loadExportDataIncomes',
        error: incomesError,
        userId: userId,
        context: { scenarioId, errorCode: incomesError.code },
      });
      return null;
    }

    const { data: expensesData, error: expensesError } = await supabase
      .from('expenses_decrypted')
      .select('amount, type, frequency, currency')
      .eq('user_id', userId)
      .eq('scenario_id', scenarioId)
      .order('created_at', { ascending: false });

    if (expensesError) {
      await reportErrorToTelegram({
        action: 'loadExportDataExpenses',
        error: expensesError,
        userId: userId,
        context: { scenarioId, errorCode: expensesError.code },
      });
      return null;
    }

    const { data: savingsData, error: savingsError } = await supabase
      .from('savings_decrypted')
      .select('amount, comment, currency')
      .eq('user_id', userId)
      .eq('scenario_id', scenarioId)
      .order('created_at', { ascending: false });

    if (savingsError) {
      await reportErrorToTelegram({
        action: 'loadExportDataSavings',
        error: savingsError,
        userId: userId,
        context: { scenarioId, errorCode: savingsError.code },
      });
      return null;
    }

    const { data: goalsData, error: goalsError } = await supabase
      .from('goals_decrypted')
      .select('target_amount, name, currency')
      .eq('user_id', userId)
      .eq('scenario_id', scenarioId)
      .order('created_at', { ascending: false });

    if (goalsError) {
      await reportErrorToTelegram({
        action: 'loadExportDataGoals',
        error: goalsError,
        userId: userId,
        context: { scenarioId, errorCode: goalsError.code },
      });
      return null;
    }

    return {
      incomes: (incomesData || []) as IncomeData[],
      savings: (savingsData || []) as SavingData[],
      goals: (goalsData || []) as GoalData[],
      expenses: (expensesData || []) as ExpenseData[],
      defaultCurrency,
      userId,
    };
  } catch (err) {
    await reportErrorToTelegram({
      action: 'loadExportData',
      error: err,
      userId: userId,
      context: { scenarioId },
    });
    return null;
  }
}

async function calculateTotals(
  data: ExportData
): Promise<{
  incomeMonthly: { original: number; converted: number };
  incomeYearly: { original: number; converted: number };
  savingsTotal: { original: number; converted: number };
  goalsTotal: { original: number; converted: number };
  expenseMonthly: { original: number; converted: number };
  expenseYearly: { original: number; converted: number };
}> {
  const incomeByCurrency: Record<string, { monthly: number; yearly: number }> = {};
  const expenseByCurrency: Record<string, { monthly: number; yearly: number }> = {};
  const savingsByCurrency: Record<string, number> = {};
  const goalsByCurrency: Record<string, number> = {};

  for (const income of data.incomes) {
    if (!incomeByCurrency[income.currency]) {
      incomeByCurrency[income.currency] = { monthly: 0, yearly: 0 };
    }
    if (income.frequency === 'monthly') {
      incomeByCurrency[income.currency].monthly += income.amount;
      incomeByCurrency[income.currency].yearly += income.amount * 12;
    } else if (income.frequency === 'annual') {
      incomeByCurrency[income.currency].monthly += income.amount / 12;
      incomeByCurrency[income.currency].yearly += income.amount;
    }
  }

  for (const expense of data.expenses) {
    if (!expenseByCurrency[expense.currency]) {
      expenseByCurrency[expense.currency] = { monthly: 0, yearly: 0 };
    }
    if (expense.frequency === 'monthly') {
      expenseByCurrency[expense.currency].monthly += expense.amount;
      expenseByCurrency[expense.currency].yearly += expense.amount * 12;
    } else if (expense.frequency === 'annual') {
      expenseByCurrency[expense.currency].monthly += expense.amount / 12;
      expenseByCurrency[expense.currency].yearly += expense.amount;
    } else if (expense.frequency === 'one-time') {
      expenseByCurrency[expense.currency].monthly += expense.amount / 12;
      expenseByCurrency[expense.currency].yearly += expense.amount;
    }
  }

  for (const saving of data.savings) {
    if (!savingsByCurrency[saving.currency]) {
      savingsByCurrency[saving.currency] = 0;
    }
    savingsByCurrency[saving.currency] += saving.amount;
  }

  for (const goal of data.goals) {
    if (!goalsByCurrency[goal.currency]) {
      goalsByCurrency[goal.currency] = 0;
    }
    goalsByCurrency[goal.currency] += goal.target_amount;
  }

  let incomeMonthlyConverted = 0;
  let incomeYearlyConverted = 0;
  let expenseMonthlyConverted = 0;
  let expenseYearlyConverted = 0;
  let savingsTotalConverted = 0;
  let goalsTotalConverted = 0;

  for (const [currency, amounts] of Object.entries(incomeByCurrency)) {
    const monthlyConverted = await convertToDefaultCurrency(amounts.monthly, currency, data.defaultCurrency, data.userId);
    const yearlyConverted = await convertToDefaultCurrency(amounts.yearly, currency, data.defaultCurrency, data.userId);
    incomeMonthlyConverted += monthlyConverted || 0;
    incomeYearlyConverted += yearlyConverted || 0;
  }

  for (const [currency, amounts] of Object.entries(expenseByCurrency)) {
    const monthlyConverted = await convertToDefaultCurrency(amounts.monthly, currency, data.defaultCurrency, data.userId);
    const yearlyConverted = await convertToDefaultCurrency(amounts.yearly, currency, data.defaultCurrency, data.userId);
    expenseMonthlyConverted += monthlyConverted || 0;
    expenseYearlyConverted += yearlyConverted || 0;
  }

  for (const [currency, amount] of Object.entries(savingsByCurrency)) {
    const converted = await convertToDefaultCurrency(amount, currency, data.defaultCurrency, data.userId);
    savingsTotalConverted += converted || 0;
  }

  for (const [currency, targetAmount] of Object.entries(goalsByCurrency)) {
    const converted = await convertToDefaultCurrency(targetAmount, currency, data.defaultCurrency, data.userId);
    goalsTotalConverted += converted || 0;
  }

  const incomeMonthlyOriginal = Object.values(incomeByCurrency).reduce((sum, amounts) => sum + amounts.monthly, 0);
  const incomeYearlyOriginal = Object.values(incomeByCurrency).reduce((sum, amounts) => sum + amounts.yearly, 0);
  const expenseMonthlyOriginal = Object.values(expenseByCurrency).reduce((sum, amounts) => sum + amounts.monthly, 0);
  const expenseYearlyOriginal = Object.values(expenseByCurrency).reduce((sum, amounts) => sum + amounts.yearly, 0);
  const savingsTotalOriginal = Object.values(savingsByCurrency).reduce((sum, amount) => sum + amount, 0);
  const goalsTotalOriginal = Object.values(goalsByCurrency).reduce((sum, amount) => sum + amount, 0);

  return {
    incomeMonthly: { original: incomeMonthlyOriginal, converted: incomeMonthlyConverted },
    incomeYearly: { original: incomeYearlyOriginal, converted: incomeYearlyConverted },
    expenseMonthly: { original: expenseMonthlyOriginal, converted: expenseMonthlyConverted },
    expenseYearly: { original: expenseYearlyOriginal, converted: expenseYearlyConverted },
    savingsTotal: { original: savingsTotalOriginal, converted: savingsTotalConverted },
    goalsTotal: { original: goalsTotalOriginal, converted: goalsTotalConverted },
  };
}

export async function generateCSV(
  data: ExportData,
  t: TFunction
): Promise<string> {
  const lines: string[] = [];

  const incomeCategories = getIncomeCategories(t);

  lines.push('Доходы');
  lines.push('Сумма,Источник,Частота,Валюта,Сумма в дефолтной валюте');

  for (const income of data.incomes) {
    const category = incomeCategories.find(cat => cat.id === income.type);
    const source = category ? category.label : income.type;
    const frequency = income.frequency === 'monthly' ? t('incomeForm.monthly') : t('incomeForm.annual');
    const converted = await convertToDefaultCurrency(income.amount, income.currency, data.defaultCurrency, data.userId);
    const convertedStr = converted !== null ? converted.toFixed(2) : '';
    lines.push(`${income.amount},${source},${frequency},${income.currency},${convertedStr}`);
  }

  lines.push('');

  lines.push('Расходы');
  lines.push('Сумма,Источник,Частота,Валюта,Сумма в дефолтной валюте');

  for (const expense of data.expenses) {
    const source = expense.type;
    let frequency = '';
    if (expense.frequency === 'monthly') {
      frequency = t('expensesForm.monthly');
    } else if (expense.frequency === 'annual') {
      frequency = t('expensesForm.annual');
    } else if (expense.frequency === 'one-time') {
      frequency = t('expensesForm.oneTime');
    }
    const converted = await convertToDefaultCurrency(expense.amount, expense.currency, data.defaultCurrency, data.userId);
    const convertedStr = converted !== null ? converted.toFixed(2) : '';
    lines.push(`${expense.amount},${source},${frequency},${expense.currency},${convertedStr}`);
  }

  lines.push('');

  lines.push('Накопления');
  lines.push('Сумма,Комментарий,Валюта,Сумма в дефолтной валюте');

  for (const saving of data.savings) {
    const converted = await convertToDefaultCurrency(saving.amount, saving.currency, data.defaultCurrency, data.userId);
    const convertedStr = converted !== null ? converted.toFixed(2) : '';
    // Экранируем запятые в комментарии
    const comment = saving.comment.replace(/,/g, ';');
    lines.push(`${saving.amount},${comment},${saving.currency},${convertedStr}`);
  }

  lines.push('');

  lines.push('Цели');
  lines.push('Сумма,Категория,Валюта,Сумма в дефолтной валюте');

  for (const goal of data.goals) {
    const converted = await convertToDefaultCurrency(goal.target_amount, goal.currency, data.defaultCurrency, data.userId);
    const convertedStr = converted !== null ? converted.toFixed(2) : '';
    lines.push(`${goal.target_amount},${goal.name},${goal.currency},${convertedStr}`);
  }

  lines.push('');

  lines.push('Итоги');
  lines.push('Период,Тип,Сумма в валюте ввода,Валюта ввода,Сумма в дефолтной валюте,Дефолтная валюта');

  const totals = await calculateTotals(data);

  const inputCurrency = data.defaultCurrency || 
    (data.incomes.length > 0 ? data.incomes[0].currency : null) ||
    (data.expenses.length > 0 ? data.expenses[0].currency : null) ||
    'USD';

  lines.push(`Месяц,Доходы,${totals.incomeMonthly.original.toFixed(2)},${inputCurrency},${totals.incomeMonthly.converted.toFixed(2)},${data.defaultCurrency}`);
  lines.push(`Год,Доходы,${totals.incomeYearly.original.toFixed(2)},${inputCurrency},${totals.incomeYearly.converted.toFixed(2)},${data.defaultCurrency}`);
  lines.push(`Месяц,Расходы,${totals.expenseMonthly.original.toFixed(2)},${inputCurrency},${totals.expenseMonthly.converted.toFixed(2)},${data.defaultCurrency}`);
  lines.push(`Год,Расходы,${totals.expenseYearly.original.toFixed(2)},${inputCurrency},${totals.expenseYearly.converted.toFixed(2)},${data.defaultCurrency}`);
  lines.push(`,Накопления,${totals.savingsTotal.original.toFixed(2)},${inputCurrency},${totals.savingsTotal.converted.toFixed(2)},${data.defaultCurrency}`);
  lines.push(`,Цели,${totals.goalsTotal.original.toFixed(2)},${inputCurrency},${totals.goalsTotal.converted.toFixed(2)},${data.defaultCurrency}`);

  return lines.join('\n');
}

export function downloadCSV(content: string, filename: string): void {
  const blob = new Blob(['\ufeff' + content], { type: 'text/csv;charset=utf-8;' }); // BOM для корректного отображения кириллицы в Excel
  const link = document.createElement('a');
  const url = URL.createObjectURL(blob);
  
  link.setAttribute('href', url);
  link.setAttribute('download', filename);
  link.style.visibility = 'hidden';
  
  document.body.appendChild(link);
  link.click();
  document.body.removeChild(link);
  
  URL.revokeObjectURL(url);
}

