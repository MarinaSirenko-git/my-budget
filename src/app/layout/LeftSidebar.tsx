import { NavLink, useParams, useNavigate } from "react-router-dom";
import { useTranslation } from '@/shared/i18n';
import Logo from '@/shared/ui/Logo';
import FinancialSummary from "@/shared/ui/FinancialSummary";
import { useQueryClient } from '@tanstack/react-query';
import { supabase } from '@/lib/supabase';
import { reportErrorToTelegram } from '@/shared/utils/errorReporting';
import { useConvertedIncomes } from '@/shared/hooks/useConvertedIncomes';
import { useConvertedExpenses } from '@/shared/hooks/useConvertedExpenses';
import { useConvertedSavings } from '@/shared/hooks/useConvertedSavings';
import { useConvertedGoals } from '@/shared/hooks/useConvertedGoals';

function LeftSidebar(){
    const { t } = useTranslation('components');
    const { scenarioSlug } = useParams<{ scenarioSlug: string }>();
    const currentSlug = scenarioSlug;
    const queryClient = useQueryClient();
    const navigate = useNavigate();
    const { monthlyTotal: totalIncome } = useConvertedIncomes();
    const { monthlyTotal: totalExpenses } = useConvertedExpenses();
    const { totalInBaseCurrency: totalSavings } = useConvertedSavings();
    const { totalMonthlyPayment: totalGoals } = useConvertedGoals();
    
    const remainder = totalIncome - totalExpenses - totalGoals;

    const signOut = async () => {
        const user = queryClient.getQueryData(['user']) as { id?: string } | null;
        const userId = user?.id;
        
        try {
          await supabase.auth.signOut();
          queryClient.clear();
          navigate('/auth', { replace: true });
        } catch (error) {
          await reportErrorToTelegram({
            action: 'signOut',
            error: error instanceof Error ? error : new Error(String(error)),
            userId: userId,
          });
          navigate('/auth', { replace: true });
        }
      }

    const navLinkClass = ({ isActive }: { isActive: boolean }) => 
        `flex items-center pb-1 border-b-2 transition-colors font-light ${
            isActive 
                ? 'border-b-black dark:border-b-white text-black dark:text-white font-bold' 
                : 'border-b-transparent hover:border-b-black dark:hover:border-b-white text-black dark:text-white'
        }`;

    return(
        <div className="hidden lg:flex fixed top-0 left-0 flex-col h-screen w-[clamp(200px,18vw,260px)] bg-white dark:bg-black border-r border-black dark:border-white p-0 pt-0 z-30">

            
            <div className='flex items-center h-[75px] border-b border-black dark:border-white px-2'>
                <Logo />
            </div>
            <div className="flex flex-col justify-between flex-1">
                <ul className="w-full px-4 flex flex-col gap-2 text-base leading-loose pt-2">
                    <li> 
                        <NavLink className={navLinkClass} to={`/${currentSlug}/income`}>
                            {t('sidebar.myIncome')}
                        </NavLink>
                    </li>
                    <li> 
                        <NavLink className={navLinkClass} to={`/${currentSlug}/expenses`}>
                            {t('sidebar.myExpenses')}
                        </NavLink>
                    </li>
                    <li> 
                        <NavLink className={navLinkClass} to={`/${currentSlug}/goals`}>
                            {t('sidebar.myGoals')}
                        </NavLink>
                    </li>
                    <li> 
                        <NavLink className={navLinkClass} to={`/${currentSlug}/savings`}>
                            {t('sidebar.mySavings')}
                        </NavLink>
                    </li>
                </ul>
                <FinancialSummary
                    totalIncome={totalIncome}
                    totalExpenses={totalExpenses}
                    totalSavings={totalSavings}
                    totalGoals={totalGoals}
                    remainder={remainder}
                    t={t}
                />
                <ul className="w-full px-4 flex flex-col gap-2 text-base leading-loose pt-2">
                    <li> 
                        <NavLink className={navLinkClass} to={`/${currentSlug}/docs`}>
                            {t('sidebar.howWillThisHelp')}
                        </NavLink>
                    </li>
                    <li> 
                        <NavLink className={navLinkClass} to={`/${currentSlug}/settings`}>
                            {t('sidebar.settings')}
                        </NavLink>
                    </li>
                    <li> 
                        <button onClick={signOut} className='flex items-center pb-1 border-b-2 border-b-transparent hover:border-b-black dark:hover:border-b-white text-black dark:text-white font-light transition-colors w-full text-left'>
                            {t('sidebar.signOut')}
                        </button>
                    </li>
                </ul>
            </div>
        </div>
    )
}

export default LeftSidebar