import { create } from 'zustand';
import type { Session, User } from '@supabase/supabase-js'
import { supabase } from '@/lib/supabase'

type AuthState = {
    user: User | null
    session: Session | null
    loading: boolean
    set: (p: Partial<AuthState>) => void
    init: () => Promise<void>
    signOut: () => Promise<void>
  }

  export const useAuth = create<AuthState>((set, get) => ({
    user: null,
    session: null,
    loading: true,
    set: (p) => set(p),
  
    init: async () => {
        supabase.auth.onAuthStateChange((_event, session2) => {
            set({ session: session2, user: session2?.user ?? null, loading: false });
          });
          const { data: { session } } = await supabase.auth.getSession();
          set({ session, user: session?.user ?? null, loading: false });
    },
  
    signOut: async () => {
      await supabase.auth.signOut()
    }
  }))
