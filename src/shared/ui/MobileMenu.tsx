import { Fragment, useState } from 'react';
import { Dialog, DialogPanel, Transition, TransitionChild } from '@headlessui/react';
import { 
  XMarkIcon, 
  Bars3Icon,
  DocumentTextIcon,
  Cog6ToothIcon,
  ArrowRightEndOnRectangleIcon,
  ArrowRightStartOnRectangleIcon,
  SparklesIcon,
  BanknotesIcon,
  ArrowDownTrayIcon
} from '@heroicons/react/24/outline';
import { NavLink, useParams } from 'react-router-dom';
import ThemeSwitch from './ThemeSwitch';
import Logo from './Logo';
import ScenarioSwitch from './ScenarioSwitch';
import { useTranslation } from '@/shared/i18n';
import { useAuth } from '@/shared/store/auth';

export default function MobileMenu() {
  const [open, setOpen] = useState(false);
  const { t } = useTranslation('components');
  const { scenarioSlug } = useParams<{ scenarioSlug: string }>();
  const currentSlug = scenarioSlug;
  const signOut = useAuth(s => s.signOut);

  const navLinkClass = ({ isActive }: { isActive: boolean }) => 
    `flex items-center font-normal gap-2 py-2 px-2 rounded-md hover:bg-contentBg dark:hover:bg-cardColor truncate ${isActive ? 'bg-contentBg dark:bg-cardColor' : ''}`;

  return (
    <>
      {/* Hamburger Button */}
      <button
        onClick={() => setOpen(true)}
        className="lg:hidden p-2 rounded-md bg-primary text-white"
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
            <div className="fixed inset-0 bg-black/30" />
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
                <DialogPanel className="relative flex flex-col w-full max-w-xs bg-sidebarBg text-mainTextColor shadow-xl pointer-events-auto">
                  {/* Header with Logo, Theme Switch and Close Button */}
                  <div className="flex items-center justify-between px-2 py-2 border-b border-borderColor">
                    <Logo />
                    <div className="flex items-center gap-3 mt-4">
                      
                      <button
                        onClick={() => setOpen(false)}
                        className="p-2 rounded-md hover:bg-cardColor"
                      >
                        <XMarkIcon className="h-6 w-6" />
                      </button>
                    </div>
                  </div>
                  <nav className="py-4 px-2 overflow-y-auto">
                    <ul className="flex flex-col gap-4 space-y-1">
                      <li>
                        <NavLink className={navLinkClass} to={`/${currentSlug}/income`} onClick={() => setOpen(false)}>
                          <ArrowRightEndOnRectangleIcon className="w-5 h-5 flex-shrink-0" />
                          <span className="truncate">{t('sidebar.myIncome')}</span>
                        </NavLink>
                      </li>
                      <li>
                        <NavLink className={navLinkClass} to={`/${currentSlug}/savings`} onClick={() => setOpen(false)}>
                          <BanknotesIcon className="w-5 h-5 flex-shrink-0" />
                          <span className="truncate">{t('sidebar.mySavings')}</span>
                        </NavLink>
                      </li>
                      <li>
                        <NavLink className={navLinkClass} to={`/${currentSlug}/expenses`} onClick={() => setOpen(false)}>
                          <ArrowRightStartOnRectangleIcon className="w-5 h-5 flex-shrink-0" />
                          <span className="truncate">{t('sidebar.myExpenses')}</span>
                        </NavLink>
                      </li>
                      <li>
                        <NavLink className={navLinkClass} to={`/${currentSlug}/goals`} onClick={() => setOpen(false)}>
                          <SparklesIcon className="w-5 h-5 flex-shrink-0" />
                          <span className="truncate">{t('sidebar.myGoals')}</span>
                        </NavLink>
                      </li>
                    </ul>
                    <ul className="pt-4 mt-4 border-t border-borderColor space-y-1">
                    <li>
                        <ScenarioSwitch mobile={true} />
                      </li>
                    </ul>
                    <ul className="flex flex-col gap-4 mt-4 pt-4 border-t border-borderColor space-y-1">

                      <li>
                        <NavLink className={navLinkClass} to={`/${currentSlug}/docs`} onClick={() => setOpen(false)}>
                          <DocumentTextIcon className="w-5 h-5 flex-shrink-0" />
                          <span className="truncate">{t('sidebar.howWillThisHelp')}</span>
                        </NavLink>
                      </li>
                      <li>
                        <NavLink className={navLinkClass} to={`/${currentSlug}/settings`} onClick={() => setOpen(false)}>
                          <Cog6ToothIcon className="w-5 h-5 flex-shrink-0" />
                          <span className="truncate">{t('sidebar.settings')}</span>
                        </NavLink>
                      </li>
                      <li>
                        <NavLink className={navLinkClass} to={`/${currentSlug}/report`} onClick={() => setOpen(false)}>
                          <ArrowDownTrayIcon className="w-5 h-5 flex-shrink-0" />
                          <span className="truncate">{t('sidebar.exportData')}</span>
                        </NavLink>
                      </li>
                      <li>
                        <button 
                          onClick={() => {
                            signOut();
                            setOpen(false);
                          }} 
                          className="flex items-center font-normal gap-2 w-full py-2 px-2 hover:bg-contentBg dark:hover:bg-cardColor truncate"
                        >
                          <ArrowRightStartOnRectangleIcon className="w-5 h-5 flex-shrink-0" />
                          <span className="truncate">{t('sidebar.signOut')}</span>
                        </button>
                      </li>
                    </ul>
                  </nav>
                  <div className="border-t border-borderColor p-4 flex items-center justify-end">
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

