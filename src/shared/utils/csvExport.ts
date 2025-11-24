import { supabase } from '@/lib/supabase';
import { getIncomeCategories, getExpenseCategories } from './categories';
import type { TFunction } from '@/shared/i18n';

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
  amount: number;
  name: string;
  currency: string;
}

interface ExportData {
  incomes: IncomeData[];
  expenses: ExpenseData[];
  savings: SavingData[];
  goals: GoalData[];
  defaultCurrency: string;
}

/**
 * Конвертирует сумму в дефолтную валюту через RPC
 */
async function convertToDefaultCurrency(
  amount: number,
  fromCurrency: string,
  defaultCurrency: string
): Promise<number | null> {
  if (fromCurrency === defaultCurrency) {
    return amount;
  }

  try {
    const { data, error } = await supabase.rpc('convert_amount', {
      p_amount: amount,
      p_from_currency: fromCurrency,
      p_to_currency: defaultCurrency,
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
}

/**
 * Загружает все данные для экспорта
 */
export async function loadExportData(
  userId: string,
  scenarioId: string | null,
  defaultCurrency: string
): Promise<ExportData | null> {
  try {
    // Загружаем доходы
    let incomesQuery = supabase
      .from('incomes_decrypted')
      .select('amount, type, frequency, currency')
      .eq('user_id', userId);

    if (scenarioId) {
      incomesQuery = incomesQuery.eq('scenario_id', scenarioId);
    }

    const { data: incomesData, error: incomesError } = await incomesQuery.order('created_at', { ascending: false });

    if (incomesError) {
      console.error('Error loading incomes:', incomesError);
      return null;
    }

    // Загружаем расходы
    let expensesQuery = supabase
      .from('expenses_decrypted')
      .select('amount, type, frequency, currency')
      .eq('user_id', userId);

    if (scenarioId) {
      expensesQuery = expensesQuery.eq('scenario_id', scenarioId);
    }

    const { data: expensesData, error: expensesError } = await expensesQuery.order('created_at', { ascending: false });

    if (expensesError) {
      console.error('Error loading expenses:', expensesError);
      return null;
    }

    // Загружаем накопления
    let savingsQuery = supabase
      .from('savings_decrypted')
      .select('amount, comment, currency')
      .eq('user_id', userId);

    if (scenarioId) {
      savingsQuery = savingsQuery.eq('scenario_id', scenarioId);
    }

    const { data: savingsData, error: savingsError } = await savingsQuery.order('created_at', { ascending: false });

    if (savingsError) {
      console.error('Error loading savings:', savingsError);
      return null;
    }

    // Загружаем цели
    let goalsQuery = supabase
      .from('goals_decrypted')
      .select('amount, name, currency')
      .eq('user_id', userId);

    if (scenarioId) {
      goalsQuery = goalsQuery.eq('scenario_id', scenarioId);
    }

    const { data: goalsData, error: goalsError } = await goalsQuery.order('created_at', { ascending: false });

    if (goalsError) {
      console.error('Error loading goals:', goalsError);
      return null;
    }

    return {
      incomes: (incomesData || []) as IncomeData[],
      expenses: (expensesData || []) as ExpenseData[],
      savings: (savingsData || []) as SavingData[],
      goals: (goalsData || []) as GoalData[],
      defaultCurrency,
    };
  } catch (err) {
    console.error('Error loading export data:', err);
    return null;
  }
}

/**
 * Рассчитывает итоговые суммы с учетом частоты и конвертации валют
 */
async function calculateTotals(
  data: ExportData,
  t: TFunction
): Promise<{
  incomeMonthly: { original: number; converted: number };
  incomeYearly: { original: number; converted: number };
  expenseMonthly: { original: number; converted: number };
  expenseYearly: { original: number; converted: number };
  savingsTotal: { original: number; converted: number };
  goalsTotal: { original: number; converted: number };
}> {
  // Группируем суммы по валютам для расчета в валюте ввода
  const incomeByCurrency: Record<string, { monthly: number; yearly: number }> = {};
  const expenseByCurrency: Record<string, { monthly: number; yearly: number }> = {};
  const savingsByCurrency: Record<string, number> = {};
  const goalsByCurrency: Record<string, number> = {};

  // Рассчитываем доходы
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

  // Рассчитываем расходы
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

  // Рассчитываем накопления
  for (const saving of data.savings) {
    if (!savingsByCurrency[saving.currency]) {
      savingsByCurrency[saving.currency] = 0;
    }
    savingsByCurrency[saving.currency] += saving.amount;
  }

  // Рассчитываем цели
  for (const goal of data.goals) {
    if (!goalsByCurrency[goal.currency]) {
      goalsByCurrency[goal.currency] = 0;
    }
    goalsByCurrency[goal.currency] += goal.amount;
  }

  // Конвертируем все суммы в дефолтную валюту
  let incomeMonthlyConverted = 0;
  let incomeYearlyConverted = 0;
  let expenseMonthlyConverted = 0;
  let expenseYearlyConverted = 0;
  let savingsTotalConverted = 0;
  let goalsTotalConverted = 0;

  for (const [currency, amounts] of Object.entries(incomeByCurrency)) {
    const monthlyConverted = await convertToDefaultCurrency(amounts.monthly, currency, data.defaultCurrency);
    const yearlyConverted = await convertToDefaultCurrency(amounts.yearly, currency, data.defaultCurrency);
    incomeMonthlyConverted += monthlyConverted || 0;
    incomeYearlyConverted += yearlyConverted || 0;
  }

  for (const [currency, amounts] of Object.entries(expenseByCurrency)) {
    const monthlyConverted = await convertToDefaultCurrency(amounts.monthly, currency, data.defaultCurrency);
    const yearlyConverted = await convertToDefaultCurrency(amounts.yearly, currency, data.defaultCurrency);
    expenseMonthlyConverted += monthlyConverted || 0;
    expenseYearlyConverted += yearlyConverted || 0;
  }

  for (const [currency, amount] of Object.entries(savingsByCurrency)) {
    const converted = await convertToDefaultCurrency(amount, currency, data.defaultCurrency);
    savingsTotalConverted += converted || 0;
  }

  for (const [currency, amount] of Object.entries(goalsByCurrency)) {
    const converted = await convertToDefaultCurrency(amount, currency, data.defaultCurrency);
    goalsTotalConverted += converted || 0;
  }

  // Для оригинальных сумм суммируем все валюты (они будут показаны в валюте ввода)
  // Это упрощение - показываем сумму всех валют, но в CSV будет указана основная валюта
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

/**
 * Генерирует CSV контент из данных
 */
export async function generateCSV(
  data: ExportData,
  t: TFunction
): Promise<string> {
  const lines: string[] = [];

  // Получаем категории для переводов
  const incomeCategories = getIncomeCategories(t);
  const expenseCategories = getExpenseCategories(t);

  // Секция доходов
  lines.push('Доходы');
  lines.push('Сумма,Источник,Частота,Валюта,Сумма в дефолтной валюте');

  for (const income of data.incomes) {
    const category = incomeCategories.find(cat => cat.id === income.type);
    const source = category ? category.label : income.type;
    const frequency = income.frequency === 'monthly' ? t('incomeForm.monthly') : t('incomeForm.annual');
    const converted = await convertToDefaultCurrency(income.amount, income.currency, data.defaultCurrency);
    const convertedStr = converted !== null ? converted.toFixed(2) : '';
    lines.push(`${income.amount},${source},${frequency},${income.currency},${convertedStr}`);
  }

  lines.push(''); // Пустая строка между секциями

  // Секция расходов
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
    const converted = await convertToDefaultCurrency(expense.amount, expense.currency, data.defaultCurrency);
    const convertedStr = converted !== null ? converted.toFixed(2) : '';
    lines.push(`${expense.amount},${source},${frequency},${expense.currency},${convertedStr}`);
  }

  lines.push(''); // Пустая строка между секциями

  // Секция накоплений
  lines.push('Накопления');
  lines.push('Сумма,Комментарий,Валюта,Сумма в дефолтной валюте');

  for (const saving of data.savings) {
    const converted = await convertToDefaultCurrency(saving.amount, saving.currency, data.defaultCurrency);
    const convertedStr = converted !== null ? converted.toFixed(2) : '';
    // Экранируем запятые в комментарии
    const comment = saving.comment.replace(/,/g, ';');
    lines.push(`${saving.amount},${comment},${saving.currency},${convertedStr}`);
  }

  lines.push(''); // Пустая строка между секциями

  // Секция целей
  lines.push('Цели');
  lines.push('Сумма,Категория,Валюта,Сумма в дефолтной валюте');

  for (const goal of data.goals) {
    const converted = await convertToDefaultCurrency(goal.amount, goal.currency, data.defaultCurrency);
    const convertedStr = converted !== null ? converted.toFixed(2) : '';
    lines.push(`${goal.amount},${goal.name},${goal.currency},${convertedStr}`);
  }

  lines.push(''); // Пустая строка между секциями

  // Секция итогов
  lines.push('Итоги');
  lines.push('Период,Тип,Сумма в валюте ввода,Валюта ввода,Сумма в дефолтной валюте,Дефолтная валюта');

  const totals = await calculateTotals(data, t);

  // Определяем основную валюту ввода (дефолтная или первая встреченная)
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

/**
 * Скачивает CSV файл
 */
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

