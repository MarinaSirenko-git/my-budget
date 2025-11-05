export default function FinancialSummary({ totalIncome = 0, totalExpenses = 0, totalGoals = 0 }) {

  const remainder = totalIncome - totalExpenses - totalGoals;

  let remainderColor = 'text-gray-800 dark:text-gray-200';
  if (remainder > 0) {
    remainderColor = 'text-green-700 dark:text-green-500';
  } else if (remainder < 0) {
    remainderColor = 'text-red-700 dark:text-red-500';
  }

  const itemStyle = "flex-1 min-w-[120px] px-1 bg-transparent dark:bg-gray-800 rounded-md shadow-sm border border-[#1E293B] dark:border-gray-700";
  const labelStyle = "text-xs text-[#1E293B] dark:text-gray-400 tracking-wider";
  const valueStyle = "text-sm font-semibold";

  return (
    <div className="flex flex-wrap items-center gap-4 bg-gray-100 dark:bg-gray-900 rounded-lg">
      <div className={itemStyle}>
        <div className={labelStyle}>Доходы</div>
        <div className={`${valueStyle} text-green-600 dark:text-green-500`}>
          {totalIncome}
        </div>
      </div>

      <div className={itemStyle}>
        <div className={labelStyle}>Расходы</div>
        <div className={`${valueStyle} text-red-600 dark:text-red-500`}>
          {totalExpenses}
        </div>
      </div>
      
      <div className={itemStyle}>
        <div className={labelStyle}>Цели</div>
        <div className={`${valueStyle} text-blue-600 dark:text-blue-500`}>
          {totalGoals}
        </div>
      </div>

      <div className={itemStyle}>
        <div className={labelStyle}>Остаток</div>
        <div className={`${valueStyle} ${remainderColor}`}>
          {remainder}
        </div>
      </div>
    </div>
  );
};

