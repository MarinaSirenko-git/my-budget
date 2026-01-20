import { useMemo } from 'react';
import { useQuery } from '@tanstack/react-query';
import { useGoals } from './useGoals';
import { useCurrency } from './useCurrency';
import { useCurrencyConversion } from './useCurrencyConversion';
import { useScenario } from './useScenario';
import { type Goal, calculateMonthsLeft } from '@/shared/utils/goals';

interface GoalTotals {
    totalTargetAmount: number;
    totalSavedAmount: number;
    totalMonthlyPayment: number;
    goalsTotal: number;
}

function calculateGoalTotals(convertedGoals: Goal[]): GoalTotals {
    let totalTargetAmount = 0;
    let totalSavedAmount = 0;
    let totalMonthlyPayment = 0;
    const goalsTotal = convertedGoals.length;
    
    convertedGoals.forEach((goal: Goal) => {
        // Sum target amount in base currency
        const targetAmount = goal.amountInDefaultCurrency ?? goal.amount;
        totalTargetAmount += targetAmount;
        
        // Sum saved amount in base currency
        const savedAmount = goal.savedInDefaultCurrency ?? goal.saved ?? 0;
        totalSavedAmount += savedAmount;
        
        // Sum monthly payment in base currency
        const monthlyPayment = goal.monthlyPaymentInDefaultCurrency ?? goal.monthlyPayment ?? 0;
        totalMonthlyPayment += monthlyPayment;
    });
    
    return {
        totalTargetAmount,
        totalSavedAmount,
        totalMonthlyPayment,
        goalsTotal,
    };
}

async function convertGoals(
    goals: Goal[],
    baseCurrency: string,
    convertAmountsBulk: (items: Array<{ amount: number; currency: string }>, toCurrency?: string) => Promise<Map<number, number> | null>
): Promise<Goal[]> {
    if (!goals || goals.length === 0) {
        return [];
    }
    
    const goalsNeedingConversion = goals.filter(
        (goal: Goal) => goal.currency && goal.currency !== baseCurrency
    );
    
    if (goalsNeedingConversion.length === 0) {
        // All goals are already in base currency, set conversion fields and calculate monthly payments
        return goals.map((goal: Goal) => {
            const amountInDefaultCurrency = goal.amount;
            const savedInDefaultCurrency = goal.saved ?? 0;
            
            // Calculate months left if not provided
            let monthsLeft = goal.monthsLeft;
            if (!monthsLeft && goal.targetDate && goal.startDate) {
                monthsLeft = calculateMonthsLeft(goal.startDate, goal.targetDate);
            }
            
            // Calculate monthly payment: (target - saved) / monthsLeft
            const monthlyPayment = monthsLeft && monthsLeft > 0
                ? (goal.amount - savedInDefaultCurrency) / monthsLeft
                : 0;
            
            return {
                ...goal,
                amountInDefaultCurrency,
                savedInDefaultCurrency,
                monthlyPayment,
                monthlyPaymentInDefaultCurrency: monthlyPayment,
                monthsLeft: monthsLeft ?? goal.monthsLeft,
            };
        });
    }
    
    // Prepare items for bulk conversion (target amounts)
    const itemsToConvert = goalsNeedingConversion.map((goal: Goal) => ({
        amount: goal.amount,
        currency: goal.currency,
    }));
    
    const conversionMap = await convertAmountsBulk(itemsToConvert);
    
    // Prepare items for saved amounts conversion (if any saved amounts exist)
    const goalsWithSaved = goalsNeedingConversion.filter((goal: Goal) => goal.saved && goal.saved > 0);
    const savedItemsToConvert = goalsWithSaved.map((goal: Goal) => ({
        amount: goal.saved!,
        currency: goal.currency,
    }));
    
    const savedConversionMap = savedItemsToConvert.length > 0
        ? await convertAmountsBulk(savedItemsToConvert)
        : null;
    
    if (!conversionMap) {
        // If conversion fails, return goals with calculated monthly payments but no conversion
        return goals.map((goal: Goal) => {
            let monthsLeft = goal.monthsLeft;
            if (!monthsLeft && goal.targetDate && goal.startDate) {
                monthsLeft = calculateMonthsLeft(goal.startDate, goal.targetDate);
            }
            
            const monthlyPayment = monthsLeft && monthsLeft > 0
                ? (goal.amount - (goal.saved ?? 0)) / monthsLeft
                : 0;
            
            return {
                ...goal,
                monthlyPayment,
                monthsLeft: monthsLeft ?? goal.monthsLeft,
            };
        });
    }
    
    // Map converted amounts back to goals
    return goals.map((goal: Goal) => {
        const needsConversion = goal.currency && goal.currency !== baseCurrency;
        
        // Calculate months left if not provided
        let monthsLeft = goal.monthsLeft;
        if (!monthsLeft && goal.targetDate && goal.startDate) {
            monthsLeft = calculateMonthsLeft(goal.startDate, goal.targetDate);
        }
        
        if (needsConversion) {
            const goalIndex = goalsNeedingConversion.findIndex((g: Goal) => g.id === goal.id);
            const convertedTarget = conversionMap.get(goalIndex);
            
            // Find saved amount conversion if it exists
            const savedGoalIndex = goalsWithSaved.findIndex((g: Goal) => g.id === goal.id);
            const convertedSaved = savedConversionMap && savedGoalIndex >= 0
                ? savedConversionMap.get(savedGoalIndex)
                : undefined;
            
            const amountInDefaultCurrency = convertedTarget !== undefined ? convertedTarget : goal.amount;
            const savedInDefaultCurrency = convertedSaved !== undefined ? convertedSaved : (goal.saved ?? 0);
            
            // Calculate monthly payment in base currency: (convertedTarget - convertedSaved) / monthsLeft
            const monthlyPaymentInDefaultCurrency = monthsLeft && monthsLeft > 0
                ? (amountInDefaultCurrency - savedInDefaultCurrency) / monthsLeft
                : 0;
            
            // Calculate monthly payment in original currency for reference
            const monthlyPayment = monthsLeft && monthsLeft > 0
                ? (goal.amount - (goal.saved ?? 0)) / monthsLeft
                : 0;
            
            return {
                ...goal,
                amountInDefaultCurrency,
                savedInDefaultCurrency,
                monthlyPayment,
                monthlyPaymentInDefaultCurrency,
                monthsLeft: monthsLeft ?? goal.monthsLeft,
            };
        }
        
        // Goal already in base currency
        const amountInDefaultCurrency = goal.amount;
        const savedInDefaultCurrency = goal.saved ?? 0;
        const monthlyPayment = monthsLeft && monthsLeft > 0
            ? (goal.amount - savedInDefaultCurrency) / monthsLeft
            : 0;
        
        return {
            ...goal,
            amountInDefaultCurrency,
            savedInDefaultCurrency,
            monthlyPayment,
            monthlyPaymentInDefaultCurrency: monthlyPayment,
            monthsLeft: monthsLeft ?? goal.monthsLeft,
        };
    });
}

// Create a stable hash for the goals array to use in queryKey
function createGoalsHash(goals: Goal[]): string {
    if (!goals || goals.length === 0) {
        return 'empty';
    }
    // Create a hash based on goal IDs, amounts, saved amounts, and currencies
    return goals
        .map(goal => `${goal.id}:${goal.amount}:${goal.saved ?? 0}:${goal.currency}:${goal.targetDate}:${goal.startDate}:${goal.name}`)
        .sort()
        .join('|');
}

export function useConvertedGoals() {
    const { goals, loading: goalsLoading, error } = useGoals();
    const { currency: baseCurrency, loading: currencyLoading } = useCurrency();
    const { convertAmountsBulk } = useCurrencyConversion();
    const { currentScenario } = useScenario();
    
    // Create stable hash for query key
    const goalsHash = useMemo(
        () => createGoalsHash(goals),
        [goals]
    );
    
    // Convert goals using React Query
    const {
        data: convertedGoals = [],
        isLoading: conversionLoading,
        error: conversionError,
    } = useQuery<Goal[]>({
        queryKey: ['convertedGoals', currentScenario?.id, baseCurrency, goalsHash],
        queryFn: () => convertGoals(goals, baseCurrency, convertAmountsBulk),
        
        staleTime: 1000 * 60 * 5, // 5 minutes
        gcTime: 1000 * 60 * 10, // 10 minutes
        
        refetchOnMount: 'always',
        refetchOnWindowFocus: false,
        refetchOnReconnect: true,
        
        enabled: !goalsLoading && !currencyLoading && !!baseCurrency && !!currentScenario?.id,
    });
    
    // Calculate totals using React Query
    const {
        data: totals = { totalTargetAmount: 0, totalSavedAmount: 0, totalMonthlyPayment: 0, goalsTotal: 0 },
        isLoading: totalsLoading,
    } = useQuery<GoalTotals>({
        queryKey: ['goalTotals', currentScenario?.id, goalsHash, baseCurrency],
        queryFn: () => calculateGoalTotals(convertedGoals),
        
        staleTime: 1000 * 60 * 5, // 5 minutes
        gcTime: 1000 * 60 * 10, // 10 minutes
        
        refetchOnMount: 'always',
        refetchOnWindowFocus: false,
        refetchOnReconnect: true,
        
        enabled: !conversionLoading && convertedGoals.length > 0,
    });
    
    return {
        convertedGoals,
        loading: goalsLoading || currencyLoading || conversionLoading || totalsLoading,
        error: error || conversionError,
        totalTargetAmount: totals.totalTargetAmount,
        totalSavedAmount: totals.totalSavedAmount,
        totalMonthlyPayment: totals.totalMonthlyPayment,
        goalsTotal: totals.goalsTotal,
    };
}