// init session and scenario id/slug on app start
import { create } from 'zustand';
import type { Session, User, AuthChangeEvent } from '@supabase/supabase-js'
import { supabase } from '@/lib/supabase'
import { reportErrorToTelegram } from '../utils/errorReporting';
import { createSlug } from '@/shared/utils/slug';

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
    loadCurrentScenarioId: () => Promise<void>
    loadCurrentScenarioSlug: () => Promise<void>
    setCurrentScenarioId: (scenarioId: string | null) => void
    getScenarioIdBySlug: (slug: string) => Promise<string | null>
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
      // check if already initialized
      if (get().initialized) {
        return;  // return if already initialized (avoid double initialization)
      }

      const handleAuthStateChange = async (event: AuthChangeEvent, session: Session | null) => {
        try {
          const user = session?.user ?? null;
          const previousUser = get().user;
          
          // Always update session and user, and set loading to false
          set({ session, user, loading: false });
          
          // Handle different events differently
          if (event === 'TOKEN_REFRESHED') {
            // Token was refreshed - no need to reload scenario data
            // Just update session and user, loading is already set to false
            return;
          }
          
          if (event === 'SIGNED_OUT') {
            // User signed out - clear scenario data
            set({ currentScenarioId: null, currentScenarioSlug: null });
            return;
          }
          
          if (event === 'INITIAL_SESSION') {
            // Initial session - load scenario data only if user exists
            if (user) {
              await get().loadCurrentScenarioId();
            } else {
              set({ currentScenarioId: null, currentScenarioSlug: null });
            }
            return;
          }
          
          // For SIGNED_IN and other events, check if user changed
          if (user) {
            // Only reload scenario data if user actually changed
            if (!previousUser || previousUser.id !== user.id) {
              await get().loadCurrentScenarioId();
            }
          } else {
            set({ currentScenarioId: null, currentScenarioSlug: null });
          }
        } catch (error) {
          // Ensure loading is always set to false even on error
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

      set({ initialized: true });  // mark as initialized
    },

    loadCurrentScenarioId: async () => {
      const { user } = get();
      if (!user) {
        set({ currentScenarioId: null, currentScenarioSlug: null });
        return;
      }

      try {
        const { data, error } = await supabase
          .from('profiles')
          .select('current_scenario_id')
          .eq('id', user.id)
          .single();

        if (error && error.code !== 'PGRST116') {
          await reportAuthError('loadCurrentScenarioId', error, user.id);
          set({ currentScenarioId: null, currentScenarioSlug: null });
          return;
        }

        const scenarioId = data?.current_scenario_id ?? null;
        set({ currentScenarioId: scenarioId });

        if (scenarioId) {
          await get().loadCurrentScenarioSlug();
        } else {
          set({ currentScenarioSlug: null });
        }
      } catch (error) {
        await reportAuthError('loadCurrentScenarioId', error, user.id);
        set({ currentScenarioId: null, currentScenarioSlug: null });
      }
    },

    loadCurrentScenarioSlug: async () => {
      const { user, currentScenarioId } = get();
      if (!user || !currentScenarioId) {
        set({ currentScenarioSlug: null });
        return;
      }

      try {
        const { data, error } = await supabase
          .from('scenarios')
          .select('name')
          .eq('id', currentScenarioId)
          .eq('user_id', user.id)
          .single();

        if (error) {
          await reportAuthError('loadCurrentScenarioSlug', error, user.id);
          set({ currentScenarioSlug: null });
          return;
        }

        if (data?.name) {
          const slug = createSlug(data.name);
          set({ currentScenarioSlug: slug });
        } else {
          set({ currentScenarioSlug: null });
        }
      } catch (error) {
        await reportAuthError('loadCurrentScenarioSlug', error, user.id);
        set({ currentScenarioSlug: null });
      }
    },

    getScenarioIdBySlug: async (slug: string) => {
      const { user } = get();
      if (!user || !slug) {
        return null;
      }

      try {
        const { data: scenarios, error } = await supabase
          .from('scenarios')
          .select('id, name')
          .eq('user_id', user.id);

        if (error) {
          await reportAuthError('getScenarioIdBySlug', error, user.id, { slug });
          return null;
        }

        const matchingScenario = scenarios?.find(scenario => {
          const scenarioSlug = createSlug(scenario.name);
          return scenarioSlug === slug;
        });

        return matchingScenario?.id ?? null;
      } catch (error) {
        await reportAuthError('getScenarioIdBySlug', error, user.id, { slug });
        return null;
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
