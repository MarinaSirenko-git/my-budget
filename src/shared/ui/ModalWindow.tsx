import React, { Fragment } from 'react';
import { Dialog, Transition } from '@headlessui/react';
import { XMarkIcon } from '@heroicons/react/24/outline';

interface ModalWindowProps {
  open: boolean;
  onClose: () => void;
  title?: string;
  className?: string;
  children?: React.ReactNode;
}

const ModalWindow = React.forwardRef<HTMLDivElement, ModalWindowProps>(({ open, onClose, title, className = '', children, ...props }, ref) => (
  <Transition show={open} as={Fragment}>
    <Dialog as="div" className="relative z-50" onClose={onClose} {...props}>
      <Transition.Child
        as={Fragment}
        enter="ease-out duration-300" enterFrom="opacity-0" enterTo="opacity-100"
        leave="ease-in duration-200" leaveFrom="opacity-100" leaveTo="opacity-0">
        <div className="fixed inset-0 bg-black bg-opacity-20 transition-opacity" />
      </Transition.Child>
      <div className="fixed inset-0 overflow-y-auto">
        <div className="flex min-h-full items-center justify-center p-4">
          <Transition.Child
            as={Fragment}
            enter="ease-out duration-300" enterFrom="opacity-0 scale-95" enterTo="opacity-100 scale-100"
            leave="ease-in duration-200" leaveFrom="opacity-100 scale-100" leaveTo="opacity-0 scale-95">
            <Dialog.Panel ref={ref} className={`bg-cardColor dark:bg-cardColor rounded-xl shadow-xl p-6 max-w-md w-full relative ${className}`}>
              <button
                onClick={onClose}
                className="absolute top-4 right-4 text-textColor dark:text-textColor hover:text-mainTextColor dark:hover:text-mainTextColor transition-colors focus:outline-none focus-visible:ring-2 focus-visible:ring-primary rounded-full p-1"
                aria-label="Закрыть"
                title="Закрыть"
              >
                <XMarkIcon className="w-5 h-5" />
              </button>
              {title && <Dialog.Title className="text-lg font-medium mb-3 pr-8">{title}</Dialog.Title>}
              {children}
            </Dialog.Panel>
          </Transition.Child>
        </div>
      </div>
    </Dialog>
  </Transition>
));

export default ModalWindow;
