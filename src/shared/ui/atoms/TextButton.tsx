import React from 'react';

interface TextButtonProps extends Omit<React.ButtonHTMLAttributes<HTMLButtonElement>, 'children' | 'title' | 'onClick'> {
  /** Visible button label (required) */
  children: React.ReactNode;
  /** Required if button has no visible text (a11y) */
  "aria-label"?: string;
  /** Tooltip, defaults to aria-label */
  title?: string;
  /** Click handler */
  onClick?: (event: React.MouseEvent<HTMLButtonElement, MouseEvent>) => void;
  /** Button variant style */
  variant?: 'default' | 'primary';
}

const TextButton = React.forwardRef<HTMLButtonElement, TextButtonProps>(
  ({ children, className = '', disabled, variant, 'aria-label': ariaLabel, title, onClick, ...props }, ref) => {
    debugger
    const buttonTitle = title ?? ariaLabel;
    
    const variantStyles = {
      default: `
        bg-gray-300 text-primary
        hover:bg-gray-100 dark:hover:bg-gray-800
        active:bg-gray-200 dark:active:bg-gray-700
      `,
      primary: `
        bg-blue-600 text-white
        hover:bg-blue-700 dark:hover:bg-blue-700
        active:bg-blue-800 dark:active:bg-blue-800
      `,
    };

    return (
      <button
        ref={ref}
        type="button"
        aria-label={ariaLabel}
        title={buttonTitle}
        tabIndex={disabled ? -1 : 0}
        disabled={disabled}
        onClick={onClick}
        className={`
          inline-flex items-center justify-center font-medium rounded-md px-4 py-2 transition-all text-base
          ${variantStyles[variant ? variant : 'default']}
          focus-visible:ring-2 focus-visible:ring-primary focus-visible:z-10
          disabled:opacity-50 disabled:pointer-events-none
          ${className}
        `}
        {...props}
      >
        {children}
      </button>
    );
  }
);

export default TextButton;
