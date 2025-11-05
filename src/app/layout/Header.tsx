import ThemeSwitch from '@/shared/ui/ThemeSwitch';
import ScenarioSwitch from '@/shared/ui/ScenarioSwitch';
import MobileMenu from '@/shared/ui/MobileMenu';
import FinancialSummary from '@/shared/ui/FinancialSummary';
import { MapPinIcon } from '@heroicons/react/24/outline';

function Header(){
    return(
        <>
            <div className="navbar sticky top-0 font-normal font-base bg-[#F1F5F9] dark:bg-[#0F172A] z-20 shadow-xs flex items-center justify-between py-4 pl-4 pr-4">
                <div className="flex items-center gap-4">
                    <MobileMenu />
                    <div className="flex items-center gap-4">
                        <h1 className="text-sm font-normal text-[#1E293B] dark:text-white flex items-center gap-2">
                            <MapPinIcon className="w-5 h-5" />
                            Phuket
                        </h1>
                        <ScenarioSwitch />
                        <div className="flex items-center justify-center gap-1">
                            <ThemeSwitch />
                        </div>
                    </div>
                </div>
                <div className='flex items-center justify-center'>
                    <FinancialSummary totalIncome={1000} totalExpenses={500} totalGoals={200} />
                </div>
            </div>
        </>
    )
}

export default Header