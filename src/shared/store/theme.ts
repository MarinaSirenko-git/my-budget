import {create} from 'zustand';

type Theme = 'light' | 'dark';
type Store = {
    theme: Theme;
    setTheme: (t: Theme) => void;
    toggle: () => void;
    init: () => void;
}

export const useTheme = create<Store>((set, get) => ({
    theme: 'light',
    setTheme: (t) => {
      set({ theme: t });
      const root = document.documentElement;
      root.classList.toggle('dark', t === 'dark');
      localStorage.setItem('theme', t);
    },
    toggle: () => get().setTheme(get().theme === 'light' ? 'dark' : 'light'),
    init: () => {
      const saved = (localStorage.getItem('theme') as Theme | null);
      const system: Theme = window.matchMedia('(prefers-color-scheme: dark)').matches ? 'dark' : 'light';
      get().setTheme(saved ?? system);
    },
  }));