import { NavLink, useParams } from "react-router-dom";
import { useAuth } from '@/shared/store/auth';
import { useTranslation } from '@/shared/i18n';
import { 
    DocumentTextIcon, 
    Cog6ToothIcon, 
    ArrowRightEndOnRectangleIcon,
    ArrowRightStartOnRectangleIcon,
    SparklesIcon,
    BanknotesIcon,
    ArrowDownTrayIcon
} from '@heroicons/react/24/outline';
import Logo from '@/shared/ui/Logo';
import FinancialSummary from "@/shared/ui/FinancialSummary";
import { useFinancialSummary } from "@/shared/hooks/useFinancialSummary";

function LeftSidebar(){
    const { t } = useTranslation('components');
    const { scenarioSlug } = useParams<{ scenarioSlug: string }>();
    const currentSlug = scenarioSlug;
    const signOut = useAuth(s => s.signOut);

    const {
        totalIncome,
        totalExpenses,
        totalSavings,
        totalGoals,
        remainder,
    } = useFinancialSummary();

    const navLinkClass = ({ isActive }: { isActive: boolean }) => 
        `flex items-center gap-2 pb-1 border-b-2 transition-colors ${
            isActive 
                ? 'border-b-primary' 
                : 'border-b-transparent hover:border-b-primary/50'
        }`;

    const bottomNavLinkClass = ({ isActive }: { isActive: boolean }) => 
        `flex items-center font-normal gap-2 py-1 px-2 transition-colors ${
            isActive 
                ? 'text-primary' 
                : 'hover:text-primary'
        }`;

    return(
        <div className="fixed top-0 left-0 flex flex-col h-screen w-[clamp(200px,18vw,260px)] bg-sidebarBg dark:bg-sidebarBg dark:text-mainTextColor border-r dark:border-borderColor p-2 pt-0 z-30">

            
            <div className='flex items-center h-[70px]'>
                <div className="-mt-[25px]">
                  <Logo />
                </div>
            </div>
            <ul className="w-full px-2 flex flex-col gap-2 font-base bg-base-100 text-mainTextColor dark:text-mainTextColor text-md leading-loose">
                <li> 
                    <NavLink className={navLinkClass} to={`/${currentSlug}/income`}>
                        <ArrowRightEndOnRectangleIcon className="w-5 h-5 text-primary" />
                        {t('sidebar.myIncome')}
                    </NavLink>
                </li>
                <li> 
                    <NavLink className={navLinkClass} to={`/${currentSlug}/savings`}>
                        <BanknotesIcon className="w-5 h-5 text-primary" />
                        {t('sidebar.mySavings')}
                    </NavLink>
                </li>
                <li> 
                    <NavLink className={navLinkClass} to={`/${currentSlug}/expenses`}>
                        <ArrowRightStartOnRectangleIcon className="w-5 h-5 text-primary" />
                        {t('sidebar.myExpenses')}
                    </NavLink>
                </li>
                <li> 
                    <NavLink className={navLinkClass} to={`/${currentSlug}/goals`}>
                        <SparklesIcon className="w-5 h-5 text-primary" />
                        {t('sidebar.myGoals')}
                    </NavLink>
                </li>


            </ul>
            <ul className="pt-2 w-full mt-auto font-base bg-base-100 text-mainTextColor dark:text-mainTextColor text-md leading-loose">
                <li className="font-semibold rounded-md"> 
                    <NavLink className={bottomNavLinkClass} to={`/${currentSlug}/docs`}>
                        <DocumentTextIcon className="w-5 h-5" />
                        {t('sidebar.howWillThisHelp')}
                    </NavLink>
                </li>
                <li className="font-semibold rounded-md"> 
                    <NavLink className={bottomNavLinkClass} to={`/${currentSlug}/settings`}>
                        <Cog6ToothIcon className="w-5 h-5" />
                        {t('sidebar.settings')}
                    </NavLink>
                </li>
                <li className="font-semibold rounded-md"> 
                    <NavLink className={bottomNavLinkClass} to={`/${currentSlug}/report`}>
                        <ArrowDownTrayIcon className="w-5 h-5" />
                        {t('sidebar.exportData')}
                    </NavLink>
                </li>
                <li className="font-semibold rounded-md"> 
                    <button onClick={signOut} className='flex items-center font-normal gap-2 py-1 px-2 hover:text-primary'>
                        <ArrowRightStartOnRectangleIcon className="w-5 h-5" />
                        {t('sidebar.signOut')}
                    </button>
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
        </div>
    )
}

export default LeftSidebar