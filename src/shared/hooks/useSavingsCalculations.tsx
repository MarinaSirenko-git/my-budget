import { useMemo } from 'react';
import type { Saving } from '@/shared/utils/savings';
import type { CurrencyCode } from '@/shared/constants/currencies';
import type { TableColumn } from '@/shared/ui/molecules/Table';
import { PencilIcon, TrashIcon } from '@heroicons/react/24/outline';
import IconButton from '@/shared/ui/atoms/IconButton';

interface UseSavingsCalculationsProps {
  savings: Saving[];
  selectedConversionCurrency: CurrencyCode | null;
  settingsCurrency?: CurrencyCode | null;
  convertedAmountsCache: Record<string, number>;
  convertingIds: Set<string>;
  t: (key: string) => string;
  onEdit: (saving: Saving) => void;
  onDelete: (savingId: string) => void;
  deletingId: string | null;
}

interface UseSavingsCalculationsReturn {
  totalSavings: number;
  pieChartData: Array<{ name: string; value: number }>;
  tableColumns: TableColumn<Saving>[];
}

export function useSavingsCalculations({
  savings,
  selectedConversionCurrency,
  settingsCurrency,
  convertedAmountsCache,
  convertingIds,
  t,
  onEdit,
  onDelete,
  deletingId,
}: UseSavingsCalculationsProps): UseSavingsCalculationsReturn {
  const totalSavings = useMemo(() => {
    const targetCurrency = selectedConversionCurrency || settingsCurrency;
    if (!targetCurrency) return 0;

    return savings.reduce((sum, saving) => {
      // Если валюта совпадает с целевой, используем исходную сумму
      if (saving.currency === targetCurrency) {
        return sum + saving.amount;
      }
      
      // Ищем конвертированную сумму в кэше
      const cacheKey = `${saving.id}_${targetCurrency}`;
      const cachedAmount = convertedAmountsCache[cacheKey];
      
      if (cachedAmount !== undefined) {
        return sum + cachedAmount;
      }
      
      // Если нет в кэше, но есть amountInDefaultCurrency и целевая валюта = settingsCurrency
      if (targetCurrency === settingsCurrency && saving.amountInDefaultCurrency !== undefined) {
        return sum + saving.amountInDefaultCurrency;
      }
      
      // Если ничего не найдено, используем исходную сумму (будет конвертировано позже)
      return sum + saving.amount;
    }, 0);
  }, [savings, selectedConversionCurrency, settingsCurrency, convertedAmountsCache]);

  const pieChartData = useMemo(() => {
    return savings.map((saving) => ({
      name: saving.comment || 'Без названия',
      value: saving.amount,
    }));
  }, [savings]);

  const tableColumns = useMemo(() => {
    const columns: TableColumn<Saving>[] = [
      { 
        key: 'comment', 
        label: t('savingsForm.tableColumns.name'),
      },
      { 
        key: 'amount', 
        label: t('savingsForm.tableColumns.amount'),
        align: 'left' as const,
        render: (value: number, row: Saving) => `${value.toLocaleString('en-US', { minimumFractionDigits: 2, maximumFractionDigits: 2 })} ${row.currency}`
      },
    ];

    if (settingsCurrency) {
      const hasDifferentCurrency = savings.some(saving => saving.currency !== settingsCurrency);
      if (hasDifferentCurrency) {
        const targetCurrency = selectedConversionCurrency || settingsCurrency;

        columns.push({
          key: 'amountInSettingsCurrency',
          label: t('savingsForm.tableColumns.amountInSettingsCurrency'),
          align: 'left' as const,
          render: (_value: any, row: Saving) => {
            if (row.currency === targetCurrency) {
              return '-'; // Не показываем, если валюта совпадает
            }

            const cacheKey = `${row.id}_${targetCurrency}`;
            const cachedAmount = convertedAmountsCache[cacheKey];
            const isConverting = convertingIds.has(cacheKey);

            // Определяем сумму для отображения
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
      {
        key: 'actions',
        label: t('savingsForm.tableColumns.actions'),
        align: 'left' as const,
        render: (_value: any, row: Saving) => (
          <div className="flex gap-2 items-center justify-start" onClick={(e) => e.stopPropagation()}>
            <IconButton 
              aria-label={t('savingsForm.actions.editAriaLabel')} 
              title={t('savingsForm.actions.edit')} 
              onClick={() => onEdit(row)}
            >
              <PencilIcon className="w-4 h-4" />
            </IconButton>
            <IconButton 
              aria-label={t('savingsForm.actions.deleteAriaLabel')} 
              title={t('savingsForm.actions.delete')} 
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
  }, [t, settingsCurrency, savings, deletingId, onDelete, onEdit, selectedConversionCurrency, convertedAmountsCache, convertingIds]);

  return {
    totalSavings,
    pieChartData,
    tableColumns,
  };
}

