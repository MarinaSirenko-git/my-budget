import { useState, useMemo, useEffect, useCallback } from 'react';
import EmptyState from '@/shared/ui/atoms/EmptyState';
import Tag from '@/shared/ui/atoms/Tag';
import type { IncomeType, Income } from '@/mocks/pages/income.mock';
import { supabase } from '@/lib/supabase';
import { useAuth } from '@/shared/store/auth';
import { useScenarioRoute } from '@/shared/router/useScenarioRoute';
import ModalWindow from '@/shared/ui/ModalWindow';
import Form from '@/shared/ui/form/Form';
import MoneyInput from '@/shared/ui/form/MoneyInput';
import SelectInput from '@/shared/ui/form/SelectInput';
import TextInput from '@/shared/ui/form/TextInput';
import TextButton from '@/shared/ui/atoms/TextButton';
import Tabs from '@/shared/ui/molecules/Tabs';
import Table from '@/shared/ui/molecules/Table';
import PieChart from '@/shared/ui/molecules/PieChart';
import IconButton from '@/shared/ui/atoms/IconButton';
import { PencilIcon, TrashIcon } from '@heroicons/react/24/outline';
import { currencyOptions } from '@/shared/constants/currencies';
import { useTranslation } from '@/shared/i18n';
import { getIncomeCategories } from '@/shared/utils/categories';
import { useCurrency } from '@/shared/hooks/useCurrency';

export default function IncomePage() {
  const { user } = useAuth();
  const { scenarioId } = useScenarioRoute();
  const { t } = useTranslation('components');
  const [open, setOpen] = useState(false);
  const [amount, setAmount] = useState<string | undefined>(undefined);
  const [currency, setCurrency] = useState(currencyOptions[0].value);
  
  // Генерируем категории доходов с переводами
  const incomeTypes = useMemo(() => getIncomeCategories(t), [t]);
  
  const [incomeTypeId, setIncomeTypeId] = useState('');
  const [customCategoryText, setCustomCategoryText] = useState('');
  const [isTagSelected, setIsTagSelected] = useState(false); // Флаг для отслеживания, что форма открыта через клик на тэг
  
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

  // Handler for currency change
  const handleCurrencyChange = (newCurrency: string) => {
    setCurrency(newCurrency);
  };

  // Handler for income type change
  const handleIncomeTypeChange = (newTypeId: string) => {
    setIncomeTypeId(newTypeId);
    if (newTypeId === 'custom') {
      // Предзаполняем пустой строкой, чтобы пользователь мог сразу начать ввод
      setCustomCategoryText('');
    } else {
      // При выборе стандартной категории из SelectInput предзаполняем её названием
      const selectedType = incomeTypes.find(type => type.id === newTypeId);
      if (selectedType) {
        setCustomCategoryText(selectedType.label);
        setIncomeTypeId('custom'); // Переключаем на custom, чтобы показать TextInput
        setIsTagSelected(true);
      } else {
        setCustomCategoryText('');
      }
    }
  };
  const [incomes, setIncomes] = useState<Income[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [submitting, setSubmitting] = useState(false);
  const [formError, setFormError] = useState<string | null>(null);
  const { currency: settingsCurrency } = useCurrency();
  const [deletingId, setDeletingId] = useState<string | null>(null);
  const [editingId, setEditingId] = useState<string | null>(null);
  // Состояние для выбранной валюты в колонке конвертации (по умолчанию settingsCurrency)
  const [selectedConversionCurrency, setSelectedConversionCurrency] = useState<string | null>(null);
  // Флаг для отслеживания, была ли валюта выбрана пользователем вручную
  const [isCurrencyManuallySelected, setIsCurrencyManuallySelected] = useState(false);
  // Кэш конвертированных сумм: ключ = `${incomeId}_${toCurrency}`, значение = конвертированная сумма
  const [convertedAmountsCache, setConvertedAmountsCache] = useState<Record<string, number>>({});
  // Состояние для отслеживания загрузки конвертации
  const [convertingIds, setConvertingIds] = useState<Set<string>>(new Set());

  function handleTagClick(type: IncomeType) {
    // При клике на любой тэг показываем TextInput с предзаполненным значением
    setIncomeTypeId('custom');
    setCustomCategoryText(type.label); // Предзаполняем названием категории из тэга
    setIsTagSelected(true);
    setFormError(null);
    setOpen(true);
  }

  function handleAddIncomeClick() {
    setEditingId(null);
    setIncomeTypeId(incomeTypes[0]?.id || '');
    setCustomCategoryText('');
    setIsTagSelected(false);
    setFormError(null);
    setOpen(true);
  }

  const handleEditIncome = useCallback((income: Income) => {
    setEditingId(income.id);
    // Проверяем, является ли категория кастомной (не входит в стандартный список)
    const isCustomCategory = !incomeTypes.some(type => type.id === income.type);
    if (isCustomCategory) {
      setIncomeTypeId('custom');
      setCustomCategoryText(income.type);
      setIsTagSelected(true);
    } else {
      // Для стандартных категорий тоже показываем TextInput с предзаполненным значением
      setIncomeTypeId('custom');
      setCustomCategoryText(income.type);
      setIsTagSelected(true);
    }
    setAmount(income.amount.toString());
    // Validate currency before setting
    const validCurrency = currencyOptions.find(opt => opt.value === income.currency);
    setCurrency(validCurrency ? validCurrency.value : currencyOptions[0].value);
    setFrequency(income.frequency);
    setFormError(null);
    setOpen(true);
  }, [incomeTypes]);

  function handleModalClose() {
    setOpen(false);
    setEditingId(null);
    setIncomeTypeId(incomeTypes[0]?.id || '');
    setCustomCategoryText('');
    setIsTagSelected(false);
    setAmount(undefined);
    const defaultCurrency = settingsCurrency || currencyOptions[0].value;
    const validCurrency = currencyOptions.find(opt => opt.value === defaultCurrency);
    setCurrency(validCurrency ? validCurrency.value : currencyOptions[0].value);
    setFrequency('monthly');
    setFormError(null);
  }

  // Check if form is valid
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
        p_to_currency: targetCurrency, // Всегда передаем явно, чтобы избежать ошибки с default_currency
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
        p_to_currency: targetCurrency, // Всегда передаем явно, чтобы избежать ошибки с default_currency
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
        const finalType = (incomeTypeId === 'custom' || isTagSelected) ? customCategoryText.trim() : incomeTypeId;
        const { error: updateError } = await supabase
          .from('incomes')
          .update({
            type: finalType,
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
            p_to_currency: settingsCurrency, // Явно передаем валюту из настроек
          });
        }

        const finalType = (incomeTypeId === 'custom' || isTagSelected) ? customCategoryText.trim() : incomeTypeId;
        const { error: insertError } = await supabase
          .from('incomes')
          .insert({
            type: finalType,
            amount: incomeAmount,
            currency: currency,
            frequency: frequency,
            scenario_id: scenarioId,
          });
        if (insertError) {
          throw insertError;
        }
      }

      // Refresh incomes list
      let query = supabase
        .from('incomes_decrypted')
        .select('*')
        .eq('user_id', user.id);
      
      // Фильтруем по scenario_id если он установлен
      if (scenarioId) {
        query = query.eq('scenario_id', scenarioId);
      }
      
      const { data, error: fetchError } = await query
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
        
        // Отправляем событие для обновления Summary в сайдбаре
        window.dispatchEvent(new CustomEvent('incomeUpdated'));
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
      let query = supabase
        .from('incomes_decrypted')
        .select('*')
        .eq('user_id', user.id);
      
      // Фильтруем по scenario_id если он установлен
      if (scenarioId) {
        query = query.eq('scenario_id', scenarioId);
      }
      
      const { data, error: fetchError } = await query
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
        
        // Отправляем событие для обновления Summary в сайдбаре
        window.dispatchEvent(new CustomEvent('incomeUpdated'));
      }
    } catch (err) {
      console.error('Error deleting income:', err);
      const errorMessage = err instanceof Error ? err.message : (t('incomeForm.deleteError') ?? 'Error deleting income');
      alert(errorMessage);
    } finally {
      setDeletingId(null);
    }
  }, [user, scenarioId, t, settingsCurrency, convertAmount]);

  // Инициализируем selectedConversionCurrency при загрузке settingsCurrency
  useEffect(() => {
    if (settingsCurrency && !isCurrencyManuallySelected) {
      // Устанавливаем валюту из настроек только если пользователь не выбрал валюту вручную
      setSelectedConversionCurrency(settingsCurrency);
    }
  }, [settingsCurrency, isCurrencyManuallySelected]);

  // Сбрасываем selectedConversionCurrency при размонтировании компонента
  useEffect(() => {
    return () => {
      // При размонтировании сбрасываем на null
      // Это произойдет при переходе на другую страницу
      setSelectedConversionCurrency(null);
    };
  }, []);

  // Автоматически конвертируем суммы при изменении selectedConversionCurrency
  useEffect(() => {
    if (!selectedConversionCurrency || !incomes.length) {
      return;
    }

    const convertAllAmounts = async () => {
      // Фильтруем доходы, которые нужно конвертировать
      const incomesToConvert = incomes.filter(income => {
        const cacheKey = `${income.id}_${selectedConversionCurrency}`;
        // Пропускаем если валюта совпадает или уже в кэше
        return income.currency !== selectedConversionCurrency && convertedAmountsCache[cacheKey] === undefined;
      });

      if (incomesToConvert.length === 0) {
        return;
      }

      // Подготавливаем массив items для batch конвертации
      const items = incomesToConvert.map(income => ({
        amount: income.amount,
        currency: income.currency,
      }));

      // Отмечаем все как конвертируемые
      const cacheKeys = incomesToConvert.map(income => `${income.id}_${selectedConversionCurrency}`);
      setConvertingIds(prev => {
        const newSet = new Set(prev);
        cacheKeys.forEach(key => newSet.add(key));
        return newSet;
      });

      try {
        // Выполняем batch конвертацию одним запросом
        const resultMap = await convertAmountsBulk(items, selectedConversionCurrency);
        
        if (resultMap) {
          // Обновляем кэш для всех результатов одновременно
          const newCache: Record<string, number> = {};
          
          incomesToConvert.forEach((income, index) => {
            const cacheKey = `${income.id}_${selectedConversionCurrency}`;
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
    };

    convertAllAmounts();
  }, [selectedConversionCurrency, incomes, convertAmountsBulk, convertedAmountsCache]);


  // Set default currency from settings when loaded (only once, not on every currency change)
  useEffect(() => {
    if (settingsCurrency) {
      const validCurrency = currencyOptions.find(opt => opt.value === settingsCurrency);
      if (validCurrency) {
        // Устанавливаем валюту из настроек только если она еще не была установлена пользователем
        // Проверяем, что валюта все еще равна дефолтной (первой в списке)
        // и форма не открыта (чтобы не перезаписывать выбор пользователя)
        if (currency === currencyOptions[0].value && !open) {
          setCurrency(validCurrency.value);
        }
      }
    }
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [settingsCurrency]);

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
        
        let query = supabase
          .from('incomes_decrypted')
          .select('*')
          .eq('user_id', user.id);
        
        // Фильтруем по scenario_id если он установлен
        if (scenarioId) {
          query = query.eq('scenario_id', scenarioId);
        }
        
        const { data, error: fetchError } = await query
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
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [user, scenarioId, settingsCurrency, t]);

  // Calculate totals in selected conversion currency
  const monthlyTotal = useMemo(() => {
    const targetCurrency = selectedConversionCurrency || settingsCurrency;
    if (!targetCurrency) return 0;

    // Суммируем месячные доходы
    const monthlyIncomesTotal = incomes
      .filter(income => income.frequency === 'monthly')
      .reduce((sum, income) => {
        // Если валюта совпадает с целевой, используем исходную сумму
        if (income.currency === targetCurrency) {
          return sum + income.amount;
        }
        
        // Ищем конвертированную сумму в кэше
        const cacheKey = `${income.id}_${targetCurrency}`;
        const cachedAmount = convertedAmountsCache[cacheKey];
        
        if (cachedAmount !== undefined) {
          return sum + cachedAmount;
        }
        
        // Если нет в кэше, но есть amountInDefaultCurrency и целевая валюта = settingsCurrency
        if (targetCurrency === settingsCurrency && income.amountInDefaultCurrency !== undefined) {
          return sum + income.amountInDefaultCurrency;
        }
        
        // Если ничего не найдено, используем исходную сумму (будет конвертировано позже)
        return sum + income.amount;
      }, 0);

    // Суммируем годовые доходы, разделенные на 12
    const annualIncomesMonthlyTotal = incomes
      .filter(income => income.frequency === 'annual')
      .reduce((sum, income) => {
        // Если валюта совпадает с целевой, используем исходную сумму
        if (income.currency === targetCurrency) {
          return sum + (income.amount / 12);
        }
        
        // Ищем конвертированную сумму в кэше
        const cacheKey = `${income.id}_${targetCurrency}`;
        const cachedAmount = convertedAmountsCache[cacheKey];
        
        if (cachedAmount !== undefined) {
          return sum + (cachedAmount / 12);
        }
        
        // Если нет в кэше, но есть amountInDefaultCurrency и целевая валюта = settingsCurrency
        if (targetCurrency === settingsCurrency && income.amountInDefaultCurrency !== undefined) {
          return sum + (income.amountInDefaultCurrency / 12);
        }
        
        // Если ничего не найдено, используем исходную сумму (будет конвертировано позже)
        return sum + (income.amount / 12);
      }, 0);

    return monthlyIncomesTotal + annualIncomesMonthlyTotal;
  }, [incomes, selectedConversionCurrency, settingsCurrency, convertedAmountsCache]);

  const annualTotal = useMemo(() => {
    const targetCurrency = selectedConversionCurrency || settingsCurrency;
    if (!targetCurrency) return 0;

    // Суммируем месячные доходы, умноженные на 12
    const monthlyIncomesTotal = incomes
      .filter(income => income.frequency === 'monthly')
      .reduce((sum, income) => {
        // Если валюта совпадает с целевой, используем исходную сумму
        if (income.currency === targetCurrency) {
          return sum + (income.amount * 12);
        }
        
        // Ищем конвертированную сумму в кэше
        const cacheKey = `${income.id}_${targetCurrency}`;
        const cachedAmount = convertedAmountsCache[cacheKey];
        
        if (cachedAmount !== undefined) {
          return sum + (cachedAmount * 12);
        }
        
        // Если нет в кэше, но есть amountInDefaultCurrency и целевая валюта = settingsCurrency
        if (targetCurrency === settingsCurrency && income.amountInDefaultCurrency !== undefined) {
          return sum + (income.amountInDefaultCurrency * 12);
        }
        
        // Если ничего не найдено, используем исходную сумму (будет конвертировано позже)
        return sum + (income.amount * 12);
      }, 0);

    // Суммируем годовые доходы
    const annualIncomesTotal = incomes
      .filter(income => income.frequency === 'annual')
      .reduce((sum, income) => {
        // Если валюта совпадает с целевой, используем исходную сумму
        if (income.currency === targetCurrency) {
          return sum + income.amount;
        }
        
        // Ищем конвертированную сумму в кэше
        const cacheKey = `${income.id}_${targetCurrency}`;
        const cachedAmount = convertedAmountsCache[cacheKey];
        
        if (cachedAmount !== undefined) {
          return sum + cachedAmount;
        }
        
        // Если нет в кэше, но есть amountInDefaultCurrency и целевая валюта = settingsCurrency
        if (targetCurrency === settingsCurrency && income.amountInDefaultCurrency !== undefined) {
          return sum + income.amountInDefaultCurrency;
        }
        
        // Если ничего не найдено, используем исходную сумму (будет конвертировано позже)
        return sum + income.amount;
      }, 0);

    return monthlyIncomesTotal + annualIncomesTotal;
  }, [incomes, selectedConversionCurrency, settingsCurrency, convertedAmountsCache]);

  // Transform data for pie chart (group by type, sum amounts with conversion)
  const pieChartData = useMemo(() => {
    const targetCurrency = selectedConversionCurrency || settingsCurrency;
    if (!targetCurrency) return [];

    const grouped = incomes.reduce((acc, income) => {
      const type = incomeTypes.find(t => t.id === income.type);
      const label = type?.label || income.type;
      
      if (!acc[label]) {
        acc[label] = 0;
      }

      // Определяем сумму для использования в диаграмме (месячный эквивалент)
      let amountToAdd = 0;
      
      // Если валюта совпадает с целевой, используем исходную сумму
      if (income.currency === targetCurrency) {
        amountToAdd = income.frequency === 'monthly' ? income.amount : income.amount / 12;
      } else {
        // Ищем конвертированную сумму в кэше
        const cacheKey = `${income.id}_${targetCurrency}`;
        const cachedAmount = convertedAmountsCache[cacheKey];
        
        if (cachedAmount !== undefined) {
          // Используем конвертированную сумму из кэша
          amountToAdd = income.frequency === 'monthly' ? cachedAmount : cachedAmount / 12;
        } else if (targetCurrency === settingsCurrency && income.amountInDefaultCurrency !== undefined) {
          // Если нет в кэше, но есть amountInDefaultCurrency и целевая валюта = settingsCurrency
          amountToAdd = income.frequency === 'monthly' 
            ? income.amountInDefaultCurrency 
            : income.amountInDefaultCurrency / 12;
        } else {
          // Если конвертация еще не выполнена, используем исходную сумму (будет конвертировано позже)
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

  // Обработчик изменения валюты для конвертации
  const handleConversionCurrencyChange = useCallback(async (newCurrency: string) => {
    setSelectedConversionCurrency(newCurrency);
    setIsCurrencyManuallySelected(true); // Отмечаем, что валюта выбрана пользователем вручную
    
    // Фильтруем доходы, которые нужно конвертировать
    const incomesToConvert = incomes.filter(income => {
      const cacheKey = `${income.id}_${newCurrency}`;
      // Пропускаем если валюта совпадает или уже в кэше
      return income.currency !== newCurrency && convertedAmountsCache[cacheKey] === undefined;
    });

    if (incomesToConvert.length === 0) {
      return;
    }

    // Подготавливаем массив items для batch конвертации
    const items = incomesToConvert.map(income => ({
      amount: income.amount,
      currency: income.currency,
    }));

    // Отмечаем все как конвертируемые
    const cacheKeys = incomesToConvert.map(income => `${income.id}_${newCurrency}`);
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
        
        incomesToConvert.forEach((income, index) => {
          const cacheKey = `${income.id}_${newCurrency}`;
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
  }, [incomes, convertedAmountsCache, convertAmountsBulk]);

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
        const targetCurrency = selectedConversionCurrency || settingsCurrency;

        columns.push({
          key: 'amountInSettingsCurrency',
          label: t('incomeForm.tableColumns.amountInSettingsCurrency'),
          align: 'left' as const,
          render: (_value: any, row: Income) => {
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
  }, [t, incomeTypes, settingsCurrency, incomes, deletingId, handleDeleteIncome, handleEditIncome, selectedConversionCurrency, convertedAmountsCache, convertingIds]);

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
              {incomeTypeId === 'custom' || isTagSelected ? (
                <TextInput
                  value={customCategoryText}
                  onChange={(e) => setCustomCategoryText(e.target.value)}
                  label={t('incomeForm.categoryLabel')}
                  placeholder={t('incomeForm.customCategoryPlaceholder')}
                />
              ) : (
                <SelectInput 
                  value={incomeTypeId} 
                  options={incomeTypeOptions} 
                  onChange={handleIncomeTypeChange} 
                  label={t('incomeForm.categoryLabel')}
                  creatable={true}
                />
              )}
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
              <div className="space-y-2 px-12">
                <div className="flex justify-between items-center text-sm text-textColor dark:text-textColor">
                  <div className="flex gap-3">
                    <span>{t('incomeForm.totals.monthly')} <strong className="text-mainTextColor dark:text-mainTextColor">{monthlyTotal.toLocaleString('en-US', { minimumFractionDigits: 2, maximumFractionDigits: 2 })} {selectedConversionCurrency || settingsCurrency || 'USD'}</strong></span>
                    <span>{t('incomeForm.totals.annual')} <strong className="text-mainTextColor dark:text-mainTextColor">{annualTotal.toLocaleString('en-US', { minimumFractionDigits: 2, maximumFractionDigits: 2 })} {selectedConversionCurrency || settingsCurrency || 'USD'}</strong></span>
                  </div>
                  {settingsCurrency && incomes.some(income => income.currency !== settingsCurrency) && (
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
              <div className="space-y-2 px-12">
                <div className="text-sm text-textColor dark:text-textColor text-right">
                  {t('incomeForm.totals.monthly')} <strong className="text-mainTextColor dark:text-mainTextColor">{monthlyTotal.toLocaleString('en-US', { minimumFractionDigits: 2, maximumFractionDigits: 2 })} {selectedConversionCurrency || settingsCurrency || 'USD'}</strong>
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

      <ModalWindow open={open} onClose={handleModalClose} title={editingId ? t('incomeForm.editTitle') : t('incomeForm.title')}>
        <Form onSubmit={handleSubmit}>
          {formError && (
            <div className="text-accentRed dark:text-accentRed text-sm">
              {formError}
            </div>
          )}
          {incomeTypeId === 'custom' || isTagSelected ? (
            <TextInput
              value={customCategoryText}
              onChange={(e) => setCustomCategoryText(e.target.value)}
              label={t('incomeForm.categoryLabel')}
              placeholder={t('incomeForm.customCategoryPlaceholder')}
            />
          ) : (
            <SelectInput 
              value={incomeTypeId} 
              options={incomeTypeOptions} 
              onChange={handleIncomeTypeChange} 
              label={t('incomeForm.categoryLabel')} 
              creatable={true}
            />
          )}
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
