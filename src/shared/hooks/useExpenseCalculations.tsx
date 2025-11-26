import { useMemo } from 'react';
import type { Expense, ExpenseCategory } from '@/mocks/pages/expenses.mock';
import type { CurrencyCode } from '@/shared/constants/currencies';
import type { TableColumn } from '@/shared/ui/molecules/Table';
import { PencilIcon, TrashIcon } from '@heroicons/react/24/outline';
import IconButton from '@/shared/ui/atoms/IconButton';

interface UseExpenseCalculationsProps {
  expenses: Expense[];
  expenseCategories: ExpenseCategory[];
  selectedConversionCurrency: CurrencyCode | null;
  settingsCurrency?: CurrencyCode | null;
  convertedAmountsCache: Record<string, number>;
  convertingIds: Set<string>;
  t: (key: string) => string;
  onEdit: (expense: Expense) => void;
  onDelete: (expenseId: string) => void | Promise<void>;
  deletingId: string | null;
}

interface UseExpenseCalculationsReturn {
  monthlyTotal: number;
  annualTotal: number;
  oneTimeTotal: number;
  pieChartData: Array<{ name: string; value: number }>;
  tableColumns: TableColumn<Expense>[];
}

export function useExpenseCalculations({
  expenses,
  expenseCategories,
  selectedConversionCurrency,
  settingsCurrency,
  convertedAmountsCache,
  convertingIds,
  t,
  onEdit,
  onDelete,
  deletingId,
}: UseExpenseCalculationsProps): UseExpenseCalculationsReturn {
  const monthlyTotal = useMemo(() => {
    const targetCurrency = selectedConversionCurrency || settingsCurrency;
    if (!targetCurrency) return 0;

    const monthlyExpensesTotal = expenses
      .filter(expense => expense.frequency === 'monthly')
      .reduce((sum, expense) => sum + getAmountInCurrency(expense, targetCurrency, settingsCurrency, convertedAmountsCache), 0);

    const annualExpensesMonthlyTotal = expenses
      .filter(expense => expense.frequency === 'annual')
      .reduce((sum, expense) => sum + (getAmountInCurrency(expense, targetCurrency, settingsCurrency, convertedAmountsCache) / 12), 0);

    return monthlyExpensesTotal + annualExpensesMonthlyTotal;
  }, [expenses, selectedConversionCurrency, settingsCurrency, convertedAmountsCache]);

  const annualTotal = useMemo(() => {
    const targetCurrency = selectedConversionCurrency || settingsCurrency;
    if (!targetCurrency) return 0;

    const monthlyExpensesTotal = expenses
      .filter(expense => expense.frequency === 'monthly')
      .reduce((sum, expense) => sum + (getAmountInCurrency(expense, targetCurrency, settingsCurrency, convertedAmountsCache) * 12), 0);

    const annualExpensesTotal = expenses
      .filter(expense => expense.frequency === 'annual')
      .reduce((sum, expense) => sum + getAmountInCurrency(expense, targetCurrency, settingsCurrency, convertedAmountsCache), 0);

    return monthlyExpensesTotal + annualExpensesTotal;
  }, [expenses, selectedConversionCurrency, settingsCurrency, convertedAmountsCache]);

  const oneTimeTotal = useMemo(() => {
    const targetCurrency = selectedConversionCurrency || settingsCurrency;
    if (!targetCurrency) return 0;

    return expenses
      .filter(expense => expense.frequency === 'one-time')
      .reduce((sum, expense) => sum + getAmountInCurrency(expense, targetCurrency, settingsCurrency, convertedAmountsCache), 0);
  }, [expenses, selectedConversionCurrency, settingsCurrency, convertedAmountsCache]);

  const pieChartData = useMemo(() => {
    const targetCurrency = selectedConversionCurrency || settingsCurrency;
    if (!targetCurrency) return [];

    const grouped = expenses.reduce((acc, expense) => {
      const category = expenseCategories.find(c => c.id === expense.category);
      const label = category?.label || expense.type || 'Unknown';

      if (!acc[label]) {
        acc[label] = 0;
      }

      const amount = expense.frequency === 'annual'
        ? getAmountInCurrency(expense, targetCurrency, settingsCurrency, convertedAmountsCache) / 12
        : getAmountInCurrency(expense, targetCurrency, settingsCurrency, convertedAmountsCache);

      acc[label] += amount;
      return acc;
    }, {} as Record<string, number>);

    return Object.entries(grouped).map(([name, value]) => ({
      name,
      value,
    }));
  }, [expenses, expenseCategories, selectedConversionCurrency, settingsCurrency, convertedAmountsCache]);

  const tableColumns = useMemo(() => {
    const columns: TableColumn<Expense>[] = [
      { 
        key: 'category', 
        label: t('expensesForm.tableColumns.category'),
        render: (value: string) => {
          const category = expenseCategories.find(cat => cat.id === value);
          return category?.label || value;
        }
      },
      { 
        key: 'amount', 
        label: t('expensesForm.tableColumns.amount'),
        align: 'left' as const,
        render: (value: number, row: Expense) => `${value.toLocaleString('en-US', { minimumFractionDigits: 2, maximumFractionDigits: 2 })} ${row.currency}`
      },
    ];

    if (settingsCurrency) {
      const hasDifferentCurrency = expenses.some(expense => expense.currency !== settingsCurrency);
      if (hasDifferentCurrency) {
        const targetCurrency = selectedConversionCurrency || settingsCurrency;

        columns.push({
          key: 'amountInSettingsCurrency',
          label: t('expensesForm.tableColumns.amountInSettingsCurrency'),
          align: 'left' as const,
          render: (_value: any, row: Expense) => {
            if (row.currency === targetCurrency) {
              return '-';
            }

            const cacheKey = `${row.id}_${targetCurrency}`;
            const cachedAmount = convertedAmountsCache[cacheKey];
            const isConverting = convertingIds.has(cacheKey);

            let displayAmount: number | null = null;
            if (targetCurrency === row.currency) {
              displayAmount = row.amount;
            } else if (cachedAmount !== undefined) {
              displayAmount = cachedAmount;
            } else if (targetCurrency === settingsCurrency && row.amountInDefaultCurrency !== undefined) {
              displayAmount = row.amountInDefaultCurrency;
            }

            return (
              <span className="text-sm">
                {isConverting ? (
                  '...'
                ) : displayAmount !== null ? (
                  `${displayAmount.toLocaleString('en-US', { minimumFractionDigits: 2, maximumFractionDigits: 2 })} ${targetCurrency}`
                ) : (
                  `... ${targetCurrency}`
                )}
              </span>
            );
          }
        });
      }
    }

    columns.push(
      { key: 'frequency', label: t('expensesForm.tableColumns.frequency'), align: 'left' as const },
      { key: 'date', label: t('expensesForm.tableColumns.date') },
      {
        key: 'actions',
        label: t('expensesForm.tableColumns.actions'),
        align: 'left' as const,
        render: (_value: any, row: Expense) => (
          <div className="flex gap-2 items-center justify-start" onClick={(e) => e.stopPropagation()}>
            <IconButton 
              aria-label={t('expensesForm.actions.editAriaLabel')} 
              title={t('expensesForm.actions.edit')} 
              onClick={() => onEdit(row)}
            >
              <PencilIcon className="w-4 h-4" />
            </IconButton>
            <IconButton 
              aria-label={t('expensesForm.actions.deleteAriaLabel')} 
              title={t('expensesForm.actions.delete')} 
              onClick={() => onDelete(row.id)}
              disabled={deletingId === row.id}
            >
              <TrashIcon className="w-4 h-4" />
            </IconButton>
          </div>
        )
      }
    );

    return columns;
  }, [t, expenseCategories, settingsCurrency, expenses, deletingId, onDelete, onEdit, selectedConversionCurrency, convertedAmountsCache, convertingIds]);

  return {
    monthlyTotal,
    annualTotal,
    oneTimeTotal,
    pieChartData,
    tableColumns,
  };
}

function getAmountInCurrency(
  expense: Expense,
  targetCurrency: CurrencyCode,
  settingsCurrency: CurrencyCode | null | undefined,
  convertedAmountsCache: Record<string, number>
): number {
  if (expense.currency === targetCurrency) {
    return expense.amount;
  }

  const cacheKey = `${expense.id}_${targetCurrency}`;
  const cachedAmount = convertedAmountsCache[cacheKey];

  if (cachedAmount !== undefined) {
    return cachedAmount;
  }

  if (targetCurrency === settingsCurrency && expense.amountInDefaultCurrency !== undefined) {
    return expense.amountInDefaultCurrency;
  }

  return expense.amount;
}


