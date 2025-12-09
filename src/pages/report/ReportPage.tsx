import { useState, useEffect } from 'react';
import { useAuth } from '@/shared/store/auth';
import { useScenarioRoute } from '@/shared/router/useScenarioRoute';
import { useTranslation } from '@/shared/i18n';
import { supabase } from '@/lib/supabase';
import { loadExportData, generateCSV, downloadCSV } from '@/shared/utils/csvExport';
import { getIncomeCategories } from '@/shared/utils/categories';
import { convertCurrency } from '@/shared/utils/currencyConversion';
import { reportErrorToTelegram } from '@/shared/utils/errorReporting';
import LoadingState from '@/shared/ui/atoms/LoadingState';
import ErrorState from '@/shared/ui/atoms/ErrorState';
import Table, { type TableColumn } from '@/shared/ui/molecules/Table';
import TextButton from '@/shared/ui/atoms/TextButton';
import { ArrowDownTrayIcon } from '@heroicons/react/24/outline';

interface IncomeRow {
  amount: string;
  source: string;
  frequency: string;
  currency: string;
  converted: string;
}

interface ExpenseRow {
  amount: string;
  source: string;
  frequency: string;
  currency: string;
  converted: string;
}

interface SavingRow {
  amount: string;
  comment: string;
  currency: string;
  converted: string;
}

interface GoalRow {
  amount: string;
  category: string;
  currency: string;
  converted: string;
}

interface TotalRow {
  period: string;
  type: string;
  originalAmount: string;
  originalCurrency: string;
  convertedAmount: string;
  defaultCurrency: string;
}

export default function ReportPage() {
  const { t } = useTranslation('pages');
  const { t: tComponents } = useTranslation('components');
  const { user } = useAuth();
  const { scenarioId } = useScenarioRoute();
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [exporting, setExporting] = useState(false);
  const [incomes, setIncomes] = useState<IncomeRow[]>([]);
  const [expenses, setExpenses] = useState<ExpenseRow[]>([]);
  const [savings, setSavings] = useState<SavingRow[]>([]);
  const [goals, setGoals] = useState<GoalRow[]>([]);
  const [totals, setTotals] = useState<TotalRow[]>([]);
  const [defaultCurrency, setDefaultCurrency] = useState<string>('');

  useEffect(() => {
    async function loadData() {
      if (!user?.id || !scenarioId) {
        return;
      }

      setLoading(true);
      setError(null);

      try {
        const { data: scenario, error: scenarioError } = await supabase
          .from('scenarios')
          .select('base_currency')
          .eq('id', scenarioId)
          .eq('user_id', user.id)
          .single();

        if (scenarioError) throw new Error(tComponents('export.error'));
        const baseCurrency = scenario?.base_currency || 'USD';
        setDefaultCurrency(baseCurrency);

        const exportData = await loadExportData(user.id, scenarioId, baseCurrency);
        if (!exportData) {
          throw new Error(tComponents('export.error'));
        }

        // Process incomes
        const incomeCategories = getIncomeCategories(tComponents);
        const incomeRows: IncomeRow[] = [];
        for (const income of exportData.incomes) {
          const category = incomeCategories.find(cat => cat.id === income.type);
          const source = category ? category.label : income.type;
          const frequency = income.frequency === 'monthly' 
            ? tComponents('incomeForm.monthly') 
            : tComponents('incomeForm.annual');
          const converted = await convertCurrency(income.amount, income.currency, baseCurrency);
          const convertedStr = converted !== null ? converted.toFixed(2) : '';
          incomeRows.push({
            amount: income.amount.toFixed(2),
            source,
            frequency,
            currency: income.currency,
            converted: convertedStr,
          });
        }
        setIncomes(incomeRows);

        // Process expenses
        const expenseRows: ExpenseRow[] = [];
        for (const expense of exportData.expenses) {
          let frequency = '';
          if (expense.frequency === 'monthly') {
            frequency = tComponents('expensesForm.monthly');
          } else if (expense.frequency === 'annual') {
            frequency = tComponents('expensesForm.annual');
          } else if (expense.frequency === 'one-time') {
            frequency = tComponents('expensesForm.oneTime');
          }
          const converted = await convertCurrency(expense.amount, expense.currency, baseCurrency);
          const convertedStr = converted !== null ? converted.toFixed(2) : '';
          expenseRows.push({
            amount: expense.amount.toFixed(2),
            source: expense.type,
            frequency,
            currency: expense.currency,
            converted: convertedStr,
          });
        }
        setExpenses(expenseRows);

        // Process savings
        const savingRows: SavingRow[] = [];
        for (const saving of exportData.savings) {
          const converted = await convertCurrency(saving.amount, saving.currency, baseCurrency);
          const convertedStr = converted !== null ? converted.toFixed(2) : '';
          savingRows.push({
            amount: saving.amount.toFixed(2),
            comment: saving.comment,
            currency: saving.currency,
            converted: convertedStr,
          });
        }
        setSavings(savingRows);

        // Process goals
        const goalRows: GoalRow[] = [];
        for (const goal of exportData.goals) {
          const converted = await convertCurrency(goal.target_amount, goal.currency, baseCurrency);
          const convertedStr = converted !== null ? converted.toFixed(2) : '';
          goalRows.push({
            amount: goal.target_amount.toFixed(2),
            category: goal.name,
            currency: goal.currency,
            converted: convertedStr,
          });
        }
        setGoals(goalRows);

        // Calculate totals
        const incomeByCurrency: Record<string, { monthly: number; yearly: number }> = {};
        const expenseByCurrency: Record<string, { monthly: number; yearly: number }> = {};
        const savingsByCurrency: Record<string, number> = {};
        const goalsByCurrency: Record<string, number> = {};

        for (const income of exportData.incomes) {
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

        for (const expense of exportData.expenses) {
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

        for (const saving of exportData.savings) {
          if (!savingsByCurrency[saving.currency]) {
            savingsByCurrency[saving.currency] = 0;
          }
          savingsByCurrency[saving.currency] += saving.amount;
        }

        for (const goal of exportData.goals) {
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
          const monthlyConverted = await convertCurrency(amounts.monthly, currency, baseCurrency);
          const yearlyConverted = await convertCurrency(amounts.yearly, currency, baseCurrency);
          incomeMonthlyConverted += monthlyConverted || 0;
          incomeYearlyConverted += yearlyConverted || 0;
        }

        for (const [currency, amounts] of Object.entries(expenseByCurrency)) {
          const monthlyConverted = await convertCurrency(amounts.monthly, currency, baseCurrency);
          const yearlyConverted = await convertCurrency(amounts.yearly, currency, baseCurrency);
          expenseMonthlyConverted += monthlyConverted || 0;
          expenseYearlyConverted += yearlyConverted || 0;
        }

        for (const [currency, amount] of Object.entries(savingsByCurrency)) {
          const converted = await convertCurrency(amount, currency, baseCurrency);
          savingsTotalConverted += converted || 0;
        }

        for (const [currency, targetAmount] of Object.entries(goalsByCurrency)) {
          const converted = await convertCurrency(targetAmount, currency, baseCurrency);
          goalsTotalConverted += converted || 0;
        }

        const incomeMonthlyOriginal = Object.values(incomeByCurrency).reduce((sum, amounts) => sum + amounts.monthly, 0);
        const incomeYearlyOriginal = Object.values(incomeByCurrency).reduce((sum, amounts) => sum + amounts.yearly, 0);
        const expenseMonthlyOriginal = Object.values(expenseByCurrency).reduce((sum, amounts) => sum + amounts.monthly, 0);
        const expenseYearlyOriginal = Object.values(expenseByCurrency).reduce((sum, amounts) => sum + amounts.yearly, 0);
        const savingsTotalOriginal = Object.values(savingsByCurrency).reduce((sum, amount) => sum + amount, 0);
        const goalsTotalOriginal = Object.values(goalsByCurrency).reduce((sum, amount) => sum + amount, 0);

        const inputCurrency = baseCurrency || 
          (exportData.incomes.length > 0 ? exportData.incomes[0].currency : null) ||
          (exportData.expenses.length > 0 ? exportData.expenses[0].currency : null) ||
          'USD';

        const totalRows: TotalRow[] = [
          {
            period: t('report.totals.month'),
            type: t('report.totals.income'),
            originalAmount: incomeMonthlyOriginal.toFixed(2),
            originalCurrency: inputCurrency,
            convertedAmount: incomeMonthlyConverted.toFixed(2),
            defaultCurrency: baseCurrency,
          },
          {
            period: t('report.totals.year'),
            type: t('report.totals.income'),
            originalAmount: incomeYearlyOriginal.toFixed(2),
            originalCurrency: inputCurrency,
            convertedAmount: incomeYearlyConverted.toFixed(2),
            defaultCurrency: baseCurrency,
          },
          {
            period: t('report.totals.month'),
            type: t('report.totals.expense'),
            originalAmount: expenseMonthlyOriginal.toFixed(2),
            originalCurrency: inputCurrency,
            convertedAmount: expenseMonthlyConverted.toFixed(2),
            defaultCurrency: baseCurrency,
          },
          {
            period: t('report.totals.year'),
            type: t('report.totals.expense'),
            originalAmount: expenseYearlyOriginal.toFixed(2),
            originalCurrency: inputCurrency,
            convertedAmount: expenseYearlyConverted.toFixed(2),
            defaultCurrency: baseCurrency,
          },
          {
            period: '',
            type: t('report.totals.savings'),
            originalAmount: savingsTotalOriginal.toFixed(2),
            originalCurrency: inputCurrency,
            convertedAmount: savingsTotalConverted.toFixed(2),
            defaultCurrency: baseCurrency,
          },
          {
            period: '',
            type: t('report.totals.goals'),
            originalAmount: goalsTotalOriginal.toFixed(2),
            originalCurrency: inputCurrency,
            convertedAmount: goalsTotalConverted.toFixed(2),
            defaultCurrency: baseCurrency,
          },
        ];
        setTotals(totalRows);
      } catch (err) {
        await reportErrorToTelegram({
          action: 'loadReportData',
          error: err,
          userId: user.id,
          context: { scenarioId },
        });
        setError(err instanceof Error ? err.message : tComponents('export.error'));
      } finally {
        setLoading(false);
      }
    }

    loadData();
  }, [user?.id, scenarioId, t, tComponents]);

  const handleDownload = async () => {
    if (!user?.id || !scenarioId) {
      return;
    }

    setExporting(true);

    try {
      const { data: scenario, error: scenarioError } = await supabase
        .from('scenarios')
        .select('base_currency')
        .eq('id', scenarioId)
        .eq('user_id', user.id)
        .single();

      if (scenarioError) throw new Error(tComponents('export.error'));
      const defaultCurrency = scenario?.base_currency;

      const exportData = await loadExportData(user.id, scenarioId, defaultCurrency);
      if (!exportData) {
        throw new Error(tComponents('export.error'));
      }
      const csvContent = await generateCSV(exportData, tComponents, t);
      const date = new Date().toISOString().split('T')[0];
      const filename = `budget_export_${date}.csv`;

      downloadCSV(csvContent, filename);
    } catch (err) {
      await reportErrorToTelegram({
        action: 'exportData',
        error: err,
        userId: user.id,
        context: { scenarioId },
      });
      alert(tComponents('export.error'));
    } finally {
      setExporting(false);
    }
  };

  if (loading) {
    return <LoadingState message={t('report.loading')} />;
  }

  if (error) {
    return <ErrorState message={`${t('report.errorPrefix')} ${error}`} />;
  }

  const incomeColumns: TableColumn<IncomeRow>[] = [
    { key: 'amount', label: t('report.columns.amount'),  },
    { key: 'currency', label: t('report.columns.currency') },
    { key: 'converted', label: t('report.columns.converted', { currency: defaultCurrency }),  },
    { key: 'source', label: t('report.columns.source') },
    { key: 'frequency', label: t('report.columns.frequency') },
  ];

  const expenseColumns: TableColumn<ExpenseRow>[] = [
    { key: 'amount', label: t('report.columns.amount')  },
    { key: 'currency', label: t('report.columns.currency') },
    { key: 'converted', label: t('report.columns.converted', { currency: defaultCurrency })},
    { key: 'source', label: t('report.columns.category') },
    { key: 'frequency', label: t('report.columns.frequency') },
  ];

  const savingColumns: TableColumn<SavingRow>[] = [
    { key: 'amount', label: t('report.columns.amount'),  },
    { key: 'currency', label: t('report.columns.currency') },
    { key: 'converted', label: t('report.columns.converted', { currency: defaultCurrency })},
    { key: 'comment', label: t('report.columns.comment') },
  ];

  const goalColumns: TableColumn<GoalRow>[] = [
    { key: 'amount', label: t('report.columns.amount'),  },
    { key: 'currency', label: t('report.columns.currency') },
    { key: 'converted', label: t('report.columns.converted', { currency: defaultCurrency })},
    { key: 'category', label: t('report.columns.category') },
  ];

  const totalColumns: TableColumn<TotalRow>[] = [
    { key: 'type', label: t('report.columns.type') },
    { key: 'period', label: t('report.columns.period') },
    { key: 'originalAmount', label: t('report.columns.originalAmount')},
    { key: 'originalCurrency', label: t('report.columns.originalCurrency')},
    { key: 'convertedAmount', label: t('report.columns.convertedAmount')},
    { key: 'defaultCurrency', label: t('report.columns.defaultCurrency')},
  ];

  return (
    <div className="flex flex-col gap-4 lg:gap-6 p-2 lg:px-6 min-h-[calc(100vh-100px)]">
      <div className="flex flex-col sm:flex-row w-full justify-between items-start sm:items-center gap-3 sm:gap-0">
        <h1 className="text-base lg:text-lg font-bold text-mainTextColor dark:text-mainTextColor">
          {t('report.title')}
        </h1>
        <TextButton
          onClick={handleDownload}
          disabled={exporting}
          variant="primary"
          aria-label={t('report.downloadButton')}
          className="w-full sm:w-auto"
        >
          <ArrowDownTrayIcon className="w-4 h-4 lg:w-5 lg:h-5 mr-2" />
          {exporting ? tComponents('export.loading') : t('report.downloadButton')}
        </TextButton>
      </div>

      {incomes.length > 0 && (
        <div className="space-y-2">
          <h2 className="text-base lg:text-lg font-semibold text-mainTextColor dark:text-mainTextColor">
            {t('report.sections.incomes')}
          </h2>
          <Table columns={incomeColumns} data={incomes} />
        </div>
      )}

     {savings.length > 0 && (
        <div className="space-y-2">
          <h2 className="text-base lg:text-lg font-semibold text-mainTextColor dark:text-mainTextColor">
            {t('report.sections.savings')}
          </h2>
          <Table columns={savingColumns} data={savings} />
        </div>
      )}

      {goals.length > 0 && (
        <div className="space-y-2">
          <h2 className="text-base lg:text-lg font-semibold text-mainTextColor dark:text-mainTextColor">
            {t('report.sections.goals')}
          </h2>
          <Table columns={goalColumns} data={goals} />
        </div>
      )}

      {expenses.length > 0 && (
        <div className="space-y-2">
          <h2 className="text-base lg:text-lg font-semibold text-mainTextColor dark:text-mainTextColor">
            {t('report.sections.expenses')}
          </h2>
          <Table columns={expenseColumns} data={expenses} />
        </div>
      )}

      {totals.length > 0 && (
        <div className="space-y-2">
          <h2 className="text-base lg:text-lg font-semibold text-mainTextColor dark:text-mainTextColor">
            {t('report.sections.totals')}
          </h2>
          <Table columns={totalColumns} data={totals} />
        </div>
      )}

      {incomes.length === 0 && expenses.length === 0 && savings.length === 0 && goals.length === 0 && (
        <div className="flex items-center justify-center min-h-[300px] lg:min-h-[400px]">
          <p className="text-sm lg:text-base text-textColor dark:text-textColor">{t('report.empty')}</p>
        </div>
      )}
    </div>
  );
}

