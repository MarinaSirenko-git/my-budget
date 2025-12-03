import { useState, useEffect, useCallback } from 'react';
import { useCurrencyConversion } from './useCurrencyConversion';
import { reportErrorToTelegram } from '@/shared/utils/errorReporting';
import type { CurrencyCode } from '@/shared/constants/currencies';

/**
 * Универсальный интерфейс для элементов с финансовыми данными
 */
export interface FinancialItem {
  id: string;
  amount: number;
  currency: string;
  amountInDefaultCurrency?: number;
}

interface UseCurrencyConversionForItemsProps<T extends FinancialItem> {
  items: T[];
  settingsCurrency?: CurrencyCode | null;
  userId?: string;
  scenarioId?: string | null;
}

interface UseCurrencyConversionForItemsReturn {
  selectedConversionCurrency: CurrencyCode | null;
  convertedAmountsCache: Record<string, number>;
  convertingIds: Set<string>;
  isCurrencyManuallySelected: boolean;
  
  // Actions
  handleConversionCurrencyChange: (newCurrency: string) => Promise<void>;
  setSelectedConversionCurrency: (currency: CurrencyCode | null) => void;
  setIsCurrencyManuallySelected: (value: boolean) => void;
}

/**
 * Универсальный хук для конвертации валют для любых финансовых элементов
 * Работает с любым массивом объектов, имеющих id, amount, currency
 */
export function useCurrencyConversionForItems<T extends FinancialItem>({
  items,
  settingsCurrency,
  userId,
  scenarioId,
}: UseCurrencyConversionForItemsProps<T>): UseCurrencyConversionForItemsReturn {
  const [selectedConversionCurrency, setSelectedConversionCurrency] = useState<CurrencyCode | null>(null);
  const [convertedAmountsCache, setConvertedAmountsCache] = useState<Record<string, number>>({});
  const [convertingIds, setConvertingIds] = useState<Set<string>>(new Set());
  const [isCurrencyManuallySelected, setIsCurrencyManuallySelected] = useState(false);
  
  const { convertAmountsBulk } = useCurrencyConversion();

  // Reset state when scenario or currency changes
  useEffect(() => {
    setIsCurrencyManuallySelected(false);
    setSelectedConversionCurrency(null);
    setConvertedAmountsCache({});
    setConvertingIds(new Set());
  }, [scenarioId, settingsCurrency]);

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

  // Auto-convert when currency or items change
  useEffect(() => {
    if (!selectedConversionCurrency || !items.length) {
      return;
    }

    const convertAllAmounts = async () => {
      // Filter items that need conversion
      const itemsToConvert = items.filter(item => {
        const cacheKey = `${item.id}_${selectedConversionCurrency}`;
        // Skip if currency matches or already in cache
        return item.currency !== selectedConversionCurrency && convertedAmountsCache[cacheKey] === undefined;
      });

      if (itemsToConvert.length === 0) {
        return;
      }

      // Prepare items array for batch conversion
      const conversionItems = itemsToConvert.map(item => ({
        amount: item.amount,
        currency: item.currency,
      }));

      // Mark all as converting
      const cacheKeys = itemsToConvert.map(item => `${item.id}_${selectedConversionCurrency}`);
      setConvertingIds(prev => {
        const newSet = new Set(prev);
        cacheKeys.forEach(key => newSet.add(key));
        return newSet;
      });

      try {
        const resultMap = await convertAmountsBulk(conversionItems, selectedConversionCurrency);
        
        if (resultMap) {
          const newCache: Record<string, number> = {};
          
          itemsToConvert.forEach((item, index) => {
            const cacheKey = `${item.id}_${selectedConversionCurrency}`;
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
          context: { selectedConversionCurrency, itemsCount: conversionItems.length }
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
  }, [selectedConversionCurrency, items, convertAmountsBulk, convertedAmountsCache, userId]);

  const handleConversionCurrencyChange = useCallback(async (newCurrency: string) => {
    const validCurrency = newCurrency as CurrencyCode;
    setSelectedConversionCurrency(validCurrency);
    setIsCurrencyManuallySelected(true);
    
    // Filter items that need conversion
    const itemsToConvert = items.filter(item => {
      const cacheKey = `${item.id}_${validCurrency}`;
      // Skip if currency matches or already in cache
      return item.currency !== validCurrency && convertedAmountsCache[cacheKey] === undefined;
    });

    if (itemsToConvert.length === 0) {
      return;
    }

    // Prepare items array for batch conversion
    const conversionItems = itemsToConvert.map(item => ({
      amount: item.amount,
      currency: item.currency,
    }));

    // Mark all as converting
    const cacheKeys = itemsToConvert.map(item => `${item.id}_${validCurrency}`);
    setConvertingIds(prev => {
      const newSet = new Set(prev);
      cacheKeys.forEach(key => newSet.add(key));
      return newSet;
    });

    try {
      // Perform batch conversion in one request
      const resultMap = await convertAmountsBulk(conversionItems, validCurrency);
      
      if (resultMap) {
        // Update cache for all results at once
        const newCache: Record<string, number> = {};
        
        itemsToConvert.forEach((item, index) => {
          const cacheKey = `${item.id}_${validCurrency}`;
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
        context: { newCurrency, itemsCount: conversionItems.length }
      });
    } finally {
      // Remove from convertingIds
      setConvertingIds(prev => {
        const newSet = new Set(prev);
        cacheKeys.forEach(key => newSet.delete(key));
        return newSet;
      });
    }
  }, [items, convertedAmountsCache, convertAmountsBulk, userId]);

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

