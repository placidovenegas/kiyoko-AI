'use client';

import { create } from 'zustand';
import { persist } from 'zustand/middleware';

interface UIState {
  // Sidebar
  sidebarOpen: boolean;
  sidebarCollapsed: boolean; // alias — kept for backwards compat
  // Organization
  currentOrgId: string | null;
  // Theme & view
  theme: 'light' | 'dark' | 'system';
  scenesView: 'list' | 'grid' | 'timeline';
  preferredAiProvider: string | null;
  // Chat
  chatPanelOpen: boolean;
  chatPanelWidth: number;
  chatExpanded: boolean;
  // Modals
  workspaceModalOpen: boolean;
  settingsModalOpen: boolean;
  settingsSection: string;

  // Sidebar
  setSidebarOpen: (open: boolean) => void;
  toggleSidebar: () => void;
  setSidebarCollapsed: (collapsed: boolean) => void;
  // Organization
  setCurrentOrgId: (id: string | null) => void;
  // Theme
  setTheme: (theme: 'light' | 'dark' | 'system') => void;
  setScenesView: (view: 'list' | 'grid' | 'timeline') => void;
  setPreferredAiProvider: (provider: string | null) => void;
  // Chat
  toggleChat: () => void;
  expandChat: () => void;
  collapseChat: () => void;
  setChatWidth: (w: number) => void;
  // Modals
  openWorkspaceModal: () => void;
  closeWorkspaceModal: () => void;
  openSettingsModal: (section?: string) => void;
  closeSettingsModal: () => void;
}

export const useUIStore = create<UIState>()(
  persist(
    (set) => ({
      sidebarOpen: true,
      sidebarCollapsed: false,
      currentOrgId: null,
      theme: 'system',
      scenesView: 'list',
      preferredAiProvider: null,
      chatPanelOpen: false,
      chatPanelWidth: 400,
      chatExpanded: false,
      workspaceModalOpen: false,
      settingsModalOpen: false,
      settingsSection: 'perfil',

      setSidebarOpen: (open) => set({ sidebarOpen: open, sidebarCollapsed: !open }),
      toggleSidebar: () => set((s) => ({ sidebarOpen: !s.sidebarOpen, sidebarCollapsed: s.sidebarOpen })),
      setSidebarCollapsed: (collapsed) => set({ sidebarCollapsed: collapsed, sidebarOpen: !collapsed }),
      setCurrentOrgId: (id) => set({ currentOrgId: id }),
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
        sidebarOpen: state.sidebarOpen,
        sidebarCollapsed: state.sidebarCollapsed,
        currentOrgId: state.currentOrgId,
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
