import { PlusIcon } from '@heroicons/react/24/outline';

interface AddButtonProps {
  onClick: () => void;
  'aria-label': string;
  children: React.ReactNode;
  className?: string;
}

export default function AddButton({ 
  onClick, 
  'aria-label': ariaLabel, 
  children,
  className = '' 
}: AddButtonProps) {
  return (
    <button
      onClick={onClick}
      aria-label={ariaLabel}
      className={`flex items-center gap-2 px-3 py-2 bg-gray-200 dark:bg-gray-800 text-black dark:text-white border border-black dark:border-white hover:bg-gray-300 dark:hover:bg-gray-700 transition-colors focus:outline-none focus:ring-0 ${className}`}
    >
      <div className="w-6 h-6 rounded-full bg-black dark:bg-white flex items-center justify-center">
        <PlusIcon className="w-4 h-4 text-white dark:text-black" />
      </div>
      <span className="text-sm font-light">{children}</span>
    </button>
  );
}
