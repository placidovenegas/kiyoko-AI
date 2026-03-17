'use client';

import { create } from 'zustand';
import { persist } from 'zustand/middleware';

interface UIState {
  sidebarCollapsed: boolean;
  theme: 'light' | 'dark' | 'system';
  scenesView: 'list' | 'grid' | 'timeline';
  preferredAiProvider: string | null;
  toggleSidebar: () => void;
  setSidebarCollapsed: (collapsed: boolean) => void;
  setTheme: (theme: 'light' | 'dark' | 'system') => void;
  setScenesView: (view: 'list' | 'grid' | 'timeline') => void;
  setPreferredAiProvider: (provider: string | null) => void;
}

export const useUIStore = create<UIState>()(
  persist(
    (set) => ({
      sidebarCollapsed: false,
      theme: 'system',
      scenesView: 'list',
      preferredAiProvider: null,
      toggleSidebar: () => set((s) => ({ sidebarCollapsed: !s.sidebarCollapsed })),
      setSidebarCollapsed: (collapsed) => set({ sidebarCollapsed: collapsed }),
      setTheme: (theme) => {
        set({ theme });
        if (typeof document !== 'undefined') {
          document.documentElement.setAttribute('data-theme', theme === 'system' ? '' : theme);
        }
      },
      setScenesView: (scenesView) => set({ scenesView }),
      setPreferredAiProvider: (preferredAiProvider) => set({ preferredAiProvider }),
    }),
    {
      name: 'kiyoko-ui',
      partialize: (state) => ({
        sidebarCollapsed: state.sidebarCollapsed,
        theme: state.theme,
        scenesView: state.scenesView,
        preferredAiProvider: state.preferredAiProvider,
      }),
    }
  )
);
