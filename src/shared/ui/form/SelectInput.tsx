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
    const [pendingValue, setPendingValue] = useState<string | null>(null);
    const searchInputRef = useRef<HTMLInputElement>(null);
    const buttonRef = useRef<HTMLButtonElement>(null);
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
        setPendingValue(null);
        setTimeout(() => {
          buttonRef.current?.focus();
        }, 0);
      }
    };

    const handleOptionChange = (newValue: string) => {
      // Выбор происходит при клике или программно
      if (onChange) {
        onChange(newValue);
      }
      setSearchQuery('');
      setPendingValue(null);
      setTimeout(() => {
        buttonRef.current?.focus();
      }, 0);
    };

    const handleOptionEnter = (optionValue?: string) => {
      const valueToSelect = optionValue || pendingValue || filteredOptions[0]?.value;
      if (valueToSelect) {
        setPendingValue(null);
        if (onChange) {
          onChange(valueToSelect);
        }
        setSearchQuery('');
        setTimeout(() => {
          buttonRef.current?.focus();
        }, 0);
      }
    };

    return (
      <div className={`w-full ${className}`}>
        {label && <span className="block mb-2 text-sm font-bold text-black dark:text-white tracking-tight">{label}</span>}
        <Listbox value={value} onChange={handleOptionChange} disabled={disabled}>
          {({ open }) => (
            <div className="relative">
              <Listbox.Button 
                ref={(node) => {
                  buttonRef.current = node;
                  if (typeof ref === 'function') {
                    ref(node);
                  } else if (ref) {
                    ref.current = node;
                  }
                }} 
                name={name} 
                className={`
                  relative w-full cursor-pointer border border-black dark:border-white bg-white dark:bg-black py-2 pl-3 pr-10 text-left font-light text-black dark:text-white focus:outline-none focus:ring-0
                  disabled:opacity-50 disabled:cursor-not-allowed
                `}
              >
                <span className="block truncate">{selectedOption?.label || value}</span>
                <span className="absolute inset-y-0 right-0 flex items-center pr-3 pointer-events-none">
                  <ChevronUpDownIcon className="w-5 h-5 text-black dark:text-white" aria-hidden="true" />
                </span>
              </Listbox.Button>
              <Transition
                as={Fragment}
                show={open}
                leave="transition ease-in duration-100"
                leaveFrom="opacity-100"
                leaveTo="opacity-0">
                <Listbox.Options static className="absolute z-50 mt-1 w-full overflow-auto border border-black dark:border-white bg-white dark:bg-black max-h-56 py-1 text-base focus:outline-none">
                  {creatable && (
                    <div className="px-2 py-1 border-b border-black dark:border-white">
                      <input
                        ref={searchInputRef}
                        type="text"
                        value={searchQuery}
                        onChange={(e) => setSearchQuery(e.target.value)}
                        placeholder="Поиск или создание..."
                        className="w-full px-2 py-1 border border-black dark:border-white bg-white dark:bg-black text-black dark:text-white text-sm font-light focus:outline-none focus:ring-0"
                        onClick={(e) => e.stopPropagation()}
                        onKeyDown={(e) => {
                          if (e.key === 'Enter') {
                            e.preventDefault();
                            e.stopPropagation();
                            if (showCreateOption) {
                              handleCreateOption();
                            } else if (pendingValue) {
                              handleOptionEnter(pendingValue);
                            } else if (filteredOptions.length > 0) {
                              handleOptionEnter(filteredOptions[0].value);
                            }
                          } else if (e.key === 'Escape') {
                            e.stopPropagation();
                          }
                          // Пробел и другие символы обрабатываются нормально
                        }}
                      />
                    </div>
                  )}
                  {showCreateOption && (
                    <div
                      onClick={(e) => {
                        e.preventDefault();
                        e.stopPropagation();
                        setPendingValue(null);
                      }}
                      onKeyDown={(e) => {
                        if (e.key === 'Enter') {
                          e.preventDefault();
                          e.stopPropagation();
                          handleCreateOption();
                        }
                      }}
                      className="relative cursor-pointer select-none py-2 pl-10 pr-4 text-black dark:text-white hover:bg-black hover:text-white dark:hover:bg-white dark:hover:text-black flex items-center gap-2 font-light"
                      tabIndex={0}
                    >
                      <PlusIcon className="w-5 h-5 absolute left-3" />
                      <span>Создать "{searchQuery.trim()}"</span>
                    </div>
                  )}
                  {filteredOptions.map((option) => {
                    return (
                      <Listbox.Option
                        key={option.value}
                        value={option.value}
                        disabled={option.disabled}
                        className={({ active, selected }) => `
                          relative cursor-pointer select-none py-2 pl-10 pr-4 font-light
                          ${selected ? 'bg-black text-white dark:bg-white dark:text-black' : active ? 'bg-black text-white dark:bg-white dark:text-black' : 'text-black dark:text-white'}
                          ${option.disabled ? 'opacity-50 cursor-not-allowed' : ''}
                        `}
                      >
                        {({ selected }) => (
                          <>
                            <span className={`block truncate ${selected ? 'font-bold' : 'font-light'}`}>{option.label}</span>
                            {selected ? (
                              <span className="absolute inset-y-0 left-0 flex items-center pl-3">
                                <CheckIcon className="w-5 h-5 text-white dark:text-black" aria-hidden="true" />
                              </span>
                            ) : null}
                          </>
                        )}
                      </Listbox.Option>
                    );
                  })}
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
