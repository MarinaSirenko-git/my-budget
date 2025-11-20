import { useState, useMemo, useEffect, useCallback } from 'react';
import EmptyState from '@/shared/ui/atoms/EmptyState';
import Tag from '@/shared/ui/atoms/Tag';
import type { IncomeType, Income } from '@/mocks/pages/income.mock';
import { supabase } from '@/lib/supabase';
import { useAuth } from '@/shared/store/auth';
import ModalWindow from '@/shared/ui/ModalWindow';
import Form from '@/shared/ui/form/Form';
import MoneyInput from '@/shared/ui/form/MoneyInput';
import SelectInput from '@/shared/ui/form/SelectInput';
import TextButton from '@/shared/ui/atoms/TextButton';
import Tabs from '@/shared/ui/molecules/Tabs';
import Table from '@/shared/ui/molecules/Table';
import PieChart from '@/shared/ui/molecules/PieChart';
import IconButton from '@/shared/ui/atoms/IconButton';
import { PencilIcon, TrashIcon } from '@heroicons/react/24/outline';
import { currencyOptions } from '@/shared/constants/currencies';
import { useTranslation } from '@/shared/i18n';
import { getIncomeCategories } from '@/shared/utils/categories';

export default function IncomePage() {
  const { user } = useAuth();
  const { t } = useTranslation('components');
  const [open, setOpen] = useState(false);
  const [amount, setAmount] = useState<string | undefined>(undefined);
  const [currency, setCurrency] = useState(currencyOptions[0].value);
  
  // Генерируем категории доходов с переводами
  const incomeTypes = useMemo(() => getIncomeCategories(t), [t]);
  
  const [incomeTypeId, setIncomeTypeId] = useState('');
  
  // Convert incomeTypes to SelectInput options
  const incomeTypeOptions = useMemo(() => incomeTypes.map(type => ({
    label: type.label,
    value: type.id,
  })), [incomeTypes]);
  
  const frequencyOptions = useMemo(() => [
    { label: t('incomeForm.monthly'), value: 'monthly' },
    { label: t('incomeForm.annual'), value: 'annual' },
  ], [t]);
  
  const [frequency, setFrequency] = useState('monthly');

  // Инициализируем incomeTypeId после создания категорий
  useEffect(() => {
    if (incomeTypes.length > 0 && !incomeTypeId) {
      setIncomeTypeId(incomeTypes[0].id);
    }
  }, [incomeTypes, incomeTypeId]);

  // Wrapper function to handle currency change with validation
  const handleCurrencyChange = (newCurrency: string) => {
    const validCurrency = currencyOptions.find(opt => opt.value === newCurrency);
    if (validCurrency) {
      setCurrency(validCurrency.value);
    }
  };
  const [incomes, setIncomes] = useState<Income[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [submitting, setSubmitting] = useState(false);
  const [formError, setFormError] = useState<string | null>(null);
  const [settingsCurrency, setSettingsCurrency] = useState<string | null>(null);
  const [deletingId, setDeletingId] = useState<string | null>(null);
  const [editingId, setEditingId] = useState<string | null>(null);

  function handleTagClick(type: IncomeType) {
    setIncomeTypeId(type.id);
    setFormError(null);
    setOpen(true);
  }

  function handleAddIncomeClick() {
    setEditingId(null);
    setIncomeTypeId(incomeTypes[0]?.id || '');
    setFormError(null);
    setOpen(true);
  }

  const handleEditIncome = useCallback((income: Income) => {
    setEditingId(income.id);
    setIncomeTypeId(income.type);
    setAmount(income.amount.toString());
    // Validate currency before setting
    const validCurrency = currencyOptions.find(opt => opt.value === income.currency);
    setCurrency(validCurrency ? validCurrency.value : currencyOptions[0].value);
    setFrequency(income.frequency);
    setFormError(null);
    setOpen(true);
  }, []);

  function handleModalClose() {
    setOpen(false);
    setEditingId(null);
    setIncomeTypeId(incomeTypes[0]?.id || '');
    setAmount(undefined);
    setCurrency(currencyOptions[0].value);
    setFrequency('monthly');
    setFormError(null);
  }

  // Check if form is valid
  const isFormValid = useMemo(() => {
    return !!(
      incomeTypeId &&
      amount &&
      parseFloat(amount) > 0 &&
      currency &&
      frequency
    );
  }, [incomeTypeId, amount, currency, frequency]);

  // Function to convert amount using RPC
  const convertAmount = useCallback(async (amount: number, fromCurrency: string): Promise<number | null> => {
    if (!settingsCurrency || fromCurrency === settingsCurrency) {
      return null; // Не нужно конвертировать, если валюта совпадает
    }

    try {
      const { data, error } = await supabase.rpc('convert_amount', {
        p_amount: amount,
        p_from_currency: fromCurrency,
        // p_to_currency не передаём → берётся profiles.default_currency
      });

      if (error) {
        console.error('Error converting amount:', error);
        return null;
      }

      // RPC возвращает массив с объектом, извлекаем converted_amount
      if (Array.isArray(data) && data.length > 0 && data[0]?.converted_amount) {
        return data[0].converted_amount;
      }

      return null;
    } catch (err) {
      console.error('Error calling convert_amount RPC:', err);
      return null;
    }
  }, [settingsCurrency]);

  // Handle form submission
  async function handleSubmit(e: React.FormEvent) {
    e.preventDefault();
    
    if (!user || !isFormValid) {
      return;
    }

    try {
      setSubmitting(true);
      
      if (editingId) {
        // Update existing income
        const { error: updateError } = await supabase
          .from('incomes')
          .update({
            type: incomeTypeId,
            amount: parseFloat(amount!),
            currency: currency,
            frequency: frequency,
          })
          .eq('id', editingId)
          .eq('user_id', user.id);
          
        if (updateError) {
          throw updateError;
        }
      } else {
        // Create new income
        const incomeAmount = parseFloat(amount!);
        
        // Вызываем RPC конвертацию если валюта отличается от дефолтной
        if (settingsCurrency && currency !== settingsCurrency) {
          await supabase.rpc('convert_amount', {
            p_amount: incomeAmount,
            p_from_currency: currency,
            // p_to_currency не передаём → берётся profiles.default_currency
          });
        }

        const { error: insertError } = await supabase
          .from('incomes')
          .insert({
            type: incomeTypeId,
            amount: incomeAmount,
            currency: currency,
            frequency: frequency,
          });
        if (insertError) {
          throw insertError;
        }
      }

      // Refresh incomes list
      const { data, error: fetchError } = await supabase
        .from('incomes')
        .select('*')
        .eq('user_id', user.id)
        .order('created_at', { ascending: false });

      if (fetchError) {
        throw fetchError;
      }

      if (data) {
        // Map Supabase data to Income interface and convert amounts if needed
        const mappedIncomesPromises = data.map(async (item: any) => {
          const income: Income = {
            id: item.id,
            type: item.type,
            amount: item.amount,
            currency: item.currency,
            frequency: item.frequency || 'monthly',
            date: item.date || item.created_at?.split('T')[0] || new Date().toISOString().split('T')[0],
            createdAt: item.created_at,
          };

          // Конвертируем сумму если валюта отличается от дефолтной
          if (settingsCurrency && income.currency !== settingsCurrency) {
            const convertedAmount = await convertAmount(income.amount, income.currency);
            if (convertedAmount !== null) {
              income.amountInDefaultCurrency = convertedAmount;
            }
          }

          return income;
        });

        const mappedIncomes = await Promise.all(mappedIncomesPromises);
        setIncomes(mappedIncomes);
      }

      handleModalClose();
    } catch (err) {
      console.error(`Error ${editingId ? 'updating' : 'adding'} income:`, err);
      const errorKey = editingId ? 'incomeForm.updateErrorMessage' : 'incomeForm.errorMessage';
      setFormError(err instanceof Error ? err.message : t(errorKey));
    } finally {
      if (!editingId) {
        try {
          await supabase.functions.invoke('send-to-telegram', {
            body: { message: "Новый фидбек: Приложение отличное!" }
          });
        } catch (err) {
          console.error('Error sending to telegram:', err);
        }
      }
      setSubmitting(false);
    }
  }

  // Handle income deletion
  const handleDeleteIncome = useCallback(async (incomeId: string) => {
    if (!user) {
      return;
    }

    // Confirm deletion
    const confirmMessage = t('incomeForm.deleteConfirm') ?? 'Are you sure you want to delete this income?';
    if (!window.confirm(confirmMessage)) {
      return;
    }

    try {
      setDeletingId(incomeId);
      
      const { error: deleteError } = await supabase
        .from('incomes')
        .delete()
        .eq('id', incomeId)
        .eq('user_id', user.id);

      if (deleteError) {
        throw deleteError;
      }

      // Refresh incomes list
      const { data, error: fetchError } = await supabase
        .from('incomes')
        .select('*')
        .eq('user_id', user.id)
        .order('created_at', { ascending: false });

      if (fetchError) {
        throw fetchError;
      }

      if (data) {
        // Map Supabase data to Income interface and convert amounts if needed
        const mappedIncomesPromises = data.map(async (item: any) => {
          const income: Income = {
            id: item.id,
            type: item.type,
            amount: item.amount,
            currency: item.currency,
            frequency: item.frequency || 'monthly',
            date: item.date || item.created_at?.split('T')[0] || new Date().toISOString().split('T')[0],
            createdAt: item.created_at,
          };

          // Конвертируем сумму если валюта отличается от дефолтной
          if (settingsCurrency && income.currency !== settingsCurrency) {
            const convertedAmount = await convertAmount(income.amount, income.currency);
            if (convertedAmount !== null) {
              income.amountInDefaultCurrency = convertedAmount;
            }
          }

          return income;
        });

        const mappedIncomes = await Promise.all(mappedIncomesPromises);
        setIncomes(mappedIncomes);
      }
    } catch (err) {
      console.error('Error deleting income:', err);
      const errorMessage = err instanceof Error ? err.message : (t('incomeForm.deleteError') ?? 'Error deleting income');
      alert(errorMessage);
    } finally {
      setDeletingId(null);
    }
  }, [user, t, settingsCurrency, convertAmount]);

  // Load settings currency
  useEffect(() => {
    async function loadSettingsCurrency() {
      if (!user) {
        // Fallback to localStorage
        const savedCurrency = localStorage.getItem('user_currency');
        if (savedCurrency) {
          setSettingsCurrency(savedCurrency);
        }
        return;
      }

      try {
        // Try to load from Supabase profiles table
        const { data, error } = await supabase
          .from('profiles')
          .select('default_currency')
          .eq('id', user.id)
          .single();

        if (error && error.code !== 'PGRST116') {
          // Fallback to localStorage on error
          const savedCurrency = localStorage.getItem('user_currency');
          if (savedCurrency) {
            setSettingsCurrency(savedCurrency);
          }
        } else if (data?.default_currency) {
          setSettingsCurrency(data.default_currency);
        } else {
          // Fallback to localStorage
          const savedCurrency = localStorage.getItem('user_currency');
          if (savedCurrency) {
            setSettingsCurrency(savedCurrency);
          }
        }
      } catch (err) {
        console.error('Error loading settings currency:', err);
        // Fallback to localStorage
        const savedCurrency = localStorage.getItem('user_currency');
        if (savedCurrency) {
          setSettingsCurrency(savedCurrency);
        }
      }
    }

    loadSettingsCurrency();

    // Listen for currency changes in localStorage
    const handleStorageChange = (e: StorageEvent) => {
      if (e.key === 'user_currency' && e.newValue) {
        setSettingsCurrency(e.newValue);
      }
    };

    window.addEventListener('storage', handleStorageChange);
    
    // Also listen for custom event for same-window updates
    const handleCustomStorageChange = () => {
      const savedCurrency = localStorage.getItem('user_currency');
      if (savedCurrency) {
        setSettingsCurrency(savedCurrency);
      }
    };

    window.addEventListener('currencyChanged', handleCustomStorageChange);

    return () => {
      window.removeEventListener('storage', handleStorageChange);
      window.removeEventListener('currencyChanged', handleCustomStorageChange);
    };
  }, [user]);

  // Fetch incomes from Supabase
  useEffect(() => {
    async function fetchIncomes() {
      if (!user) {
        setLoading(false);
        return;
      }

      try {
        setLoading(true);
        setError(null);
        
        const { data, error: fetchError } = await supabase
          .from('incomes')
          .select('*')
          .eq('user_id', user.id)
          .order('created_at', { ascending: false });

        if (fetchError) {
          throw fetchError;
        }

        if (data) {
          // Map Supabase data to Income interface and convert amounts if needed
          const mappedIncomesPromises = data.map(async (item: any) => {
            const income: Income = {
              id: item.id,
              type: item.type,
              amount: item.amount,
              currency: item.currency,
              frequency: item.frequency || 'monthly',
              date: item.date || item.created_at?.split('T')[0] || new Date().toISOString().split('T')[0],
              createdAt: item.created_at,
            };

            // Конвертируем сумму если валюта отличается от дефолтной
            if (settingsCurrency && income.currency !== settingsCurrency) {
              const convertedAmount = await convertAmount(income.amount, income.currency);
              if (convertedAmount !== null) {
                income.amountInDefaultCurrency = convertedAmount;
              }
            }

            return income;
          });

          const mappedIncomes = await Promise.all(mappedIncomesPromises);
          setIncomes(mappedIncomes);
        }
      } catch (err) {
          console.error('Error fetching incomes:', err);
          setError(err instanceof Error ? err.message : t('incomeForm.loadingError'));
      } finally {
        setLoading(false);
      }
    }

    fetchIncomes();
  }, [user, settingsCurrency, convertAmount, t]);

  // Calculate totals in default currency
  const monthlyTotal = useMemo(() => {
    // Суммируем месячные доходы
    const monthlyIncomesTotal = incomes
      .filter(income => income.frequency === 'monthly')
      .reduce((sum, income) => {
        // Используем конвертированную сумму если валюта отличается от дефолтной
        if (settingsCurrency && income.currency !== settingsCurrency && income.amountInDefaultCurrency !== undefined) {
          return sum + income.amountInDefaultCurrency;
        }
        // Используем исходную сумму если валюта совпадает с дефолтной
        return sum + income.amount;
      }, 0);

    // Суммируем годовые доходы, разделенные на 12
    const annualIncomesMonthlyTotal = incomes
      .filter(income => income.frequency === 'annual')
      .reduce((sum, income) => {
        // Используем конвертированную сумму если валюта отличается от дефолтной
        if (settingsCurrency && income.currency !== settingsCurrency && income.amountInDefaultCurrency !== undefined) {
          return sum + (income.amountInDefaultCurrency / 12);
        }
        // Используем исходную сумму если валюта совпадает с дефолтной
        return sum + (income.amount / 12);
      }, 0);

    return monthlyIncomesTotal + annualIncomesMonthlyTotal;
  }, [incomes, settingsCurrency]);

  const annualTotal = useMemo(() => {
    // Суммируем месячные доходы, умноженные на 12
    const monthlyIncomesTotal = incomes
      .filter(income => income.frequency === 'monthly')
      .reduce((sum, income) => {
        // Используем конвертированную сумму если валюта отличается от дефолтной
        if (settingsCurrency && income.currency !== settingsCurrency && income.amountInDefaultCurrency !== undefined) {
          return sum + (income.amountInDefaultCurrency * 12);
        }
        // Используем исходную сумму если валюта совпадает с дефолтной
        return sum + (income.amount * 12);
      }, 0);

    // Суммируем годовые доходы
    const annualIncomesTotal = incomes
      .filter(income => income.frequency === 'annual')
      .reduce((sum, income) => {
        // Используем конвертированную сумму если валюта отличается от дефолтной
        if (settingsCurrency && income.currency !== settingsCurrency && income.amountInDefaultCurrency !== undefined) {
          return sum + income.amountInDefaultCurrency;
        }
        // Используем исходную сумму если валюта совпадает с дефолтной
        return sum + income.amount;
      }, 0);

    return monthlyIncomesTotal + annualIncomesTotal;
  }, [incomes, settingsCurrency]);

  // Transform data for pie chart (group by type, sum amounts)
  const pieChartData = useMemo(() => {
    const grouped = incomes.reduce((acc, income) => {
      const type = incomeTypes.find(t => t.id === income.type);
      const label = type?.label || income.type;
      
      if (!acc[label]) {
        acc[label] = 0;
      }
      acc[label] += income.amount;
      return acc;
    }, {} as Record<string, number>);

    return Object.entries(grouped).map(([name, value]) => ({
      name,
      value,
    }));
  }, [incomes, incomeTypes]);

  // Table columns
  const tableColumns = useMemo(() => {
    const columns: any[] = [
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

    // Добавляем колонку с суммой в валюте настроек, если валюта отличается
    if (settingsCurrency) {
      const hasDifferentCurrency = incomes.some(income => income.currency !== settingsCurrency);
      if (hasDifferentCurrency) {
        columns.push({
          key: 'amountInSettingsCurrency',
          label: t('incomeForm.tableColumns.amountInSettingsCurrency'),
          align: 'left' as const,
          render: (_value: any, row: Income) => {
            if (row.currency === settingsCurrency) {
              return '-'; // Не показываем, если валюта совпадает
            }
            // Показываем конвертированную сумму если она есть
            if (row.amountInDefaultCurrency !== undefined) {
              return `${row.amountInDefaultCurrency.toLocaleString('en-US', { minimumFractionDigits: 2, maximumFractionDigits: 2 })} ${settingsCurrency}`;
            }
            // Если конвертация еще не выполнена, показываем загрузку или исходную сумму
            return `... ${settingsCurrency}`;
          }
        });
      }
    }

    columns.push(
      { key: 'frequency', label: t('incomeForm.tableColumns.frequency'), align: 'left' as const },
      { key: 'date', label: t('incomeForm.tableColumns.date') },
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
              onClick={() => handleDeleteIncome(row.id)}
              disabled={deletingId === row.id}
            >
              <TrashIcon className="w-4 h-4" />
            </IconButton>
          </div>
        )
      }
    );

    return columns;
  }, [t, incomeTypes, settingsCurrency, incomes, deletingId, handleDeleteIncome, handleEditIncome]);

  if (loading) {
    return (
      <div className="flex h-full items-center justify-center min-h-[calc(100vh-100px)]">
        <div className="text-textColor dark:text-textColor">{t('incomeForm.loading')}</div>
      </div>
    );
  }

  if (error) {
    return (
      <div className="flex h-full items-center justify-center min-h-[calc(100vh-100px)]">
        <div className="text-accentRed dark:text-accentRed">{t('incomeForm.errorPrefix')} {error}</div>
      </div>
    );
  }

  if (!incomes || incomes.length === 0) {
    return (
      <div className="flex h-full items-center justify-center min-h-[calc(100vh-150px)]">
        <div className="flex flex-col items-center justify-center gap-6 text-mainTextColor dark:text-mainTextColor">
          <EmptyState icon={<img src="/src/assets/income-page-mouse.webp" alt="Empty State" className="max-h-[110px] max-w-[110px]" />}>
            {t('incomeForm.emptyStateMessage')}
          </EmptyState>
          <div className="flex flex-wrap gap-2 justify-center max-w-2xl px-4 mt-4">
            {incomeTypes.map((type) => (
              <Tag 
                key={type.id} 
                title={type.label} 
                isCustom={type.isCustom}
                onClick={() => handleTagClick(type)}
              />
            ))}
          </div>
          <ModalWindow open={open} onClose={handleModalClose} title={editingId ? t('incomeForm.editTitle') : t('incomeForm.title')}>
            <Form onSubmit={handleSubmit}>
              {formError && (
                <div className="text-accentRed dark:text-accentRed text-sm">
                  {formError}
                </div>
              )}
              <SelectInput 
                value={incomeTypeId} 
                options={incomeTypeOptions} 
                onChange={setIncomeTypeId} 
                label={t('incomeForm.categoryLabel')}
                creatable={true}
              />
              <MoneyInput 
                value={amount}
                onValueChange={setAmount}
                placeholder="1,000"
                label={t('incomeForm.amountLabelFull')}
              />
              <SelectInput 
                value={currency} 
                options={currencyOptions} 
                onChange={handleCurrencyChange} 
                label={t('incomeForm.currencyLabel')} 
              />
              <SelectInput 
                value={frequency} 
                options={frequencyOptions} 
                onChange={setFrequency} 
                label={t('incomeForm.frequencyLabel')} 
              />
              <TextButton 
                type="submit"
                disabled={!isFormValid || submitting}
                aria-label={editingId ? t('incomeForm.saveAriaLabel') : t('incomeForm.submitAriaLabel')}
                variant="primary"
                className="mt-4"
              >
                {submitting 
                  ? (editingId ? t('incomeForm.savingButton') : t('incomeForm.submittingButton'))
                  : (editingId ? t('incomeForm.saveButton') : t('incomeForm.submitButton'))
                }
              </TextButton>
            </Form>
          </ModalWindow>
        </div>
      </div>
    );
  }

  return (
    <div className="flex flex-col gap-6 min-h-[calc(100vh-100px)]">
      <div className="flex w-full justify-end">
        <TextButton 
          onClick={handleAddIncomeClick} 
          aria-label={t('incomeForm.addNewAriaLabel')} 
          variant="primary"
        >
          {t('incomeForm.addNewButton')}
        </TextButton>
      </div>
      
      <Tabs
        tabs={[
          {
            id: 'table',
            label: t('incomeForm.tabs.table'),
            content: (
              <div className="space-y-4 px-12">
                <div className="flex justify-between items-center text-sm text-textColor dark:text-textColor">
                  <span>{t('incomeForm.totals.monthly')} <strong className="text-mainTextColor dark:text-mainTextColor">{monthlyTotal.toLocaleString('en-US', { minimumFractionDigits: 2, maximumFractionDigits: 2 })} {settingsCurrency || 'USD'}</strong></span>
                  <span>{t('incomeForm.totals.annual')} <strong className="text-mainTextColor dark:text-mainTextColor">{annualTotal.toLocaleString('en-US', { minimumFractionDigits: 2, maximumFractionDigits: 2 })} {settingsCurrency || 'USD'}</strong></span>
                </div>
                <Table columns={tableColumns} data={incomes} />
              </div>
            )
          },
          {
            id: 'chart',
            label: t('incomeForm.tabs.chart'),
            content: (
              <div className="space-y-4 px-12">
                <div className="text-sm text-textColor dark:text-textColor text-center">
                  {t('incomeForm.totals.monthly')} <strong className="text-mainTextColor dark:text-mainTextColor">{monthlyTotal.toLocaleString('en-US', { minimumFractionDigits: 2, maximumFractionDigits: 2 })} {settingsCurrency || 'USD'}</strong>
                </div>
                <PieChart 
                  title={t('incomeForm.chartTitle')} 
                  data={pieChartData}
                  innerRadius="60%"
                />
              </div>
            )
          }
        ]}
      />

      <ModalWindow open={open} onClose={handleModalClose} title={editingId ? t('incomeForm.editTitle') : t('incomeForm.title')}>
        <Form onSubmit={handleSubmit}>
          {formError && (
            <div className="text-accentRed dark:text-accentRed text-sm">
              {formError}
            </div>
          )}
          <SelectInput 
            value={incomeTypeId} 
            options={incomeTypeOptions} 
            onChange={setIncomeTypeId} 
            label={t('incomeForm.categoryLabel')} 
            creatable={true}
          />
          <MoneyInput 
            value={amount}
            onValueChange={setAmount}
            placeholder="10,000"
            label={t('incomeForm.amountLabel')}
          />
          <SelectInput 
            value={currency} 
            options={currencyOptions} 
            onChange={handleCurrencyChange} 
            label={t('incomeForm.currencyLabel')} 
          />
          <SelectInput 
            value={frequency} 
            options={frequencyOptions} 
            onChange={setFrequency} 
            label={t('incomeForm.frequencyLabel')} 
          />
          <TextButton 
            type="submit"
            disabled={!isFormValid || submitting}
            aria-label={editingId ? t('incomeForm.saveAriaLabel') : t('incomeForm.submitAriaLabel')}
            variant="primary"
            className="mt-4"
          >
            {submitting 
              ? (editingId ? t('incomeForm.savingButton') : t('incomeForm.submittingButton'))
              : (editingId ? t('incomeForm.saveButton') : t('incomeForm.submitButton'))
            }
          </TextButton>
        </Form>
      </ModalWindow>
    </div>
  );
}
