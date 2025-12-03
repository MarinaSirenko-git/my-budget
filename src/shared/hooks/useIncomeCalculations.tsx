import { useMemo } from 'react';
import type { Income, IncomeType } from '@/mocks/pages/income.mock';
import type { CurrencyCode } from '@/shared/constants/currencies';
import type { TableColumn } from '@/shared/ui/molecules/Table';
import { PencilIcon, TrashIcon } from '@heroicons/react/24/outline';
import IconButton from '@/shared/ui/atoms/IconButton';

interface UseIncomeCalculationsProps {
  incomes: Income[];
  incomeTypes: IncomeType[];
  selectedConversionCurrency: CurrencyCode | null;
  settingsCurrency?: CurrencyCode | null;
  convertedAmountsCache: Record<string, number>;
  convertingIds: Set<string>;
  t: (key: string) => string;
  onEdit: (income: Income) => void;
  onDelete: (incomeId: string) => void;
  deletingId: string | null;
}

interface UseIncomeCalculationsReturn {
  monthlyTotal: number;
  annualTotal: number;
  pieChartData: Array<{ name: string; value: number }>;
  tableColumns: TableColumn<Income>[];
}

export function useIncomeCalculations({
  incomes,
  incomeTypes,
  selectedConversionCurrency,
  settingsCurrency,
  convertedAmountsCache,
  convertingIds,
  t,
  onEdit,
  onDelete,
  deletingId,
}: UseIncomeCalculationsProps): UseIncomeCalculationsReturn {
  const monthlyTotal = useMemo(() => {
    const targetCurrency = selectedConversionCurrency || settingsCurrency;
    if (!targetCurrency) return 0;

    // Sum monthly incomes
    const monthlyIncomesTotal = incomes
      .filter(income => income.frequency === 'monthly')
      .reduce((sum, income) => {
        // If currency matches target, use original amount
        if (income.currency === targetCurrency) {
          return sum + income.amount;
        }
        
        // Look for converted amount in cache
        const cacheKey = `${income.id}_${targetCurrency}`;
        const cachedAmount = convertedAmountsCache[cacheKey];
        
        if (cachedAmount !== undefined) {
          return sum + cachedAmount;
        }
        
        // If not in cache, but has amountInDefaultCurrency and target currency = settingsCurrency
        if (targetCurrency === settingsCurrency && income.amountInDefaultCurrency !== undefined) {
          return sum + income.amountInDefaultCurrency;
        }
        
        // If nothing found, use original amount (will be converted later)
        return sum + income.amount;
      }, 0);

    // Sum annual incomes divided by 12
    const annualIncomesMonthlyTotal = incomes
      .filter(income => income.frequency === 'annual')
      .reduce((sum, income) => {
        // If currency matches target, use original amount
        if (income.currency === targetCurrency) {
          return sum + (income.amount / 12);
        }
        
        // Look for converted amount in cache
        const cacheKey = `${income.id}_${targetCurrency}`;
        const cachedAmount = convertedAmountsCache[cacheKey];
        
        if (cachedAmount !== undefined) {
          return sum + (cachedAmount / 12);
        }
        
        // If not in cache, but has amountInDefaultCurrency and target currency = settingsCurrency
        if (targetCurrency === settingsCurrency && income.amountInDefaultCurrency !== undefined) {
          return sum + (income.amountInDefaultCurrency / 12);
        }
        
        // If nothing found, use original amount (will be converted later)
        return sum + (income.amount / 12);
      }, 0);

    return monthlyIncomesTotal + annualIncomesMonthlyTotal;
  }, [incomes, selectedConversionCurrency, settingsCurrency, convertedAmountsCache]);

  const annualTotal = useMemo(() => {
    const targetCurrency = selectedConversionCurrency || settingsCurrency;
    if (!targetCurrency) return 0;

    // Sum monthly incomes multiplied by 12
    const monthlyIncomesTotal = incomes
      .filter(income => income.frequency === 'monthly')
      .reduce((sum, income) => {
        // If currency matches target, use original amount
        if (income.currency === targetCurrency) {
          return sum + (income.amount * 12);
        }
        
        // Look for converted amount in cache
        const cacheKey = `${income.id}_${targetCurrency}`;
        const cachedAmount = convertedAmountsCache[cacheKey];
        
        if (cachedAmount !== undefined) {
          return sum + (cachedAmount * 12);
        }
        
        // If not in cache, but has amountInDefaultCurrency and target currency = settingsCurrency
        if (targetCurrency === settingsCurrency && income.amountInDefaultCurrency !== undefined) {
          return sum + (income.amountInDefaultCurrency * 12);
        }
        
        // If nothing found, use original amount (will be converted later)
        return sum + (income.amount * 12);
      }, 0);

    // Sum annual incomes
    const annualIncomesTotal = incomes
      .filter(income => income.frequency === 'annual')
      .reduce((sum, income) => {
        // If currency matches target, use original amount
        if (income.currency === targetCurrency) {
          return sum + income.amount;
        }
        
        // Look for converted amount in cache
        const cacheKey = `${income.id}_${targetCurrency}`;
        const cachedAmount = convertedAmountsCache[cacheKey];
        
        if (cachedAmount !== undefined) {
          return sum + cachedAmount;
        }
        
        // If not in cache, but has amountInDefaultCurrency and target currency = settingsCurrency
        if (targetCurrency === settingsCurrency && income.amountInDefaultCurrency !== undefined) {
          return sum + income.amountInDefaultCurrency;
        }
        
        // If nothing found, use original amount (will be converted later)
        return sum + income.amount;
      }, 0);

    return monthlyIncomesTotal + annualIncomesTotal;
  }, [incomes, selectedConversionCurrency, settingsCurrency, convertedAmountsCache]);

  const pieChartData = useMemo(() => {
    const targetCurrency = selectedConversionCurrency || settingsCurrency;
    if (!targetCurrency) return [];

    const grouped = incomes.reduce((acc, income) => {
      const type = incomeTypes.find(t => t.id === income.type);
      const label = type?.label || income.type;
      
      if (!acc[label]) {
        acc[label] = 0;
      }

      // Determine amount to use in chart (monthly equivalent)
      let amountToAdd = 0;
      
      // If currency matches target, use original amount
      if (income.currency === targetCurrency) {
        amountToAdd = income.frequency === 'monthly' ? income.amount : income.amount / 12;
      } else {
        // Look for converted amount in cache
        const cacheKey = `${income.id}_${targetCurrency}`;
        const cachedAmount = convertedAmountsCache[cacheKey];
        
        if (cachedAmount !== undefined) {
          // Use converted amount from cache
          amountToAdd = income.frequency === 'monthly' ? cachedAmount : cachedAmount / 12;
        } else if (targetCurrency === settingsCurrency && income.amountInDefaultCurrency !== undefined) {
          // If not in cache, but has amountInDefaultCurrency and target currency = settingsCurrency
          amountToAdd = income.frequency === 'monthly' 
            ? income.amountInDefaultCurrency 
            : income.amountInDefaultCurrency / 12;
        } else {
          // If conversion not yet done, use original amount (will be converted later)
          amountToAdd = income.frequency === 'monthly' ? income.amount : income.amount / 12;
        }
      }

      acc[label] += amountToAdd;
      return acc;
    }, {} as Record<string, number>);

    return Object.entries(grouped).map(([name, value]) => ({
      name,
      value,
    }));
  }, [incomes, incomeTypes, selectedConversionCurrency, settingsCurrency, convertedAmountsCache]);

  const tableColumns = useMemo(() => {
    const columns: TableColumn<Income>[] = [
      { 
        key: 'type', 
        label: t('incomeForm.tableColumns.category'),
        render: (value: string) => {
          const type = incomeTypes.find(typeItem => typeItem.id === value);
          return type?.label || value;
        }
      },
      { 
        key: 'amount', 
        label: t('incomeForm.tableColumns.amount'),
        align: 'left' as const,
        render: (value: number, row: Income) => `${value.toLocaleString('en-US', { minimumFractionDigits: 2, maximumFractionDigits: 2 })} ${row.currency}`
      },
    ];

    if (settingsCurrency) {
      const hasDifferentCurrency = incomes.some(income => income.currency !== settingsCurrency);
      if (hasDifferentCurrency) {
        const targetCurrency = selectedConversionCurrency || settingsCurrency;

        columns.push({
          key: 'amountInSettingsCurrency',
          label: t('incomeForm.tableColumns.amountInSettingsCurrency'),
          align: 'left' as const,
          render: (_value: any, row: Income) => {
            if (row.currency === targetCurrency) {
              return '-'; // Don't show if currency matches
            }

            const cacheKey = `${row.id}_${targetCurrency}`;
            const cachedAmount = convertedAmountsCache[cacheKey];
            const isConverting = convertingIds.has(cacheKey);

            // Determine amount to display
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
      { key: 'frequency', label: t('incomeForm.tableColumns.frequency'), align: 'left' as const },
      {
        key: 'actions',
        label: t('incomeForm.tableColumns.actions'),
        align: 'left' as const,
        render: (_value: any, row: Income) => (
          <div className="flex gap-2 items-center justify-start" onClick={(e) => e.stopPropagation()}>
            <IconButton 
              aria-label={t('incomeForm.actions.editAriaLabel')} 
              title={t('incomeForm.actions.edit')} 
              onClick={() => onEdit(row)}
            >
              <PencilIcon className="w-4 h-4" />
            </IconButton>
            <IconButton 
              aria-label={t('incomeForm.actions.deleteAriaLabel')} 
              title={t('incomeForm.actions.delete')} 
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
  }, [t, incomeTypes, settingsCurrency, incomes, deletingId, onDelete, onEdit, selectedConversionCurrency, convertedAmountsCache, convertingIds]);

  return {
    monthlyTotal,
    annualTotal,
    pieChartData,
    tableColumns,
  };
}

