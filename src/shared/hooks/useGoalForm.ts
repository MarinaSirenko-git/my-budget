import { useState, useMemo, useEffect } from 'react';
import { currencyOptions, type CurrencyCode } from '@/shared/constants/currencies';

interface UseGoalFormProps {
  settingsCurrency?: CurrencyCode | null;
  defaultCurrency?: CurrencyCode;
}

interface UseGoalFormReturn {
  // Form state
  name: string;
  amount: string | undefined;
  currency: CurrencyCode;
  targetDate: string | undefined;
  
  // Form validation
  isFormValid: boolean;
  hasChanges: boolean;
  
  // Setters
  setName: (value: string) => void;
  setAmount: (value: string | undefined) => void;
  setCurrency: (value: CurrencyCode) => void;
  setTargetDate: (value: string | undefined) => void;
  
  // Handlers
  handleCurrencyChange: (newCurrency: string) => void;
  resetForm: () => void;
  initializeForEdit: (goal: { name: string; amount: number; currency: string; targetDate: string }) => void;
  initializeForCreate: () => void;
}

export function useGoalForm({
  settingsCurrency,
  defaultCurrency,
}: UseGoalFormProps): UseGoalFormReturn {
  const [name, setName] = useState('');
  const [amount, setAmount] = useState<string | undefined>(undefined);
  const [currency, setCurrency] = useState<CurrencyCode>(currencyOptions[0].value);
  const [targetDate, setTargetDate] = useState<string | undefined>(undefined);
  
  // Original values for change detection when editing
  const [originalValues, setOriginalValues] = useState<{
    name: string;
    amount: number;
    currency: CurrencyCode;
    targetDate: string;
  } | null>(null);

  // Set default currency from settings when loaded
  useEffect(() => {
    if (settingsCurrency) {
      const validCurrency = currencyOptions.find(opt => opt.value === settingsCurrency);
      if (validCurrency && currency === currencyOptions[0].value) {
        setCurrency(validCurrency.value);
      }
    } else if (defaultCurrency) {
      const validCurrency = currencyOptions.find(opt => opt.value === defaultCurrency);
      if (validCurrency && currency === currencyOptions[0].value) {
        setCurrency(validCurrency.value);
      }
    }
  }, [settingsCurrency, defaultCurrency, currency]);

  const isFormValid = useMemo(() => {
    return !!(
      name.trim() &&
      amount &&
      parseFloat(amount) > 0 &&
      currency &&
      targetDate
    );
  }, [name, amount, currency, targetDate]);

  const hasChanges = useMemo(() => {
    if (!originalValues) return true; // If no original values, assume changes (create mode)
    
    const currentAmount = amount ? parseFloat(amount) : 0;
    
    return (
      name.trim() !== originalValues.name ||
      currentAmount !== originalValues.amount ||
      currency !== originalValues.currency ||
      targetDate !== originalValues.targetDate
    );
  }, [originalValues, name, amount, currency, targetDate]);

  const handleCurrencyChange = (newCurrency: string) => {
    const validCurrency = currencyOptions.find(opt => opt.value === newCurrency);
    if (validCurrency) {
      setCurrency(validCurrency.value);
    }
  };

  const resetForm = () => {
    setName('');
    setAmount(undefined);
    const defaultCurrencyValue = settingsCurrency || currencyOptions[0].value;
    const validCurrency = currencyOptions.find(opt => opt.value === defaultCurrencyValue);
    setCurrency(validCurrency ? validCurrency.value : currencyOptions[0].value);
    setTargetDate(undefined);
    setOriginalValues(null);
  };

  const initializeForEdit = (goal: { name: string; amount: number; currency: string; targetDate: string }) => {
    setName(goal.name || '');
    setAmount(goal.amount.toString());
    
    const validCurrency = currencyOptions.find(opt => opt.value === goal.currency);
    const goalCurrency = validCurrency ? validCurrency.value : currencyOptions[0].value;
    setCurrency(goalCurrency);
    setTargetDate(goal.targetDate);
    
    // Save original values for change detection
    setOriginalValues({
      name: goal.name || '',
      amount: goal.amount,
      currency: goalCurrency,
      targetDate: goal.targetDate,
    });
  };

  const initializeForCreate = () => {
    setName('');
    setAmount(undefined);
    const defaultCurrencyValue = settingsCurrency || currencyOptions[0].value;
    const validCurrency = currencyOptions.find(opt => opt.value === defaultCurrencyValue);
    setCurrency(validCurrency ? validCurrency.value : currencyOptions[0].value);
    setTargetDate(undefined);
    setOriginalValues(null);
  };

  return {
    name,
    amount,
    currency,
    targetDate,
    isFormValid,
    hasChanges,
    setName,
    setAmount,
    setCurrency,
    setTargetDate,
    handleCurrencyChange,
    resetForm,
    initializeForEdit,
    initializeForCreate,
  };
}

