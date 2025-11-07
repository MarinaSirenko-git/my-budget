import { Fragment, useState } from 'react';
import { Dialog, DialogPanel, Transition, TransitionChild } from '@headlessui/react';
import { XMarkIcon, Bars3Icon } from '@heroicons/react/24/outline';
import { SparklesIcon, ArrowRightEndOnRectangleIcon, ArrowRightStartOnRectangleIcon, DocumentMagnifyingGlassIcon } from '@heroicons/react/24/solid';
import { NavLink } from 'react-router-dom';
import ThemeSwitch from './ThemeSwitch';
import ProfileMenu from './ProfileMenu';
import Logo from './Logo';

export default function MobileMenu() {
  const [open, setOpen] = useState(false);

  const navLinkClass = ({ isActive }: { isActive: boolean }) => 
    `flex items-center font-normal gap-2 hover:bg-gray-100 dark:hover:bg-gray-700 ${isActive ? 'bg-gray-100 dark:bg-gray-700' : ''}`;

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
                <DialogPanel className="relative flex flex-col w-full max-w-xs bg-gray-900 text-white shadow-xl pointer-events-auto">
                  {/* Header with Logo and Close Button */}
                  <div className="flex items-center justify-between p-4 border-b border-gray-700">
                    <Logo iconSize="lg" textColor="text-white" />
                    <button
                      onClick={() => setOpen(false)}
                      className="p-2 rounded-md hover:bg-gray-800"
                    >
                      <XMarkIcon className="h-6 w-6" />
                    </button>
                  </div>

                  {/* Navigation */}
                  <nav className="flex-1 py-4 px-2 overflow-y-auto">
                    <ul className="space-y-1">
                      <li>
                        <NavLink className={navLinkClass} to="/goals" onClick={() => setOpen(false)}>
                          <SparklesIcon className="w-6 h-6" />
                          Мои финансовые цели
                        </NavLink>
                      </li>
                      <li>
                        <NavLink className={navLinkClass} to="/income" onClick={() => setOpen(false)}>
                          <ArrowRightEndOnRectangleIcon className="w-6 h-6" />
                          Мои доходы
                        </NavLink>
                      </li>
                      <li>
                        <NavLink className={navLinkClass} to="/expenses" onClick={() => setOpen(false)}>
                          <ArrowRightStartOnRectangleIcon className="w-6 h-6" />
                          Мои расходы
                        </NavLink>
                      </li>
                      <li>
                        <NavLink className={navLinkClass} to="/docs" onClick={() => setOpen(false)}>
                          <DocumentMagnifyingGlassIcon className="w-6 h-6" />
                          Документация
                        </NavLink>
                      </li>
                    </ul>
                  </nav>

                  {/* Footer with Theme Switch and Profile */}
                  <div className="border-t border-gray-700 p-4 flex items-center justify-between gap-4">
                    <ThemeSwitch />
                    <ProfileMenu />
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

