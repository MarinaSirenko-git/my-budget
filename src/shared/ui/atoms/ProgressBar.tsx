import React from 'react';

interface ProgressBarProps extends React.ProgressHTMLAttributes<HTMLProgressElement> {
  /** Current value of the progress bar; if undefined, renders indeterminate */
  value?: number;
  /** Maximum value (required for determinate) */
  max?: number;
  className?: string;
}

const ProgressBar = React.forwardRef<HTMLProgressElement, ProgressBarProps>(
  ({ value, max = 100, className = '', ...props }, ref) => {
    // Indeterminate if value is undefined
    const isIndeterminate = value === undefined || value === null;
    return (
      <progress
        ref={ref}
        value={isIndeterminate ? undefined : value}
        max={max}
        className={`
          w-full h-3 rounded bg-gray-200 dark:bg-gray-800
          [&::-webkit-progress-bar]:rounded [&::-webkit-progress-bar]:bg-gray-200 dark:[&::-webkit-progress-bar]:bg-gray-800
          [&::-webkit-progress-value]:rounded [&::-webkit-progress-value]:bg-primary
          [&::-moz-progress-bar]:rounded [&::-moz-progress-bar]:bg-primary
          ${isIndeterminate ? 'animate-pulse' : ''} ${className}
        `}
        aria-valuenow={!isIndeterminate ? value : undefined}
        aria-valuemax={max}
        aria-valuemin={0}
        aria-label={props['aria-label'] || 'progress'}
        {...props}
      >
        {/* fallback for old browsers */}
        {value} / {max}
      </progress>
    );
  }
);

export default ProgressBar;
