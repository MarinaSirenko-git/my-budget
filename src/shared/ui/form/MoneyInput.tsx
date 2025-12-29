import React from 'react';
import CurrencyInput from 'react-currency-input-field';
import type { CurrencyInputProps } from 'react-currency-input-field';

export interface MoneyInputProps extends Omit<CurrencyInputProps, 'onValueChange'> {
  value?: string | number;
  onValueChange?: (value: string | undefined) => void;
  className?: string;
  label?: string;
  description?: string;
}

const MoneyInput = React.forwardRef<HTMLInputElement, MoneyInputProps>(
  ({ value, onValueChange, name, label, description, className = '', ...props }, ref) => {
    return (
      <div className="w-full">
        {label && (
          <label className="block mb-2 text-sm font-bold text-black dark:text-white tracking-tight">
            {label}
          </label>
        )}
        <CurrencyInput
          ref={ref}
          name={name}
          value={value}
          onValueChange={onValueChange}
          className={`border border-black dark:border-white px-3 py-2 bg-white dark:bg-black text-black dark:text-white w-full font-light focus:outline-none focus:ring-0 ${className}`}
          {...props}
        />
        {description && (
          <p className="mt-2 text-xs text-black dark:text-white font-light">
            {description}
          </p>
        )}
      </div>
    );
  }
);

export default MoneyInput;
