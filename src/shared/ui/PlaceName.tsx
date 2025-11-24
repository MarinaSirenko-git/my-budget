import { useState, useEffect, useMemo } from 'react';
import { MapPinIcon } from '@heroicons/react/24/outline';
import { useNavigate } from 'react-router-dom';
import { useAuth } from '@/shared/store/auth';
import { supabase } from '@/lib/supabase';
import SelectInput from '@/shared/ui/form/SelectInput';
import { createSlug } from '@/shared/utils/slug';

const PLACE_NAME_STORAGE_KEY = 'user_place_name';
const DEFAULT_PLACE_NAME = 'Phuket';

interface Scenario {
  id: string;
  name: string;
}

export default function PlaceName() {
  const navigate = useNavigate();
  const { user, currentScenarioId, setCurrentScenarioId, loadCurrentScenarioId, loadCurrentScenarioSlug } = useAuth();
  const [placeName, setPlaceName] = useState(DEFAULT_PLACE_NAME);
  const [scenarios, setScenarios] = useState<Scenario[]>([]);
  const [loading, setLoading] = useState(true);

  // Load all scenarios and current scenario name from database
  useEffect(() => {
    async function loadScenarios() {
      if (!user) {
        setLoading(false);
        // Fallback to localStorage if no user
        const savedPlaceName = localStorage.getItem(PLACE_NAME_STORAGE_KEY);
        if (savedPlaceName) {
          setPlaceName(savedPlaceName);
        }
        return;
      }

      try {
        // Загружаем все сценарии пользователя
        const { data: allScenarios, error: scenariosError } = await supabase
          .from('scenarios')
          .select('id, name')
          .eq('user_id', user.id)
          .order('created_at', { ascending: false });

        if (scenariosError) {
          console.error('Error loading scenarios:', scenariosError);
          setLoading(false);
          return;
        }

        if (allScenarios) {
          setScenarios(allScenarios);

          // Загружаем имя текущего сценария
          if (currentScenarioId) {
            const currentScenario = allScenarios.find(s => s.id === currentScenarioId);
            if (currentScenario) {
              setPlaceName(currentScenario.name);
              localStorage.setItem(PLACE_NAME_STORAGE_KEY, currentScenario.name);
            } else {
              // Fallback to localStorage if scenario not found
              const savedPlaceName = localStorage.getItem(PLACE_NAME_STORAGE_KEY);
              if (savedPlaceName) {
                setPlaceName(savedPlaceName);
              }
            }
          } else {
            // Fallback to localStorage if no current scenario
            const savedPlaceName = localStorage.getItem(PLACE_NAME_STORAGE_KEY);
            if (savedPlaceName) {
              setPlaceName(savedPlaceName);
            }
          }
        }
      } catch (err) {
        console.error('Error loading scenarios:', err);
        // Fallback to localStorage on error
        const savedPlaceName = localStorage.getItem(PLACE_NAME_STORAGE_KEY);
        if (savedPlaceName) {
          setPlaceName(savedPlaceName);
        }
      } finally {
        setLoading(false);
      }
    }

    loadScenarios();
  }, [user, currentScenarioId]);

  // Listen for storage changes to update when changed from Settings page
  useEffect(() => {
    const handleStorageChange = (e: StorageEvent) => {
      if (e.key === PLACE_NAME_STORAGE_KEY && e.newValue) {
        setPlaceName(e.newValue);
      }
    };

    window.addEventListener('storage', handleStorageChange);
    
    // Also listen for custom event for same-window updates
    const handleCustomStorageChange = () => {
      const savedPlaceName = localStorage.getItem(PLACE_NAME_STORAGE_KEY);
      if (savedPlaceName) {
        setPlaceName(savedPlaceName);
      }
    };

    window.addEventListener('placeNameChanged', handleCustomStorageChange);
    
    // Listen for scenario change event
    const handleScenarioChanged = async () => {
      // Reload scenarios and scenario name when scenario changes
      if (user) {
        const { data: allScenarios, error: scenariosError } = await supabase
          .from('scenarios')
          .select('id, name')
          .eq('user_id', user.id)
          .order('created_at', { ascending: false });

        if (!scenariosError && allScenarios) {
          setScenarios(allScenarios);
          
          if (currentScenarioId) {
            const currentScenario = allScenarios.find(s => s.id === currentScenarioId);
            if (currentScenario) {
              setPlaceName(currentScenario.name);
              localStorage.setItem(PLACE_NAME_STORAGE_KEY, currentScenario.name);
            }
          }
        }
      }
    };

    window.addEventListener('scenarioChanged', handleScenarioChanged);

    return () => {
      window.removeEventListener('storage', handleStorageChange);
      window.removeEventListener('placeNameChanged', handleCustomStorageChange);
      window.removeEventListener('scenarioChanged', handleScenarioChanged);
    };
  }, [user, currentScenarioId]);

  // Prepare options for select
  const scenarioOptions = useMemo(() => {
    return scenarios.map(scenario => ({
      label: scenario.name,
      value: scenario.id,
    }));
  }, [scenarios]);

  // Handle scenario selection
  const handleScenarioChange = async (scenarioId: string) => {
    if (!user || scenarioId === currentScenarioId) return;

    try {
      // Обновляем current_scenario_id в profiles
      const { error: updateError } = await supabase
        .from('profiles')
        .update({ current_scenario_id: scenarioId })
        .eq('id', user.id);

      if (updateError) {
        console.error('Error updating current scenario:', updateError);
        return;
      }

      // Обновляем store
      setCurrentScenarioId(scenarioId);
      await loadCurrentScenarioId();
      await loadCurrentScenarioSlug();

      // Получаем имя выбранного сценария для генерации slug
      const selectedScenario = scenarios.find(s => s.id === scenarioId);
      if (selectedScenario) {
        const slug = createSlug(selectedScenario.name);
        const currentPath = window.location.pathname;
        const pathWithoutSlug = currentPath.replace(/^\/[^/]+/, '') || '/goals';
        navigate(`/${slug}${pathWithoutSlug}`, { replace: true });
      }

      // Отправляем событие для обновления UI
      window.dispatchEvent(new Event('scenarioChanged'));
    } catch (err) {
      console.error('Error switching scenario:', err);
    }
  };

  // Show select if more than one scenario, otherwise show text
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

