import React from 'react';
import ProgressBar from '../atoms/ProgressBar';
import IconButton from '../atoms/IconButton';
import { PencilIcon, TrashIcon } from '@heroicons/react/24/outline';

interface GoalCardProps {
  title: string;
  saved: number;
  target: number;
  currency?: string;
  monthsLeft?: number;
  onEdit?: () => void;
}

const formatMoney = (value: number, currency = '₽') => value.toLocaleString('ru-RU') + ' ' + currency;

const GoalCard: React.FC<GoalCardProps> = ({ title, saved, target, currency = '₽', monthsLeft, onEdit }) => {
  function handleEdit(e: React.MouseEvent) {
    e.stopPropagation();
    if (onEdit) onEdit();
  }
  function handleDelete(e: React.MouseEvent) {
    e.stopPropagation();
    // TODO: confirm and delete
    alert('Delete goal feature coming soon');
  }
  return (
    <div className="relative group rounded-xl bg-cardColor dark:bg-cardColor p-4 shadow flex flex-col gap-3 w-full max-w-md">
      {/* Action buttons - only visible on hover */}
      <div className="absolute top-3 right-3 flex gap-2 z-10 opacity-0 pointer-events-none group-hover:opacity-100 group-hover:pointer-events-auto transition-opacity">
        <IconButton aria-label="Edit goal" title="Edit goal" onClick={handleEdit}>
          <PencilIcon className="w-5 h-5" />
        </IconButton>
        <IconButton aria-label="Delete goal" title="Delete goal" onClick={handleDelete}>
          <TrashIcon className="w-5 h-5" />
        </IconButton>
      </div>
      <div className="text-lg font-semibold text-mainTextColor dark:text-mainTextColor">{title}</div>
      <ProgressBar value={saved} max={target} />
      <div className="text-base font-medium text-mainTextColor dark:text-textColor mt-1">
        Накоплено <span className="font-bold">{formatMoney(saved, currency)}</span> из <span className="font-bold">{formatMoney(target, currency)}</span>
      </div>
      {typeof monthsLeft === 'number' && (
        <div className="text-sm opacity-60 mt-1">Осталось {monthsLeft} месяцев</div>
      )}
    </div>
  );
};

export default GoalCard;
