import { useState, useEffect, useMemo} from 'react';
import { MapPinIcon } from '@heroicons/react/24/outline';
import { useNavigate } from 'react-router-dom';
import { useQueryClient } from '@tanstack/react-query';
import SelectInput from '@/shared/ui/form/SelectInput';
import { reportErrorToTelegram } from '@/shared/utils/errorReporting';
import { loadUserScenarios, updateCurrentScenario, type Scenario } from '@/shared/utils/scenarios';


function getPlaceNameFromScenario(
  scenarios: Scenario[],
  currentScenarioId: string | null
): string {
  const currentScenario = scenarios.find(s => s.id === currentScenarioId);
  return currentScenario?.name || '';
}

export default function PlaceName() {
  const navigate = useNavigate();
  const queryClient = useQueryClient();
  const user = queryClient.getQueryData(['user']) as { id?: string; email?: string } | null;
  const currentScenario = queryClient.getQueryData(['currentScenario']) as { 
    id?: string | null; 
    slug?: string | null; 
    baseCurrency?: string | null;
  } | null;
  const currentScenarioId = currentScenario?.id ?? null;
  const currentScenarioSlug = currentScenario?.slug ?? null;
  const setCurrentScenarioId = (scenarioId: string) => {
    queryClient.setQueryData(['currentScenario'], {
      id: scenarioId,
      slug: currentScenarioSlug,
      baseCurrency: currentScenario?.baseCurrency ?? null,
    });
  };
  const [placeName, setPlaceName] = useState('');
  const [scenarios, setScenarios] = useState<Scenario[]>([]);
  const [loading, setLoading] = useState(true);

  const scenarioOptions = useMemo(() => {
    return scenarios.map(scenario => ({
      label: scenario.name,
      value: scenario.id,
    }));
  }, [scenarios]);

  useEffect(() => {
    async function loadScenarios() {
      if (!user?.id) return;
      const allScenarios = await loadUserScenarios(user.id) || [];

      setScenarios(allScenarios);
      const placeNameFromScenario = getPlaceNameFromScenario(allScenarios, currentScenarioId);
      setPlaceName(placeNameFromScenario);

      setLoading(false);
    }

    loadScenarios();
  }, [user, currentScenarioId, currentScenarioSlug]);


  const handleScenarioChange = async (scenarioId: string) => {
    if (scenarioId === currentScenarioId) return;
    if (!user?.id) return;

    try {
      const success = await updateCurrentScenario(user.id, scenarioId);
      if (!success) throw new Error('Failed to update current scenario');

      setCurrentScenarioId(scenarioId);

      const selectedScenario = scenarios.find(s => s.id === scenarioId);
      if (selectedScenario) {
        const slug = selectedScenario.slug;
        const currentPath = window.location.pathname;
        const pathWithoutSlug = currentPath.replace(/^\/[^/]+/, '') || '/income';
        navigate(`/${slug}${pathWithoutSlug}`, { replace: true });
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

  const hasMultipleScenarios = scenarios.length > 1;

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

