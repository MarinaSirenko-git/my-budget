import { useState, useEffect, useMemo } from 'react';
import { MapPinIcon } from '@heroicons/react/24/outline';
import { useNavigate } from 'react-router-dom';
import { useAuth } from '@/shared/store/auth';
import SelectInput from '@/shared/ui/form/SelectInput';
import { createSlug } from '@/shared/utils/slug';
import { reportErrorToTelegram } from '@/shared/utils/errorReporting';
import { loadUserScenarios, updateCurrentScenario, type Scenario } from '@/shared/utils/scenarios';

const PLACE_NAME_STORAGE_KEY = 'user_place_name';
const DEFAULT_PLACE_NAME = 'Phuket';

function getPlaceNameFromScenario(
  scenarios: Scenario[],
  currentScenarioId: string | null
): string {
  if (currentScenarioId) {
    const currentScenario = scenarios.find(s => s.id === currentScenarioId);
    if (currentScenario) {
      localStorage.setItem(PLACE_NAME_STORAGE_KEY, currentScenario.name);
      return currentScenario.name;
    }
  }
  
  const savedPlaceName = localStorage.getItem(PLACE_NAME_STORAGE_KEY);
  return savedPlaceName || DEFAULT_PLACE_NAME;
}

export default function PlaceName() {
  const navigate = useNavigate();
  const { user, currentScenarioId, setCurrentScenarioId, loadCurrentScenarioId, loadCurrentScenarioSlug } = useAuth();
  const [placeName, setPlaceName] = useState(DEFAULT_PLACE_NAME);
  const [scenarios, setScenarios] = useState<Scenario[]>([]);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    async function loadScenarios() {
      const allScenarios = await loadUserScenarios(user!.id);
      
      if (allScenarios) {
        setScenarios(allScenarios);
        const placeNameFromScenario = getPlaceNameFromScenario(allScenarios, currentScenarioId);
        setPlaceName(placeNameFromScenario);
      } else {
        const savedPlaceName = localStorage.getItem(PLACE_NAME_STORAGE_KEY);
        if (savedPlaceName) {
          setPlaceName(savedPlaceName);
        }
      }
      
      setLoading(false);
    }

    loadScenarios();
  }, [user, currentScenarioId]);

  useEffect(() => {
    const handleStorageChange = (e: StorageEvent) => {
      if (e.key === PLACE_NAME_STORAGE_KEY && e.newValue) {
        setPlaceName(e.newValue);
      }
    };

    window.addEventListener('storage', handleStorageChange);
    
    const handleCustomStorageChange = () => {
      const savedPlaceName = localStorage.getItem(PLACE_NAME_STORAGE_KEY);
      if (savedPlaceName) {
        setPlaceName(savedPlaceName);
      }
    };

    window.addEventListener('placeNameChanged', handleCustomStorageChange);
    
    const handleScenarioChanged = async () => {
      const allScenarios = await loadUserScenarios(user!.id);
      
      if (allScenarios) {
        setScenarios(allScenarios);
        const placeNameFromScenario = getPlaceNameFromScenario(allScenarios, currentScenarioId);
        setPlaceName(placeNameFromScenario);
      }
    };

    window.addEventListener('scenarioChanged', handleScenarioChanged);

    return () => {
      window.removeEventListener('storage', handleStorageChange);
      window.removeEventListener('placeNameChanged', handleCustomStorageChange);
      window.removeEventListener('scenarioChanged', handleScenarioChanged);
    };
  }, [user, currentScenarioId]);

  const scenarioOptions = useMemo(() => {
    return scenarios.map(scenario => ({
      label: scenario.name,
      value: scenario.id,
    }));
  }, [scenarios]);

  const handleScenarioChange = async (scenarioId: string) => {
    if (scenarioId === currentScenarioId) return;

    try {
      const success = await updateCurrentScenario(user!.id, scenarioId);
      
      if (!success) {
        return;
      }

      setCurrentScenarioId(scenarioId);
      await loadCurrentScenarioId();
      await loadCurrentScenarioSlug();

      const selectedScenario = scenarios.find(s => s.id === scenarioId);
      if (selectedScenario) {
        const slug = createSlug(selectedScenario.name);
        const currentPath = window.location.pathname;
        const pathWithoutSlug = currentPath.replace(/^\/[^/]+/, '') || '/goals';
        navigate(`/${slug}${pathWithoutSlug}`, { replace: true });
      }

      window.dispatchEvent(new Event('scenarioChanged'));
    } catch (err) {
      await reportErrorToTelegram({
        action: 'handleScenarioChange',
        error: err,
        userId: user!.id,
        context: { scenarioId },
      });
    }
  };

  const hasMultipleScenarios = scenarios.length > 1;

  if (loading) {
    return (
      <h1 className="text-md text-mainTextColor dark:text-white flex items-center gap-1">
        <MapPinIcon className="w-5 h-5" />
        {placeName}
      </h1>
    );
  }

  if (hasMultipleScenarios) {
    return (
      <div className="flex items-center gap-1">
        <MapPinIcon className="w-5 h-5 text-mainTextColor dark:text-white" />
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
    <h1 className="text-md text-mainTextColor dark:text-white flex items-center gap-1">
      <MapPinIcon className="w-5 h-5" />
      {placeName}
    </h1>
  );
}

