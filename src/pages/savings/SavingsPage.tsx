import EmptyState from '@/shared/ui/atoms/EmptyState';
import TextButton from '@/shared/ui/atoms/TextButton';
import { useState, useEffect, useMemo, useCallback } from 'react';
import { supabase } from '@/lib/supabase';
import { useAuth } from '@/shared/store/auth';
import ModalWindow from '@/shared/ui/ModalWindow';
import Form from '@/shared/ui/form/Form';
import TextInput from '@/shared/ui/form/TextInput';
import MoneyInput from '@/shared/ui/form/MoneyInput';
import SelectInput from '@/shared/ui/form/SelectInput';
import { currencyOptions } from '@/shared/constants/currencies';
import { useTranslation } from '@/shared/i18n';
import Tabs from '@/shared/ui/molecules/Tabs';
import Table from '@/shared/ui/molecules/Table';
import PieChart from '@/shared/ui/molecules/PieChart';
import IconButton from '@/shared/ui/atoms/IconButton';
import { PencilIcon, TrashIcon } from '@heroicons/react/24/outline';

interface Saving {
  id: string;
  comment: string;
  amount: number;
  currency: string;
  createdAt: string;
  amountInDefaultCurrency?: number;
}

export default function SavingsPage() {
  const { user } = useAuth();
  const { t } = useTranslation('components');
  // State to control modal open/close and editing target
  const [open, setOpen] = useState(false);
  const [editingSaving, setEditingSaving] = useState<Saving | null>(null);
  const [savings, setSavings] = useState<Saving[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  
  // Form state
  const [comment, setComment] = useState('');
  const [amount, setAmount] = useState<string | undefined>(undefined);
  const [currency, setCurrency] = useState(currencyOptions[0].value);
  const [submitting, setSubmitting] = useState(false);
  const [formError, setFormError] = useState<string | null>(null);
  const [settingsCurrency, setSettingsCurrency] = useState<string | null>(null);
  const [deletingId, setDeletingId] = useState<string | null>(null);
  // Состояние для выбранной валюты в колонке конвертации (по умолчанию settingsCurrency)
  const [selectedConversionCurrency, setSelectedConversionCurrency] = useState<string | null>(null);
  // Кэш конвертированных сумм: ключ = `${savingId}_${toCurrency}`, значение = конвертированная сумма
  const [convertedAmountsCache, setConvertedAmountsCache] = useState<Record<string, number>>({});
  // Состояние для отслеживания загрузки конвертации
  const [convertingIds, setConvertingIds] = useState<Set<string>>(new Set());

  // Load settings currency
  useEffect(() => {
    async function loadSettingsCurrency() {
      if (!user) {
        const savedCurrency = localStorage.getItem('user_currency');
        if (savedCurrency) {
          setSettingsCurrency(savedCurrency);
        }
        return;
      }

      try {
        const { data, error } = await supabase
          .from('profiles')
          .select('default_currency')
          .eq('id', user.id)
          .single();

        if (error && error.code !== 'PGRST116') {
          const savedCurrency = localStorage.getItem('user_currency');
          if (savedCurrency) {
            setSettingsCurrency(savedCurrency);
          }
        } else if (data?.default_currency) {
          setSettingsCurrency(data.default_currency);
        } else {
          const savedCurrency = localStorage.getItem('user_currency');
          if (savedCurrency) {
            setSettingsCurrency(savedCurrency);
          }
        }
      } catch (err) {
        console.error('Error loading settings currency:', err);
        const savedCurrency = localStorage.getItem('user_currency');
        if (savedCurrency) {
          setSettingsCurrency(savedCurrency);
        }
      }
    }

    loadSettingsCurrency();

    const handleStorageChange = (e: StorageEvent) => {
      if (e.key === 'user_currency' && e.newValue) {
        setSettingsCurrency(e.newValue);
      }
    };

    window.addEventListener('storage', handleStorageChange);
    
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

  // Set default currency from settings when loaded
  useEffect(() => {
    if (settingsCurrency) {
      const validCurrency = currencyOptions.find(opt => opt.value === settingsCurrency);
      if (validCurrency && currency === currencyOptions[0].value) {
        setCurrency(validCurrency.value);
      }
    }
  }, [settingsCurrency, currency]);

  // Wrapper function to handle currency change with validation
  const handleCurrencyChange = (newCurrency: string) => {
    const validCurrency = currencyOptions.find(opt => opt.value === newCurrency);
    if (validCurrency) {
      setCurrency(validCurrency.value);
    }
  };

  // Function to convert amount using RPC
  const convertAmount = useCallback(async (amount: number, fromCurrency: string, toCurrency?: string): Promise<number | null> => {
    const targetCurrency = toCurrency || settingsCurrency;
    if (!targetCurrency || fromCurrency === targetCurrency) {
      return null; // Не нужно конвертировать, если валюта совпадает
    }

    try {
      const { data, error } = await supabase.rpc('convert_amount', {
        p_amount: amount,
        p_from_currency: fromCurrency,
        ...(toCurrency ? { p_to_currency: toCurrency } : {}),
        // Если p_to_currency не передаём → берётся profiles.default_currency
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

  // Function to convert multiple amounts using batch RPC
  const convertAmountsBulk = useCallback(async (
    items: Array<{ amount: number; currency: string }>,
    toCurrency?: string
  ): Promise<Map<number, number> | null> => {
    const targetCurrency = toCurrency || settingsCurrency;
    if (!targetCurrency || items.length === 0) {
      return null;
    }

    try {
      const { data, error } = await supabase.rpc('convert_amount_bulk', {
        p_items: items,
        // supabase сам превратит это в JSONB
        ...(toCurrency ? { p_to_currency: toCurrency } : {}),
        // p_to_currency не передаём → используется profiles.default_currency
      });

      if (error) {
        console.error('Error converting amounts bulk:', error);
        return null;
      }

      // RPC возвращает массив результатов
      // Предполагаем формат: [{amount, currency, converted_amount}, ...]
      // Порядок результатов должен соответствовать порядку items
      const resultMap = new Map<number, number>();
      
      if (Array.isArray(data)) {
        data.forEach((item: any, index: number) => {
          if (item.converted_amount !== undefined && items[index]) {
            // Используем индекс для сопоставления с исходным items
            resultMap.set(index, item.converted_amount);
          }
        });
      }

      return resultMap;
    } catch (err) {
      console.error('Error calling convert_amount_bulk RPC:', err);
      return null;
    }
  }, [settingsCurrency]);

  function handleCreateSaving() {
    setEditingSaving(null);
    setComment('');
    setAmount(undefined);
    const defaultCurrency = settingsCurrency || currencyOptions[0].value;
    const validCurrency = currencyOptions.find(opt => opt.value === defaultCurrency);
    setCurrency(validCurrency ? validCurrency.value : currencyOptions[0].value);
    setFormError(null);
    setOpen(true);
  }

  function handleEditSaving(saving: Saving) {
    setEditingSaving(saving);
    setComment(saving.comment || '');
    setAmount(saving.amount.toString());
    const validCurrency = currencyOptions.find(opt => opt.value === saving.currency);
    if (validCurrency) {
      setCurrency(validCurrency.value);
    } else {
      setCurrency(currencyOptions[0].value);
    }
    setFormError(null);
    setOpen(true);
  }

  const handleDeleteSaving = useCallback(async (saving: Saving) => {
    if (!user) {
      return;
    }

    if (!window.confirm(t('savingsForm.deleteConfirm') || `Вы уверены, что хотите удалить накопление "${saving.comment || 'без названия'}"?`)) {
      return;
    }

    try {
      setDeletingId(saving.id);
      
      const { error } = await supabase
        .from('savings')
        .delete()
        .eq('id', saving.id)
        .eq('user_id', user.id);

      if (error) {
        throw error;
      }

      // Refresh savings list
      const { data, error: fetchError } = await supabase
        .from('savings')
        .select('*')
        .eq('user_id', user.id)
        .order('created_at', { ascending: false });

      if (fetchError) {
        throw fetchError;
      }

      if (data) {
        // Map Supabase data to Saving interface and convert amounts if needed
        const mappedSavingsPromises = data.map(async (item: any) => {
          const saving: Saving = {
            id: item.id,
            comment: item.comment || '',
            amount: item.amount || 0,
            currency: item.currency,
            createdAt: item.created_at,
          };

          // Конвертируем сумму если валюта отличается от дефолтной
          if (settingsCurrency && saving.currency !== settingsCurrency) {
            const convertedAmount = await convertAmount(saving.amount, saving.currency);
            if (convertedAmount !== null) {
              saving.amountInDefaultCurrency = convertedAmount;
            }
          }

          return saving;
        });

        const mappedSavings = await Promise.all(mappedSavingsPromises);
        setSavings(mappedSavings);
        
        // Автоматически заполняем кэш для дефолтной валюты, если есть накопления с разными валютами
        if (settingsCurrency) {
          const hasDifferentCurrency = mappedSavings.some(saving => saving.currency !== settingsCurrency);
          if (hasDifferentCurrency) {
            // Используем amountInDefaultCurrency из уже конвертированных данных для кэша
            const initialCache: Record<string, number> = {};
            mappedSavings.forEach(saving => {
              if (saving.amountInDefaultCurrency !== undefined && saving.currency !== settingsCurrency) {
                const cacheKey = `${saving.id}_${settingsCurrency}`;
                initialCache[cacheKey] = saving.amountInDefaultCurrency;
              }
            });
            if (Object.keys(initialCache).length > 0) {
              setConvertedAmountsCache(prev => ({ ...prev, ...initialCache }));
            }
          }
        }
      }

      // Trigger event to update sidebar if needed
      window.dispatchEvent(new Event('savingUpdated'));
    } catch (err) {
      console.error('Error deleting saving:', err);
      alert(err instanceof Error ? err.message : t('savingsForm.deleteError') || 'Ошибка при удалении накопления');
    } finally {
      setDeletingId(null);
    }
  }, [user, t]);

  function handleModalClose() {
    setOpen(false);
    setEditingSaving(null);
    setComment('');
    setAmount(undefined);
    const defaultCurrency = settingsCurrency || currencyOptions[0].value;
    const validCurrency = currencyOptions.find(opt => opt.value === defaultCurrency);
    setCurrency(validCurrency ? validCurrency.value : currencyOptions[0].value);
    setFormError(null);
  }

  // Check if form is valid
  const isFormValid = useMemo(() => {
    return !!(
      comment.trim() &&
      amount &&
      parseFloat(amount) > 0 &&
      currency
    );
  }, [comment, amount, currency]);

  // Handle form submission
  async function handleSubmit(e: React.FormEvent) {
    e.preventDefault();
    
    if (!user || !isFormValid) {
      return;
    }

    try {
      setSubmitting(true);
      setFormError(null);
      
      const savingData = {
        user_id: user.id,
        comment: comment.trim(),
        amount: parseFloat(amount!),
        currency: currency,
      };

      if (editingSaving) {
        // Update existing saving
        const { error: updateError } = await supabase
          .from('savings')
          .update(savingData)
          .eq('id', editingSaving.id)
          .eq('user_id', user.id);

        if (updateError) {
          throw updateError;
        }
      } else {
        // Create new saving
        const { error: insertError } = await supabase
          .from('savings')
          .insert(savingData);

        if (insertError) {
          throw insertError;
        }
      }

      // Refresh savings list
      const { data, error: fetchError } = await supabase
        .from('savings')
        .select('*')
        .eq('user_id', user.id)
        .order('created_at', { ascending: false });

      if (fetchError) {
        throw fetchError;
      }

      if (data) {
        // Map Supabase data to Saving interface and convert amounts if needed
        const mappedSavingsPromises = data.map(async (item: any) => {
          const saving: Saving = {
            id: item.id,
            comment: item.comment || '',
            amount: item.amount || 0,
            currency: item.currency,
            createdAt: item.created_at,
          };

          // Конвертируем сумму если валюта отличается от дефолтной
          if (settingsCurrency && saving.currency !== settingsCurrency) {
            const convertedAmount = await convertAmount(saving.amount, saving.currency);
            if (convertedAmount !== null) {
              saving.amountInDefaultCurrency = convertedAmount;
            }
          }

          return saving;
        });

        const mappedSavings = await Promise.all(mappedSavingsPromises);
        setSavings(mappedSavings);
      }

      handleModalClose();
    } catch (err) {
      console.error('Error saving saving:', err);
      setFormError(err instanceof Error ? err.message : t('savingsForm.errorMessage'));
    } finally {
      setSubmitting(false);
    }
  }

  // Fetch savings from Supabase
  useEffect(() => {
    async function fetchSavings() {
      if (!user) {
        setLoading(false);
        return;
      }

      try {
        setLoading(true);
        setError(null);
        
        const { data, error: fetchError } = await supabase
          .from('savings')
          .select('*')
          .eq('user_id', user.id)
          .order('created_at', { ascending: false });

        if (fetchError) {
          throw fetchError;
        }

      if (data) {
        // Map Supabase data to Saving interface and convert amounts if needed
        const mappedSavingsPromises = data.map(async (item: any) => {
          const saving: Saving = {
            id: item.id,
            comment: item.comment || '',
            amount: item.amount || 0,
            currency: item.currency,
            createdAt: item.created_at,
          };

          // Конвертируем сумму если валюта отличается от дефолтной
          if (settingsCurrency && saving.currency !== settingsCurrency) {
            const convertedAmount = await convertAmount(saving.amount, saving.currency);
            if (convertedAmount !== null) {
              saving.amountInDefaultCurrency = convertedAmount;
            }
          }

          return saving;
        });

        const mappedSavings = await Promise.all(mappedSavingsPromises);
        setSavings(mappedSavings);
        
        // Автоматически заполняем кэш для дефолтной валюты, если есть накопления с разными валютами
        if (settingsCurrency) {
          const hasDifferentCurrency = mappedSavings.some(saving => saving.currency !== settingsCurrency);
          if (hasDifferentCurrency) {
            // Используем amountInDefaultCurrency из уже конвертированных данных для кэша
            const initialCache: Record<string, number> = {};
            mappedSavings.forEach(saving => {
              if (saving.amountInDefaultCurrency !== undefined && saving.currency !== settingsCurrency) {
                const cacheKey = `${saving.id}_${settingsCurrency}`;
                initialCache[cacheKey] = saving.amountInDefaultCurrency;
              }
            });
            if (Object.keys(initialCache).length > 0) {
              setConvertedAmountsCache(prev => ({ ...prev, ...initialCache }));
            }
            // Устанавливаем дефолтную валюту как выбранную для конвертации
            if (!selectedConversionCurrency) {
              setSelectedConversionCurrency(settingsCurrency);
            }
          }
        }
      }
      } catch (err) {
        console.error('Error fetching savings:', err);
        setError(err instanceof Error ? err.message : t('savingsForm.loadingError'));
      } finally {
        setLoading(false);
      }
    }

    fetchSavings();
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [user, settingsCurrency]);

  // Calculate total savings in selected conversion currency
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

  // Transform data for pie chart
  const pieChartData = useMemo(() => {
    return savings.map((saving) => ({
      name: saving.comment || 'Без названия',
      value: saving.amount,
    }));
  }, [savings]);

  // Обработчик изменения валюты для конвертации
  const handleConversionCurrencyChange = useCallback(async (newCurrency: string) => {
    setSelectedConversionCurrency(newCurrency);
    
    // Фильтруем накопления, которые нужно конвертировать
    const savingsToConvert = savings.filter(saving => {
      const cacheKey = `${saving.id}_${newCurrency}`;
      // Пропускаем если валюта совпадает или уже в кэше
      return saving.currency !== newCurrency && convertedAmountsCache[cacheKey] === undefined;
    });

    if (savingsToConvert.length === 0) {
      return;
    }

    // Подготавливаем массив items для batch конвертации
    const items = savingsToConvert.map(saving => ({
      amount: saving.amount,
      currency: saving.currency,
    }));

    // Отмечаем все как конвертируемые
    const cacheKeys = savingsToConvert.map(saving => `${saving.id}_${newCurrency}`);
    setConvertingIds(prev => {
      const newSet = new Set(prev);
      cacheKeys.forEach(key => newSet.add(key));
      return newSet;
    });

    try {
      // Выполняем batch конвертацию одним запросом
      const resultMap = await convertAmountsBulk(items, newCurrency);
      
      if (resultMap) {
        // Обновляем кэш для всех результатов одновременно
        const newCache: Record<string, number> = {};
        
        savingsToConvert.forEach((saving, index) => {
          const cacheKey = `${saving.id}_${newCurrency}`;
          const convertedAmount = resultMap.get(index);
          
          if (convertedAmount !== undefined) {
            newCache[cacheKey] = convertedAmount;
          }
        });

        setConvertedAmountsCache(prev => ({ ...prev, ...newCache }));
      }
    } catch (err) {
      console.error('Error converting amounts bulk:', err);
    } finally {
      // Убираем из convertingIds
      setConvertingIds(prev => {
        const newSet = new Set(prev);
        cacheKeys.forEach(key => newSet.delete(key));
        return newSet;
      });
    }
  }, [savings, convertedAmountsCache, convertAmountsBulk]);

  // Table columns
  const tableColumns = useMemo(() => {
    const columns: any[] = [
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

    // Добавляем колонку с суммой в валюте настроек, если валюта отличается
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
        key: 'createdAt', 
        label: t('savingsForm.tableColumns.date'),
        render: (value: string) => {
          if (!value) return '-';
          const date = new Date(value);
          return date.toLocaleDateString('ru-RU', { day: '2-digit', month: '2-digit', year: 'numeric' });
        }
      },
      {
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
              onClick={() => handleDeleteSaving(row)}
              disabled={deletingId === row.id}
            >
              <TrashIcon className="w-4 h-4" />
            </IconButton>
          </div>
        )
      }
    );

    return columns;
  }, [t, settingsCurrency, savings, deletingId, handleDeleteSaving, selectedConversionCurrency, convertedAmountsCache, convertingIds]);

  if (loading) {
    return (
      <div className="flex h-full items-center justify-center min-h-[calc(100vh-100px)]">
        <div className="text-textColor dark:text-textColor">{t('savingsForm.loading')}</div>
      </div>
    );
  }

  if (error) {
    return (
      <div className="flex h-full items-center justify-center min-h-[calc(100vh-100px)]">
        <div className="text-accentRed dark:text-accentRed">{t('savingsForm.errorPrefix')} {error}</div>
      </div>
    );
  }

  if (!savings || savings.length === 0) {
    return (
      <div className="flex h-full items-center justify-center min-h-[calc(100vh-150px)]">
        <div className="flex flex-col items-center justify-center gap-8 text-mainTextColor dark:text-mainTextColor">
          <EmptyState icon={<img src="/src/assets/savings-page-mouse.webp" alt="Empty State" className="max-h-[200px] max-w-[200px]" />}>
            <span dangerouslySetInnerHTML={{ __html: t('savingsForm.emptyStateMessage') }} />
          </EmptyState>
          <TextButton 
            onClick={handleCreateSaving} 
            aria-label={t('savingsForm.createAriaLabel')} 
            variant="primary"
            className="mt-3"
          >
            {t('savingsForm.createButton')}
          </TextButton>
          <ModalWindow open={open} onClose={handleModalClose} title={editingSaving ? t('savingsForm.editTitle') : t('savingsForm.createTitle')}>
            <Form onSubmit={handleSubmit}>
              {formError && (
                <div className="text-accentRed dark:text-accentRed text-sm">
                  {formError}
                </div>
              )}
              <TextInput 
                value={comment}
                onChange={(e) => setComment(e.target.value)}
                label={t('savingsForm.nameLabel')}
                placeholder={t('savingsForm.namePlaceholder')}
              />
              <MoneyInput 
                value={amount}
                onValueChange={setAmount}
                placeholder="10,000"
                label={t('savingsForm.amountLabel')}
              />
              <SelectInput 
                value={currency} 
                options={currencyOptions} 
                onChange={handleCurrencyChange} 
                label={t('savingsForm.currencyLabel')} 
              />
              <TextButton 
                type="submit"
                disabled={!isFormValid || submitting}
                variant="primary" 
                className="mt-4"
                aria-label={editingSaving ? t('savingsForm.saveAriaLabel') : t('savingsForm.createAriaLabel')}
              >
                {submitting ? (editingSaving ? t('savingsForm.savingButton') : t('savingsForm.creatingButton')) : (editingSaving ? t('savingsForm.saveButton') : t('savingsForm.createButton'))}
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
          onClick={handleCreateSaving} 
          aria-label={t('savingsForm.addNewAriaLabel')} 
          variant="primary"
        >
          {t('savingsForm.addNewButton')}
        </TextButton>
      </div>
      
      <Tabs
        tabs={[
          {
            id: 'table',
            label: t('savingsForm.tabs.table'),
            content: (
              <div className="space-y-2 px-12">
                <div className="flex justify-between items-center text-sm text-textColor dark:text-textColor">
                  <div>
                    <span>{t('savingsForm.totals.total')} <strong className="text-mainTextColor dark:text-mainTextColor">{totalSavings.toLocaleString('en-US', { minimumFractionDigits: 2, maximumFractionDigits: 2 })} {selectedConversionCurrency || settingsCurrency || 'USD'}</strong></span>
                  </div>
                  {settingsCurrency && savings.some(saving => saving.currency !== settingsCurrency) && (
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
                <Table columns={tableColumns} data={savings} />
              </div>
            )
          },
          {
            id: 'chart',
            label: t('savingsForm.tabs.chart'),
            content: (
              <div className="space-y-2 px-12">
                <div className="text-sm text-textColor dark:text-textColor text-right">
                  {t('savingsForm.totals.total')} <strong className="text-mainTextColor dark:text-mainTextColor">{totalSavings.toLocaleString('en-US', { minimumFractionDigits: 2, maximumFractionDigits: 2 })} {settingsCurrency || 'USD'}</strong>
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

      <ModalWindow open={open} onClose={handleModalClose} title={editingSaving ? t('savingsForm.editTitle') : t('savingsForm.createTitle')}>
        <Form onSubmit={handleSubmit}>
          {formError && (
            <div className="text-accentRed dark:text-accentRed text-sm">
              {formError}
            </div>
          )}
          <TextInput 
            value={comment}
            onChange={(e) => setComment(e.target.value)}
            label={t('savingsForm.nameLabel')}
            placeholder={t('savingsForm.namePlaceholder')}
          />
          <MoneyInput 
            value={amount}
            onValueChange={setAmount}
            placeholder="10,000"
            label={t('savingsForm.amountLabel')}
          />
          <SelectInput 
            value={currency} 
            options={currencyOptions} 
            onChange={handleCurrencyChange} 
            label={t('savingsForm.currencyLabel')} 
          />
          <TextButton 
            type="submit"
            disabled={!isFormValid || submitting}
            variant="primary" 
            className="mt-4"
            aria-label={editingSaving ? t('savingsForm.saveAriaLabel') : t('savingsForm.createAriaLabel')}
          >
            {submitting ? (editingSaving ? t('savingsForm.savingButton') : t('savingsForm.creatingButton')) : (editingSaving ? t('savingsForm.saveButton') : t('savingsForm.createButton'))}
          </TextButton>
        </Form>
      </ModalWindow>
    </div>
  );
}

