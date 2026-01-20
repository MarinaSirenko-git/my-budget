import { useMemo } from 'react';
import { useQuery } from '@tanstack/react-query';
import { useIncomes } from './useIncomes';
import { useCurrency } from './useCurrency';
import { useCurrencyConversion } from './useCurrencyConversion';
import { useScenario } from './useScenario';

interface Income {
  id: string;
  type: string;
  amount: number;
  currency: string;
  frequency: 'monthly' | 'annual';
  date: string;
  createdAt: string;
  amountInDefaultCurrency?: number;
}

interface IncomeTotals {
    monthlyTotal: number;
    annualTotal: number;
    incomeTotal: number;
}

function calculateIncomeTotals(convertedIncomes: Income[]): IncomeTotals {
    let monthlyTotal = 0;
    let annualTotal = 0;
    const incomeTotal = convertedIncomes.length;
    
    convertedIncomes.forEach((income: Income) => {
        const amount = income.amountInDefaultCurrency ?? income.amount;
        
        if (income.frequency === 'monthly') {
            monthlyTotal += amount;
            annualTotal += amount * 12;
        } else if (income.frequency === 'annual') {
            monthlyTotal += amount / 12;
            annualTotal += amount;
        }
    });
    
    return {
        monthlyTotal,
        annualTotal,
        incomeTotal,
    };
}

async function convertIncomes(
    incomes: Income[],
    baseCurrency: string,
    convertAmountsBulk: (items: Array<{ amount: number; currency: string }>, toCurrency?: string) => Promise<Map<number, number> | null>
): Promise<Income[]> {
    if (!incomes || incomes.length === 0) {
        return [];
    }
    
    const incomesNeedingConversion = incomes.filter(
        (income: Income) => income.currency && income.currency !== baseCurrency
    );
    
    if (incomesNeedingConversion.length === 0) {
        return incomes;
    }
    
    const itemsToConvert = incomesNeedingConversion.map((income: Income) => ({
        amount: income.amount,
        currency: income.currency,
    }));
    
    const conversionMap = await convertAmountsBulk(itemsToConvert);
    
    if (!conversionMap) {
        return incomes;
    }
    
    return incomes.map((income: Income) => {
        const needsConversion = income.currency && income.currency !== baseCurrency;
        
        if (needsConversion) {
            const index = incomesNeedingConversion.findIndex((inc: Income) => inc.id === income.id);
            const convertedAmount = conversionMap.get(index);
            
            return {
                ...income,
                amountInDefaultCurrency: convertedAmount !== undefined ? convertedAmount : undefined,
            };
        }
        
        return income;
    });
}

// Create a stable hash for the incomes array to use in queryKey
function createIncomesHash(incomes: Income[]): string {
    if (!incomes || incomes.length === 0) {
        return 'empty';
    }
    // Create a hash based on income IDs, amounts, and currencies
    return incomes
        .map(inc => `${inc.id}:${inc.amount}:${inc.currency}`)
        .sort()
        .join('|');
}

export function useConvertedIncomes() {
    const { incomes, loading: incomesLoading, error } = useIncomes();
    const { currency: baseCurrency, loading: currencyLoading } = useCurrency();
    const { convertAmountsBulk } = useCurrencyConversion();
    const { currentScenario } = useScenario();
    
    // Create stable hash for query key
    const incomesHash = useMemo(
        () => createIncomesHash(incomes),
        [incomes]
    );
    
    // Convert incomes using React Query
    const {
        data: convertedIncomes = [],
        isLoading: conversionLoading,
        error: conversionError,
    } = useQuery<Income[]>({
        queryKey: ['convertedIncomes', currentScenario?.id, baseCurrency, incomesHash],
        queryFn: () => convertIncomes(incomes, baseCurrency, convertAmountsBulk),
        
        staleTime: 1000 * 60 * 5, // 5 minutes
        gcTime: 1000 * 60 * 10, // 10 minutes
        
        refetchOnMount: 'always',
        refetchOnWindowFocus: false,
        refetchOnReconnect: true,
        
        enabled: !incomesLoading && !currencyLoading && !!baseCurrency && !!currentScenario?.id,
    });
    
    // Calculate totals using React Query
    const {
        data: totals = { monthlyTotal: 0, annualTotal: 0, incomeTotal: 0 },
        isLoading: totalsLoading,
    } = useQuery<IncomeTotals>({
        queryKey: ['incomeTotals', currentScenario?.id, baseCurrency, incomesHash],
        queryFn: () => calculateIncomeTotals(convertedIncomes),
        
        staleTime: 1000 * 60 * 5, // 5 minutes
        gcTime: 1000 * 60 * 10, // 10 minutes
        
        refetchOnMount: 'always',
        refetchOnWindowFocus: false,
        refetchOnReconnect: true,
        
        enabled: !conversionLoading && convertedIncomes.length > 0,
    });
    
    return {
        convertedIncomes,
        loading: incomesLoading || currencyLoading || conversionLoading || totalsLoading,
        error: error || conversionError,
        monthlyTotal: totals.monthlyTotal,
        annualTotal: totals.annualTotal,
        incomeTotal: totals.incomeTotal,
    };
}