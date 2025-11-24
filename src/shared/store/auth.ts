import { create } from 'zustand';
import type { Session, User } from '@supabase/supabase-js'
import { supabase } from '@/lib/supabase'

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

  export const useAuth = create<AuthState>((set, get) => ({
    user: null,
    session: null,
    loading: true,
    currentScenarioId: null,
    currentScenarioSlug: null,
    set: (p) => set(p),
  
    init: async () => {
        supabase.auth.onAuthStateChange(async (_event, session2) => {
            const user = session2?.user ?? null;
            set({ session: session2, user, loading: false });
            // Загружаем currentScenarioId после установки user
            if (user) {
              await get().loadCurrentScenarioId();
            } else {
              set({ currentScenarioId: null });
            }
          });
          const { data: { session } } = await supabase.auth.getSession();
          const user = session?.user ?? null;
          set({ session, user, loading: false });
          // Загружаем currentScenarioId после установки user
          if (user) {
            await get().loadCurrentScenarioId();
          } else {
            set({ currentScenarioId: null });
          }
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
          console.error('Error loading current scenario ID:', error);
          set({ currentScenarioId: null, currentScenarioSlug: null });
          return;
        }

        const scenarioId = data?.current_scenario_id ?? null;
        set({ currentScenarioId: scenarioId });

        // Загружаем slug для текущего сценария
        if (scenarioId) {
          await get().loadCurrentScenarioSlug();
        } else {
          set({ currentScenarioSlug: null });
        }
      } catch (error) {
        console.error('Error loading current scenario ID:', error);
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
          console.error('Error loading scenario name:', error);
          set({ currentScenarioSlug: null });
          return;
        }

        if (data?.name) {
          const { createSlug } = await import('@/shared/utils/slug');
          const slug = createSlug(data.name);
          set({ currentScenarioSlug: slug });
        } else {
          set({ currentScenarioSlug: null });
        }
      } catch (error) {
        console.error('Error loading current scenario slug:', error);
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
          console.error('Error loading scenarios:', error);
          return null;
        }

        const { createSlug } = await import('@/shared/utils/slug');
        const matchingScenario = scenarios?.find(scenario => {
          const scenarioSlug = createSlug(scenario.name);
          return scenarioSlug === slug;
        });

        return matchingScenario?.id ?? null;
      } catch (error) {
        console.error('Error getting scenario ID by slug:', error);
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
