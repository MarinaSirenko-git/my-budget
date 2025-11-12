import React, { Fragment, useState, useRef, useEffect } from 'react';
import { Listbox, Transition } from '@headlessui/react';
import { CheckIcon, ChevronUpDownIcon, PlusIcon } from '@heroicons/react/24/outline';

export interface Option {
  label: string;
  value: string;
  disabled?: boolean;
}

interface SelectInputProps {
  value: string;
  options: Option[];
  onChange?: (value: string) => void;
  onCreateOption?: (value: string) => void;
  name?: string;
  label?: string;
  className?: string;
  disabled?: boolean;
  creatable?: boolean;
}

const SelectInput = React.forwardRef<HTMLButtonElement, SelectInputProps>(
  ({ value, options, onChange, onCreateOption, name, label, className = '', disabled, creatable = false }, ref) => {
    const [searchQuery, setSearchQuery] = useState('');
    const searchInputRef = useRef<HTMLInputElement>(null);
    const selectedOption = options.find(opt => opt.value === value) || options[0];

    // Filter options based on search query
    const filteredOptions = creatable && searchQuery
      ? options.filter(opt => 
          opt.label.toLowerCase().includes(searchQuery.toLowerCase()) ||
          opt.value.toLowerCase().includes(searchQuery.toLowerCase())
        )
      : options;

    // Check if search query matches any existing option
    const hasExactMatch = searchQuery && options.some(opt => 
      opt.value.toLowerCase() === searchQuery.toLowerCase().trim() ||
      opt.label.toLowerCase() === searchQuery.toLowerCase().trim()
    );

    // Show create option if creatable is enabled, search query exists, and no exact match
    const showCreateOption = creatable && searchQuery && !hasExactMatch && searchQuery.trim().length > 0;

    // Focus search input when dropdown opens
    useEffect(() => {
      if (creatable && searchInputRef.current) {
        const timer = setTimeout(() => {
          searchInputRef.current?.focus();
        }, 100);
        return () => clearTimeout(timer);
      }
    }, [creatable]);

    const handleCreateOption = () => {
      if (onCreateOption && searchQuery.trim()) {
        onCreateOption(searchQuery.trim());
        setSearchQuery('');
      }
    };

    const handleOptionChange = (newValue: string) => {
      if (onChange) {
        onChange(newValue);
      }
      setSearchQuery('');
    };

    return (
      <div className={`w-full ${className}`}>
        {label && <span className="block mb-1 text-sm font-medium text-textColor dark:text-textColor">{label}</span>}
        <Listbox value={value} onChange={handleOptionChange} disabled={disabled}>
          {({ open }) => (
            <div className="relative">
              <Listbox.Button ref={ref} name={name} className={`
                relative w-full cursor-pointer rounded border bg-cardColor dark:bg-sidebarBg py-2 pl-3 pr-10 text-left shadow-sm focus:outline-none focus-visible:ring-2 focus-visible:ring-primary text-mainTextColor dark:text-mainTextColor
                disabled:opacity-50 disabled:cursor-not-allowed
              `}>
                <span className="block truncate">{selectedOption?.label || value}</span>
                <span className="absolute inset-y-0 right-0 flex items-center pr-3 pointer-events-none">
                  <ChevronUpDownIcon className="w-5 h-5 text-textColor dark:text-textColor" aria-hidden="true" />
                </span>
              </Listbox.Button>
              <Transition
                as={Fragment}
                show={open}
                leave="transition ease-in duration-100"
                leaveFrom="opacity-100"
                leaveTo="opacity-0">
                <Listbox.Options className="absolute z-50 mt-1 w-full overflow-auto rounded bg-cardColor dark:bg-sidebarBg shadow-lg max-h-56 py-1 text-base ring-1 ring-black/5 focus:outline-none">
                  {creatable && (
                    <div className="px-2 py-1 border-b border-borderColor">
                      <input
                        ref={searchInputRef}
                        type="text"
                        value={searchQuery}
                        onChange={(e) => setSearchQuery(e.target.value)}
                        placeholder="Поиск или создание..."
                        className="w-full px-2 py-1 rounded border bg-contentBg dark:bg-sidebarBg text-mainTextColor dark:text-mainTextColor text-sm focus:outline-none focus:ring-2 focus:ring-primary"
                        onClick={(e) => e.stopPropagation()}
                        onKeyDown={(e) => {
                          if (e.key === 'Enter' && showCreateOption) {
                            e.preventDefault();
                            handleCreateOption();
                          }
                        }}
                      />
                    </div>
                  )}
                  {showCreateOption && (
                    <div
                      onClick={handleCreateOption}
                      className="relative cursor-pointer select-none py-2 pl-10 pr-4 text-primary hover:bg-contentBg dark:hover:bg-cardColor flex items-center gap-2"
                    >
                      <PlusIcon className="w-5 h-5 absolute left-3" />
                      <span className="font-medium">Создать "{searchQuery.trim()}"</span>
                    </div>
                  )}
                  {filteredOptions.map(option => (
                    <Listbox.Option
                      key={option.value}
                      value={option.value}
                      disabled={option.disabled}
                      className={({ active, selected, disabled }) =>
                        `
                          relative cursor-pointer select-none py-2 pl-10 pr-4 text-mainTextColor dark:text-mainTextColor
                          ${selected ? 'bg-primary text-white' : active ? 'bg-contentBg dark:bg-cardColor' : ''}
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
