import React from 'react';
import { XMarkIcon } from '@heroicons/react/24/outline';

interface TagProps {
  /** The text content of the tag */
  title: string;
  /** Optional click handler for the tag */
  onClick?: () => void;
  /** Optional handler for the remove/close button */
  onRemove?: () => void;
  /** Whether the tag is disabled */
  disabled?: boolean;
  /** Whether the tag should have accent color (e.g., for custom items) */
  isCustom?: boolean;
  /** Additional CSS classes */
  className?: string;
}

const Tag: React.FC<TagProps> = ({ 
  title, 
  onClick, 
  onRemove, 
  disabled = false,
  isCustom = false,
  className = '' 
}) => {
  return (
    <button
      className={`
        inline-flex items-center gap-1.5 rounded-full px-3 py-1 text-sm font-medium
        transition-colors
        ${isCustom 
          ? 'bg-blue-100 dark:bg-blue-900 text-blue-800 dark:text-blue-200 hover:bg-blue-200 dark:hover:bg-blue-800' 
          : 'bg-gray-100 dark:bg-gray-700 text-gray-800 dark:text-gray-200 hover:bg-gray-200 dark:hover:bg-gray-600'}
        ${onClick && !disabled ? 'cursor-pointer' : ''}
        ${disabled ? 'opacity-50 cursor-not-allowed' : ''}
        ${className}
      `}
      onClick={onClick && !disabled ? onClick : undefined}
      role={onClick ? 'button' : undefined}
      tabIndex={onClick && !disabled ? 0 : undefined}
      aria-label={onClick ? title : undefined}
    >
      <span>{title}</span>
      {onRemove && !disabled && (
        <button
          onClick={(e) => {
            e.stopPropagation();
            onRemove();
          }}
          className="ml-1 rounded-full hover:bg-gray-300 dark:hover:bg-gray-500 p-0.5 transition-colors"
          aria-label={`Remove ${title}`}
          type="button"
        >
          <XMarkIcon className="w-3.5 h-3.5" />
        </button>
      )}
    </button>
  );
};

export default Tag;

