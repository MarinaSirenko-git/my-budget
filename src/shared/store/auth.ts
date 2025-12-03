// init session and scenario id/slug on app start
import { create } from 'zustand';
import type { Session, User, AuthChangeEvent } from '@supabase/supabase-js'
import { supabase } from '@/lib/supabase'
import { reportErrorToTelegram } from '../utils/errorReporting';

type AuthState = {
    user: User | null
    session: Session | null
    loading: boolean
    currentScenarioId: string | null
    currentScenarioSlug: string | null
    initialized: boolean
    set: (p: Partial<AuthState>) => void
    init: () => Promise<void>
    signOut: () => Promise<void>
    loadCurrentScenarioData: () => Promise<void>
    setCurrentScenarioId: (scenarioId: string | null) => void
  }

  // Helper function to safely extract error code from unknown error
  function getErrorCode(error: unknown): string | undefined {
    if (error && typeof error === 'object' && 'code' in error) {
      return (error as { code: string }).code;
    }
    return undefined;
  }

  // Helper function to report error with automatic errorCode extraction
  async function reportAuthError(
    action: string,
    error: unknown,
    userId: string,
    additionalContext?: Record<string, any>
  ): Promise<void> {
    await reportErrorToTelegram({
      action,
      error,
      userId,
      context: {
        errorCode: getErrorCode(error),
        ...additionalContext,
      },
    });
  }

  export const useAuth = create<AuthState>((set, get) => ({
    user: null,
    session: null,
    loading: true,
    currentScenarioId: null,
    currentScenarioSlug: null,
    initialized: false,
    set: (p) => set(p),
  
    init: async () => {
      if (get().initialized) {
        return;
      }
      
      const handleAuthStateChange = async (event: AuthChangeEvent, session: Session | null) => {
        try {
          const user = session?.user ?? null;
          const previousUser = get().user;
          
          set({ session, user, loading: false });
          
          if (event === 'TOKEN_REFRESHED') return;
          if (event === 'SIGNED_OUT') {
            set({ currentScenarioId: null, currentScenarioSlug: null });
            return;
          }
          
          if (user) {
            if (!previousUser || previousUser.id !== user.id) {
              await get().loadCurrentScenarioData();
            }
          } else {
            set({ currentScenarioId: null, currentScenarioSlug: null });
          }
        } catch (error) {
          set({ loading: false });
          const currentUser = get().user;
          if (currentUser) {
            await reportAuthError('handleAuthStateChange', error, currentUser.id, { event });
          }
        }
      };

      supabase.auth.onAuthStateChange(async (event, session) => {
        await handleAuthStateChange(event, session);
      });

      set({ initialized: true });
    },

    loadCurrentScenarioData: async () => {
      const { user } = get();
      if (!user) {
        set({ currentScenarioId: null, currentScenarioSlug: null });
        return;
      }

      try {
        const { data, error } = await supabase
          .from('profiles')
          .select('current_scenario_id, current_scenario_slug')
          .eq('id', user.id)
          .single();
        if (error && error.code !== 'PGRST116') {
          await reportAuthError('loadCurrentScenarioData', error, user.id);
          // set({ currentScenarioId: null, currentScenarioSlug: null });
          return;
        }

        const scenarioId = data?.current_scenario_id;
        const scenarioSlug = data?.current_scenario_slug;
        set({ currentScenarioId: scenarioId, currentScenarioSlug: scenarioSlug });

      } catch (error) {
        await reportAuthError('loadCurrentScenarioData', error, user.id);
        // set({ currentScenarioId: null, currentScenarioSlug: null });
      }
    },

    setCurrentScenarioId: (scenarioId: string | null) => {
      set({ currentScenarioId: scenarioId });
    },
  
    signOut: async () => {
      await supabase.auth.signOut();
      set({ currentScenarioId: null, currentScenarioSlug: null });
    }
  }))
