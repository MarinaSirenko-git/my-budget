import { NavLink } from "react-router-dom";
import Logo from '@/shared/ui/Logo';
import { useAuth } from '@/shared/store/auth';
import { useEffect, useState, useCallback } from 'react';
import { supabase } from '@/lib/supabase';
import { useTranslation } from '@/shared/i18n';

function LeftSidebar(){
    const { user } = useAuth();
    const signOut = useAuth(s => s.signOut);
    const { t } = useTranslation('components');
    const [totalIncome, setTotalIncome] = useState(0);
    const [totalExpenses, setTotalExpenses] = useState(0);
    const [totalGoals, setTotalGoals] = useState(0);
    const [totalSavings, setTotalSavings] = useState(0);
    const [settingsCurrency, setSettingsCurrency] = useState<string | null>(null);

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

    // Load settings currency
    useEffect(() => {
        async function loadSettingsCurrency() {
            if (!user) {
                const savedCurrency = localStorage.getItem('user_currency');
                if (savedCurrency) {
                    setSettingsCurrency(savedCurrency);
                }
                return;
            }

            try {
                const { data, error } = await supabase
                    .from('profiles')
                    .select('default_currency')
                    .eq('id', user.id)
                    .single();

                if (error && error.code !== 'PGRST116') {
                    const savedCurrency = localStorage.getItem('user_currency');
                    if (savedCurrency) {
                        setSettingsCurrency(savedCurrency);
                    }
                } else if (data?.default_currency) {
                    setSettingsCurrency(data.default_currency);
                } else {
                    const savedCurrency = localStorage.getItem('user_currency');
                    if (savedCurrency) {
                        setSettingsCurrency(savedCurrency);
                    }
                }
            } catch (err) {
                console.error('Error loading settings currency:', err);
                const savedCurrency = localStorage.getItem('user_currency');
                if (savedCurrency) {
                    setSettingsCurrency(savedCurrency);
                }
            }
        }

        loadSettingsCurrency();

        const handleStorageChange = (e: StorageEvent) => {
            if (e.key === 'user_currency' && e.newValue) {
                setSettingsCurrency(e.newValue);
            }
        };

        window.addEventListener('storage', handleStorageChange);
        
        const handleCustomStorageChange = () => {
            const savedCurrency = localStorage.getItem('user_currency');
            if (savedCurrency) {
                setSettingsCurrency(savedCurrency);
            }
        };

        window.addEventListener('currencyChanged', handleCustomStorageChange);

        return () => {
            window.removeEventListener('storage', handleStorageChange);
            window.removeEventListener('currencyChanged', handleCustomStorageChange);
        };
    }, [user]);

    // Function to convert amount using RPC
    const convertAmount = async (amount: number, fromCurrency: string): Promise<number | null> => {
        if (!settingsCurrency || fromCurrency === settingsCurrency) {
            return null;
        }

        try {
            const { data, error } = await supabase.rpc('convert_amount', {
                p_amount: amount,
                p_from_currency: fromCurrency,
            });

            if (error) {
                console.error('Error converting amount:', error);
                return null;
            }

            if (Array.isArray(data) && data.length > 0 && data[0]?.converted_amount) {
                return data[0].converted_amount;
            }

            return null;
        } catch (err) {
            console.error('Error calling convert_amount RPC:', err);
            return null;
        }
    };

    // Fetch and calculate total income
    const fetchTotalIncome = useCallback(async () => {
        if (!user) {
            setTotalIncome(0);
            return;
        }
        try {
            const { data, error } = await supabase
                .from('incomes_decrypted')
                .select('amount, currency, frequency')
                .eq('user_id', user.id);
            if (error) {
                console.error('Error fetching incomes:', error);
                setTotalIncome(0);
                return;
            }
            if (data) {
                // Конвертируем суммы и рассчитываем месячный доход
                // Сначала обрабатываем месячные доходы
                const monthlyIncomesPromises = data
                    .filter(income => income.frequency === 'monthly')
                    .map(async (income) => {
                        // Используем конвертированную сумму если валюта отличается от дефолтной
                        if (settingsCurrency && income.currency !== settingsCurrency) {
                            const converted = await convertAmount(income.amount, income.currency);
                            if (converted !== null) {
                                return converted;
                            }
                        }
                        // Используем исходную сумму если валюта совпадает с дефолтной
                        return income.amount;
                    });

                // Затем обрабатываем годовые доходы, разделенные на 12
                const annualIncomesPromises = data
                    .filter(income => income.frequency === 'annual')
                    .map(async (income) => {
                        // Используем конвертированную сумму если валюта отличается от дефолтной
                        if (settingsCurrency && income.currency !== settingsCurrency) {
                            const converted = await convertAmount(income.amount, income.currency);
                            if (converted !== null) {
                                return converted / 12;
                            }
                        }
                        // Используем исходную сумму если валюта совпадает с дефолтной
                        return income.amount / 12;
                    });

                const [monthlyAmounts, annualAmounts] = await Promise.all([
                    Promise.all(monthlyIncomesPromises),
                    Promise.all(annualIncomesPromises)
                ]);

                const total = [...monthlyAmounts, ...annualAmounts].reduce((sum, amount) => sum + amount, 0);
                // Сохраняем точное значение, форматирование будет при отображении
                setTotalIncome(total);
            }
        } catch (err) {
            console.error('Error calculating total income:', err);
            setTotalIncome(0);
        }
    }, [user, settingsCurrency, convertAmount]);

    useEffect(() => {
        fetchTotalIncome();
    }, [fetchTotalIncome]);

    // Подписка на события обновления доходов
    useEffect(() => {
        const handleIncomeUpdated = () => {
            fetchTotalIncome();
        };

        window.addEventListener('incomeUpdated', handleIncomeUpdated);
        return () => {
            window.removeEventListener('incomeUpdated', handleIncomeUpdated);
        };
    }, [fetchTotalIncome]);

    // Fetch and calculate total expenses
    const fetchTotalExpenses = useCallback(async () => {
        if (!user) {
            setTotalExpenses(0);
            return;
        }
        try {
            const { data, error } = await supabase
                .from('expenses_decrypted')
                .select('amount, frequency')
                .eq('user_id', user.id);
            if (error) {
                console.error('Error fetching expenses:', error);
                setTotalExpenses(0);
                return;
            }
            if (data) {
                const total = data.reduce((sum, expense) => {
                    const amount = expense.amount || 0;
                    if (expense.frequency === 'annual') {
                        return sum + (amount / 12);
                    } else {
                        return sum + amount;
                    }
                }, 0);
                setTotalExpenses(total);
            }
        } catch (err) {
            console.error('Error calculating total expenses:', err);
            setTotalExpenses(0);
        }
    }, [user]);

    useEffect(() => {
        fetchTotalExpenses();
    }, [fetchTotalExpenses]);

    // Подписка на события обновления расходов
    useEffect(() => {
        const handleExpenseUpdated = () => {
            fetchTotalExpenses();
        };

        window.addEventListener('expenseUpdated', handleExpenseUpdated);
        return () => {
            window.removeEventListener('expenseUpdated', handleExpenseUpdated);
        };
    }, [fetchTotalExpenses]);

    // Fetch and calculate total goals
    const fetchTotalGoals = useCallback(async () => {
        if (!user) {
            setTotalGoals(0);
            return;
        }
        try {
            const { data, error } = await supabase
                .from('goals_decrypted')
                .select('target_amount, target_date, created_at')
                .eq('user_id', user.id);
            if (error) {
                console.error('Error fetching goals:', error);
                setTotalGoals(0);
                return;
            }
            if (data && data.length > 0) {
                const total = data.reduce((sum, goal) => {
                    const targetAmount = goal.target_amount || 0;
                    const targetDate = goal.target_date;
                    const createdAt = goal.created_at;
                    
                    // Skip goals without target date or creation date
                    if (!targetDate || !createdAt) {
                        return sum;
                    }
                    
                    // Skip goals with zero or negative amount
                    if (targetAmount <= 0) {
                        return sum;
                    }
                    
                    // Calculate months from creation date to target date
                    const created = new Date(createdAt);
                    created.setHours(0, 0, 0, 0);
                    
                    const target = new Date(targetDate);
                    target.setHours(0, 0, 0, 0);
                    
                    const diffTime = target.getTime() - created.getTime();
                    
                    // If target date is before or equal to creation date, skip
                    if (diffTime <= 0) {
                        return sum;
                    }
                    
                    // Calculate total months from creation to target
                    const diffDays = Math.ceil(diffTime / (1000 * 60 * 60 * 24));
                    const totalMonths = Math.max(1, Math.ceil(diffDays / 30.44)); // 30.44 = average days per month
                    
                    // Calculate monthly contribution: target_amount / total_months
                    const monthlyContribution = targetAmount / totalMonths;
                    
                    return sum + monthlyContribution;
                }, 0);
                
                setTotalGoals(Math.round(total * 100) / 100); // Round to 2 decimal places
            } else {
                setTotalGoals(0);
            }
        } catch (err) {
            console.error('Error calculating total goals:', err);
            setTotalGoals(0);
        }
    }, [user]);

    useEffect(() => {
        fetchTotalGoals();
    }, [fetchTotalGoals]);

    // Подписка на события обновления целей
    useEffect(() => {
        const handleGoalUpdated = () => {
            fetchTotalGoals();
        };

        window.addEventListener('goalUpdated', handleGoalUpdated);
        return () => {
            window.removeEventListener('goalUpdated', handleGoalUpdated);
        };
    }, [fetchTotalGoals]);

    // Fetch and calculate total savings
    const fetchTotalSavings = useCallback(async () => {
        if (!user) {
            setTotalSavings(0);
            return;
        }
        try {
            const { data, error } = await supabase
                .from('savings_decrypted')
                .select('amount, currency')
                .eq('user_id', user.id);
            if (error) {
                console.error('Error fetching savings:', error);
                setTotalSavings(0);
                return;
            }
            if (data) {
                // Конвертируем суммы и рассчитываем общую сумму накоплений
                const savingsPromises = data.map(async (saving) => {
                    // Используем конвертированную сумму если валюта отличается от дефолтной
                    if (settingsCurrency && saving.currency !== settingsCurrency) {
                        const converted = await convertAmount(saving.amount, saving.currency);
                        if (converted !== null) {
                            return converted;
                        }
                    }
                    // Используем исходную сумму если валюта совпадает с дефолтной
                    return saving.amount || 0;
                });

                const amounts = await Promise.all(savingsPromises);
                const total = amounts.reduce((sum, amount) => sum + amount, 0);
                setTotalSavings(total);
            }
        } catch (err) {
            console.error('Error calculating total savings:', err);
            setTotalSavings(0);
        }
    }, [user, settingsCurrency, convertAmount]);

    useEffect(() => {
        fetchTotalSavings();
    }, [fetchTotalSavings]);

    // Подписка на события обновления накоплений
    useEffect(() => {
        const handleSavingUpdated = () => {
            fetchTotalSavings();
        };

        window.addEventListener('savingUpdated', handleSavingUpdated);
        return () => {
            window.removeEventListener('savingUpdated', handleSavingUpdated);
        };
    }, [fetchTotalSavings]);

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
                    <div className="text-xs text-white tracking-wider">{t('summary.income')}</div>
                    <div className="text-sm font-semibold text-white">{totalIncome.toLocaleString('en-US', { minimumFractionDigits: 2, maximumFractionDigits: 2 })}</div>
                </div>
                <div className="min-w-[100px] px-3 py-2 bg-accentRed rounded-md shadow-sm">
                    <div className="text-xs text-white tracking-wider">{t('summary.expenses')}</div>
                    <div className="text-sm font-semibold text-white">{totalExpenses.toLocaleString('en-US', { minimumFractionDigits: 2, maximumFractionDigits: 2 })}</div>
                </div>
                <div className="min-w-[100px] px-3 py-2 bg-accentYellow rounded-md shadow-sm">
                    <div className="text-xs text-white tracking-wider">{t('summary.goals')}</div>
                    <div className="text-sm font-semibold text-white">{totalGoals.toLocaleString('en-US', { minimumFractionDigits: 2, maximumFractionDigits: 2 })}</div>
                </div>
                <div className="min-w-[100px] px-3 py-2 bg-blue-500 rounded-md shadow-sm">
                    <div className="text-xs text-white tracking-wider">{t('summary.savings')}</div>
                    <div className="text-sm font-semibold text-white">{totalSavings.toLocaleString('en-US', { minimumFractionDigits: 2, maximumFractionDigits: 2 })}</div>
                </div>
                <div className="min-w-[100px] px-3 py-2 bg-presenting rounded-md shadow-sm">
                    <div className="text-xs text-white tracking-wider">{t('summary.remainder')}</div>
                    <div className={`text-sm font-semibold ${remainderColor}`}>{remainder.toLocaleString('en-US', { minimumFractionDigits: 2, maximumFractionDigits: 2 })}</div>
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
                        {t('sidebar.myIncome')}
                    </NavLink>
                </li>
                <li> 
                    <NavLink className={navLinkClass} to="/savings">
                        {t('sidebar.mySavings')}
                    </NavLink>
                </li>
                <li> 
                    <NavLink className={navLinkClass} to="/goals">
                        {t('sidebar.myGoals')}
                    </NavLink>
                </li>
                <li> 
                    <NavLink className={navLinkClass} to="/expenses">
                        {t('sidebar.myExpenses')}
                    </NavLink>
                </li>

            </ul>
            <ul className="pt-2 w-full mt-auto font-base bg-base-100 text-mainTextColor dark:text-mainTextColor text-md leading-loose">
                <li className="font-semibold rounded-md"> 
                    <NavLink className={bottomNavLinkClass} to="/docs">
                        {t('sidebar.howWillThisHelp')}
                    </NavLink>
                </li>
                <li className="font-semibold rounded-md"> 
                    <NavLink className={bottomNavLinkClass} to="/settings">
                        {t('sidebar.settings')}
                    </NavLink>
                </li>
                <li className="font-semibold rounded-md"> 
                    <button onClick={signOut} className='flex items-center font-normal gap-2 py-1 px-4 hover:text-primary'>
                        {t('sidebar.signOut')}
                    </button>
                </li>
            </ul>
        </div>
    )
}

export default LeftSidebar