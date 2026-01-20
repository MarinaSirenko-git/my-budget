import { useMemo } from 'react';
import { useQuery } from '@tanstack/react-query';
import { useExpenses } from './useExpenses';
import { useCurrency } from './useCurrency';
import { useCurrencyConversion } from './useCurrencyConversion';
import { useScenario } from './useScenario';
import type { Expense } from '@/mocks/pages/expenses.mock';

interface ExpenseTotals {
    monthlyTotal: number;
    annualTotal: number;
    expenseTotal: number;
}

function calculateExpenseTotals(convertedExpenses: Expense[]): ExpenseTotals {
    let monthlyTotal = 0;
    let annualTotal = 0;
    const expenseTotal = convertedExpenses.length;
    
    convertedExpenses.forEach((expense: Expense) => {
        const amount = expense.amountInDefaultCurrency ?? expense.amount;
        
        if (expense.frequency === 'monthly') {
            monthlyTotal += amount;
            annualTotal += amount * 12;
        } else if (expense.frequency === 'annual') {
            monthlyTotal += amount / 12;
            annualTotal += amount;
        }
    });
    
    return {
        monthlyTotal,
        annualTotal,
        expenseTotal,
    };
}

async function convertExpenses(
    expenses: Expense[],
    baseCurrency: string,
    convertAmountsBulk: (items: Array<{ amount: number; currency: string }>, toCurrency?: string) => Promise<Map<number, number> | null>
): Promise<Expense[]> {
    if (!expenses || expenses.length === 0) {
        return [];
    }
    
    const expensesNeedingConversion = expenses.filter(
        (expense: Expense) => expense.currency && expense.currency !== baseCurrency
    );
    
    if (expensesNeedingConversion.length === 0) {
        return expenses;
    }
    
    const itemsToConvert = expensesNeedingConversion.map((expense: Expense) => ({
        amount: expense.amount,
        currency: expense.currency,
    }));
    
    const conversionMap = await convertAmountsBulk(itemsToConvert);
    
    if (!conversionMap) {
        return expenses;
    }
    
    return expenses.map((expense: Expense) => {
        const needsConversion = expense.currency && expense.currency !== baseCurrency;
        
        if (needsConversion) {
            const index = expensesNeedingConversion.findIndex((exp: Expense) => exp.id === expense.id);
            const convertedAmount = conversionMap.get(index);
            
            return {
                ...expense,
                amountInDefaultCurrency: convertedAmount !== undefined ? convertedAmount : undefined,
            };
        }
        
        return expense;
    });
}

// Create a stable hash for the expenses array to use in queryKey
function createExpensesHash(expenses: Expense[]): string {
    if (!expenses || expenses.length === 0) {
        return 'empty';
    }
    // Create a hash based on expense IDs, amounts, and currencies
    return expenses
        .map(exp => `${exp.id}:${exp.amount}:${exp.currency}:${exp.type}:${exp.frequency}`)
        .sort()
        .join('|');
}

export function useConvertedExpenses() {
    const { expenses, loading: expensesLoading, error } = useExpenses();
    const { currency: baseCurrency, loading: currencyLoading } = useCurrency();
    const { convertAmountsBulk } = useCurrencyConversion();
    const { currentScenario } = useScenario();
    
    // Create stable hash for query key
    const expensesHash = useMemo(
        () => createExpensesHash(expenses),
        [expenses]
    );
    
    // Convert expenses using React Query
    const {
        data: convertedExpenses = [],
        isLoading: conversionLoading,
        error: conversionError,
    } = useQuery<Expense[]>({
        queryKey: ['convertedExpenses', currentScenario?.id, baseCurrency, expensesHash],
        queryFn: () => convertExpenses(expenses, baseCurrency, convertAmountsBulk),
        
        staleTime: 1000 * 60 * 5, // 5 minutes
        gcTime: 1000 * 60 * 10, // 10 minutes
        
        refetchOnMount: 'always',
        refetchOnWindowFocus: false,
        refetchOnReconnect: true,
        
        enabled: !expensesLoading && !currencyLoading && !!baseCurrency && !!currentScenario?.id,
    });
    
    // Calculate totals using React Query
    const {
        data: totals = { monthlyTotal: 0, annualTotal: 0, expenseTotal: 0 },
        isLoading: totalsLoading,
    } = useQuery<ExpenseTotals>({
        queryKey: ['expenseTotals', currentScenario?.id, baseCurrency, expensesHash],
        queryFn: () => calculateExpenseTotals(convertedExpenses),
        
        staleTime: 1000 * 60 * 5, // 5 minutes
        gcTime: 1000 * 60 * 10, // 10 minutes
        
        refetchOnMount: 'always',
        refetchOnWindowFocus: false,
        refetchOnReconnect: true,
        
        enabled: !conversionLoading && convertedExpenses.length > 0,
    });
    
    return {
        convertedExpenses,
        loading: expensesLoading || currencyLoading || conversionLoading || totalsLoading,
        error: error || conversionError,
        monthlyTotal: totals.monthlyTotal,
        annualTotal: totals.annualTotal,
        expenseTotal: totals.expenseTotal,
    };
}

