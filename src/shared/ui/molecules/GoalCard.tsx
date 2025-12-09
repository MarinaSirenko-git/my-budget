import React, { useState, useEffect } from 'react';
import IconButton from '../atoms/IconButton';
import { PencilIcon, TrashIcon } from '@heroicons/react/24/outline';
import { useCurrency } from '@/shared/hooks/useCurrency';
import { useCurrencyConversion } from '@/shared/hooks/useCurrencyConversion';
import { DEFAULT_CURRENCY } from '@/shared/constants/currencies';

interface GoalCardProps {
  title: string;
  saved: number;
  target: number;
  currency?: string;
  monthsLeft?: number;
  onEdit?: () => void;
  onDelete?: () => void;
}

const formatMoney = (value: number, currency: string) => 
  value.toLocaleString('en-US', { minimumFractionDigits: 2, maximumFractionDigits: 2 }) + ' ' + currency;

const GoalCard: React.FC<GoalCardProps> = ({ title, saved, target, currency = DEFAULT_CURRENCY, monthsLeft, onEdit, onDelete }) => {
  const { currency: baseCurrency, loading: currencyLoading } = useCurrency();
  const { convertAmount } = useCurrencyConversion();
  const [convertedSaved, setConvertedSaved] = useState<number | null>(null);
  const [convertedTarget, setConvertedTarget] = useState<number | null>(null);

  useEffect(() => {
    let isMounted = true;

    async function performConversion() {
      if (currencyLoading) return;

      if (!baseCurrency || !currency || currency === baseCurrency) {
        if (isMounted) {
          setConvertedSaved(null);
          setConvertedTarget(null);
        }
        return;
      }

      if (typeof baseCurrency !== 'string' || typeof currency !== 'string' || baseCurrency.trim() === '' || currency.trim() === '') {
        if (isMounted) {
          setConvertedSaved(null);
          setConvertedTarget(null);
        }
        return;
      }

      if (!isFinite(saved) || !isFinite(target) || target <= 0) {
        if (isMounted) {
          setConvertedSaved(null);
          setConvertedTarget(null);
        }
        return;
      }

      try {
        const savedConverted = await convertAmount(saved, currency, baseCurrency);
        const targetConverted = await convertAmount(target, currency, baseCurrency);
        
        if (isMounted) {
          setConvertedSaved(savedConverted);
          setConvertedTarget(targetConverted);
        }
      } catch (error) {
        if (isMounted) {
          setConvertedSaved(null);
          setConvertedTarget(null);
        }
      }
    }

    performConversion();

    return () => {
      isMounted = false;
    };
  }, [currencyLoading, baseCurrency, currency, saved, target, convertAmount]);

  function handleEdit(e: React.MouseEvent) {
    e.stopPropagation();
    if (onEdit) onEdit();
  }
  function handleDelete(e: React.MouseEvent) {
    e.stopPropagation();
    if (onDelete) onDelete();
  }
  return (
    <div className="relative group rounded-xl bg-cardColor dark:bg-cardColor p-3 lg:p-4 shadow flex flex-col gap-2 lg:gap-3 w-full max-w-md">
      {/* Action buttons - only visible on hover */}
      <div className="absolute top-2 right-2 lg:top-3 lg:right-3 flex gap-2 z-10 opacity-1 pointer-events-none group-hover:opacity-100 group-hover:pointer-events-auto transition-opacity">
        <IconButton aria-label="Edit goal" title="Edit goal" onClick={handleEdit}>
          <PencilIcon className="w-4 h-4 lg:w-5 lg:h-5" />
        </IconButton>
        <IconButton aria-label="Delete goal" title="Delete goal" onClick={handleDelete}>
          <TrashIcon className="w-4 h-4 lg:w-5 lg:h-5" />
        </IconButton>
      </div>
      <div className="flex items-baseline gap-2">
        <img 
          src="/src/assets/logo1.webp" 
          alt="Goal icon" 
          className="w-5 h-5 lg:w-6 lg:h-6 object-contain"
        />
        <div className="text-base lg:text-lg font-semibold text-mainTextColor dark:text-mainTextColor truncate">{title}</div>
      </div>
      <div className="text-sm lg:text-base font-medium text-mainTextColor dark:text-textColor">
        {formatMoney(saved, currency)} / {formatMoney(target, currency)}

      </div>
      {/* Progress bar */}
      <div className="relative w-full h-2.5 lg:h-3 rounded-full bg-gray-200 dark:bg-gray-700 overflow-hidden">
        <div 
          className="h-full bg-accentYellow rounded-full transition-all duration-300"
          style={{ width: `${target > 0 ? Math.min(100, (saved / target) * 100) : 0}%` }}
        />
      </div>
      <div className="flex flex-col sm:flex-row items-start sm:items-center gap-1 sm:gap-2 justify-between text-xs lg:text-sm opacity-60 mt-1">
        {typeof monthsLeft === 'number' && (
          <div>Осталось {monthsLeft} месяцев</div>
        )}
       {baseCurrency && currency !== baseCurrency && convertedSaved !== null && convertedTarget !== null && (
          <div className="text-xs lg:text-sm">
            {formatMoney(convertedSaved, baseCurrency)} / {formatMoney(convertedTarget, baseCurrency)}
          </div>
        )}
      </div>
    </div>
  );
};

export default GoalCard;
