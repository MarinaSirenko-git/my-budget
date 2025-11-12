import React from 'react';

interface TextInputProps extends Omit<React.InputHTMLAttributes<HTMLInputElement>, 'value' | 'onChange'> {
  value?: string;
  onChange?: React.ChangeEventHandler<HTMLInputElement>;
  label?: string;
  required?: boolean;
}

const TextInput = React.forwardRef<HTMLInputElement, TextInputProps>(
  ({ label, className = '', required, id, ...props }, ref) => {
    const inputId = id || (label ? `text-input-${label.replace(/\s+/g, '-').toLowerCase()}` : undefined);
    
    return (
      <div className="w-full">
        {label && (
          <label 
            htmlFor={inputId}
            className="block mb-1 text-sm font-medium text-mainTextColor dark:text-textColor"
          >
            {label}
            {required && <span className="text-accentRed dark:text-accentRed ml-1">*</span>}
          </label>
        )}
        <input
          ref={ref}
          id={inputId}
          type="text"
          required={required}
          className={`border rounded px-3 py-2 bg-cardColor dark:bg-sidebarBg text-mainTextColor dark:text-mainTextColor w-full ${className}`}
          {...props}
        />
      </div>
    );
  }
);

TextInput.displayName = 'TextInput';

export default TextInput;
