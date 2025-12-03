import { useState, useMemo, useEffect } from 'react';
import { currencyOptions, type CurrencyCode } from '@/shared/constants/currencies';
import type { IncomeType } from '@/mocks/pages/income.mock';

interface UseIncomeFormProps {
  incomeTypes: IncomeType[];
  settingsCurrency?: CurrencyCode | null;
  defaultCurrency?: CurrencyCode;
}

interface UseIncomeFormReturn {
  // Form state
  incomeTypeId: string;
  customCategoryText: string;
  amount: string | undefined;
  currency: CurrencyCode;
  frequency: string;
  isTagSelected: boolean;
  
  // Form validation
  isFormValid: boolean;
  hasChanges: boolean;
  
  // Setters
  setIncomeTypeId: (value: string) => void;
  setCustomCategoryText: (value: string) => void;
  setAmount: (value: string | undefined) => void;
  setCurrency: (value: CurrencyCode) => void;
  setFrequency: (value: string) => void;
  setIsTagSelected: (value: boolean) => void;
  
  // Handlers
  handleIncomeTypeChange: (newTypeId: string) => void;
  handleCurrencyChange: (newCurrency: string) => void;
  resetForm: () => void;
  initializeForEdit: (income: { type: string; amount: number; currency: string; frequency: string }) => void;
  initializeForCreate: () => void;
  initializeForTag: (type: IncomeType) => void;
  
  // Computed
  getFinalType: () => string;
}

export function useIncomeForm({
  incomeTypes,
  settingsCurrency,
  defaultCurrency,
}: UseIncomeFormProps): UseIncomeFormReturn {
  const [incomeTypeId, setIncomeTypeId] = useState('');
  const [customCategoryText, setCustomCategoryText] = useState('');
  const [amount, setAmount] = useState<string | undefined>(undefined);
  const [currency, setCurrency] = useState<CurrencyCode>(currencyOptions[0].value);
  const [frequency, setFrequency] = useState<string>('monthly');
  const [isTagSelected, setIsTagSelected] = useState(false);
  
  // Original values for change detection when editing
  const [originalValues, setOriginalValues] = useState<{
    type: string;
    amount: number;
    currency: CurrencyCode;
    frequency: string;
  } | null>(null);

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
    } else if (defaultCurrency) {
      const validCurrency = currencyOptions.find(opt => opt.value === defaultCurrency);
      if (validCurrency) {
        setCurrency(validCurrency.value);
      }
    }
  }, [settingsCurrency, defaultCurrency]);

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

  const hasChanges = useMemo(() => {
    if (!originalValues) return true; // If no original values, assume changes (create mode)
    
    const currentType = (incomeTypeId === 'custom' || isTagSelected) 
      ? customCategoryText.trim() 
      : incomeTypeId;
    const currentAmount = amount ? parseFloat(amount) : 0;
    
    return (
      currentType !== originalValues.type ||
      currentAmount !== originalValues.amount ||
      currency !== originalValues.currency ||
      frequency !== originalValues.frequency
    );
  }, [originalValues, incomeTypeId, isTagSelected, customCategoryText, amount, currency, frequency]);

  const getFinalType = () => {
    return (incomeTypeId === 'custom' || isTagSelected) 
      ? customCategoryText.trim() 
      : incomeTypeId;
  };

  const handleIncomeTypeChange = (newTypeId: string) => {
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
  };

  const handleCurrencyChange = (newCurrency: string) => {
    const validCurrency = currencyOptions.find(opt => opt.value === newCurrency);
    if (validCurrency) {
      setCurrency(validCurrency.value);
    }
  };

  const resetForm = () => {
    setIncomeTypeId(incomeTypes[0]?.id || '');
    setCustomCategoryText('');
    setIsTagSelected(false);
    setAmount(undefined);
    const defaultCurrencyValue = settingsCurrency || currencyOptions[0].value;
    const validCurrency = currencyOptions.find(opt => opt.value === defaultCurrencyValue);
    setCurrency(validCurrency ? validCurrency.value : currencyOptions[0].value);
    setFrequency('monthly');
    setOriginalValues(null);
  };

  const initializeForEdit = (income: { type: string; amount: number; currency: string; frequency: string }) => {
    setIncomeTypeId('custom');
    setCustomCategoryText(income.type);
    setIsTagSelected(true);
    setAmount(income.amount.toString());
    
    const validCurrency = currencyOptions.find(opt => opt.value === income.currency);
    const incomeCurrency = validCurrency ? validCurrency.value : currencyOptions[0].value;
    setCurrency(incomeCurrency);
    
    setFrequency(income.frequency);
    
    // Save original values for change detection
    setOriginalValues({
      type: income.type,
      amount: income.amount,
      currency: incomeCurrency,
      frequency: income.frequency,
    });
  };

  const initializeForCreate = () => {
    setIncomeTypeId(incomeTypes[0]?.id || '');
    setCustomCategoryText('');
    setIsTagSelected(false);
    setAmount(undefined);
    const defaultCurrencyValue = settingsCurrency || currencyOptions[0].value;
    const validCurrency = currencyOptions.find(opt => opt.value === defaultCurrencyValue);
    setCurrency(validCurrency ? validCurrency.value : currencyOptions[0].value);
    setFrequency('monthly');
    setOriginalValues(null);
  };

  const initializeForTag = (type: IncomeType) => {
    setIncomeTypeId('custom');
    setCustomCategoryText(type.label);
    setIsTagSelected(true);
  };

  return {
    incomeTypeId,
    customCategoryText,
    amount,
    currency,
    frequency,
    isTagSelected,
    isFormValid,
    hasChanges,
    setIncomeTypeId,
    setCustomCategoryText,
    setAmount,
    setCurrency,
    setFrequency,
    setIsTagSelected,
    handleIncomeTypeChange,
    handleCurrencyChange,
    resetForm,
    initializeForEdit,
    initializeForCreate,
    initializeForTag,
    getFinalType,
  };
}

