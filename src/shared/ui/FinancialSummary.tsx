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
  const remainderColor = remainder > 0 
    ? 'text-mainTextColor' 
    : remainder < 0 
    ? 'text-accentRed' 
    : 'text-mainTextColor';

  const isMobile = variant === 'mobile';

  // Desktop styles
  const containerClass = isMobile
    ? 'flex w-full gap-0 overflow-x-auto'
    : 'absolute right-[-40px] top-1/2 -translate-y-1/2 z-40 flex flex-col gap-2';

  const cardClass = isMobile
    ? 'flex-shrink-0 min-w-[80px] px-2 py-1.5'
    : 'min-w-[100px] px-3 py-2';

  const labelTextClass = isMobile ? 'text-[10px]' : 'text-xs';
  const valueTextClass = isMobile ? 'text-xs' : 'text-sm';
  const emojiClass = isMobile ? 'absolute right-1 top-1 text-xs' : 'absolute right-0 top-0';

  return (
    <div className={containerClass}>
      <div className={`${cardClass} bg-success lg:rounded-md shadow-sm`} title={t('summary.incomeTitle')}>
        <div className={`${labelTextClass} text-white tracking-wider`}>{t('summary.income')}</div>
        <div className={`${valueTextClass} font-semibold text-white`}>{totalIncome.toLocaleString('en-US', { minimumFractionDigits: 2, maximumFractionDigits: 2 })}</div>
      </div>
      <div className={`${cardClass} bg-success lg:rounded-md shadow-sm`} title={t('summary.savingsTitle')}>
        <div className={`${labelTextClass} text-white tracking-wider`}>{t('summary.savings')}</div>
        <div className={`${valueTextClass} font-semibold text-white`}>{totalSavings.toLocaleString('en-US', { minimumFractionDigits: 2, maximumFractionDigits: 2 })}</div>
      </div>
      <div className={`${cardClass} bg-accentRed lg:rounded-md shadow-sm`} title={t('summary.expensesTitle')}>
        <div className={`${labelTextClass} text-white tracking-wider`}>{t('summary.expenses')}</div>
        <div className={`${valueTextClass} font-semibold text-white`}>{totalExpenses.toLocaleString('en-US', { minimumFractionDigits: 2, maximumFractionDigits: 2 })}</div>
      </div>
      <div className={`${cardClass} bg-accentBlue lg:rounded-md shadow-sm`} title={t('summary.goalsTitle')}>
        <div className={`${labelTextClass} text-white tracking-wider`}>{t('summary.goals')}</div>
        <div className={`${valueTextClass} font-semibold text-white`}>{totalGoals.toLocaleString('en-US', { minimumFractionDigits: 2, maximumFractionDigits: 2 })}</div>
      </div>

      <div className={`relative ${cardClass} bg-white lg:rounded-md shadow-sm`} title={t('summary.remainderTitle')}>
        <div className={`${labelTextClass} text-mainTextColor tracking-wider`}>{t('summary.remainder')}</div>
        <div className={emojiClass}>{remainder > 0 ? `🤩` : remainder < 0 ? `🤬` : remainder === 0 ? `🫥` : `🤔`}</div>
        <div className={`${valueTextClass} font-semibold ${remainderColor}`}>{remainder.toLocaleString('en-US', { minimumFractionDigits: 2, maximumFractionDigits: 2 })}</div>
      </div>
    </div>
  );
}

