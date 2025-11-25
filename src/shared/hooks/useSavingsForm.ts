import { useState, useMemo, useEffect } from 'react';
import { currencyOptions, type CurrencyCode } from '@/shared/constants/currencies';

interface UseSavingsFormProps {
  settingsCurrency?: CurrencyCode | null;
  defaultCurrency?: CurrencyCode;
}

interface UseSavingsFormReturn {
  // Form state
  comment: string;
  amount: string | undefined;
  currency: CurrencyCode;
  
  // Form validation
  isFormValid: boolean;
  
  // Setters
  setComment: (value: string) => void;
  setAmount: (value: string | undefined) => void;
  setCurrency: (value: CurrencyCode) => void;
  
  // Handlers
  handleCurrencyChange: (newCurrency: string) => void;
  resetForm: () => void;
  initializeForEdit: (saving: { comment: string; amount: number; currency: string }) => void;
  initializeForCreate: () => void;
}

export function useSavingsForm({
  settingsCurrency,
  defaultCurrency,
}: UseSavingsFormProps): UseSavingsFormReturn {
  const [comment, setComment] = useState('');
  const [amount, setAmount] = useState<string | undefined>(undefined);
  const [currency, setCurrency] = useState<CurrencyCode>(currencyOptions[0].value);

  // Set default currency from settings when loaded
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
    return !!(
      comment.trim() &&
      amount &&
      parseFloat(amount) > 0 &&
      currency
    );
  }, [comment, amount, currency]);

  const handleCurrencyChange = (newCurrency: string) => {
    const validCurrency = currencyOptions.find(opt => opt.value === newCurrency);
    if (validCurrency) {
      setCurrency(validCurrency.value);
    }
  };

  const resetForm = () => {
    setComment('');
    setAmount(undefined);
    const defaultCurrencyValue = settingsCurrency || currencyOptions[0].value;
    const validCurrency = currencyOptions.find(opt => opt.value === defaultCurrencyValue);
    setCurrency(validCurrency ? validCurrency.value : currencyOptions[0].value);
  };

  const initializeForEdit = (saving: { comment: string; amount: number; currency: string }) => {
    setComment(saving.comment || '');
    setAmount(saving.amount.toString());
    
    const validCurrency = currencyOptions.find(opt => opt.value === saving.currency);
    setCurrency(validCurrency ? validCurrency.value : currencyOptions[0].value);
  };

  const initializeForCreate = () => {
    setComment('');
    setAmount(undefined);
    const defaultCurrencyValue = settingsCurrency || currencyOptions[0].value;
    const validCurrency = currencyOptions.find(opt => opt.value === defaultCurrencyValue);
    setCurrency(validCurrency ? validCurrency.value : currencyOptions[0].value);
  };

  return {
    comment,
    amount,
    currency,
    isFormValid,
    setComment,
    setAmount,
    setCurrency,
    handleCurrencyChange,
    resetForm,
    initializeForEdit,
    initializeForCreate,
  };
}

