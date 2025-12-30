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
        inline-flex items-center gap-2 border border-black dark:border-white
        px-3 py-1.5 text-xs font-mono uppercase tracking-wide
        transition-all
        ${isCustom 
          ? 'bg-black dark:bg-white text-white dark:text-black hover:bg-white hover:text-black dark:hover:bg-black dark:hover:text-white' 
          : 'bg-white dark:bg-black text-black dark:text-white hover:bg-black hover:text-white dark:hover:bg-white dark:hover:text-black'}
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
          className="ml-1 border border-black dark:border-white bg-white dark:bg-black text-black dark:text-white hover:bg-black hover:text-white dark:hover:bg-white dark:hover:text-black p-0.5 transition-all"
          aria-label={`Remove ${title}`}
          type="button"
        >
          <XMarkIcon className="w-3 h-3" />
        </button>
      )}
    </button>
  );
};

export default Tag;

