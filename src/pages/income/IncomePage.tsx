import { useState, useMemo, useEffect } from 'react';
import type { FormEvent } from 'react';
// reusable global components
import EmptyState from '@/shared/ui/atoms/EmptyState';
import ModalWindow from '@/shared/ui/ModalWindow';
import SelectInput from '@/shared/ui/form/SelectInput';
import Tag from '@/shared/ui/atoms/Tag';
import AddButton from '@/shared/ui/atoms/AddButton';
import Tabs from '@/shared/ui/molecules/Tabs';
import Table from '@/shared/ui/molecules/Table';
import PieChart from '@/shared/ui/molecules/PieChart';
import IconButton from '@/shared/ui/atoms/IconButton';
import { PencilIcon, TrashIcon } from '@heroicons/react/24/outline';
// reusable local components
import AddIncomeForm from '@/features/income/AddIncomeForm';
// custom hooks
import { useTranslation } from '@/shared/i18n';
import { useCurrency } from '@/shared/hooks';
// constants
import { currencyOptions, type CurrencyCode } from '@/shared/constants/currencies';
import { getIncomeCategories, getIncomeFrequencyOptions } from '@/shared/utils/categories';
// data types
import type { IncomeType, Income } from '@/mocks/pages/income.mock';
import type { TableColumn } from '@/shared/ui/molecules/Table';

export default function IncomePage() {
  const { t } = useTranslation('components');
  const { currency: settingsCurrency } = useCurrency();
  
  // Incomes data - empty array
  const incomes: Income[] = [];
  
  // Modal state
  const [open, setOpen] = useState(false);
  const [editingId, setEditingId] = useState<string | null>(null);
  
  // Form state
  const [incomeTypeId, setIncomeTypeId] = useState('');
  const [customCategoryText, setCustomCategoryText] = useState('');
  const [amount, setAmount] = useState<string | undefined>(undefined);
  const [currency, setCurrency] = useState<CurrencyCode>(currencyOptions[0].value);
  const [frequency, setFrequency] = useState<string>('monthly');
  const [isTagSelected, setIsTagSelected] = useState(false);
  const [formError, setFormError] = useState<string | null>(null);
  
  // Data placeholders
  const submitting = false;
  const deletingId: string | null = null;
  const monthlyTotal = 0;
  const annualTotal = 0;
  const pieChartData: Array<{ name: string; value: number }> = [];
  const selectedConversionCurrency: CurrencyCode | null = null;
  
  // Types and options
  const incomeTypes = getIncomeCategories(t);
  const frequencyOptions = getIncomeFrequencyOptions(t);
  const incomeTypeOptions = useMemo(() => incomeTypes.map(type => ({
    label: type.label,
    value: type.id,
  })), [incomeTypes]);

  // Initialize incomeTypeId when incomeTypes are available
  useEffect(() => {
    if (incomeTypes.length > 0 && !incomeTypeId) {
      setIncomeTypeId(incomeTypes[0].id);
    }
  }, [incomeTypes, incomeTypeId]);

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
    const hasValidCategory = (incomeTypeId === 'custom' || isTagSelected)
      ? customCategoryText.trim().length > 0
      : incomeTypeId;

    return !!(
      hasValidCategory &&
      amount &&
      parseFloat(amount) > 0 &&
      currency &&
      frequency
    );
  }, [incomeTypeId, isTagSelected, customCategoryText, amount, currency, frequency]);

  const hasChanges = true; // Always true for now since we don't track original values

  // Table columns
  const tableColumns = useMemo<TableColumn<Income>[]>(() => {
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
              onClick={() => handleEditIncome(row)}
            >
              <PencilIcon className="w-4 h-4" />
            </IconButton>
            <IconButton 
              aria-label={t('incomeForm.actions.deleteAriaLabel')} 
              title={t('incomeForm.actions.delete')} 
              onClick={() => handleDeleteIncomeClick(row.id)}
              disabled={deletingId === row.id}
            >
              <TrashIcon className="w-4 h-4" />
            </IconButton>
          </div>
        )
      }
    );

    return columns;
  }, [t, incomeTypes, settingsCurrency, incomes, deletingId, selectedConversionCurrency]);

  // Event handlers
  function handleTagClick(type: IncomeType) {
    setIncomeTypeId('custom');
    setCustomCategoryText(type.label);
    setIsTagSelected(true);
    setFormError(null);
    setEditingId(null);
    setOpen(true);
  }

  function handleAddIncomeClick() {
    setIncomeTypeId(incomeTypes[0]?.id || '');
    setCustomCategoryText('');
    setIsTagSelected(false);
    setAmount(undefined);
    const defaultCurrencyValue = settingsCurrency || currencyOptions[0].value;
    const validCurrency = currencyOptions.find(opt => opt.value === defaultCurrencyValue);
    setCurrency(validCurrency ? validCurrency.value : currencyOptions[0].value);
    setFrequency('monthly');
    setFormError(null);
    setEditingId(null);
    setOpen(true);
  }

  function handleSubmit(e: FormEvent) {
    e.preventDefault();
    // Empty stub - no business logic
  }

  function handleEditIncome(income: Income) {
    setEditingId(income.id);
    setIncomeTypeId('custom');
    setCustomCategoryText(income.type);
    setIsTagSelected(true);
    setAmount(income.amount.toString());
    const validCurrency = currencyOptions.find(opt => opt.value === income.currency);
    setCurrency(validCurrency ? validCurrency.value : currencyOptions[0].value);
    setFrequency(income.frequency);
    setFormError(null);
    setOpen(true);
  }

  function handleDeleteIncomeClick(_incomeId: string) {
    // Empty stub - no business logic
  }

  function handleConversionCurrencyChange(_newCurrency: string) {
    // Empty stub - no business logic
  }

  function handleModalClose() {
    setOpen(false);
    setEditingId(null);
    setIncomeTypeId(incomeTypes[0]?.id || '');
    setCustomCategoryText('');
    setIsTagSelected(false);
    setAmount(undefined);
    const defaultCurrencyValue = settingsCurrency || currencyOptions[0].value;
    const validCurrency = currencyOptions.find(opt => opt.value === defaultCurrencyValue);
    setCurrency(validCurrency ? validCurrency.value : currencyOptions[0].value);
    setFrequency('monthly');
    setFormError(null);
  }

  function handleCurrencyChange(newCurrency: string) {
    const validCurrency = currencyOptions.find(opt => opt.value === newCurrency);
    if (validCurrency) {
      setCurrency(validCurrency.value);
    }
  }

  function handleIncomeTypeChange(newTypeId: string) {
    setIncomeTypeId(newTypeId);
    if (newTypeId === 'custom') {
      setCustomCategoryText('');
    } else {
      const selectedType = incomeTypes.find(type => type.id === newTypeId);
      if (selectedType) {
        setCustomCategoryText(selectedType.label);
        setIncomeTypeId('custom');
        setIsTagSelected(true);
      } else {
        setCustomCategoryText('');
      }
    }
  }

  const modal = (
    <ModalWindow open={open} onClose={handleModalClose} title={editingId ? t('incomeForm.editTitle') : t('incomeForm.title')}>
      <AddIncomeForm
        handleSubmit={handleSubmit}
        handleCurrencyChange={handleCurrencyChange}
        isFormValid={isFormValid}
        hasChanges={hasChanges}
        formError={formError}
        incomeTypeId={incomeTypeId}
        isTagSelected={isTagSelected}
        customCategoryText={customCategoryText}
        setCustomCategoryText={setCustomCategoryText}
        incomeTypeOptions={incomeTypeOptions}
        handleIncomeTypeChange={handleIncomeTypeChange}
        amount={amount}
        setAmount={setAmount}
        currency={currency}
        frequency={frequency}
        setFrequency={setFrequency}
        frequencyOptions={frequencyOptions}
        submitting={submitting}
        editingId={editingId}
        t={t} 
      />
    </ModalWindow>
  );

  // Render states - incomes is always empty, so show empty state
  if (incomes.length === 0) {
    return (
      <div className="flex h-full items-center justify-center pt-12 lg:pt-0 lg:min-h-[calc(100vh-150px)]">
        <div className="flex flex-col items-center justify-center gap-6 text-mainTextColor dark:text-mainTextColor">
          <EmptyState>
            {t('incomeForm.emptyStateMessage')}
          </EmptyState>
          <div className="flex flex-wrap gap-4 lg:gap-2 justify-center max-w-2xl px-4 mt-4">
            {incomeTypes.map((type) => (
              <Tag 
                key={type.id} 
                title={type.label} 
                isCustom={type.isCustom}
                onClick={() => handleTagClick(type)}
              />
            ))}
          </div>
          {modal}
        </div>
      </div>
    );
  }

  const totalCurrency = selectedConversionCurrency || settingsCurrency || 'USD';

  return (
    <div className="flex flex-col gap-6 lg:min-h-[calc(100vh-100px)]">
      <div className="flex w-full justify-center lg:justify-end px-4 lg:px-0 py-4 lg:py-0">
        <AddButton
          onClick={handleAddIncomeClick}
          aria-label={t('incomeForm.addNewAriaLabel')}
          className="w-full lg:w-auto justify-center lg:justify-start"
        >
          {t('incomeForm.addNewButton')}
        </AddButton>
      </div>
      
      <Tabs
        tabs={[
          {
            id: 'table',
            label: t('incomeForm.tabs.table'),
            content: (
              <div className="lg:space-y-2 lg:px-2">
                <div className="flex justify-between items-center text-sm text-textColor dark:text-textColor mb-4 lg:mb-0">
                  <div className="flex flex-wrap gap-3">
                    <span>{t('incomeForm.totals.monthly')} <strong className="text-mainTextColor dark:text-mainTextColor">{monthlyTotal.toLocaleString('en-US', { minimumFractionDigits: 2, maximumFractionDigits: 2 })} {totalCurrency}</strong></span>
                    <span>{t('incomeForm.totals.annual')} <strong className="text-mainTextColor dark:text-mainTextColor">{annualTotal.toLocaleString('en-US', { minimumFractionDigits: 2, maximumFractionDigits: 2 })} {totalCurrency}</strong></span>
                  </div>
                  {settingsCurrency && incomes.length > 0 && (
                    <div className="flex items-center gap-2">
                      <SelectInput
                        value={selectedConversionCurrency || settingsCurrency}
                        options={currencyOptions}
                        onChange={handleConversionCurrencyChange}
                        className="w-30"
                      />
                    </div>
                  )}
                 
                </div>
                <Table columns={tableColumns} data={incomes} />
              </div>
            )
          },
          {
            id: 'chart',
            label: t('incomeForm.tabs.chart'),
            content: (
              <div className="lg:space-y-2 lg:px-2">
                <div className="text-sm text-textColor dark:text-textColor text-right">
                  {t('incomeForm.totals.monthly')} <strong className="text-mainTextColor dark:text-mainTextColor">{monthlyTotal.toLocaleString('en-US', { minimumFractionDigits: 2, maximumFractionDigits: 2 })} {totalCurrency}</strong>
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
