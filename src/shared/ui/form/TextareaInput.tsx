import React from 'react';

interface TextareaInputProps extends Omit<React.TextareaHTMLAttributes<HTMLTextAreaElement>, 'value' | 'onChange'> {
  value?: string;
  onChange?: React.ChangeEventHandler<HTMLTextAreaElement>;
  label?: string;
  required?: boolean;
  description?: string;
}

const TextareaInput = React.forwardRef<HTMLTextAreaElement, TextareaInputProps>(
  ({ label, className = '', required, id, description, ...props }, ref) => {
    const textareaId = id || (label ? `textarea-input-${label.replace(/\s+/g, '-').toLowerCase()}` : undefined);
    
    return (
      <div className="w-full">
        {label && (
          <label 
            htmlFor={textareaId}
            className="block mb-1 text-sm font-medium text-mainTextColor dark:text-textColor"
          >
            {label}
            {required && <span className="text-accentRed dark:text-accentRed ml-1">*</span>}
          </label>
        )}
        <textarea
          ref={ref}
          id={textareaId}
          required={required}
          className={`border rounded px-3 py-2 bg-cardColor dark:bg-sidebarBg text-mainTextColor dark:text-mainTextColor w-full resize-y min-h-[100px] ${className}`}
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

TextareaInput.displayName = 'TextareaInput';

export default TextareaInput;

