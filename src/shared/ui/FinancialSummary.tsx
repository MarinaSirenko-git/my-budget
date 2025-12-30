interface FinancialSummaryProps {
  totalIncome: number;
  totalExpenses: number;
  totalSavings: number;
  totalGoals: number;
  remainder: number;
  t: (key: string) => string;
  variant?: 'desktop' | 'mobile';
}

export default function FinancialSummary({
  totalIncome,
  totalExpenses,
  totalSavings,
  totalGoals,
  remainder,
  t,
  variant = 'desktop',
}: FinancialSummaryProps) {
  const isMobile = variant === 'mobile';

  // Desktop styles
  const containerClass = isMobile
    ? 'flex w-full gap-0 overflow-x-auto'
    : 'flex flex-col';

  const baseCardClass = isMobile
    ? 'flex-shrink-0 min-w-[80px] px-2 py-1.5 border border-black dark:border-white'
    : 'min-w-[100px] px-4 py-2 border-x-transparent';

  const labelTextClass = isMobile ? 'text-[10px]' : 'text-base';
  const valueTextClass = isMobile ? 'text-xs' : 'text-base';

  return (
    <div className={containerClass}>
      <div className={`${baseCardClass} bg-white dark:bg-black`} title={t('summary.incomeTitle')}>
        <div className={`${labelTextClass} text-black dark:text-white tracking-wider font-light`}>{t('summary.income')}</div>
        <div className={`${valueTextClass} font-bold text-black dark:text-white`}>{totalIncome.toLocaleString('en-US', { minimumFractionDigits: 2, maximumFractionDigits: 2 })}</div>
      </div>
      <div className={`${baseCardClass} border-t border-black dark:border-white bg-white dark:bg-black`} title={t('summary.savingsTitle')}>
        <div className={`${labelTextClass} text-black dark:text-white tracking-wider font-light`}>{t('summary.savings')}</div>
        <div className={`${valueTextClass} font-bold text-black dark:text-white`}>{totalSavings.toLocaleString('en-US', { minimumFractionDigits: 2, maximumFractionDigits: 2 })}</div>
      </div>
      <div className={`${baseCardClass} border-t border-black dark:border-white bg-white dark:bg-black`} title={t('summary.expensesTitle')}>
        <div className={`${labelTextClass} text-black dark:text-white tracking-wider font-light`}>{t('summary.expenses')}</div>
        <div className={`${valueTextClass} font-bold text-black dark:text-white`}>{totalExpenses.toLocaleString('en-US', { minimumFractionDigits: 2, maximumFractionDigits: 2 })}</div>
      </div>
      <div className={`${baseCardClass} border-t border-black dark:border-white bg-white dark:bg-black`} title={t('summary.goalsTitle')}>
        <div className={`${labelTextClass} text-black dark:text-white tracking-wider font-light`}>{t('summary.goals')}</div>
        <div className={`${valueTextClass} font-bold text-black dark:text-white`}>{totalGoals.toLocaleString('en-US', { minimumFractionDigits: 2, maximumFractionDigits: 2 })}</div>
      </div>

      <div className={`${baseCardClass} border-t border-b border-black dark:border-white bg-black dark:bg-white`} title={t('summary.remainderTitle')}>
        <div className={`${labelTextClass} text-white dark:text-black tracking-wider font-light`}>{t('summary.remainder')}</div>
        <div className={`${valueTextClass} font-bold text-white dark:text-black`}>{remainder.toLocaleString('en-US', { minimumFractionDigits: 2, maximumFractionDigits: 2 })}</div>
      </div>
    </div>
  );
}

