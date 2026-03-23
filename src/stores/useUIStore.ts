'use client';

import { create } from 'zustand';
import { persist } from 'zustand/middleware';

interface UIState {
  sidebarCollapsed: boolean;
  theme: 'light' | 'dark' | 'system';
  scenesView: 'list' | 'grid' | 'timeline';
  preferredAiProvider: string | null;
  chatPanelOpen: boolean;
  chatPanelWidth: number;
  chatExpanded: boolean;
  workspaceModalOpen: boolean;
  settingsModalOpen: boolean;
  settingsSection: string;

  toggleSidebar: () => void;
  setSidebarCollapsed: (collapsed: boolean) => void;
  setTheme: (theme: 'light' | 'dark' | 'system') => void;
  setScenesView: (view: 'list' | 'grid' | 'timeline') => void;
  setPreferredAiProvider: (provider: string | null) => void;
  toggleChat: () => void;
  expandChat: () => void;
  collapseChat: () => void;
  setChatWidth: (w: number) => void;
  openWorkspaceModal: () => void;
  closeWorkspaceModal: () => void;
  openSettingsModal: (section?: string) => void;
  closeSettingsModal: () => void;
}

export const useUIStore = create<UIState>()(
  persist(
    (set) => ({
      sidebarCollapsed: false,
      theme: 'system',
      scenesView: 'list',
      preferredAiProvider: null,
      chatPanelOpen: false,
      chatPanelWidth: 400,
      chatExpanded: false,
      workspaceModalOpen: false,
      settingsModalOpen: false,
      settingsSection: 'perfil',

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
      toggleChat: () => set((s) => ({ chatPanelOpen: !s.chatPanelOpen, chatExpanded: false })),
      expandChat: () => set({ chatExpanded: true, chatPanelOpen: false }),
      collapseChat: () => set({ chatExpanded: false, chatPanelOpen: true }),
      setChatWidth: (chatPanelWidth) => set({ chatPanelWidth }),
      openWorkspaceModal: () => set({ workspaceModalOpen: true }),
      closeWorkspaceModal: () => set({ workspaceModalOpen: false }),
      openSettingsModal: (section = 'perfil') => set({ settingsModalOpen: true, settingsSection: section }),
      closeSettingsModal: () => set({ settingsModalOpen: false }),
    }),
    {
      name: 'kiyoko-ui',
      partialize: (state) => ({
        sidebarCollapsed: state.sidebarCollapsed,
        theme: state.theme,
        scenesView: state.scenesView,
        preferredAiProvider: state.preferredAiProvider,
        chatPanelWidth: state.chatPanelWidth,
        chatPanelOpen: state.chatPanelOpen,
        chatExpanded: state.chatExpanded,
      }),
    }
  )
);
