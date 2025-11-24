import { useEffect } from 'react';
import { supabase } from '@/lib/supabase';
import { useNavigate } from 'react-router-dom';
import { useTranslation } from '@/shared/i18n';
import { useAuth } from '@/shared/store/auth';
import { createSlug } from '@/shared/utils/slug';

export default function AuthCallback() {
  const navigate = useNavigate();
  const { t } = useTranslation('pages');
  const { loadCurrentScenarioId, loadCurrentScenarioSlug } = useAuth();

  useEffect(() => {
    (async () => {
      const { data, error } = await supabase.auth.exchangeCodeForSession(window.location.href);
      if (error) console.error(error);
      if (data) console.log(data);

      const tz = Intl.DateTimeFormat().resolvedOptions().timeZone;
      const loc = navigator.language || 'ru-RU';

      const { data: { user }, error: userError } = await supabase.auth.getUser();
      if (error) { console.error(error); return; }
      if (!user)  { return; }

      await supabase.auth.updateUser({ data: { timezone: tz, locale: loc } });
      await supabase.rpc('set_currency_from_client', { p_timezone: tz, p_locale: loc });

      // Загружаем текущий сценарий и редиректим на его slug
      await loadCurrentScenarioId();
      await loadCurrentScenarioSlug();
      
      const authState = useAuth.getState();
      const currentScenarioId = authState.currentScenarioId;
      const currentScenarioSlug = authState.currentScenarioSlug;
      
      if (currentScenarioId && currentScenarioSlug) {
        navigate(`/${currentScenarioSlug}/goals`, { replace: true });
      } else if (currentScenarioId) {
        // Если slug не загружен, получаем имя сценария
        const { data: scenario, error: scenarioError } = await supabase
          .from('scenarios')
          .select('name')
          .eq('id', currentScenarioId)
          .eq('user_id', user.id)
          .single();

        if (!scenarioError && scenario) {
          const slug = createSlug(scenario.name);
          navigate(`/${slug}/goals`, { replace: true });
        } else {
          navigate('/scenario/goals', { replace: true });
        }
      } else {
        navigate('/scenario/goals', { replace: true });
      }
    })();
  }, [navigate, loadCurrentScenarioId, loadCurrentScenarioSlug]);

  return <p>{t('auth.signingIn')}</p>;
}