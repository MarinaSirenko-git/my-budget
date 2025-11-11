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
          <label className="block mb-1 text-sm font-medium text-mainTextColor dark:text-textColor">
            {label}
          </label>
        )}
        <CurrencyInput
          ref={ref}
          name={name}
          value={value}
          onValueChange={onValueChange}
          className={`border rounded px-3 py-2 bg-cardColor dark:bg-sidebarBg text-mainTextColor dark:text-mainTextColor w-full ${className}`}
          {...props}
        />
        {description && (
          <p className="mt-1 text-xs text-textColor dark:text-textColor">
            {description}
          </p>
        )}
      </div>
    );
  }
);

export default MoneyInput;
