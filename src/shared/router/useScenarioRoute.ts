import { useParams } from 'react-router-dom';
import { useAuth } from '@/shared/store/auth';


export function useScenarioRoute() {
  const { scenarioSlug } = useParams<{ scenarioSlug: string }>();
  const currentScenarioId = useAuth(s => s.currentScenarioId);
  return {
    scenarioSlug: scenarioSlug || null,
    scenarioId: currentScenarioId,
    loading: false,
    error: null,
  };
}

