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
  variant?: 'default' | 'primary' | 'yellow';
}

const TextButton = React.forwardRef<HTMLButtonElement, TextButtonProps>(
  ({ children, className = '', disabled, variant, 'aria-label': ariaLabel, title, onClick, ...props }, ref) => {
    const buttonTitle = title ?? ariaLabel;
    
    const variantStyles = {
      default: `
        bg-cardColor text-primary
        hover:bg-contentBg dark:hover:bg-cardColor
        active:bg-contentBg dark:active:bg-cardColor
      `,
      primary: `
        bg-primary text-white
        hover:bg-primary/80 dark:hover:bg-primary/80
        active:bg-primary/90 dark:active:bg-primary/90
      `,
      yellow: `
        bg-accentYellow text-gray-900 dark:text-gray-900
        hover:bg-accentYellow/80 dark:hover:bg-accentYellow/80
        active:bg-accentYellow/90 dark:active:bg-accentYellow/90
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
          inline-flex items-center justify-center font-medium rounded-full px-3 py-2 lg:px-4 lg:py-3 transition-all text-sm lg:text-base
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
