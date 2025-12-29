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
            className="block mb-2 text-sm font-bold text-black dark:text-white tracking-tight"
          >
            {label}
            {required && <span className="text-black dark:text-white ml-1">*</span>}
          </label>
        )}
        <input
          ref={ref}
          id={inputId}
          type="text"
          required={required}
          className={`border border-black dark:border-white px-3 py-2 bg-white dark:bg-black text-black dark:text-white w-full font-light focus:outline-none focus:ring-0 ${className}`}
          {...props}
        />
      </div>
    );
  }
);

TextInput.displayName = 'TextInput';

export default TextInput;
