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
  const progress = target > 0 ? Math.min(100, (saved / target) * 100) : 0;

  return (
    <div className="relative group border border-black dark:border-white bg-white dark:bg-black p-4 lg:p-5 flex flex-col gap-3 lg:gap-4 w-full">
      {/* Action buttons - only visible on hover */}
      <div className="absolute top-3 right-3 lg:top-4 lg:right-4 flex gap-1 z-10 opacity-0 pointer-events-none group-hover:opacity-100 group-hover:pointer-events-auto transition-opacity">
        <IconButton aria-label="Edit goal" title="Edit goal" onClick={handleEdit}>
          <PencilIcon className="w-4 h-4 lg:w-5 lg:h-5" />
        </IconButton>
        <IconButton aria-label="Delete goal" title="Delete goal" onClick={handleDelete}>
          <TrashIcon className="w-4 h-4 lg:w-5 lg:h-5" />
        </IconButton>
      </div>
      
      {/* Title */}
      <div className="text-lg lg:text-lg font-bold text-black dark:text-white uppercase tracking-tight truncate pr-16">
        {title}
      </div>
      
      {/* Amount */}
      <div className="text-base lg:text-lg font-mono text-black dark:text-white">
        {formatMoney(saved, currency)} / {formatMoney(target, currency)}
      </div>
      
      {/* Progress bar - monochrome */}
      <div className="relative w-full h-1 bg-black dark:bg-white overflow-hidden">
        <div 
          className="h-full bg-white dark:bg-black transition-all duration-500"
          style={{ width: `${progress}%` }}
        />
      </div>
      
      {/* Footer info */}
      <div className="flex flex-col sm:flex-row items-start sm:items-center gap-2 sm:gap-3 justify-between text-xs lg:text-sm text-black dark:text-white pt-2">
        {typeof monthsLeft === 'number' && (
          <div className="font-mono uppercase tracking-wide">
            {monthsLeft} {monthsLeft === 1 ? 'месяц' : monthsLeft < 5 ? 'месяца' : 'месяцев'}
          </div>
        )}
        {baseCurrency && currency !== baseCurrency && convertedSaved !== null && convertedTarget !== null && (
          <div className="text-xs lg:text-sm font-mono">
            {formatMoney(convertedSaved, baseCurrency)} / {formatMoney(convertedTarget, baseCurrency)}
          </div>
        )}
      </div>
    </div>
  );
};

export default GoalCard;
