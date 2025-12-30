import ScenarioSwitch from '@/shared/ui/ScenarioSwitch';
import MobileMenu from '@/shared/ui/MobileMenu';
import ThemeSwitch from '@/shared/ui/ThemeSwitch';
import PlaceName from '@/shared/ui/PlaceName';
import FinancialSummary from '@/shared/ui/FinancialSummary';
import { useTranslation } from '@/shared/i18n';
import { useFinancialSummary } from '@/shared/hooks/useFinancialSummary';

function Header(){
    const { t } = useTranslation('components');
    const {
        totalIncome,
        totalExpenses,
        totalSavings,
        totalGoals,
        remainder,
    } = useFinancialSummary();

    return(
        <>
            <div className="sticky top-0 z-20 flex flex-col bg-white dark:bg-black border-b border-black dark:border-white">
                {/* Main Header */}
                <div className="navbar font-normal flex items-center justify-between py-2 lg:py-4 px-2 lg:px-4">
                    <div className="flex justify-between lg:justify-start items-center gap-4 w-full">
                        <MobileMenu />
                        <div className="flex items-center justify-between gap-4 lg:w-full">
                            <div className="flex items-center gap-4">
                                <PlaceName />
                                <ScenarioSwitch />
                            </div>
                            <div className="hidden lg:flex items-center gap-4">
                                <ThemeSwitch />
                            </div>
                        </div>
                    </div>
                </div>
                
                <div className="lg:hidden bg-white dark:bg-black border-b border-black dark:border-white px-0 py-2 overflow-x-auto">
                    <FinancialSummary
                        totalIncome={totalIncome}
                        totalExpenses={totalExpenses}
                        totalSavings={totalSavings}
                        totalGoals={totalGoals}
                        remainder={remainder}
                        t={t}
                        variant="mobile"
                    />
                </div>
            </div>
        </>
    )
}

export default Header