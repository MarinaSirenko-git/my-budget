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
        inline-flex items-center gap-1.5 rounded-full px-3 py-2 text-sm font-medium
        transition-colors hover:opacity-80
        ${isCustom 
          ? 'bg-primary dark:bg-primary text-white dark:text-mainTextColor hover:bg-primary dark:hover:bg-primary' 
          : 'bg-sidebarBg dark:bg-cardColor text-mainTextColor dark:text-mainTextColor hover:bg-sidebarBg dark:hover:bg-cardColor'}
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
          className="ml-1 rounded-full bg-sidebarBg hover:bg-sidebarBg dark:hover:bg-cardColor p-0.5 transition-colors"
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

