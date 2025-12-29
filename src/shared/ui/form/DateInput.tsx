import React, { useRef, useState, useCallback, useMemo } from 'react';
import { DayPicker, useNavigation, type CustomComponents } from 'react-day-picker';
import 'react-day-picker/dist/style.css';
import { useLanguage } from '@/shared/i18n';

interface DateInputProps extends Omit<React.InputHTMLAttributes<HTMLInputElement>, 'value' | 'onChange'> {
  value?: string; // YYYY-MM-DD (internal format for database)
  onChange?: (date: string | undefined) => void; // Returns YYYY-MM-DD
  label?: string;
}

// Custom navigation component with year and month dropdowns
function CustomCaption(props: { displayMonth: Date; onMonthChange?: (month: Date) => void }) {
  const { displayMonth } = props;
  const { goToMonth, nextMonth, previousMonth } = useNavigation();
  const { currentLanguage } = useLanguage();

  const currentYear = displayMonth.getFullYear();
  const currentMonth = displayMonth.getMonth();

  // Generate years array
  const years = Array.from({ length: 2099 - 1940 + 1 }, (_, i) => 1940 + i);
  
  // Generate localized month names
  const months = useMemo(() => {
    const locale = currentLanguage === 'ru' ? 'ru-RU' : 'en-US';
    return Array.from({ length: 12 }, (_, i) => {
      const date = new Date(2024, i, 1);
      return date.toLocaleString(locale, { month: 'long' });
    });
  }, [currentLanguage]);

  const handleYearChange = (e: React.ChangeEvent<HTMLSelectElement>) => {
    const newYear = parseInt(e.target.value);
    const newDate = new Date(newYear, currentMonth, 1);
    goToMonth(newDate);
  };

  const handleMonthChange = (e: React.ChangeEvent<HTMLSelectElement>) => {
    const newMonth = parseInt(e.target.value);
    const newDate = new Date(currentYear, newMonth, 1);
    goToMonth(newDate);
  };

  return (
    <div className="flex items-center justify-between mb-4">
      <button
        type="button"
        onClick={() => previousMonth && goToMonth(previousMonth)}
        disabled={!previousMonth}
        className="p-1 border border-black dark:border-white bg-white dark:bg-black text-black dark:text-white hover:bg-black hover:text-white dark:hover:bg-white dark:hover:text-black disabled:opacity-50 disabled:cursor-not-allowed focus:outline-none focus:ring-0"
        aria-label="Previous month"
      >
        <svg className="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
          <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M15 19l-7-7 7-7" />
        </svg>
      </button>
      
      <div className="flex items-center gap-2">
        <select
          value={currentMonth}
          onChange={handleMonthChange}
          className="px-2 py-1 border border-black dark:border-white bg-white dark:bg-black text-black dark:text-white cursor-pointer font-light focus:outline-none focus:ring-0"
          aria-label="Select month"
        >
          {months.map((month, index) => (
            <option key={index} value={index}>
              {month}
            </option>
          ))}
        </select>
        <select
          value={currentYear}
          onChange={handleYearChange}
          className="px-2 py-1 border border-black dark:border-white bg-white dark:bg-black text-black dark:text-white cursor-pointer font-light focus:outline-none focus:ring-0"
          aria-label="Select year"
        >
          {years.map((year) => (
            <option key={year} value={year}>
              {year}
            </option>
          ))}
        </select>
      </div>

      <button
        type="button"
        onClick={() => nextMonth && goToMonth(nextMonth)}
        disabled={!nextMonth}
        className="p-1 border border-black dark:border-white bg-white dark:bg-black text-black dark:text-white hover:bg-black hover:text-white dark:hover:bg-white dark:hover:text-black disabled:opacity-50 disabled:cursor-not-allowed focus:outline-none focus:ring-0"
        aria-label="Next month"
      >
        <svg className="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
          <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M9 5l7 7-7 7" />
        </svg>
      </button>
    </div>
  );
}

// Convert YYYY-MM-DD to DD-MM-YYYY for display
function convertFromISO(isoDate: string): string {
  if (!isoDate || !/^\d{4}-\d{2}-\d{2}$/.test(isoDate)) return '';
  const [year, month, day] = isoDate.split('-');
  return `${day}-${month}-${year}`;
}

// Convert DD-MM-YYYY to YYYY-MM-DD for database
function convertToISO(ddmmyyyy: string): string | null {
  if (!ddmmyyyy || !/^\d{2}-\d{2}-\d{4}$/.test(ddmmyyyy)) return null;
  const [day, month, year] = ddmmyyyy.split('-');
  return `${year}-${month}-${day}`;
}

// Format input with mask DD-MM-YYYY
function formatDateInput(value: string): string {
  // Remove all non-digits
  const digits = value.replace(/\D/g, '');
  
  // Limit to 8 digits
  const limited = digits.slice(0, 8);
  
  // Add dashes at appropriate positions
  if (limited.length === 0) {
    return '';
  } else if (limited.length <= 2) {
    return limited;
  } else if (limited.length <= 4) {
    return `${limited.slice(0, 2)}-${limited.slice(2)}`;
  } else {
    return `${limited.slice(0, 2)}-${limited.slice(2, 4)}-${limited.slice(4)}`;
  }
}

// Validate DD-MM-YYYY format and check if date is valid
function isValidDateString(dateString: string): boolean {
  const regex = /^\d{2}-\d{2}-\d{4}$/;
  if (!regex.test(dateString)) return false;
  
  const [day, month, year] = dateString.split('-').map(Number);
  
  // Check if values are in valid ranges
  if (month < 1 || month > 12) return false;
  if (day < 1 || day > 31) return false;
  if (year < 1940 || year > 2099) return false;
  
  // Check if date is actually valid (e.g., not 31-02-2024)
  const date = new Date(year, month - 1, day);
  return date.getFullYear() === year &&
         date.getMonth() === month - 1 &&
         date.getDate() === day;
}

const DateInput = React.forwardRef<HTMLInputElement, DateInputProps>(
  ({ value, onChange, placeholder = 'DD-MM-YYYY', label, className = '', ...props }, ref) => {
    const [open, setOpen] = useState(false);
    // inputValue stores DD-MM-YYYY format for display
    const [inputValue, setInputValue] = useState(value ? convertFromISO(value) : '');
    const inputRef = useRef<HTMLInputElement | null>(null);
    const calendarRef = useRef<HTMLDivElement | null>(null);
    const selected = value ? new Date(value) : undefined;

    // Sync inputValue with external value prop when it changes
    React.useEffect(() => {
      setInputValue(value ? convertFromISO(value) : '');
    }, [value]);

    function handleDaySelect(day: Date | undefined) {
      setOpen(false);
      if (!day) {
        setInputValue('');
        if (onChange) {
          onChange(undefined);
        }
        return;
      }
      
      const isoDate = day.toISOString().slice(0, 10); // YYYY-MM-DD
      const displayDate = convertFromISO(isoDate); // DD-MM-YYYY
      setInputValue(displayDate);
      if (onChange) {
        onChange(isoDate);
      }
    }

    function handleInputChange(e: React.ChangeEvent<HTMLInputElement>) {
      const rawValue = e.target.value;
      
      // Format with mask (handles both input and deletion)
      const formatted = formatDateInput(rawValue);
      setInputValue(formatted);
      
      // If user typed a complete valid date, update parent immediately
      if (formatted === '') {
        if (onChange) {
          onChange(undefined);
        }
      } else if (isValidDateString(formatted)) {
        const isoDate = convertToISO(formatted);
        if (isoDate && onChange) {
          onChange(isoDate);
        }
      }
      // For partial input, we keep it in local state but don't update parent yet
    }

    function handleInputBlur() {
      const trimmedValue = inputValue.trim();
      
      if (trimmedValue === '') {
        setInputValue('');
        if (onChange) {
          onChange(undefined);
        }
        return;
      }

      // Validate on blur
      if (isValidDateString(trimmedValue)) {
        const isoDate = convertToISO(trimmedValue);
        if (isoDate) {
          setInputValue(trimmedValue);
          if (onChange) {
            onChange(isoDate);
          }
        } else {
          // If conversion failed, revert
          setInputValue(value ? convertFromISO(value) : '');
        }
      } else {
        // If invalid, revert to previous valid value
        setInputValue(value ? convertFromISO(value) : '');
      }
    }

    function handleInputFocus() {
      setOpen(true);
    }

    // Close calendar when clicking outside
    const handleClickOutside = useCallback((event: MouseEvent) => {
      if (
        calendarRef.current &&
        !calendarRef.current.contains(event.target as Node) &&
        inputRef.current &&
        !inputRef.current.contains(event.target as Node)
      ) {
        setOpen(false);
      }
    }, []);

    React.useEffect(() => {
      if (open) {
        document.addEventListener('mousedown', handleClickOutside);
        return () => {
          document.removeEventListener('mousedown', handleClickOutside);
        };
      }
    }, [open, handleClickOutside]);

    return (
      <div className="w-full">
        {label && (
          <label className="block mb-2 text-sm font-bold text-black dark:text-white tracking-tight">
            {label}
          </label>
        )}
        <div className="relative w-full">
          <input
            ref={(node) => {
              if (typeof ref === 'function') ref(node);
              else if (ref) (ref as React.MutableRefObject<HTMLInputElement | null>).current = node;
              inputRef.current = node;
            }}
            type="text"
            inputMode="numeric"
            className={`border border-black dark:border-white px-3 py-2 bg-white dark:bg-black text-black dark:text-white w-full font-light focus:outline-none focus:ring-0 ${className}`}
            value={inputValue}
            onChange={handleInputChange}
            onFocus={handleInputFocus}
            onBlur={handleInputBlur}
            pattern="\d{2}-\d{2}-\d{4}"
            placeholder={placeholder}
            maxLength={10}
            {...props}
          />
          {open && (
            <div 
              ref={calendarRef}
              className="absolute left-0 z-50 mt-2 w-max min-w-[260px] border border-black dark:border-white bg-white dark:bg-black p-4"
            >
              <DayPicker
                mode="single"
                selected={selected}
                onSelect={handleDaySelect}
                fromYear={1940}
                toYear={2099}
                showOutsideDays
                components={{
                  Caption: CustomCaption
                } as unknown as CustomComponents}
                className="rdp-monochrome"
              />
            </div>
          )}
        </div>
      </div>
    );
  }
);

export default DateInput;
