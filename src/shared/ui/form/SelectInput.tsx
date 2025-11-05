import React, { Fragment } from 'react';
import { Listbox, Transition } from '@headlessui/react';
import { CheckIcon, ChevronUpDownIcon } from '@heroicons/react/24/outline';

export interface Option {
  label: string;
  value: string;
  disabled?: boolean;
}

interface SelectInputProps {
  value: string;
  options: Option[];
  onChange?: (value: string) => void;
  name?: string;
  label?: string;
  className?: string;
  disabled?: boolean;
}

const SelectInput = React.forwardRef<HTMLButtonElement, SelectInputProps>(
  ({ value, options, onChange, name, label, className = '', disabled }, ref) => {
    const selectedOption = options.find(opt => opt.value === value) || options[0];
    return (
      <div className={`w-full ${className}`}>
        {label && <span className="block mb-1 text-sm font-medium text-gray-700 dark:text-gray-200">{label}</span>}
        <Listbox value={value} onChange={onChange} disabled={disabled}>
          {({ open }) => (
            <div className="relative">
              <Listbox.Button ref={ref} name={name} className={`
                relative w-full cursor-pointer rounded border bg-white dark:bg-gray-900 py-2 pl-3 pr-10 text-left shadow-sm focus:outline-none focus-visible:ring-2 focus-visible:ring-primary text-gray-800 dark:text-gray-200
                disabled:opacity-50 disabled:cursor-not-allowed
              `}>
                <span className="block truncate">{selectedOption.label}</span>
                <span className="absolute inset-y-0 right-0 flex items-center pr-3 pointer-events-none">
                  <ChevronUpDownIcon className="w-5 h-5 text-gray-400 dark:text-gray-500" aria-hidden="true" />
                </span>
              </Listbox.Button>
              <Transition
                as={Fragment}
                show={open}
                leave="transition ease-in duration-100"
                leaveFrom="opacity-100"
                leaveTo="opacity-0">
                <Listbox.Options className="absolute z-50 mt-1 w-full overflow-auto rounded bg-white dark:bg-gray-900 shadow-lg max-h-56 py-1 text-base ring-1 ring-black/5 focus:outline-none">
                  {options.map(option => (
                    <Listbox.Option
                      key={option.value}
                      value={option.value}
                      disabled={option.disabled}
                      className={({ active, selected, disabled }) =>
                        `
                          relative cursor-pointer select-none py-2 pl-10 pr-4 text-gray-900 dark:text-gray-100
                          ${selected ? 'bg-primary text-white' : active ? 'bg-gray-100 dark:bg-gray-700' : ''}
                          ${disabled ? 'opacity-50 cursor-not-allowed' : ''}
                        `
                      }
                    >
                      {({ selected }) => (
                        <>
                          <span className={`block truncate ${selected ? 'font-semibold' : 'font-normal'}`}>{option.label}</span>
                          {selected ? (
                            <span className="absolute inset-y-0 left-0 flex items-center pl-3">
                              <CheckIcon className="w-5 h-5 text-primary" aria-hidden="true" />
                            </span>
                          ) : null}
                        </>
                      )}
                    </Listbox.Option>
                  ))}
                </Listbox.Options>
              </Transition>
            </div>
          )}
        </Listbox>
      </div>
    );
  }
);

export default SelectInput;
