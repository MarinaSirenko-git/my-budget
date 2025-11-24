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
      // Если есть pendingValue и он отличается от newValue, значит это автоматический выбор от Headless UI при клике
      // Игнорируем его, выбор произойдет только при нажатии Enter
      if (pendingValue !== null && pendingValue !== newValue) {
        return;
      }
      
      // Выбор происходит только если нет pendingValue (т.е. через Enter или программно)
      if (onChange) {
        onChange(newValue);
      }
      setSearchQuery('');
      setPendingValue(null);
      setTimeout(() => {
        buttonRef.current?.focus();
      }, 0);
    };

    const handleOptionClick = (optionValue: string, e: React.MouseEvent) => {
      e.preventDefault();
      e.stopPropagation();
      // Не выбираем сразу, только сохраняем как pending
      setPendingValue(optionValue);
    };

    const handleOptionEnter = (optionValue?: string) => {
      const valueToSelect = optionValue || pendingValue || filteredOptions[0]?.value;
      if (valueToSelect) {
        // Очищаем pendingValue перед выбором, чтобы onChange сработал
        setPendingValue(null);
        // Вызываем onChange напрямую
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
        {label && <span className="block mb-1 text-sm font-medium text-textColor dark:text-textColor">{label}</span>}
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
                  relative w-full cursor-pointer rounded border bg-cardColor dark:bg-sidebarBg py-2 pl-3 pr-10 text-left shadow-sm focus:outline-none focus-visible:ring-2 focus-visible:ring-primary text-mainTextColor dark:text-mainTextColor
                  disabled:opacity-50 disabled:cursor-not-allowed
                `}
              >
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
                <Listbox.Options static className="absolute z-50 mt-1 w-full overflow-auto rounded bg-cardColor dark:bg-sidebarBg shadow-lg max-h-56 py-1 text-base ring-1 ring-black/5 focus:outline-none">
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
                      className="relative cursor-pointer select-none py-2 pl-10 pr-4 text-primary hover:bg-contentBg dark:hover:bg-cardColor flex items-center gap-2"
                      tabIndex={0}
                    >
                      <PlusIcon className="w-5 h-5 absolute left-3" />
                      <span className="font-medium">Создать "{searchQuery.trim()}"</span>
                    </div>
                  )}
                  {filteredOptions.map((option) => {
                    const isHighlighted = pendingValue === option.value;
                    const isSelected = option.value === value;
                    return (
                      <Listbox.Option
                        key={option.value}
                        value={option.value}
                        disabled={option.disabled}
                        as={Fragment}
                      >
                        {({ active, selected }) => (
                          <div
                            onClick={(e: React.MouseEvent) => {
                              // Предотвращаем стандартное поведение Headless UI
                              e.preventDefault();
                              e.stopPropagation();
                              if (!option.disabled) {
                                handleOptionClick(option.value, e);
                              }
                            }}
                            onKeyDown={(e: React.KeyboardEvent) => {
                              if (e.key === 'Enter') {
                                e.preventDefault();
                                e.stopPropagation();
                                if (!option.disabled) {
                                  // Очищаем pendingValue перед выбором, чтобы onChange сработал
                                  setPendingValue(null);
                                  handleOptionEnter(option.value);
                                }
                              }
                            }}
                            className={`
                              relative cursor-pointer select-none py-2 pl-10 pr-4 text-mainTextColor dark:text-mainTextColor
                              ${isSelected ? 'bg-primary text-white' : isHighlighted ? 'bg-contentBg dark:bg-cardColor' : active ? 'bg-contentBg dark:bg-cardColor' : ''}
                              ${option.disabled ? 'opacity-50 cursor-not-allowed' : ''}
                            `}
                            tabIndex={option.disabled ? -1 : 0}
                            role="option"
                            aria-selected={isSelected}
                          >
                            <span className={`block truncate ${selected ? 'font-semibold' : 'font-normal'}`}>{option.label}</span>
                            {selected ? (
                              <span className="absolute inset-y-0 left-0 flex items-center pl-3">
                                <CheckIcon className="w-5 h-5 text-white" aria-hidden="true" />
                              </span>
                            ) : null}
                          </div>
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
