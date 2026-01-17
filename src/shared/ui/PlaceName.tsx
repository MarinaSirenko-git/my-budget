import { useMemo } from 'react';
import { MapPinIcon } from '@heroicons/react/24/outline';
import { useNavigate } from 'react-router-dom';
import { useQueryClient } from '@tanstack/react-query';
import SelectInput from '@/shared/ui/form/SelectInput';
import { reportErrorToTelegram } from '@/shared/utils/errorReporting';
import { updateCurrentScenario } from '@/shared/utils/scenarios';
import { useUser } from '@/shared/hooks/useUser';
import { useScenario } from '@/shared/hooks/useScenario';

export default function PlaceName() {
  const navigate = useNavigate();
  const queryClient = useQueryClient();
  const { user } = useUser();
  const { currentScenario, allScenarios, loading } = useScenario();
  
  const placeName = currentScenario?.name || '';
  const currentScenarioId = currentScenario?.id ?? null;

  const scenarioOptions = useMemo(() => {
    return allScenarios.map(scenario => ({
      label: scenario.name,
      value: scenario.id,
    }));
  }, [allScenarios]);


  const handleScenarioChange = async (scenarioId: string) => {
    if (scenarioId === currentScenarioId) return;
    if (!user?.id) return;

    try {
      const success = await updateCurrentScenario(user.id, scenarioId);
      if (!success) throw new Error('Failed to update current scenario');

      // Invalidate scenario caches to refetch with new current scenario
      queryClient.invalidateQueries({ queryKey: ['scenarios', 'current'] });
      queryClient.invalidateQueries({ queryKey: ['profile'] });
      
      // Navigate to the selected scenario's URL
      const selectedScenario = allScenarios.find(s => s.id === scenarioId);
      if (selectedScenario) {
        const currentPath = window.location.pathname;
        const pathWithoutSlug = currentPath.replace(/^\/[^/]+/, '') || '/income';
        navigate(`/${selectedScenario.slug}${pathWithoutSlug}`, { replace: true });
      }
      
      window.dispatchEvent(new Event('scenarioChanged'));
    } catch (err) {
      await reportErrorToTelegram({
        action: 'handleScenarioChange',
        error: err,
        userId: user.id,
        context: { scenarioId },
      });
    }
  };

  const hasMultipleScenarios = allScenarios.length > 1;

  if (loading) {
    return (
      <h1 className="text-md text-mainTextColor dark:text-white flex items-center gap-1">
        {placeName}
      </h1>
    );
  }

  if (hasMultipleScenarios) {
    return (
      <div className="flex items-center gap-1">
        <SelectInput
          value={currentScenarioId || ''}
          options={scenarioOptions}
          onChange={handleScenarioChange}
          className="min-w-[150px]"
        />
      </div>
    );
  }

  return (
    <h1 className="text-sm lg:text-base text-mainTextColor dark:text-white flex items-center gap-1">
      <MapPinIcon className="lg:w-5 lg:h-5 w-3 h-3" />
      {placeName}
    </h1>
  );
}

