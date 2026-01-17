import { useQuery } from '@tanstack/react-query';
import { supabase } from '@/lib/supabase';

export type Profile = {
  id: string;
  language: string | null;
  created_at: string;
  current_scenario_id: string | null;
  current_scenario_slug: string | null;
  current_scenario: {
    id: string;
    name: string;
    slug: string;
    base_currency: string;
  } | null;
} | null;

export async function fetchProfile(): Promise<Profile> {
  const { data: profile, error } = await supabase
    .from('profiles')
    .select(`
      id,
      language,
      created_at,
      current_scenario_id,
      current_scenario_slug,
      current_scenario:scenarios!profiles_current_scenario_fkey (
        id,
        name,
        slug,
        base_currency
      )
    `)
    .maybeSingle();

  if (error || !profile) {
    return null;
  }

  // Normalize the joined scenario data
  const currentScenario = Array.isArray(profile.current_scenario)
    ? profile.current_scenario[0] ?? null
    : profile.current_scenario ?? null;

  return {
    ...profile,
    current_scenario: currentScenario,
  };
}

export function useProfile() {
  const { data: profile, isLoading: loading, error } = useQuery<Profile>({
    queryKey: ['profile'],
    queryFn: fetchProfile,
    
    staleTime: 1000 * 60 * 5, // 5 minutes
    gcTime: 1000 * 60 * 10, // 10 minutes
    
    refetchOnMount: 'always',
    refetchOnWindowFocus: false,
    refetchOnReconnect: true,
    
    retry: 1,
    retryDelay: 1000,
    
    networkMode: 'online',
    throwOnError: false,
    structuralSharing: true,
  });

  return {
    profile: profile ?? null,
    loading,
    error,
  };
}

