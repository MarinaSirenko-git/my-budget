import React, { useRef, useState } from 'react';
import { DayPicker } from 'react-day-picker';
import 'react-day-picker/dist/style.css';

interface DateInputProps extends Omit<React.InputHTMLAttributes<HTMLInputElement>, 'value' | 'onChange'> {
  value?: string; // YYYY-MM-DD
  onChange?: (date: string | undefined) => void;
}

const DateInput = React.forwardRef<HTMLInputElement, DateInputProps>(
  ({ value, onChange, placeholder = 'Select date', className = '', ...props }, ref) => {
    const [open, setOpen] = useState(false);
    const inputRef = useRef<HTMLInputElement | null>(null);
    const selected = value ? new Date(value) : undefined;

    function handleDaySelect(day: Date | undefined) {
      setOpen(false);
      if (onChange) {
        onChange(day ? day.toISOString().slice(0, 10) : undefined);
      }
    }

    // Prevent closing on input click
    function handleInputClick() { setOpen(true); }

    return (
      <div className="relative w-full">
        <input
          ref={(node) => {
            if (typeof ref === 'function') ref(node);
            else if (ref) (ref as React.MutableRefObject<HTMLInputElement | null>).current = node;
            inputRef.current = node;
          }}
          type="text"
          inputMode="none"
          className={`border rounded px-3 py-2 bg-white dark:bg-gray-900 w-full cursor-pointer ${className}`}
          value={value || ''}
          onFocus={handleInputClick}
          placeholder={placeholder}
          readOnly
          {...props}
        />
        {open && (
          <div className="absolute left-0 z-50 mt-2 w-max min-w-[260px] rounded-xl bg-white dark:bg-gray-900 shadow-lg border p-4" tabIndex={-1} onBlur={() => setOpen(false)}>
            <DayPicker
              mode="single"
              selected={selected}
              onSelect={handleDaySelect}
              fromYear={1940}
              toYear={2099}
              showOutsideDays
              className=""
            />
          </div>
        )}
      </div>
    );
  }
);

export default DateInput;
