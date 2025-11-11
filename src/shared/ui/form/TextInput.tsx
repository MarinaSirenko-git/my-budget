import React from 'react';

interface TextInputProps extends Omit<React.InputHTMLAttributes<HTMLInputElement>, 'value' | 'onChange'> {
  value?: string;
  onChange?: React.ChangeEventHandler<HTMLInputElement>;
  label?: string;
}

const TextInput = React.forwardRef<HTMLInputElement, TextInputProps>(
  ({ label, className = '', ...props }, ref) => {
    return (
      <div className="w-full">
        {label && (
          <label className="block mb-1 text-sm font-medium text-mainTextColor dark:text-textColor">
            {label}
          </label>
        )}
        <input
          ref={ref}
          type="text"
          className={`border rounded px-3 py-2 bg-cardColor dark:bg-sidebarBg text-mainTextColor dark:text-mainTextColor w-full ${className}`}
          {...props}
        />
      </div>
    );
  }
);

export default TextInput;
