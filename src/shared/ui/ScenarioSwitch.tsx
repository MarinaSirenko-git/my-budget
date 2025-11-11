import { CurrencyDollarIcon } from '@heroicons/react/24/outline';

export default function ScenarioSwitch() {
  const handleAddScenario = () => {
    // TODO: Implement add scenario functionality
    console.log('Add new scenario clicked');
  };

  return (
    <button
      onClick={handleAddScenario}
      className="text-md text-mainTextColor dark:text-[#F8FAFC] flex items-center gap-1"
    >
      <CurrencyDollarIcon className="w-5 h-5" />
      Создать альтернативный сценарий
    </button>
  );
}

