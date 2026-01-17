import { Outlet, useParams, useNavigate } from 'react-router-dom';
import { useEffect, useState } from 'react';
import { useUser } from '@/shared/hooks/useUser';
import { useScenario } from '@/shared/hooks/useScenario';
import { useTranslation } from '@/shared/i18n';

export default function ScenarioRouteGuard() {
  const { scenarioSlug } = useParams<{ scenarioSlug: string }>();
  const navigate = useNavigate();
  const { user } = useUser();
  const { currentScenario, allScenarios, loading } = useScenario();
  const [validating, setValidating] = useState(false);
  const { t } = useTranslation('components');

  const redirectToCurrentScenario = (targetSlug: string) => {
    const currentPath = window.location.pathname;
    const pathWithoutSlug = currentPath.replace(/^\/[^/]+/, '') || '/income';
    navigate(`/${targetSlug}${pathWithoutSlug}`, { replace: true });
  };

  useEffect(() => {
    if (loading) return;

    if (!scenarioSlug) {
      if (currentScenario?.slug) {
        redirectToCurrentScenario(currentScenario.slug);
      } else {
        navigate('/404', { replace: true });
      }
      return;
    }

    if (!currentScenario || !user?.id) return;

    if (scenarioSlug === currentScenario.slug) {
      setValidating(false);
      return;
    }

    setValidating(true);
    const isValidScenario = allScenarios.some(s => s.slug === scenarioSlug);
    
    if (!isValidScenario) {
      // Invalid scenario - redirect to current
      redirectToCurrentScenario(currentScenario.slug);
      return;
    }

    // Valid scenario but different from current - redirect to current
    redirectToCurrentScenario(currentScenario.slug);
  }, [scenarioSlug, currentScenario, allScenarios, user, loading, navigate]);

  if (loading) {
    return (
      <div className="flex items-center justify-center min-h-screen">
        <div>{t('scenarioRouteGuard.loadingCurrentScenario')}</div>
      </div>
    );
  }

  if (validating) {
    return (
      <div className="flex items-center justify-center min-h-screen">
        <div>{t('scenarioRouteGuard.validatingScenario')}</div>
      </div>
    );
  }

  return <Outlet />;
}
