import { useState, useMemo, useEffect } from 'react';
import { currencyOptions, type CurrencyCode } from '@/shared/constants/currencies';
import type { ExpenseCategory, Expense } from '@/mocks/pages/expenses.mock';

interface UseExpenseFormProps {
  expenseCategories: ExpenseCategory[];
  settingsCurrency?: CurrencyCode | null;
  defaultCurrency?: CurrencyCode;
}

interface UseExpenseFormReturn {
  categoryId: string;
  customCategoryText: string;
  amount: string | undefined;
  currency: CurrencyCode;
  frequency: Expense['frequency'];
  isTagSelected: boolean;
  isFormValid: boolean;
  hasChanges: boolean;

  setCategoryId: (value: string) => void;
  setCustomCategoryText: (value: string) => void;
  setAmount: (value: string | undefined) => void;
  setCurrency: (value: CurrencyCode) => void;
  setFrequency: (value: Expense['frequency']) => void;
  setIsTagSelected: (value: boolean) => void;

  handleCategoryChange: (newCategoryId: string) => void;
  handleCurrencyChange: (newCurrency: string) => void;
  resetForm: () => void;
  initializeForEdit: (expense: Expense) => void;
  initializeForCreate: () => void;
  initializeForTag: (category: ExpenseCategory) => void;
  getFinalCategory: () => string;
}

export function useExpenseForm({
  expenseCategories,
  settingsCurrency,
  defaultCurrency,
}: UseExpenseFormProps): UseExpenseFormReturn {
  const [categoryId, setCategoryId] = useState('');
  const [customCategoryText, setCustomCategoryText] = useState('');
  const [amount, setAmount] = useState<string | undefined>(undefined);
  const [currency, setCurrency] = useState<CurrencyCode>(currencyOptions[0].value);
  const [frequency, setFrequency] = useState<Expense['frequency']>('monthly');
  const [isTagSelected, setIsTagSelected] = useState(false);
  
  // Original values for change detection when editing
  const [originalValues, setOriginalValues] = useState<{
    type: string;
    amount: number;
    currency: CurrencyCode;
    frequency: Expense['frequency'];
  } | null>(null);

  useEffect(() => {
    if (expenseCategories.length > 0 && !categoryId) {
      setCategoryId(expenseCategories[0].id);
    }
  }, [expenseCategories, categoryId]);

  useEffect(() => {
    if (settingsCurrency) {
      const validCurrency = currencyOptions.find(opt => opt.value === settingsCurrency);
      if (validCurrency) {
        setCurrency(validCurrency.value);
      }
    } else if (defaultCurrency) {
      const validCurrency = currencyOptions.find(opt => opt.value === defaultCurrency);
      if (validCurrency) {
        setCurrency(validCurrency.value);
      }
    }
  }, [settingsCurrency, defaultCurrency]);

  const isFormValid = useMemo(() => {
    const hasValidCategory = (categoryId === 'custom' || isTagSelected)
      ? customCategoryText.trim().length > 0
      : categoryId;

    return !!(
      hasValidCategory &&
      amount &&
      parseFloat(amount) > 0 &&
      currency &&
      frequency
    );
  }, [categoryId, isTagSelected, customCategoryText, amount, currency, frequency]);

  const hasChanges = useMemo(() => {
    if (!originalValues) return true; // If no original values, assume changes (create mode)
    
    const currentType = (categoryId === 'custom' || isTagSelected)
      ? customCategoryText.trim()
      : categoryId;
    const currentAmount = amount ? parseFloat(amount) : 0;
    
    return (
      currentType !== originalValues.type ||
      currentAmount !== originalValues.amount ||
      currency !== originalValues.currency ||
      frequency !== originalValues.frequency
    );
  }, [originalValues, categoryId, isTagSelected, customCategoryText, amount, currency, frequency]);

  const getFinalCategory = () => {
    return (categoryId === 'custom' || isTagSelected)
      ? customCategoryText.trim()
      : categoryId;
  };

  const handleCategoryChange = (newCategoryId: string) => {
    setCategoryId(newCategoryId);
    if (newCategoryId === 'custom') {
      setCustomCategoryText('');
    } else {
      const selectedCategory = expenseCategories.find(category => category.id === newCategoryId);
      if (selectedCategory) {
        setCustomCategoryText(selectedCategory.label);
        setCategoryId('custom');
        setIsTagSelected(true);
      } else {
        setCustomCategoryText('');
      }
    }
  };

  const handleCurrencyChange = (newCurrency: string) => {
    const validCurrency = currencyOptions.find(opt => opt.value === newCurrency);
    if (validCurrency) {
      setCurrency(validCurrency.value);
    }
  };

  const resetForm = () => {
    setCategoryId(expenseCategories[0]?.id || '');
    setCustomCategoryText('');
    setIsTagSelected(false);
    setAmount(undefined);
    const defaultCurrencyValue = settingsCurrency || currencyOptions[0].value;
    const validCurrency = currencyOptions.find(opt => opt.value === defaultCurrencyValue);
    setCurrency(validCurrency ? validCurrency.value : currencyOptions[0].value);
    setFrequency('monthly');
    setOriginalValues(null);
  };

  const initializeForEdit = (expense: Expense) => {
    setCategoryId('custom');
    setCustomCategoryText(expense.type);
    setIsTagSelected(true);
    setAmount(expense.amount.toString());

    const validCurrency = currencyOptions.find(opt => opt.value === expense.currency);
    const expenseCurrency = validCurrency ? validCurrency.value : currencyOptions[0].value;
    setCurrency(expenseCurrency);

    setFrequency(expense.frequency);
    
    // Save original values for change detection
    setOriginalValues({
      type: expense.type,
      amount: expense.amount,
      currency: expenseCurrency,
      frequency: expense.frequency,
    });
  };

  const initializeForCreate = () => {
    setCategoryId(expenseCategories[0]?.id || '');
    setCustomCategoryText('');
    setIsTagSelected(false);
    setAmount(undefined);
    const defaultCurrencyValue = settingsCurrency || currencyOptions[0].value;
    const validCurrency = currencyOptions.find(opt => opt.value === defaultCurrencyValue);
    setCurrency(validCurrency ? validCurrency.value : currencyOptions[0].value);
    setFrequency('monthly');
    setOriginalValues(null);
  };

  const initializeForTag = (category: ExpenseCategory) => {
    setCategoryId('custom');
    setCustomCategoryText(category.label);
    setIsTagSelected(true);
  };

  return {
    categoryId,
    customCategoryText,
    amount,
    currency,
    frequency,
    isTagSelected,
    isFormValid,
    hasChanges,
    setCategoryId,
    setCustomCategoryText,
    setAmount,
    setCurrency,
    setFrequency,
    setIsTagSelected,
    handleCategoryChange,
    handleCurrencyChange,
    resetForm,
    initializeForEdit,
    initializeForCreate,
    initializeForTag,
    getFinalCategory,
  };
}


