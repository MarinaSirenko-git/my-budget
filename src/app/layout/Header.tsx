import { useState, useEffect } from 'react';
import ThemeSwitch from '@/shared/ui/ThemeSwitch';
import ScenarioSwitch from '@/shared/ui/ScenarioSwitch';
import MobileMenu from '@/shared/ui/MobileMenu';
import FinancialSummary from '@/shared/ui/FinancialSummary';
import { supabase } from '@/lib/supabase';
import { useAuth } from '@/shared/store/auth';
import PlaceName from '@/shared/ui/PlaceName';

function Header(){
    const { user } = useAuth();
    const [totalIncome, setTotalIncome] = useState(0);
    const [totalExpenses, setTotalExpenses] = useState(0);
    const [totalGoals, setTotalGoals] = useState(0);

    // Fetch and calculate total income
    useEffect(() => {
        async function fetchTotalIncome() {
            if (!user) {
                setTotalIncome(0);
                return;
            }

            try {
                const { data, error } = await supabase
                    .from('incomes')
                    .select('amount, frequency')
                    .eq('user_id', user.id);

                if (error) {
                    console.error('Error fetching incomes:', error);
                    setTotalIncome(0);
                    return;
                }

                if (data) {
                    // Calculate total: monthly incomes as-is, annual incomes divided by 12
                    const total = data.reduce((sum, income) => {
                        if (income.frequency === 'annual') {
                            return sum + (income.amount / 12);
                        } else {
                            // monthly or one-time
                            return sum + income.amount;
                        }
                    }, 0);
                    setTotalIncome(Math.round(total * 100) / 100); // Round to 2 decimal places
                }
            } catch (err) {
                console.error('Error calculating total income:', err);
                setTotalIncome(0);
            }
        }

        fetchTotalIncome();
    }, [user]);

    // Fetch and calculate total expenses
    useEffect(() => {
        async function fetchTotalExpenses() {
            if (!user) {
                setTotalExpenses(0);
                return;
            }

            try {
                const { data, error } = await supabase
                    .from('expenses')
                    .select('planned_amount, amount, frequency')
                    .eq('user_id', user.id);

                if (error) {
                    console.error('Error fetching expenses:', error);
                    setTotalExpenses(0);
                    return;
                }

                if (data) {
                    // Calculate total: monthly expenses as-is, annual expenses divided by 12
                    const total = data.reduce((sum, expense) => {
                        const amount = expense.planned_amount || expense.amount || 0;
                        if (expense.frequency === 'annual') {
                            return sum + (amount / 12);
                        } else {
                            // monthly or one-time
                            return sum + amount;
                        }
                    }, 0);
                    setTotalExpenses(Math.round(total * 100) / 100); // Round to 2 decimal places
                }
            } catch (err) {
                console.error('Error calculating total expenses:', err);
                setTotalExpenses(0);
            }
        }

        fetchTotalExpenses();
    }, [user]);

    // Fetch and calculate total goals
    useEffect(() => {
        async function fetchTotalGoals() {
            if (!user) {
                setTotalGoals(0);
                return;
            }

            try {
                const { data, error } = await supabase
                    .from('goals')
                    .select('target_amount, amount')
                    .eq('user_id', user.id);

                if (error) {
                    console.error('Error fetching goals:', error);
                    setTotalGoals(0);
                    return;
                }

                if (data) {
                    // Sum all target amounts
                    const total = data.reduce((sum, goal) => {
                        const amount = goal.target_amount || goal.amount || 0;
                        return sum + amount;
                    }, 0);
                    setTotalGoals(Math.round(total * 100) / 100); // Round to 2 decimal places
                }
            } catch (err) {
                console.error('Error calculating total goals:', err);
                setTotalGoals(0);
            }
        }

        fetchTotalGoals();
    }, [user]);

    return(
        <>
            <div className="navbar sticky top-0 font-normal font-base bg-[#F1F5F9] dark:bg-[#0F172A] z-20 shadow-xs flex items-center justify-between py-4 pl-4 pr-4">
                <div className="flex items-center gap-4">
                    <MobileMenu />
                    <div className="flex items-center gap-4">
                        <PlaceName />
                        <ScenarioSwitch />
                        <div className="flex items-center justify-center gap-1">
                            <ThemeSwitch />
                        </div>
                    </div>
                </div>
                <div className='flex items-center justify-center'>
                    <FinancialSummary totalIncome={totalIncome} totalExpenses={totalExpenses} totalGoals={totalGoals} />
                </div>
            </div>
        </>
    )
}

export default Header