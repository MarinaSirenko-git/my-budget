import { useState, useEffect, useCallback } from 'react';
import type { Income } from '@/mocks/pages/income.mock';
import { useCurrencyConversion } from './useCurrencyConversion';
import { useCurrency } from './useCurrency';
import { reportErrorToTelegram } from '@/shared/utils/errorReporting';
import type { CurrencyCode } from '@/shared/constants/currencies';

interface UseIncomeCurrencyConversionProps {
  incomes: Income[];
  settingsCurrency?: CurrencyCode | null;
  userId?: string;
}

interface UseIncomeCurrencyConversionReturn {
  selectedConversionCurrency: CurrencyCode | null;
  convertedAmountsCache: Record<string, number>;
  convertingIds: Set<string>;
  isCurrencyManuallySelected: boolean;
  
  // Actions
  handleConversionCurrencyChange: (newCurrency: string) => Promise<void>;
  setSelectedConversionCurrency: (currency: CurrencyCode | null) => void;
  setIsCurrencyManuallySelected: (value: boolean) => void;
}

export function useIncomeCurrencyConversion({
  incomes,
  settingsCurrency,
  userId,
}: UseIncomeCurrencyConversionProps): UseIncomeCurrencyConversionReturn {
  const [selectedConversionCurrency, setSelectedConversionCurrency] = useState<CurrencyCode | null>(null);
  const [convertedAmountsCache, setConvertedAmountsCache] = useState<Record<string, number>>({});
  const [convertingIds, setConvertingIds] = useState<Set<string>>(new Set());
  const [isCurrencyManuallySelected, setIsCurrencyManuallySelected] = useState(false);
  
  const { convertAmountsBulk } = useCurrencyConversion();
  const { currency: defaultSettingsCurrency } = useCurrency();

  // Set default conversion currency from settings when loaded
  useEffect(() => {
    if (settingsCurrency && !isCurrencyManuallySelected) {
      setSelectedConversionCurrency(settingsCurrency);
    }
  }, [settingsCurrency, isCurrencyManuallySelected]);

  // Reset on unmount
  useEffect(() => {
    return () => {
      setSelectedConversionCurrency(null);
    };
  }, []);

  // Auto-convert when currency or incomes change
  useEffect(() => {
    if (!selectedConversionCurrency || !incomes.length) {
      return;
    }

    const convertAllAmounts = async () => {
      // Filter incomes that need conversion
      const incomesToConvert = incomes.filter(income => {
        const cacheKey = `${income.id}_${selectedConversionCurrency}`;
        // Skip if currency matches or already in cache
        return income.currency !== selectedConversionCurrency && convertedAmountsCache[cacheKey] === undefined;
      });

      if (incomesToConvert.length === 0) {
        return;
      }

      // Prepare items array for batch conversion
      const items = incomesToConvert.map(income => ({
        amount: income.amount,
        currency: income.currency,
      }));

      // Mark all as converting
      const cacheKeys = incomesToConvert.map(income => `${income.id}_${selectedConversionCurrency}`);
      setConvertingIds(prev => {
        const newSet = new Set(prev);
        cacheKeys.forEach(key => newSet.add(key));
        return newSet;
      });

      try {
        const resultMap = await convertAmountsBulk(items, selectedConversionCurrency);
        
        if (resultMap) {
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
        await reportErrorToTelegram({
          action: 'convertAmountsBulk',
          error: err,
          userId,
          context: { selectedConversionCurrency, itemsCount: items.length }
        });
      } finally {
        // Remove from convertingIds
        setConvertingIds(prev => {
          const newSet = new Set(prev);
          cacheKeys.forEach(key => newSet.delete(key));
          return newSet;
        });
      }
    };

    convertAllAmounts();
  }, [selectedConversionCurrency, incomes, convertAmountsBulk, convertedAmountsCache, userId]);

  const handleConversionCurrencyChange = useCallback(async (newCurrency: string) => {
    const validCurrency = newCurrency as CurrencyCode;
    setSelectedConversionCurrency(validCurrency);
    setIsCurrencyManuallySelected(true);
    
    // Filter incomes that need conversion
    const incomesToConvert = incomes.filter(income => {
      const cacheKey = `${income.id}_${validCurrency}`;
      // Skip if currency matches or already in cache
      return income.currency !== validCurrency && convertedAmountsCache[cacheKey] === undefined;
    });

    if (incomesToConvert.length === 0) {
      return;
    }

    // Prepare items array for batch conversion
    const items = incomesToConvert.map(income => ({
      amount: income.amount,
      currency: income.currency,
    }));

    // Mark all as converting
    const cacheKeys = incomesToConvert.map(income => `${income.id}_${validCurrency}`);
    setConvertingIds(prev => {
      const newSet = new Set(prev);
      cacheKeys.forEach(key => newSet.add(key));
      return newSet;
    });

    try {
      // Perform batch conversion in one request
      const resultMap = await convertAmountsBulk(items, validCurrency);
      
      if (resultMap) {
        // Update cache for all results at once
        const newCache: Record<string, number> = {};
        
        incomesToConvert.forEach((income, index) => {
          const cacheKey = `${income.id}_${validCurrency}`;
          const convertedAmount = resultMap.get(index);
          
          if (convertedAmount !== undefined) {
            newCache[cacheKey] = convertedAmount;
          }
        });

        setConvertedAmountsCache(prev => ({ ...prev, ...newCache }));
      }
    } catch (err) {
      await reportErrorToTelegram({
        action: 'convertAmountsBulk',
        error: err,
        userId,
        context: { newCurrency, itemsCount: items.length }
      });
    } finally {
      // Remove from convertingIds
      setConvertingIds(prev => {
        const newSet = new Set(prev);
        cacheKeys.forEach(key => newSet.delete(key));
        return newSet;
      });
    }
  }, [incomes, convertedAmountsCache, convertAmountsBulk, userId]);

  return {
    selectedConversionCurrency,
    convertedAmountsCache,
    convertingIds,
    isCurrencyManuallySelected,
    handleConversionCurrencyChange,
    setSelectedConversionCurrency,
    setIsCurrencyManuallySelected,
  };
}

