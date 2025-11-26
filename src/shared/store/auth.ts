// init session and scenario id/slug on app start
import { create } from 'zustand';
import type { Session, User } from '@supabase/supabase-js'
import { supabase } from '@/lib/supabase'
import { reportErrorToTelegram } from '../utils/errorReporting';
import { createSlug } from '@/shared/utils/slug';

type AuthState = {
    user: User | null
    session: Session | null
    loading: boolean
    currentScenarioId: string | null
    currentScenarioSlug: string | null
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
    set: (p) => set(p),
  
    init: async () => {
      const handleAuthStateChange = async (session: Session | null) => {
        const user = session?.user ?? null;
        set({ session, user, loading: false });
        if (user) {
          await get().loadCurrentScenarioId();
        } else {
          set({ currentScenarioId: null, currentScenarioSlug: null });
        }
      };

      supabase.auth.onAuthStateChange(async (_event, session) => {
        await handleAuthStateChange(session);
      });

      const { data: { session } } = await supabase.auth.getSession();
      await handleAuthStateChange(session);
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
