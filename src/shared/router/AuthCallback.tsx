import { useEffect } from 'react';
import { supabase } from '@/lib/supabase';
import { useNavigate } from 'react-router-dom';

export default function AuthCallback() {
  const navigate = useNavigate();

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

      navigate('/goals', { replace: true });
    })();
  }, [navigate]);

  return <p>Signing you in…</p>;
}