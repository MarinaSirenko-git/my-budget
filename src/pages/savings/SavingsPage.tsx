import { useState, useMemo, useEffect } from 'react';
import type { FormEvent } from 'react';
import { useQueryClient, useMutation } from '@tanstack/react-query';
// reusable global components
import EmptyState from '@/shared/ui/atoms/EmptyState';
import AddButton from '@/shared/ui/atoms/AddButton';
import ModalWindow from '@/shared/ui/ModalWindow';
import Tabs from '@/shared/ui/molecules/Tabs';
import Table from '@/shared/ui/molecules/Table';
import PieChart from '@/shared/ui/molecules/PieChart';
import IconButton from '@/shared/ui/atoms/IconButton';
import { PencilIcon, TrashIcon } from '@heroicons/react/24/outline';
// reusable local components
import AddSavingForm from '@/features/savings/AddSavingForm';
// custom hooks
import { useTranslation } from '@/shared/i18n';
import { useCurrency, useConvertedSavings, useUser, useScenario } from '@/shared/hooks';
// constants
import { currencyOptions, type CurrencyCode } from '@/shared/constants/currencies';
// utils
import { createSaving, updateSaving, deleteSaving } from '@/shared/utils/savings';
// types
import type { Saving } from '@/shared/hooks/useSavings';
import type { TableColumn } from '@/shared/ui/molecules/Table';

export default function SavingsPage() {
  const { t } = useTranslation('components');
  const queryClient = useQueryClient();
  const { currency: settingsCurrency } = useCurrency();
  const { convertedSavings: savings, totalInBaseCurrency, loading: savingsLoading } = useConvertedSavings();
  const { user } = useUser();
  const { currentScenario } = useScenario();
  
  // Modal state
  const [open, setOpen] = useState(false);
  const [editingId, setEditingId] = useState<string | null>(null);
  
  // Form state
  const [comment, setComment] = useState('');
  const [amount, setAmount] = useState<string | undefined>(undefined);
  const [currency, setCurrency] = useState<CurrencyCode>(currencyOptions[0].value);
  const [formError, setFormError] = useState<string | null>(null);
  const [submitting, setSubmitting] = useState(false);
  const [deletingId, setDeletingId] = useState<string | null>(null);
  
  const selectedConversionCurrency: CurrencyCode | null = null;
  
  // Calculate pie chart data
  const pieChartData = useMemo<Array<{ name: string; value: number }>>(() => {
    if (!savings || savings.length === 0) {
      return [];
    }

    const targetCurrency = selectedConversionCurrency || settingsCurrency;
    
    // Group savings by comment and calculate totals
    const savingsTotals = new Map<string, number>();
    
    savings.forEach((saving) => {
      // Use converted amount if available, otherwise use original amount
      const amount = targetCurrency && saving.amountInDefaultCurrency !== undefined
        ? saving.amountInDefaultCurrency
        : saving.amount;
      
      // Add to savings total by comment
      const savingsName = saving.comment || 'Unnamed';
      const currentTotal = savingsTotals.get(savingsName) || 0;
      savingsTotals.set(savingsName, currentTotal + amount);
    });
    
    // Convert to array format for PieChart
    return Array.from(savingsTotals.entries()).map(([name, value]) => ({
      name,
      value,
    }));
  }, [savings, selectedConversionCurrency, settingsCurrency]);

  // Set default currency from settings when loaded
  useEffect(() => {
    if (settingsCurrency) {
      const validCurrency = currencyOptions.find(opt => opt.value === settingsCurrency);
      if (validCurrency) {
        setCurrency(validCurrency.value);
      }
    }
  }, [settingsCurrency]);

  // Form validation
  const isFormValid = useMemo(() => {
    return !!(
      comment.trim() &&
      amount &&
      parseFloat(amount) > 0 &&
      currency
    );
  }, [comment, amount, currency]);

  const hasChanges = true; // Always true for now since we don't track original values

  // Delete saving mutation with optimistic updates
  const deleteSavingMutation = useMutation({
    mutationFn: (savingId: string) => {
      if (!user?.id) {
        throw new Error('User not found');
      }
      return deleteSaving({ savingId, userId: user.id });
    },
    
    onMutate: async (savingId) => {
      if (!currentScenario?.id) {
        return { previousSavings: null };
      }
      
      await queryClient.cancelQueries({ queryKey: ['savings', currentScenario.id] });
      const previousSavings = queryClient.getQueryData<Saving[]>(['savings', currentScenario.id]);
      queryClient.setQueryData<Saving[]>(
        ['savings', currentScenario.id],
        (old) => old?.filter(saving => saving.id !== savingId) ?? []
      );
      setDeletingId(savingId);
      return { previousSavings };
    },
    
    onError: (error, _savingId, context) => {
      if (context?.previousSavings && currentScenario?.id) {
        queryClient.setQueryData(['savings', currentScenario.id], context.previousSavings);
      }
      setDeletingId(null);
      console.error('Failed to delete saving:', error);
    },
    
    onSettled: () => {
      if (currentScenario?.id) {
        queryClient.invalidateQueries({ queryKey: ['savings', currentScenario.id] });
        queryClient.invalidateQueries({ queryKey: ['convertedSavings', currentScenario.id] });
      }
      setDeletingId(null);
    },
  });

  // Table columns
  const tableColumns = useMemo<TableColumn<Saving>[]>(() => {
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
              return '-';
            }

            const displayAmount = row.amountInDefaultCurrency !== undefined 
              ? row.amountInDefaultCurrency 
              : row.amount;

            return (
              <span className="text-sm">
                {displayAmount !== null ? (
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

    columns.push({
      key: 'actions',
      label: t('savingsForm.tableColumns.actions'),
      align: 'left' as const,
      render: (_value: any, row: Saving) => (
        <div className="flex gap-2 items-center justify-start" onClick={(e) => e.stopPropagation()}>
          <IconButton 
            aria-label={t('savingsForm.actions.editAriaLabel')} 
            title={t('savingsForm.actions.edit')} 
            onClick={() => handleEditSaving(row)}
          >
            <PencilIcon className="w-4 h-4" />
          </IconButton>
          <IconButton 
            aria-label={t('savingsForm.actions.deleteAriaLabel')} 
            title={t('savingsForm.actions.delete')} 
            onClick={() => handleDeleteSavingClick(row.id)}
            disabled={deletingId === row.id}
          >
            <TrashIcon className="w-4 h-4" />
          </IconButton>
        </div>
      )
    });

    return columns;
  }, [t, settingsCurrency, savings, deletingId, selectedConversionCurrency]);

  // Event handlers
  function handleCreateSavingClick() {
    setComment('');
    setAmount(undefined);
    const defaultCurrencyValue = settingsCurrency || currencyOptions[0].value;
    const validCurrency = currencyOptions.find(opt => opt.value === defaultCurrencyValue);
    setCurrency(validCurrency ? validCurrency.value : currencyOptions[0].value);
    setFormError(null);
    setEditingId(null);
    setOpen(true);
  }

  async function handleSubmit(e: FormEvent) {
    e.preventDefault();
    
    if (!isFormValid || submitting) {
      return;
    }

    if (!user?.id) {
      setFormError(t('savingsForm.errorMessage') || 'User not found');
      return;
    }

    if (!currentScenario?.id) {
      setFormError(t('savingsForm.errorMessage') || 'Scenario not found');
      return;
    }

    setSubmitting(true);
    setFormError(null);

    try {
      const amountValue = parseFloat(amount || '0');
      if (isNaN(amountValue) || amountValue <= 0) {
        throw new Error(t('savingsForm.invalidAmount') || 'Invalid amount');
      }

      if (editingId) {
        // Update existing saving
        await updateSaving({
          savingId: editingId,
          userId: user.id,
          comment: comment.trim(),
          amount: amountValue,
          currency,
        });

        // Invalidate React Query cache to refetch savings
        queryClient.invalidateQueries({ queryKey: ['savings', currentScenario.id] });
        queryClient.invalidateQueries({ queryKey: ['convertedSavings', currentScenario.id] });
      } else {
        // Create new saving
        await createSaving({
          userId: user.id,
          scenarioId: currentScenario.id,
          comment: comment.trim(),
          amount: amountValue,
          currency,
        });
        
        // Invalidate React Query cache to refetch savings
        queryClient.invalidateQueries({ queryKey: ['savings', currentScenario.id] });
        queryClient.invalidateQueries({ queryKey: ['convertedSavings', currentScenario.id] });
      }

      // Close modal and reset form
      handleModalClose();
    } catch (error) {
      setFormError(
        error instanceof Error 
          ? error.message 
          : (t('savingsForm.errorMessage') || 'Failed to save savings')
      );
    } finally {
      setSubmitting(false);
    }
  }

  function handleEditSaving(saving: Saving) {
    setEditingId(saving.id);
    setComment(saving.comment || '');
    setAmount(saving.amount.toString());
    const validCurrency = currencyOptions.find(opt => opt.value === saving.currency);
    setCurrency(validCurrency ? validCurrency.value : currencyOptions[0].value);
    setFormError(null);
    setOpen(true);
  }

  function handleDeleteSavingClick(savingId: string) {
    deleteSavingMutation.mutate(savingId);
  }

  function handleModalClose() {
    setOpen(false);
    setEditingId(null);
    setComment('');
    setAmount(undefined);
    const defaultCurrencyValue = settingsCurrency || currencyOptions[0].value;
    const validCurrency = currencyOptions.find(opt => opt.value === defaultCurrencyValue);
    setCurrency(validCurrency ? validCurrency.value : currencyOptions[0].value);
    setFormError(null);
  }

  function handleCurrencyChange(newCurrency: string) {
    const validCurrency = currencyOptions.find(opt => opt.value === newCurrency);
    if (validCurrency) {
      setCurrency(validCurrency.value);
    }
  }

  const modal = (
    <ModalWindow open={open} onClose={handleModalClose} title={editingId ? t('savingsForm.editTitle') : t('savingsForm.createTitle')}>
      <AddSavingForm
        handleSubmit={handleSubmit}
        handleCurrencyChange={handleCurrencyChange}
        isFormValid={isFormValid}
        hasChanges={hasChanges}
        formError={formError}
        comment={comment}
        setComment={setComment}
        amount={amount}
        setAmount={setAmount}
        currency={currency}
        submitting={submitting}
        editingId={editingId}
        t={t}
      />
    </ModalWindow>
  );

  // Render states - show empty state if no savings and not loading
  if (!savingsLoading && savings.length === 0) {
    const emptyMessage = t('savingsForm.emptyStateMessage');
    const safeMessage = emptyMessage.replace(/<br\s*\/?>/gi, '\n');

    return (
      <div className="flex h-full items-center justify-center min-h-[calc(100vh-150px)]">
        <div className="flex flex-col items-center justify-center gap-8 text-mainTextColor dark:text-mainTextColor">
          <EmptyState>
            <div style={{ whiteSpace: 'pre-line' }}>{safeMessage}</div>
          </EmptyState>
          <AddButton 
            onClick={handleCreateSavingClick} 
            aria-label={t('savingsForm.createAriaLabel')} 
            className="mt-3"
          >
            {t('savingsForm.createButton')}
          </AddButton>
          {modal}
        </div>
      </div>
    );
  }

  const totalCurrency = selectedConversionCurrency || settingsCurrency || 'USD';
  const totalSavings = totalInBaseCurrency;

  return (
    <div className="flex flex-col gap-6 min-h-[calc(100vh-100px)]">
      <div className="flex w-full justify-center lg:justify-end px-4 lg:px-0 py-4 lg:py-0">
        <AddButton 
          onClick={handleCreateSavingClick} 
          aria-label={t('savingsForm.addNewAriaLabel')}
          className="w-full lg:w-auto justify-center lg:justify-start"
        >
          {t('savingsForm.addNewButton')}
        </AddButton>
      </div>
      
      <Tabs
        tabs={[
          {
            id: 'table',
            label: t('savingsForm.tabs.table'),
            content: (
              <div className="space-y-2 lg:px-2">
                <div className="flex justify-between items-center text-sm text-textColor dark:text-textColor">
                  <div>
                    <span>{t('savingsForm.totals.total')} <strong className="text-mainTextColor dark:text-mainTextColor">{totalSavings.toLocaleString('en-US', { minimumFractionDigits: 2, maximumFractionDigits: 2 })} {totalCurrency}</strong></span>
                  </div>
                </div>
                <Table columns={tableColumns} data={savings} />
              </div>
            )
          },
          {
            id: 'chart',
            label: t('savingsForm.tabs.chart'),
            content: (
              <div className="space-y-2 lg:px-2">
                <div className="text-sm text-textColor dark:text-textColor text-right">
                  {t('savingsForm.totals.total')} <strong className="text-mainTextColor dark:text-mainTextColor">{totalSavings.toLocaleString('en-US', { minimumFractionDigits: 2, maximumFractionDigits: 2 })} {totalCurrency}</strong>
                </div>
                <PieChart 
                  data={pieChartData}
                  innerRadius="40%"
                />
              </div>
            )
          }
        ]}
      />

      {modal}
    </div>
  );
}
