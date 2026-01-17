import { Outlet, useParams, useNavigate } from 'react-router-dom';
import { useEffect, useState } from 'react';
import { useQueryClient } from '@tanstack/react-query';
import { validateScenarioBySlug } from '@/shared/utils/scenarios';
import { useTranslation } from '@/shared/i18n';

export default function ScenarioRouteGuard() {
  const { scenarioSlug } = useParams<{ scenarioSlug: string }>();
  const navigate = useNavigate();
  const queryClient = useQueryClient();
  const loading = false;
  const user = queryClient.getQueryData(['user']) as { id?: string; email?: string } | null;
  const currentScenario = queryClient.getQueryData(['currentScenario']) as { 
    id?: string | null; 
    slug?: string | null; 
    baseCurrency?: string | null;
  } | null;
  const currentScenarioSlug = currentScenario?.slug ?? null;
  const [validating, setValidating] = useState(false);
  const { t } = useTranslation('components');

  const redirectToCurrentScenario = (targetSlug: string) => {
    const currentPath = window.location.pathname;
    const pathWithoutSlug = currentPath.replace(/^\/[^/]+/, '') || '/income';
    navigate(`/${targetSlug}${pathWithoutSlug}`, { replace: true });
  };

  useEffect(() => {

    if (!scenarioSlug) {
      if (currentScenarioSlug) {
        redirectToCurrentScenario(currentScenarioSlug);
      } else {
        navigate('/404', { replace: true });
      }
      return;
    }

    if (!currentScenarioSlug) return;
    if (!user?.id) return;

    const slug = scenarioSlug;
    const userId = user.id;
    const currentSlug = currentScenarioSlug;

    async function validateScenario() {
      setValidating(true);
      
      try {
        const scenarioId = await validateScenarioBySlug(slug, userId);
        
        if (!scenarioId) {
          redirectToCurrentScenario(currentSlug);
          return;
        }
        
        if (slug !== currentSlug) {
          redirectToCurrentScenario(currentSlug);
          return;
        }
        
        setValidating(false);
      } catch (error) {
        redirectToCurrentScenario(currentSlug);
      }
    }

    validateScenario();
  }, [scenarioSlug, user, currentScenarioSlug, navigate]);

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
