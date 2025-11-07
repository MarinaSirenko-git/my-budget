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
      navigate('/goals', { replace: true });
    })();
  }, [navigate]);

  return <p>Signing you in…</p>;
}