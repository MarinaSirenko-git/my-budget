import { useQuery } from '@tanstack/react-query';
import { supabase } from '@/lib/supabase';

export type User = {
  id: string;
  email?: string;
} | null;

export async function fetchUser(): Promise<User> {
  const { data: sessionData } = await supabase.auth.getSession();
  return sessionData?.session?.user ?? null;
}

export function useUser() {
    const { data: user, isLoading: loading, error } = useQuery<User>({
      queryKey: ['user'],
      queryFn: fetchUser,
      
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
    user: user ?? null,
    loading,
    error,
  };
}


