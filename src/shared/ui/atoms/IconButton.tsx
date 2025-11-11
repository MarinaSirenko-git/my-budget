import React from 'react';

interface IconButtonProps extends Omit<React.ButtonHTMLAttributes<HTMLButtonElement>, 'children' | 'title' | 'onClick'> {
  /** Required label for screen readers if child is not text  */
  "aria-label": string;
  /** Title (tooltip) for mouse users, defaults to aria-label */
  title?: string;
  /** Click handler for button interactions */
  onClick?: (event: React.MouseEvent<HTMLButtonElement, MouseEvent>) => void;
  children: React.ReactNode;
}

const IconButton = React.forwardRef<HTMLButtonElement, IconButtonProps>(
  ({ children, className = '', disabled, 'aria-label': ariaLabel, title, onClick, ...props }, ref) => {
    // Use title (tooltip) from props. If none is provided, use aria-label.
    const buttonTitle = title ?? ariaLabel;
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
          inline-flex items-center justify-center rounded-full p-2
          transition-all
          bg-cardColor dark:bg-cardColor
          text-mainTextColor dark:text-mainTextColor
          hover:bg-contentBg dark:hover:bg-contentBg
          focus-visible:ring-2 focus-visible:ring-primary focus-visible:z-10
          active:bg-contentBg dark:active:bg-contentBg
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

export default IconButton;
