export default function FinancialSummary({ totalIncome = 0, totalExpenses = 0, totalGoals = 0 }) {

  const remainder = totalIncome - totalExpenses - totalGoals;

  let remainderColor = 'text-mainTextColor dark:text-mainTextColor';
  if (remainder > 0) {
    remainderColor = 'text-success dark:text-success';
  } else if (remainder < 0) {
    remainderColor = 'text-accentRed dark:text-accentRed';
  }

  const itemStyle = "flex-1 min-w-[120px] px-1 dark:bg-cardColor rounded-md shadow-sm dark:border-borderColor";
  const labelStyle = "text-sm font-semibold text-white dark:text-textColor tracking-wider";
  const valueStyle = "text-sm font-semibold text-white dark:text-white";

  return (
    <div className="flex flex-wrap items-center gap-4 bg-contentBg dark:bg-sidebarBg rounded-lg">
      <div className={`${itemStyle} bg-success`}>
        <div className={`${labelStyle}`}>Доходы</div>
        <div className={`${valueStyle} text-success dark:text-success`}>
          {totalIncome}
        </div>
      </div>

      <div className={`${itemStyle} bg-accentRed`}>
        <div className={`${labelStyle}`}>Расходы</div>
        <div className={`${valueStyle} text-accentRed dark:text-accentRed`}>
          {totalExpenses}
        </div>
      </div>
      
      <div className={`${itemStyle} bg-accentYellow`}>
        <div className={`${labelStyle}`}>Цели</div>
        <div className={`${valueStyle} text-primary dark:text-primary`}>
          {totalGoals}
        </div>
      </div>

      <div className={`${itemStyle} bg-presenting`}>
        <div className={labelStyle}>Остаток</div>
        <div className={`${valueStyle} ${remainderColor}`}>
          {remainder}
        </div>
      </div>
    </div>
  );
};

