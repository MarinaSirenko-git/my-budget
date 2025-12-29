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
            className="block mb-2 text-sm font-bold text-black dark:text-white tracking-tight"
          >
            {label}
            {required && <span className="text-black dark:text-white ml-1">*</span>}
          </label>
        )}
        <textarea
          ref={ref}
          id={textareaId}
          required={required}
          className={`border border-black dark:border-white px-3 py-2 bg-white dark:bg-black text-black dark:text-white w-full resize-y min-h-[100px] font-light focus:outline-none focus:ring-0 ${className}`}
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

TextareaInput.displayName = 'TextareaInput';

export default TextareaInput;

