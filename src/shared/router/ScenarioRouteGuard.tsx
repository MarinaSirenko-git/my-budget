import { Outlet, useParams, useNavigate } from 'react-router-dom';
import { useEffect, useState } from 'react';
import { useAuth } from '@/shared/store/auth';
import { validateScenarioBySlug } from '@/shared/utils/scenarios';
import { useTranslation } from '@/shared/i18n';

export default function ScenarioRouteGuard() {
  const { scenarioSlug } = useParams<{ scenarioSlug: string }>();
  const navigate = useNavigate();
  const loading = useAuth(s => s.loading);
  const user = useAuth(s => s.user);
  const currentScenarioSlug = useAuth(s => s.currentScenarioSlug);
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
      if (currentScenarioSlug) {
        redirectToCurrentScenario(currentScenarioSlug);
      } else {
        navigate('/404', { replace: true });
      }
      return;
    }

    if (!currentScenarioSlug) return;
    if (!user) return;

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
  }, [loading, scenarioSlug, user, currentScenarioSlug, navigate]);

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
