import { Navigate, Outlet, useLocation } from 'react-router-dom'
import { useQueryClient } from '@tanstack/react-query'
import { useEffect, useState } from 'react'
import { supabase } from '@/lib/supabase'

export default function ProtectedRoute() {
  const queryClient = useQueryClient();
  const location = useLocation();
  const [loading, setLoading] = useState(true);
  const [user, setUser] = useState<{ id?: string; email?: string } | null>(
    queryClient.getQueryData(['user']) as { id?: string; email?: string } | null
  );

  useEffect(() => {
    const checkUser = async () => {
      const cachedUser = queryClient.getQueryData(['user']) as { id?: string; email?: string } | null;
      
      if (cachedUser) {
        const { data: sessionData } = await supabase.auth.getSession();
        const currentUser = sessionData?.session?.user;
        
        if (currentUser) {
          queryClient.setQueryData(['user'], currentUser);
          setUser(currentUser);
        } else {
          queryClient.removeQueries({ queryKey: ['user'] });
          setUser(null);
        }
      } else {
        const { data: sessionData } = await supabase.auth.getSession();
        const currentUser = sessionData?.session?.user;
        
        if (currentUser) {
          queryClient.setQueryData(['user'], currentUser);
          setUser(currentUser);
        } else {
          setUser(null);
        }
      }
      
      setLoading(false);
    };

    checkUser();
  }, [queryClient]);

  useEffect(() => {
    const loadScenarioData = async () => {
      const cachedScenario = queryClient.getQueryData(['currentScenario']);
      const cachedUser = queryClient.getQueryData(['user']) as { id?: string } | null;
      
      if (!cachedScenario && cachedUser?.id) {
        const { data: profileCtx } = await supabase
          .from('profiles')
          .select(`
            current_scenario_id,
            current_scenario_slug,
            current_scenario:scenarios!profiles_current_scenario_fkey (
              id,
              slug,
              base_currency
            )
          `)
          .eq('id', cachedUser.id)
          .maybeSingle();
        
        if (profileCtx) {
          const currentScenarioData = Array.isArray(profileCtx.current_scenario)
            ? profileCtx.current_scenario[0] ?? null
            : profileCtx.current_scenario ?? null;
          
          queryClient.setQueryData(['currentScenario'], {
            id: profileCtx.current_scenario_id ?? null,
            slug: profileCtx.current_scenario_slug ?? null,
            baseCurrency: currentScenarioData?.base_currency ?? null,
          });
        }
      }
    };
    
    if (user) {
      loadScenarioData();
    }
  }, [user, queryClient]);

  if (loading) return null;

  if (!user) return <Navigate to="/auth" replace state={{ from: location }} />

  return <Outlet />
}
