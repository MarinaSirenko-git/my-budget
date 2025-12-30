import { PlusIcon } from '@heroicons/react/24/outline';

interface AddButtonProps {
  onClick: () => void;
  'aria-label': string;
  children: React.ReactNode;
  className?: string;
  inverted?: boolean;
}

export default function AddButton({ 
  onClick, 
  'aria-label': ariaLabel, 
  children,
  className = '',
  inverted = false
}: AddButtonProps) {
  const iconBgClass = inverted 
    ? 'bg-white dark:bg-black'
    : 'bg-black dark:bg-white';
  
  const iconTextClass = inverted
    ? 'text-black dark:text-white'
    : 'text-white dark:text-black';

  // Check if className has forced overrides (!) or custom colors
  const hasForcedBg = className.includes('!bg-');
  const hasForcedText = className.includes('!text-');
  const hasCustomBg = hasForcedBg || (className.match(/\bbg-\w+/g) && !className.includes('hover:bg-'));
  const hasCustomText = hasForcedText || (className.match(/\btext-\w+/g) && !className.includes('hover:text-'));
  
  const baseBgClass = hasCustomBg ? '' : 'bg-gray-200 dark:bg-gray-800';
  const baseTextClass = hasCustomText ? '' : 'text-black dark:text-white';
  const baseHoverClass = hasCustomBg ? '' : 'hover:bg-gray-300 dark:hover:bg-gray-700';

  return (
    <button
      onClick={onClick}
      aria-label={ariaLabel}
      className={`flex items-center gap-2 px-3 py-2 ${baseBgClass} ${baseTextClass} border border-black dark:border-white ${baseHoverClass} transition-colors focus:outline-none focus:ring-0 ${className}`}
    >
      <div className={`w-6 h-6 rounded-full ${iconBgClass} flex items-center justify-center`}>
        <PlusIcon className={`w-4 h-4 ${iconTextClass}`} />
      </div>
      <span className="text-sm font-light">{children}</span>
    </button>
  );
}

