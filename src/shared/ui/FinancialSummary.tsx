interface FinancialSummaryProps {
  totalIncome: number;
  totalExpenses: number;
  totalSavings: number;
  totalGoals: number;
  remainder: number;
  t: (key: string) => string;
}

export default function FinancialSummary({
  totalIncome,
  totalExpenses,
  totalSavings,
  totalGoals,
  remainder,
  t,
}: FinancialSummaryProps) {
  const remainderColor = remainder > 0 
    ? 'text-mainTextColor' 
    : remainder < 0 
    ? 'text-accentRed' 
    : 'text-mainTextColor';

  return (
    <div className="absolute right-[-40px] top-1/2 -translate-y-1/2 z-40 flex flex-col gap-2">
      <div className="min-w-[100px] px-3 py-2 bg-success rounded-md shadow-sm" title={t('summary.incomeTitle')}>
        <div className="text-xs text-white tracking-wider">{t('summary.income')}</div>
        <div className="text-sm font-semibold text-white">{totalIncome.toLocaleString('en-US', { minimumFractionDigits: 2, maximumFractionDigits: 2 })}</div>
      </div>
      <div className="min-w-[100px] px-3 py-2 bg-success rounded-md shadow-sm" title={t('summary.savingsTitle')}>
        <div className="text-xs text-white tracking-wider">{t('summary.savings')}</div>
        <div className="text-sm font-semibold text-white">{totalSavings.toLocaleString('en-US', { minimumFractionDigits: 2, maximumFractionDigits: 2 })}</div>
      </div>
      <div className="min-w-[100px] px-3 py-2 bg-accentRed rounded-md shadow-sm" title={t('summary.expensesTitle')}>
        <div className="text-xs text-white tracking-wider">{t('summary.expenses')}</div>
        <div className="text-sm font-semibold text-white">{totalExpenses.toLocaleString('en-US', { minimumFractionDigits: 2, maximumFractionDigits: 2 })}</div>
      </div>
      <div className="min-w-[100px] px-3 py-2 bg-accentBlue rounded-md shadow-sm" title={t('summary.goalsTitle')}>
        <div className="text-xs text-white tracking-wider">{t('summary.goals')}</div>
        <div className="text-sm font-semibold text-white">{totalGoals.toLocaleString('en-US', { minimumFractionDigits: 2, maximumFractionDigits: 2 })}</div>
      </div>

      <div className="relative min-w-[100px] px-3 py-2 bg-white rounded-md shadow-sm" title={t('summary.remainderTitle')}>
        <div className="text-xs text-mainTextColor tracking-wider">{t('summary.remainder')}</div>
        <div className="absolute right-0 top-0">{remainder > 0 ? `🤩` : remainder < 0 ? `🤬` : remainder === 0 ? `🫥` : `🤔`}</div>
        <div className={`text-sm font-semibold ${remainderColor}`}>{remainder.toLocaleString('en-US', { minimumFractionDigits: 2, maximumFractionDigits: 2 })}</div>
      </div>
    </div>
  );
}

