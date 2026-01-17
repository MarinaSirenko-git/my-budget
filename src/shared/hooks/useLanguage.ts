import { useQuery } from '@tanstack/react-query';
import { supabase } from '@/lib/supabase';

export type Language = 'ru' | 'en' | null;

async function fetchLanguage(): Promise<Language> {
  const { data: profile, error } = await supabase
    .from('profiles')
    .select('language')
    .maybeSingle();

  if (error || !profile?.language) {
    return null;
  }

  const normalized = profile.language.toLowerCase().trim();
  return normalized === 'ru' ? 'ru' : normalized === 'en' ? 'en' : null;
}

export function useLanguage() {
  const { data: language, isLoading: loading, error } = useQuery<Language>({
    queryKey: ['language'],
    queryFn: fetchLanguage,
    
    staleTime: 1000 * 60 * 10, // 10 minutes
    gcTime: 1000 * 60 * 30, // 30 minutes
    
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
    language: language ?? null,
    loading,
    error,
  };
}

