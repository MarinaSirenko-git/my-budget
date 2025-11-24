import { useState, useMemo, useEffect, useCallback } from 'react';
import type { FormEvent } from 'react';
import EmptyState from '@/shared/ui/atoms/EmptyState';
import Tag from '@/shared/ui/atoms/Tag';
import type { ExpenseCategory, Expense } from '@/mocks/pages/expenses.mock';
import { supabase } from '@/lib/supabase';
import { useAuth } from '@/shared/store/auth';
import { useScenarioRoute } from '@/shared/router/useScenarioRoute';
import ModalWindow from '@/shared/ui/ModalWindow';
import Form from '@/shared/ui/form/Form';
import TextInput from '@/shared/ui/form/TextInput';
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
import { useCurrency } from '@/shared/hooks/useCurrency';
import { getExpenseCategories } from '@/shared/utils/categories';

export default function ExpensesPage() {
  const { user } = useAuth();
  const { scenarioId } = useScenarioRoute();
  const { t } = useTranslation('components');
  const [open, setOpen] = useState(false);
  const [title, setTitle] = useState('');
  const [amount, setAmount] = useState<string | undefined>(undefined);
  const [currency, setCurrency] = useState(currencyOptions[0].value);
  
  // Генерируем категории расходов с переводами
  const expenseCategories = useMemo(() => getExpenseCategories(t), [t]);
  
  const [categoryId, setCategoryId] = useState('');
  const [isTagSelected, setIsTagSelected] = useState(false); // Флаг для отслеживания, что форма открыта через клик на тэг
  
  // Convert expenseCategories to SelectInput options
  const expenseCategoryOptions = useMemo(() => expenseCategories.map(category => ({
    label: category.label,
    value: category.id,
  })), [expenseCategories]);
  
  const frequencyOptions = useMemo(() => [
    { label: t('expensesForm.monthly'), value: 'monthly' },
    { label: t('expensesForm.annual'), value: 'annual' },
    { label: t('expensesForm.oneTime'), value: 'one-time' },
  ], [t]);
  
  const [frequency, setFrequency] = useState('monthly');
  const [expenses, setExpenses] = useState<Expense[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [submitting, setSubmitting] = useState(false);
  const [formError, setFormError] = useState<string | null>(null);
  const { currency: settingsCurrency } = useCurrency();
  const [deletingId, setDeletingId] = useState<string | null>(null);
  const [editingId, setEditingId] = useState<string | null>(null);
  // Состояние для выбранной валюты в колонке конвертации (по умолчанию settingsCurrency)
  const [selectedConversionCurrency, setSelectedConversionCurrency] = useState<string | null>(null);
  // Кэш конвертированных сумм: ключ = `${expenseId}_${toCurrency}`, значение = конвертированная сумма
  const [convertedAmountsCache, setConvertedAmountsCache] = useState<Record<string, number>>({});
  // Состояние для отслеживания загрузки конвертации
  const [convertingIds, setConvertingIds] = useState<Set<string>>(new Set());

  // Инициализируем categoryId после создания категорий
  useEffect(() => {
    if (expenseCategories.length > 0 && !categoryId) {
      setCategoryId(expenseCategories[0].id);
    }
  }, [expenseCategories, categoryId]);

  // Wrapper function to handle currency change with validation
  const handleCurrencyChange = (newCurrency: string) => {
    const validCurrency = currencyOptions.find(opt => opt.value === newCurrency);
    if (validCurrency) {
      setCurrency(validCurrency.value);
    }
  };

  function handleTagClick(category: ExpenseCategory) {
    // При клике на любой тэг показываем TextInput с предзаполненным значением
    setEditingId(null);
    setCategoryId('custom');
    setTitle(category.label); // Предзаполняем названием категории из тэга
    setIsTagSelected(true);
    setFormError(null);
    setOpen(true);
  }

  function handleAddExpenseClick() {
    setEditingId(null);
    setCategoryId(expenseCategories[0]?.id || '');
    setTitle('');
    setIsTagSelected(false);
    setFormError(null);
    setOpen(true);
  }

  const handleEditExpense = useCallback((expense: Expense) => {
    setEditingId(expense.id);
    // Для редактирования всегда показываем TextInput с предзаполненным значением
    setCategoryId('custom');
    setTitle(expense.type);
    setIsTagSelected(true);
    setAmount(expense.amount.toString());
    // Validate currency before setting
    const validCurrency = currencyOptions.find(opt => opt.value === expense.currency);
    setCurrency(validCurrency ? validCurrency.value : currencyOptions[0].value);
    setFrequency(expense.frequency);
    setFormError(null);
    setOpen(true);
  }, [expenseCategories]);

  function handleModalClose() {
    setOpen(false);
    setEditingId(null);
    setCategoryId(expenseCategories[0]?.id || '');
    setTitle('');
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
    const hasValidCategory = (categoryId === 'custom' || isTagSelected)
      ? title.trim().length > 0
      : categoryId;
    return !!(
      hasValidCategory &&
      title.trim() &&
      amount &&
      parseFloat(amount) > 0 &&
      currency
    );
  }, [categoryId, isTagSelected, title, amount, currency]);

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
  async function handleSubmit(e: FormEvent) {
    e.preventDefault();
    
    if (!user || !isFormValid) {
      return;
    }

    try {
      setSubmitting(true);
      setFormError(null);
      
      const expenseAmount = parseFloat(amount!);
      
      const finalType = (categoryId === 'custom' || isTagSelected) ? title.trim() : categoryId;
      
      if (editingId) {
        // Update existing expense
        const { error: updateError } = await supabase
          .from('expenses')
          .update({
            type: finalType,
            amount: expenseAmount,
            currency: currency,
            frequency: frequency || 'monthly',
          })
          .eq('id', editingId)
          .eq('user_id', user.id);
          
        if (updateError) {
          throw updateError;
        }
      } else {
        // Create new expense
        // Вызываем RPC конвертацию если валюта отличается от дефолтной
        if (settingsCurrency && currency !== settingsCurrency) {
          await supabase.rpc('convert_amount', {
            p_amount: expenseAmount,
            p_from_currency: currency,
            p_to_currency: settingsCurrency, // Всегда передаем явно, чтобы избежать ошибки с default_currency
          });
        }
        
        const { error: insertError } = await supabase
          .from('expenses')
          .insert({
            type: finalType,
            amount: expenseAmount,
            currency: currency,
            frequency: frequency || 'monthly',
            scenario_id: scenarioId,
          });

        if (insertError) {
          throw insertError;
        }
      }

      // Refresh expenses list
      const { data, error: fetchError } = await supabase
        .from('expenses_decrypted')
        .select('*')
        .eq('user_id', user.id)
        .order('created_at', { ascending: false });

      if (fetchError) {
        throw fetchError;
      }

      if (data) {
        // Map Supabase data to Expense interface and convert amounts if needed
        const mappedExpensesPromises = data.map(async (item: any) => {
          const expense: Expense = {
            id: item.id,
            type: item.type,
            category: item.type,
            amount: item.amount,
            currency: item.currency,
            frequency: item.frequency || 'monthly',
            date: item.created_at?.split('T')[0] || new Date().toISOString().split('T')[0],
            createdAt: item.created_at,
          };

          // Конвертируем сумму если валюта отличается от дефолтной
          if (settingsCurrency && expense.currency !== settingsCurrency) {
            const convertedAmount = await convertAmount(expense.amount, expense.currency);
            if (convertedAmount !== null) {
              expense.amountInDefaultCurrency = convertedAmount;
            }
          }

          return expense;
        });

        const mappedExpenses = await Promise.all(mappedExpensesPromises);
        setExpenses(mappedExpenses);
        
        // Отправляем событие для обновления Summary в сайдбаре
        window.dispatchEvent(new CustomEvent('expenseUpdated'));
      }

      handleModalClose();
    } catch (err) {
      console.error(`Error ${editingId ? 'updating' : 'adding'} expense:`, err);
      const errorKey = editingId ? 'expensesForm.updateErrorMessage' : 'expensesForm.errorMessage';
      setFormError(err instanceof Error ? err.message : t(errorKey));
    } finally {
      setSubmitting(false);
    }
  }

  // Handle expense deletion
  const handleDeleteExpense = useCallback(async (expenseId: string) => {
    if (!user) {
      return;
    }

    // Confirm deletion
    const confirmMessage = t('expensesForm.deleteConfirm') ?? 'Are you sure you want to delete this expense?';
    if (!window.confirm(confirmMessage)) {
      return;
    }

    try {
      setDeletingId(expenseId);
      
      const { error: deleteError } = await supabase
        .from('expenses')
        .delete()
        .eq('id', expenseId)
        .eq('user_id', user.id);

      if (deleteError) {
        throw deleteError;
      }

      // Refresh expenses list
      const { data, error: fetchError } = await supabase
        .from('expenses_decrypted')
        .select('*')
        .eq('user_id', user.id)
        .order('created_at', { ascending: false });

      if (fetchError) {
        throw fetchError;
      }

      if (data) {
        // Map Supabase data to Expense interface and convert amounts if needed
        const mappedExpensesPromises = data.map(async (item: any) => {
          const expense: Expense = {
            id: item.id,
            type: item.type,
            category: item.type,
            amount: item.amount,
            currency: item.currency,
            frequency: item.frequency || 'monthly',
            date: item.created_at?.split('T')[0] || new Date().toISOString().split('T')[0],
            createdAt: item.created_at,
          };

          // Конвертируем сумму если валюта отличается от дефолтной
          if (settingsCurrency && expense.currency !== settingsCurrency) {
            const convertedAmount = await convertAmount(expense.amount, expense.currency);
            if (convertedAmount !== null) {
              expense.amountInDefaultCurrency = convertedAmount;
            }
          }

          return expense;
        });

        const mappedExpenses = await Promise.all(mappedExpensesPromises);
        setExpenses(mappedExpenses);
        
        // Отправляем событие для обновления Summary в сайдбаре
        window.dispatchEvent(new CustomEvent('expenseUpdated'));
      }
    } catch (err) {
      console.error('Error deleting expense:', err);
      const errorMessage = err instanceof Error ? err.message : (t('expensesForm.deleteError') ?? 'Error deleting expense');
      alert(errorMessage);
    } finally {
      setDeletingId(null);
    }
  }, [user, t, settingsCurrency, convertAmount]);


  // Set default currency from settings when loaded
  useEffect(() => {
    if (settingsCurrency) {
      const validCurrency = currencyOptions.find(opt => opt.value === settingsCurrency);
      if (validCurrency && currency === currencyOptions[0].value) {
        setCurrency(validCurrency.value);
      }
    }
  }, [settingsCurrency, currency]);

  // Fetch expenses from Supabase
  useEffect(() => {
    async function fetchExpenses() {
      if (!user) {
        setLoading(false);
        return;
      }

      try {
        setLoading(true);
        setError(null);
        
        let query = supabase
          .from('expenses_decrypted')
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
          // Map Supabase data to Expense interface and convert amounts if needed
          const mappedExpensesPromises = data.map(async (item: any) => {
            const expense: Expense = {
              id: item.id,
              type: item.type,
              category: item.type,
              amount: item.amount,
              currency: item.currency,
              frequency: item.frequency || 'monthly',
              date: item.created_at?.split('T')[0] || new Date().toISOString().split('T')[0],
              createdAt: item.created_at,
            };

            // Конвертируем сумму если валюта отличается от дефолтной
            if (settingsCurrency && expense.currency !== settingsCurrency) {
              const convertedAmount = await convertAmount(expense.amount, expense.currency);
              if (convertedAmount !== null) {
                expense.amountInDefaultCurrency = convertedAmount;
              }
            }

            return expense;
          });

          const mappedExpenses = await Promise.all(mappedExpensesPromises);
          setExpenses(mappedExpenses);
        }
      } catch (err) {
        console.error('Error fetching expenses:', err);
        setError(err instanceof Error ? err.message : t('expensesForm.loadingError'));
      } finally {
        setLoading(false);
      }
    }

    fetchExpenses();
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [user, scenarioId, settingsCurrency]);

  // Calculate totals in selected conversion currency
  const monthlyTotal = useMemo(() => {
    const targetCurrency = selectedConversionCurrency || settingsCurrency;
    if (!targetCurrency) return 0;

    // Суммируем месячные расходы
    const monthlyExpensesTotal = expenses
      .filter(expense => expense.frequency === 'monthly')
      .reduce((sum, expense) => {
        // Если валюта совпадает с целевой, используем исходную сумму
        if (expense.currency === targetCurrency) {
          return sum + expense.amount;
        }
        
        // Ищем конвертированную сумму в кэше
        const cacheKey = `${expense.id}_${targetCurrency}`;
        const cachedAmount = convertedAmountsCache[cacheKey];
        
        if (cachedAmount !== undefined) {
          return sum + cachedAmount;
        }
        
        // Если нет в кэше, но есть amountInDefaultCurrency и целевая валюта = settingsCurrency
        if (targetCurrency === settingsCurrency && expense.amountInDefaultCurrency !== undefined) {
          return sum + expense.amountInDefaultCurrency;
        }
        
        // Если ничего не найдено, используем исходную сумму (будет конвертировано позже)
        return sum + expense.amount;
      }, 0);

    // Суммируем годовые расходы, разделенные на 12
    const annualExpensesMonthlyTotal = expenses
      .filter(expense => expense.frequency === 'annual')
      .reduce((sum, expense) => {
        // Если валюта совпадает с целевой, используем исходную сумму
        if (expense.currency === targetCurrency) {
          return sum + (expense.amount / 12);
        }
        
        // Ищем конвертированную сумму в кэше
        const cacheKey = `${expense.id}_${targetCurrency}`;
        const cachedAmount = convertedAmountsCache[cacheKey];
        
        if (cachedAmount !== undefined) {
          return sum + (cachedAmount / 12);
        }
        
        // Если нет в кэше, но есть amountInDefaultCurrency и целевая валюта = settingsCurrency
        if (targetCurrency === settingsCurrency && expense.amountInDefaultCurrency !== undefined) {
          return sum + (expense.amountInDefaultCurrency / 12);
        }
        
        // Если ничего не найдено, используем исходную сумму (будет конвертировано позже)
        return sum + (expense.amount / 12);
      }, 0);

    return monthlyExpensesTotal + annualExpensesMonthlyTotal;
  }, [expenses, selectedConversionCurrency, settingsCurrency, convertedAmountsCache]);

  const annualTotal = useMemo(() => {
    const targetCurrency = selectedConversionCurrency || settingsCurrency;
    if (!targetCurrency) return 0;

    // Суммируем месячные расходы, умноженные на 12
    const monthlyExpensesTotal = expenses
      .filter(expense => expense.frequency === 'monthly')
      .reduce((sum, expense) => {
        // Если валюта совпадает с целевой, используем исходную сумму
        if (expense.currency === targetCurrency) {
          return sum + (expense.amount * 12);
        }
        
        // Ищем конвертированную сумму в кэше
        const cacheKey = `${expense.id}_${targetCurrency}`;
        const cachedAmount = convertedAmountsCache[cacheKey];
        
        if (cachedAmount !== undefined) {
          return sum + (cachedAmount * 12);
        }
        
        // Если нет в кэше, но есть amountInDefaultCurrency и целевая валюта = settingsCurrency
        if (targetCurrency === settingsCurrency && expense.amountInDefaultCurrency !== undefined) {
          return sum + (expense.amountInDefaultCurrency * 12);
        }
        
        // Если ничего не найдено, используем исходную сумму (будет конвертировано позже)
        return sum + (expense.amount * 12);
      }, 0);

    // Суммируем годовые расходы
    const annualExpensesTotal = expenses
      .filter(expense => expense.frequency === 'annual')
      .reduce((sum, expense) => {
        // Если валюта совпадает с целевой, используем исходную сумму
        if (expense.currency === targetCurrency) {
          return sum + expense.amount;
        }
        
        // Ищем конвертированную сумму в кэше
        const cacheKey = `${expense.id}_${targetCurrency}`;
        const cachedAmount = convertedAmountsCache[cacheKey];
        
        if (cachedAmount !== undefined) {
          return sum + cachedAmount;
        }
        
        // Если нет в кэше, но есть amountInDefaultCurrency и целевая валюта = settingsCurrency
        if (targetCurrency === settingsCurrency && expense.amountInDefaultCurrency !== undefined) {
          return sum + expense.amountInDefaultCurrency;
        }
        
        // Если ничего не найдено, используем исходную сумму (будет конвертировано позже)
        return sum + expense.amount;
      }, 0);

    return monthlyExpensesTotal + annualExpensesTotal;
  }, [expenses, selectedConversionCurrency, settingsCurrency, convertedAmountsCache]);

  const oneTimeTotal = useMemo(() => {
    const targetCurrency = selectedConversionCurrency || settingsCurrency;
    if (!targetCurrency) return 0;

    return expenses
      .filter(expense => expense.frequency === 'one-time')
      .reduce((sum, expense) => {
        // Если валюта совпадает с целевой, используем исходную сумму
        if (expense.currency === targetCurrency) {
          return sum + expense.amount;
        }
        
        // Ищем конвертированную сумму в кэше
        const cacheKey = `${expense.id}_${targetCurrency}`;
        const cachedAmount = convertedAmountsCache[cacheKey];
        
        if (cachedAmount !== undefined) {
          return sum + cachedAmount;
        }
        
        // Если нет в кэше, но есть amountInDefaultCurrency и целевая валюта = settingsCurrency
        if (targetCurrency === settingsCurrency && expense.amountInDefaultCurrency !== undefined) {
          return sum + expense.amountInDefaultCurrency;
        }
        
        // Если ничего не найдено, используем исходную сумму (будет конвертировано позже)
        return sum + expense.amount;
      }, 0);
  }, [expenses, selectedConversionCurrency, settingsCurrency, convertedAmountsCache]);

  // Transform data for pie chart (group by category, sum amounts)
  const pieChartData = useMemo(() => {
    const grouped = expenses.reduce((acc, expense) => {
      const category = expenseCategories.find(c => c.id === expense.category);
      const label = category?.label || expense.type || 'Unknown';
      
      if (!acc[label]) {
        acc[label] = 0;
      }
      acc[label] += expense.amount;
      return acc;
    }, {} as Record<string, number>);

    return Object.entries(grouped).map(([name, value]) => ({
      name,
      value,
    }));
  }, [expenses, expenseCategories]);

  const handleConversionCurrencyChange = useCallback(async (newCurrency: string) => {
    setSelectedConversionCurrency(newCurrency);
    
    // Фильтруем расходы, которые нужно конвертировать
    const expensesToConvert = expenses.filter(expense => {
      const cacheKey = `${expense.id}_${newCurrency}`;
      // Пропускаем если валюта совпадает или уже в кэше
      return expense.currency !== newCurrency && convertedAmountsCache[cacheKey] === undefined;
    });

    if (expensesToConvert.length === 0) {
      return;
    }

    // Подготавливаем массив items для batch конвертации
    const items = expensesToConvert.map(expense => ({
      amount: expense.amount,
      currency: expense.currency,
    }));

    // Отмечаем все как конвертируемые
    const cacheKeys = expensesToConvert.map(expense => `${expense.id}_${newCurrency}`);
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
        
        expensesToConvert.forEach((expense, index) => {
          const cacheKey = `${expense.id}_${newCurrency}`;
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
  }, [expenses, convertedAmountsCache, convertAmountsBulk]);

  // Table columns
  const tableColumns = useMemo(() => {
    const columns: any[] = [
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

    // Добавляем колонку с суммой в валюте настроек, если валюта отличается
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
              onClick={() => handleEditExpense(row)}
            >
              <PencilIcon className="w-4 h-4" />
            </IconButton>
            <IconButton 
              aria-label={t('expensesForm.actions.deleteAriaLabel')} 
              title={t('expensesForm.actions.delete')} 
              onClick={() => handleDeleteExpense(row.id)}
              disabled={deletingId === row.id}
            >
              <TrashIcon className="w-4 h-4" />
            </IconButton>
          </div>
        )
      }
    );

    return columns;
  }, [t, expenseCategories, settingsCurrency, expenses, deletingId, handleDeleteExpense, handleEditExpense, selectedConversionCurrency, convertedAmountsCache, convertingIds]);

  if (loading) {
    return (
      <div className="flex h-full items-center justify-center min-h-[calc(100vh-100px)]">
        <div className="text-textColor dark:text-textColor">{t('expensesForm.loading')}</div>
      </div>
    );
  }

  if (error) {
    return (
      <div className="flex h-full items-center justify-center min-h-[calc(100vh-100px)]">
        <div className="text-accentRed dark:text-accentRed">{t('expensesForm.errorPrefix')} {error}</div>
      </div>
    );
  }

  if (!expenses || expenses.length === 0) {
    return (
      <div className="flex h-full items-center justify-center min-h-[calc(100vh-150px)]">
        <div className="flex flex-col items-center justify-center gap-6">
          <EmptyState icon={<img src="/src/assets/expenses-page-mouse.webp" alt="Empty State" className="max-h-[200px] max-w-[200px]" />}>
            {t('expensesForm.emptyStateMessage')}
          </EmptyState>
           <p className="max-w-[600px] text-center text-textColor dark:text-mainTextColor">{t('expensesForm.emptyStateDescription')}</p>
          <div className="flex flex-wrap gap-2 justify-center max-w-2xl px-4">
            {expenseCategories.map((category) => (
              <Tag 
                key={category.id} 
                title={category.label} 
                isCustom={category.isCustom}
                onClick={() => handleTagClick(category)}
              />
            ))}
          </div>
          <ModalWindow open={open} onClose={handleModalClose} title={editingId ? t('expensesForm.editTitle') : t('expensesForm.title')}>
            <Form onSubmit={handleSubmit}>
              {formError && (
                <div className="text-accentRed dark:text-accentRed text-sm">
                  {formError}
                </div>
              )}
              {categoryId === 'custom' || isTagSelected ? (
                <TextInput
                  value={title}
                  onChange={(e) => setTitle(e.target.value)}
                  label={t('expensesForm.categoryLabel')}
                  placeholder={t('expensesForm.titlePlaceholder')}
                />
              ) : (
                <SelectInput 
                  value={categoryId} 
                  options={expenseCategoryOptions} 
                  onChange={setCategoryId} 
                  label={t('expensesForm.categoryLabel')} 
                  creatable={true}
                />
              )}
              <MoneyInput 
                value={amount}
                onValueChange={setAmount}
                placeholder="1,000" 
                label={t('expensesForm.amountLabelFull')}
              />
              <SelectInput 
                value={currency} 
                options={currencyOptions} 
                onChange={handleCurrencyChange} 
                label={t('expensesForm.currencyLabel')} 
              />
              <TextButton 
                type="submit"
                disabled={!isFormValid || submitting}
                aria-label={editingId ? t('expensesForm.saveAriaLabel') : t('expensesForm.submitAriaLabel')}
                variant="primary"
                className="mt-4"
              >
                {submitting 
                  ? (editingId ? t('expensesForm.savingButton') : t('expensesForm.submittingButton'))
                  : (editingId ? t('expensesForm.saveButton') : t('expensesForm.submitButton'))
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
          onClick={handleAddExpenseClick} 
          aria-label={t('expensesForm.addNewAriaLabel')} 
          variant="primary"
        >
          {t('expensesForm.addNewButton')}
        </TextButton>
      </div>
      
      <Tabs
        tabs={[
          {
            id: 'table',
            label: t('expensesForm.tabs.table'),
            content: (
              <div className="space-y-2 px-12">
                <div className="flex justify-between items-center text-sm text-textColor dark:text-textColor">
                  <div className="flex gap-3">
                    <span>{t('expensesForm.totals.monthly')} <strong className="text-mainTextColor dark:text-mainTextColor">{monthlyTotal.toLocaleString('en-US', { minimumFractionDigits: 2, maximumFractionDigits: 2 })} {selectedConversionCurrency || settingsCurrency || 'USD'}</strong></span>
                    <span>{t('expensesForm.totals.annual')} <strong className="text-mainTextColor dark:text-mainTextColor">{annualTotal.toLocaleString('en-US', { minimumFractionDigits: 2, maximumFractionDigits: 2 })} {selectedConversionCurrency || settingsCurrency || 'USD'}</strong></span>
                    <span>{t('expensesForm.totals.oneTime')} <strong className="text-mainTextColor dark:text-mainTextColor">{oneTimeTotal.toLocaleString('en-US', { minimumFractionDigits: 2, maximumFractionDigits: 2 })} {selectedConversionCurrency || settingsCurrency || 'USD'}</strong></span>
                  </div>
                  {settingsCurrency && expenses.some(expense => expense.currency !== settingsCurrency) && (
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
                <Table columns={tableColumns} data={expenses} />
              </div>
            )
          },
          {
            id: 'chart',
            label: t('expensesForm.tabs.chart'),
            content: (
              <div className="space-y-2 px-12">
                <div className="text-sm text-textColor dark:text-textColor text-right">
                  {t('expensesForm.totals.monthly')} <strong className="text-mainTextColor dark:text-mainTextColor">{monthlyTotal.toLocaleString('en-US', { minimumFractionDigits: 2, maximumFractionDigits: 2 })} {selectedConversionCurrency || settingsCurrency || 'USD'}</strong>
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

          <ModalWindow open={open} onClose={handleModalClose} title={editingId ? t('expensesForm.editTitle') : t('expensesForm.title')}>
            <Form onSubmit={handleSubmit}>
              {formError && (
                <div className="text-accentRed dark:text-accentRed text-sm">
                  {formError}
                </div>
              )}
              {categoryId === 'custom' || isTagSelected ? (
                <TextInput
                  value={title}
                  onChange={(e) => setTitle(e.target.value)}
                  label={t('expensesForm.categoryLabel')}
                  placeholder={t('expensesForm.titlePlaceholder')}
                />
              ) : (
                <SelectInput 
                  value={categoryId} 
                  options={expenseCategoryOptions} 
                  onChange={setCategoryId} 
                  label={t('expensesForm.categoryLabel')} 
                  creatable={true}
                />
              )}
              <MoneyInput 
                value={amount}
                onValueChange={setAmount}
                placeholder="1,000"
                label={t('expensesForm.amountLabel')}
              />
              <SelectInput 
                value={currency} 
                options={currencyOptions} 
                onChange={handleCurrencyChange} 
                label={t('expensesForm.currencyLabel')} 
              />
              <SelectInput 
                value={frequency} 
                options={frequencyOptions} 
                onChange={setFrequency} 
                label={t('expensesForm.frequencyLabel')} 
              />
              <TextButton 
                type="submit"
                disabled={!isFormValid || submitting}
                aria-label={editingId ? t('expensesForm.saveAriaLabel') : t('expensesForm.submitAriaLabel')}
                variant="primary"
                className="mt-4"
              >
                {submitting 
                  ? (editingId ? t('expensesForm.savingButton') : t('expensesForm.submittingButton'))
                  : (editingId ? t('expensesForm.saveButton') : t('expensesForm.submitButton'))
                }
              </TextButton>
            </Form>
          </ModalWindow>
    </div>
  );
}
