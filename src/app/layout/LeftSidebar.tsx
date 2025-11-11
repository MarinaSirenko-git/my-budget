import { NavLink } from "react-router-dom";
import Logo from '@/shared/ui/Logo';
import { useAuth } from '@/shared/store/auth';
import { useEffect, useState } from 'react';
import { supabase } from '@/lib/supabase';

function LeftSidebar(){
    const { user } = useAuth();
    const signOut = useAuth(s => s.signOut);
    const [totalIncome, setTotalIncome] = useState(0);
    const [totalExpenses, setTotalExpenses] = useState(0);
    const [totalGoals, setTotalGoals] = useState(0);

    const navLinkClass = ({ isActive }: { isActive: boolean }) => 
        `flex items-center gap-2 pb-1 border-b-2 transition-colors ${
            isActive 
                ? 'border-b-primary' 
                : 'border-b-transparent hover:border-b-primary/50'
        }`;

    const bottomNavLinkClass = ({ isActive }: { isActive: boolean }) => 
        `flex items-center font-normal gap-2 py-1 px-4 transition-colors ${
            isActive 
                ? 'text-primary' 
                : 'hover:text-primary'
        }`;

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
                    const total = data.reduce((sum, income) => {
                        if (income.frequency === 'annual') {
                            return sum + (income.amount / 12);
                        } else {
                            return sum + income.amount;
                        }
                    }, 0);
                    setTotalIncome(Math.round(total * 100) / 100);
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
                    const total = data.reduce((sum, expense) => {
                        const amount = expense.planned_amount || expense.amount || 0;
                        if (expense.frequency === 'annual') {
                            return sum + (amount / 12);
                        } else {
                            return sum + amount;
                        }
                    }, 0);
                    setTotalExpenses(Math.round(total * 100) / 100);
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
                    const total = data.reduce((sum, goal) => {
                        const amount = goal.target_amount || goal.amount || 0;
                        return sum + amount;
                    }, 0);
                    setTotalGoals(Math.round(total * 100) / 100);
                }
            } catch (err) {
                console.error('Error calculating total goals:', err);
                setTotalGoals(0);
            }
        }
        fetchTotalGoals();
    }, [user]);

    const remainder = totalIncome - totalExpenses - totalGoals;
    let remainderColor = 'text-white';
    if (remainder > 0) {
        remainderColor = 'text-success';
    } else if (remainder < 0) {
        remainderColor = 'text-accentRed';
    }

    return(
        <div className="fixed top-0 left-0 flex flex-col h-screen w-[clamp(200px,18vw,260px)] bg-sidebarBg dark:bg-sidebarBg dark:text-mainTextColor border-r dark:border-borderColor p-2 pt-0 z-30">
            {/* Financial Summary - absolutely positioned on the border */}
            <div className="absolute right-[-40px] top-1/2 -translate-y-1/2 z-40 flex flex-col gap-2">
                <div className="min-w-[100px] px-3 py-2 bg-success rounded-md shadow-sm">
                    <div className="text-xs text-white tracking-wider">Доходы</div>
                    <div className="text-sm font-semibold text-white">{totalIncome}</div>
                </div>
                <div className="min-w-[100px] px-3 py-2 bg-accentRed rounded-md shadow-sm">
                    <div className="text-xs text-white tracking-wider">Расходы</div>
                    <div className="text-sm font-semibold text-white">{totalExpenses}</div>
                </div>
                <div className="min-w-[100px] px-3 py-2 bg-accentYellow rounded-md shadow-sm">
                    <div className="text-xs text-white tracking-wider">Цели</div>
                    <div className="text-sm font-semibold text-white">{totalGoals}</div>
                </div>
                <div className="min-w-[100px] px-3 py-2 bg-presenting rounded-md shadow-sm">
                    <div className="text-xs text-white tracking-wider">Остаток</div>
                    <div className={`text-sm font-semibold ${remainderColor}`}>{remainder}</div>
                </div>
            </div>
            
            <div className='flex items-center h-[70px]'>
                <div className="-mt-[25px]">
                  <Logo />
                </div>
            </div>
            <ul className="w-full px-2 flex flex-col gap-2 font-base bg-base-100 text-mainTextColor dark:text-mainTextColor text-md leading-loose">
                <li> 
                    <NavLink className={navLinkClass} to="/income">
                        Мои доходы
                    </NavLink>
                </li>
                <li> 
                    <NavLink className={navLinkClass} to="/goals">
                        Мои цели
                    </NavLink>
                </li>
                <li> 
                    <NavLink className={navLinkClass} to="/expenses">
                        Мои расходы
                    </NavLink>
                </li>
            </ul>
            <ul className="pt-2 w-full mt-auto font-base bg-base-100 text-mainTextColor dark:text-mainTextColor text-md leading-loose">
                <li className="font-semibold rounded-md"> 
                    <NavLink className={bottomNavLinkClass} to="/docs">
                    Как мне это поможет?
                    </NavLink>
                </li>
                <li className="font-semibold rounded-md"> 
                    <NavLink className={bottomNavLinkClass} to="/settings">
                        Настройки
                    </NavLink>
                </li>
                <li className="font-semibold rounded-md"> 
                    <button onClick={signOut} className='flex items-center font-normal gap-2 py-1 px-4 hover:text-primary'>
                        Выйти
                    </button>
                </li>
            </ul>
        </div>
    )
}

export default LeftSidebar