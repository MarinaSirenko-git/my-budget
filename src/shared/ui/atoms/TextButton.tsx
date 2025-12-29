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
  variant?: 'default' | 'primary' | 'inverse';
}

const TextButton = React.forwardRef<HTMLButtonElement, TextButtonProps>(
  ({ children, className = '', disabled, variant, 'aria-label': ariaLabel, title, onClick, ...props }, ref) => {
    const buttonTitle = title ?? ariaLabel;
    
    const variantStyles = {
      default: `
        border border-black dark:border-white bg-white dark:bg-black text-black dark:text-white
        hover:bg-black hover:text-white dark:hover:bg-white dark:hover:text-black
        active:bg-black active:text-white dark:active:bg-white dark:active:text-black
      `,
      primary: `
        border border-black dark:border-white bg-black dark:bg-white text-white dark:text-black
        hover:bg-white hover:text-black dark:hover:bg-black dark:hover:text-white
        active:bg-white active:text-black dark:active:bg-black dark:active:text-white
      `,
      inverse: `
        border border-black dark:border-white bg-white dark:bg-black text-black dark:text-white
        hover:bg-black hover:text-white dark:hover:bg-white dark:hover:text-black
        active:bg-black active:text-white dark:active:bg-white dark:active:text-black
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
          inline-flex items-center justify-center font-bold px-3 py-2 lg:px-4 lg:py-3 transition-all text-sm lg:text-base
          ${variantStyles[variant ? variant : 'default']}
          focus:outline-none focus:ring-0
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
