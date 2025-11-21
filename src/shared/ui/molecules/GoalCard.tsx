import React from 'react';
import IconButton from '../atoms/IconButton';
import { PencilIcon, TrashIcon } from '@heroicons/react/24/outline';

interface GoalCardProps {
  title: string;
  saved: number;
  target: number;
  currency?: string;
  monthsLeft?: number;
  onEdit?: () => void;
  onDelete?: () => void;
}

const formatMoney = (value: number, currency = '₽') => value.toLocaleString('ru-RU') + ' ' + currency;

const GoalCard: React.FC<GoalCardProps> = ({ title, saved, target, currency = '₽', monthsLeft, onEdit, onDelete }) => {
  function handleEdit(e: React.MouseEvent) {
    e.stopPropagation();
    if (onEdit) onEdit();
  }
  function handleDelete(e: React.MouseEvent) {
    e.stopPropagation();
    if (onDelete) onDelete();
  }
  return (
    <div className="relative group rounded-xl bg-cardColor dark:bg-cardColor p-4 shadow flex flex-col gap-3 w-full max-w-md">
      {/* Action buttons - only visible on hover */}
      <div className="absolute top-3 right-3 flex gap-2 z-10 opacity-1 pointer-events-none group-hover:opacity-100 group-hover:pointer-events-auto transition-opacity">
        <IconButton aria-label="Edit goal" title="Edit goal" onClick={handleEdit}>
          <PencilIcon className="w-5 h-5" />
        </IconButton>
        <IconButton aria-label="Delete goal" title="Delete goal" onClick={handleDelete}>
          <TrashIcon className="w-5 h-5" />
        </IconButton>
      </div>
      <div className="flex items-baseline gap-2">
        <img 
          src="/src/assets/logo1.webp" 
          alt="Goal icon" 
          className="w-6 h-6 object-contain"
        />
        <div className="text-lg font-semibold text-mainTextColor dark:text-mainTextColor">{title}</div>
      </div>
      <div className="text-base font-medium text-mainTextColor dark:text-textColor">
        {formatMoney(saved, currency)} / {formatMoney(target, currency)}
      </div>
      {/* Progress bar */}
      <div className="relative w-full h-3 rounded-full bg-gray-200 dark:bg-gray-700 overflow-hidden">
        <div 
          className="h-full bg-accentYellow rounded-full transition-all duration-300"
          style={{ width: `${target > 0 ? Math.min(100, (saved / target) * 100) : 0}%` }}
        />
      </div>
      {typeof monthsLeft === 'number' && (
        <div className="text-sm opacity-60 mt-1">Осталось {monthsLeft} месяцев</div>
      )}
    </div>
  );
};

export default GoalCard;
