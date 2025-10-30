import { CurrencyDollarIcon } from '@heroicons/react/24/outline';

export default function ScenarioSwitch() {
  const handleAddScenario = () => {
    // TODO: Implement add scenario functionality
    console.log('Add new scenario clicked');
  };

  return (
    <button
      onClick={handleAddScenario}
      className="text-md font-base text-[#1E293B] dark:text-[#F8FAFC] flex items-center gap-2"
    >
      <CurrencyDollarIcon className="w-5 h-5" />
      Recalculate for another city
    </button>
  );
}

