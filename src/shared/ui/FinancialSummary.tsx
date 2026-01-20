interface FinancialSummaryProps {
  totalIncome: number;
  totalExpenses: number;
  totalSavings: number;
  totalGoals: number;
  remainder: number;
  currency: string;
  t: (key: string) => string;
  variant?: 'desktop' | 'mobile';
}

export default function FinancialSummary({
  totalIncome,
  totalExpenses,
  totalSavings,
  totalGoals,
  remainder,
  currency,
  t,
  variant = 'desktop',
}: FinancialSummaryProps) {
  const isMobile = variant === 'mobile';

  // Desktop styles
  const containerClass = isMobile
    ? 'flex flex-col gap-0'
    : 'flex flex-col';

  const baseCardClass = isMobile
    ? 'flex flex-row items-center justify-between px-4 py-2'
    : 'min-w-[100px] px-4 py-2 border-x-transparent';

  const labelTextClass = isMobile ? 'text-base' : 'text-base';
  const valueTextClass = isMobile ? 'text-base' : 'text-base';

  const remainderBgClass = isMobile
    ? 'bg-white dark:bg-black'
    : 'bg-black dark:bg-white';
  
  const remainderTextClass = isMobile
    ? 'text-black dark:text-white'
    : 'text-white dark:text-black';

  return (
    <div className={containerClass}>
      <div className={`${baseCardClass} bg-white dark:bg-black`} title={t('summary.incomeTitle')}>
        <div className={`${labelTextClass} text-black dark:text-white font-light`}>{t('summary.income')}</div>
        <div className={`${valueTextClass} font-bold text-black dark:text-white`}>{totalIncome.toLocaleString('en-US', { minimumFractionDigits: 2, maximumFractionDigits: 2 })} {currency}</div>
      </div>
      <div className={`${baseCardClass} bg-white dark:bg-black`} title={t('summary.expensesTitle')}>
        <div className={`${labelTextClass} text-black dark:text-white font-light`}>{t('summary.expenses')}</div>
        <div className={`${valueTextClass} font-bold text-black dark:text-white`}>{totalExpenses.toLocaleString('en-US', { minimumFractionDigits: 2, maximumFractionDigits: 2 })} {currency}</div>
      </div>
      <div className={`${baseCardClass} bg-white dark:bg-black`} title={t('summary.goalsTitle')}>
        <div className={`${labelTextClass} text-black dark:text-white font-light`}>{t('summary.goals')}</div>
        <div className={`${valueTextClass} font-bold text-black dark:text-white`}>{totalGoals.toLocaleString('en-US', { minimumFractionDigits: 2, maximumFractionDigits: 2 })} {currency}</div>
      </div>
      <div className={`${baseCardClass} bg-white dark:bg-black`} title={t('summary.savingsTitle')}>
        <div className={`${labelTextClass} text-black dark:text-white font-light`}>{t('summary.savings')}</div>
        <div className={`${valueTextClass} font-bold text-black dark:text-white`}>{totalSavings.toLocaleString('en-US', { minimumFractionDigits: 2, maximumFractionDigits: 2 })} {currency}</div>
      </div>

      <div className={`${baseCardClass} ${remainderBgClass}`} title={t('summary.remainderTitle')}>
        <div className={`${labelTextClass} ${remainderTextClass} font-light`}>{t('summary.remainder')}</div>
        <div className={`${valueTextClass} font-bold ${remainderTextClass}`}>{remainder.toLocaleString('en-US', { minimumFractionDigits: 2, maximumFractionDigits: 2 })} {currency}</div>
      </div>
    </div>
  );
}

