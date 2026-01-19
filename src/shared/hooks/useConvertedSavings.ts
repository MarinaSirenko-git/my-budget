import { useMemo } from 'react';
import { useQuery } from '@tanstack/react-query';
import { useSavings, type Saving } from './useSavings';
import { useCurrency } from './useCurrency';
import { useCurrencyConversion } from './useCurrencyConversion';
import { useScenario } from './useScenario';

interface SavingsTotals {
    totalInBaseCurrency: number;
    totalsByCurrency: Record<string, number>;
    savingsTotal: number;
}

function calculateSavingsTotals(convertedSavings: Saving[]): SavingsTotals {
    let totalInBaseCurrency = 0;
    const totalsByCurrency: Record<string, number> = {};
    const savingsTotal = convertedSavings.length;
    
    convertedSavings.forEach((saving: Saving) => {
        // Sum in base currency (amountInDefaultCurrency should always be set after conversion)
        const baseAmount = saving.amountInDefaultCurrency ?? saving.amount;
        totalInBaseCurrency += baseAmount;
        
        // Sum in original currency
        if (!totalsByCurrency[saving.currency]) {
            totalsByCurrency[saving.currency] = 0;
        }
        totalsByCurrency[saving.currency] += saving.amount;
    });
    
    return {
        totalInBaseCurrency,
        totalsByCurrency,
        savingsTotal,
    };
}

async function convertSavings(
    savings: Saving[],
    baseCurrency: string,
    convertAmountsBulk: (items: Array<{ amount: number; currency: string }>, toCurrency?: string) => Promise<Map<number, number> | null>
): Promise<Saving[]> {
    if (!savings || savings.length === 0) {
        return [];
    }
    
    const savingsNeedingConversion = savings.filter(
        (saving: Saving) => saving.currency && saving.currency !== baseCurrency
    );
    
    if (savingsNeedingConversion.length === 0) {
        // All savings are already in base currency, set amountInDefaultCurrency
        return savings.map((saving: Saving) => ({
            ...saving,
            amountInDefaultCurrency: saving.amount,
        }));
    }
    
    const itemsToConvert = savingsNeedingConversion.map((saving: Saving) => ({
        amount: saving.amount,
        currency: saving.currency,
    }));
    
    const conversionMap = await convertAmountsBulk(itemsToConvert);
    
    if (!conversionMap) {
        return savings;
    }
    
    return savings.map((saving: Saving) => {
        const needsConversion = saving.currency && saving.currency !== baseCurrency;
        
        if (needsConversion) {
            const index = savingsNeedingConversion.findIndex((sav: Saving) => sav.id === saving.id);
            const convertedAmount = conversionMap.get(index);
            
            return {
                ...saving,
                amountInDefaultCurrency: convertedAmount !== undefined ? convertedAmount : undefined,
            };
        }
        
        // If already in base currency, set amountInDefaultCurrency to amount
        return {
            ...saving,
            amountInDefaultCurrency: saving.amount,
        };
    });
}

// Create a stable hash for the savings array to use in queryKey
function createSavingsHash(savings: Saving[]): string {
    if (!savings || savings.length === 0) {
        return 'empty';
    }
    // Create a hash based on saving IDs, amounts, and currencies
    return savings
        .map(sav => `${sav.id}:${sav.amount}:${sav.currency}`)
        .sort()
        .join('|');
}

export function useConvertedSavings() {
    const { savings, loading: savingsLoading, error } = useSavings();
    const { currency: baseCurrency, loading: currencyLoading } = useCurrency();
    const { convertAmountsBulk } = useCurrencyConversion();
    const { currentScenario } = useScenario();
    
    // Create stable hash for query key
    const savingsHash = useMemo(
        () => createSavingsHash(savings),
        [savings]
    );
    
    // Convert savings using React Query
    const {
        data: convertedSavings = [],
        isLoading: conversionLoading,
        error: conversionError,
    } = useQuery<Saving[]>({
        queryKey: ['convertedSavings', currentScenario?.id, baseCurrency, savingsHash],
        queryFn: () => convertSavings(savings, baseCurrency, convertAmountsBulk),
        
        staleTime: 1000 * 60 * 5, // 5 minutes
        gcTime: 1000 * 60 * 10, // 10 minutes
        
        refetchOnMount: 'always',
        refetchOnWindowFocus: false,
        refetchOnReconnect: true,
        
        enabled: !savingsLoading && !currencyLoading && !!baseCurrency && !!currentScenario?.id,
    });
    
    // Calculate totals using React Query
    const {
        data: totals = { totalInBaseCurrency: 0, totalsByCurrency: {}, savingsTotal: 0 },
        isLoading: totalsLoading,
    } = useQuery<SavingsTotals>({
        queryKey: ['savingsTotals', currentScenario?.id, savingsHash, baseCurrency],
        queryFn: () => calculateSavingsTotals(convertedSavings),
        
        staleTime: 1000 * 60 * 5, // 5 minutes
        gcTime: 1000 * 60 * 10, // 10 minutes
        
        refetchOnMount: 'always',
        refetchOnWindowFocus: false,
        refetchOnReconnect: true,
        
        enabled: !conversionLoading && convertedSavings.length > 0,
    });
    
    return {
        convertedSavings,
        loading: savingsLoading || currencyLoading || conversionLoading || totalsLoading,
        error: error || conversionError,
        totalInBaseCurrency: totals.totalInBaseCurrency,
        totalsByCurrency: totals.totalsByCurrency,
        savingsTotal: totals.savingsTotal,
    };
}

