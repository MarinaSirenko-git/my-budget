import { Fragment, useState } from 'react';
import { Dialog, DialogPanel, Transition, TransitionChild } from '@headlessui/react';
import { 
  XMarkIcon, 
  Bars3Icon,
} from '@heroicons/react/24/outline';
import { NavLink, useParams } from 'react-router-dom';
import ThemeSwitch from './ThemeSwitch';
import Logo from './Logo';
import ScenarioSwitch from './ScenarioSwitch';
import FinancialSummary from './FinancialSummary';
import { useTranslation } from '@/shared/i18n';
import { useAuth } from '@/shared/store/auth';
import { useFinancialSummary } from '@/shared/hooks/useFinancialSummary';

export default function MobileMenu() {
  const [open, setOpen] = useState(false);
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
    `flex items-center pb-1 border-b-2 transition-colors font-light text-base ${
      isActive 
        ? 'border-b-black dark:border-b-white text-black dark:text-white font-bold' 
        : 'border-b-transparent hover:border-b-black dark:hover:border-b-white text-black dark:text-white'
    }`;

  return (
    <>
      {/* Hamburger Button */}
      <button
        onClick={() => setOpen(true)}
        className="lg:hidden p-2 border border-black dark:border-white bg-white dark:bg-black text-black dark:text-white hover:bg-black hover:text-white dark:hover:bg-white dark:hover:text-black transition-colors"
      >
        <Bars3Icon className="h-6 w-6" />
      </button>

      <Transition show={open} as={Fragment}>
        <Dialog as="div" className="relative z-50 lg:hidden" onClose={setOpen}>
          {/* Overlay */}
          <TransitionChild
            enter="ease-out duration-300"
            enterFrom="opacity-0"
            enterTo="opacity-100"
            leave="ease-in duration-200"
            leaveFrom="opacity-100"
            leaveTo="opacity-0"
          >
            <div className="fixed inset-0 bg-black/50 dark:bg-white/20" />
          </TransitionChild>

          {/* Sidebar */}
          <div className="fixed inset-0 pointer-events-none">
            <div className="absolute inset-0 flex">
              <TransitionChild
                enter="transform transition ease-in-out duration-300"
                enterFrom="-translate-x-full"
                enterTo="translate-x-0"
                leave="transform transition ease-in-out duration-300"
                leaveFrom="translate-x-0"
                leaveTo="-translate-x-full"
              >
                <DialogPanel className="relative flex flex-col w-full max-w-xs bg-white dark:bg-black border-r border-black dark:border-white pointer-events-auto">
                  {/* Header with Logo and Close Button */}
                  <div className="flex items-center justify-between px-4 py-4 border-b border-black dark:border-white">
                    <Logo />
                    <button
                      onClick={() => setOpen(false)}
                      className="p-2 border border-black dark:border-white bg-white dark:bg-black text-black dark:text-white hover:bg-black hover:text-white dark:hover:bg-white dark:hover:text-black transition-colors"
                    >
                      <XMarkIcon className="h-5 w-5" />
                    </button>
                  </div>
                  <div className="px-4 py-4 border-b border-black dark:border-white">
                    <ScenarioSwitch mobile={true} onMenuClose={() => setOpen(false)} />
                  </div>
                  <nav className="px-4 overflow-y-auto flex-1 flex flex-col justify-between py-4">
                    <ul className="flex flex-col gap-2 text-base leading-loose pt-4">
                      <li>
                        <NavLink className={navLinkClass} to={`/${currentSlug}/income`} onClick={() => setOpen(false)}>
                          {t('sidebar.myIncome')}
                        </NavLink>
                      </li>
                      <li>
                        <NavLink className={navLinkClass} to={`/${currentSlug}/savings`} onClick={() => setOpen(false)}>
                          {t('sidebar.mySavings')}
                        </NavLink>
                      </li>
                      <li>
                        <NavLink className={navLinkClass} to={`/${currentSlug}/expenses`} onClick={() => setOpen(false)}>
                          {t('sidebar.myExpenses')}
                        </NavLink>
                      </li>
                      <li>
                        <NavLink className={navLinkClass} to={`/${currentSlug}/goals`} onClick={() => setOpen(false)}>
                          {t('sidebar.myGoals')}
                        </NavLink>
                      </li>
                    </ul>
                    <div className="border border-black dark:border-white">
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
                    <ul className="flex flex-col gap-2 text-base leading-loose">
                      <li>
                        <NavLink className={navLinkClass} to={`/${currentSlug}/docs`} onClick={() => setOpen(false)}>
                          {t('sidebar.howWillThisHelp')}
                        </NavLink>
                      </li>
                      <li>
                        <NavLink className={navLinkClass} to={`/${currentSlug}/settings`} onClick={() => setOpen(false)}>
                          {t('sidebar.settings')}
                        </NavLink>
                      </li>
                      <li>
                        <button 
                          onClick={() => {
                            signOut();
                            setOpen(false);
                          }} 
                          className="flex items-center pb-1 border-b-2 border-b-transparent hover:border-b-black dark:hover:border-b-white text-black dark:text-white font-light transition-colors w-full text-left text-base"
                        >
                          {t('sidebar.signOut')}
                        </button>
                      </li>
                    </ul>
                  </nav>
                  <div className="border-t border-black dark:border-white p-4 flex items-center justify-end">
                    <ThemeSwitch />
                  </div>
                </DialogPanel>
              </TransitionChild>
            </div>
          </div>
        </Dialog>
      </Transition>
    </>
  );
}

