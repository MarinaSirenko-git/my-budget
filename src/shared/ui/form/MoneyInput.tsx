import React from 'react';
import CurrencyInput from 'react-currency-input-field';
import type { CurrencyInputProps } from 'react-currency-input-field';

export interface MoneyInputProps extends Omit<CurrencyInputProps, 'onValueChange'> {
  value?: string | number;
  onValueChange?: (value: string | undefined) => void;
  className?: string;
}

const MoneyInput = React.forwardRef<HTMLInputElement, MoneyInputProps>(
  ({ value, onValueChange, name, className = '', ...props }, ref) => {
    return (
      <CurrencyInput
        ref={ref}
        name={name}
        value={value}
        onValueChange={onValueChange}
        className={`border rounded px-3 py-2 bg-white dark:bg-gray-900 w-full ${className}`}
        {...props}
      />
    );
  }
);

export default MoneyInput;
