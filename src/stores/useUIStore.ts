'use client';

import { create } from 'zustand';
import { persist } from 'zustand/middleware';
import { useAIStore } from '@/stores/ai-store';
import type { TaskCategory, TaskPriority } from '@/types';

interface TaskCreateDraft {
  projectId?: string | null;
  videoId?: string | null;
  title?: string;
  description?: string;
  category?: TaskCategory;
  priority?: TaskPriority;
  dueDate?: string;
  source?: string;
}

interface TaskWorkspaceHeaderContext {
  kind: 'task-workspace';
  mode: 'create' | 'edit';
  title: string;
  lastReviewedAt: string | null;
  isDirty: boolean;
  isSaving: boolean;
  primaryDisabled: boolean;
  primaryLabel: string;
  backHref: string;
  onPrimaryAction: () => void;
  onReviewAction: () => void;
}

type PageHeaderContext = TaskWorkspaceHeaderContext | null;

export interface FilePreviewItem {
  id?: string;
  url: string;
  name: string;
  type: string;
  size?: number;
}

interface UIState {
  // Sidebar
  sidebarOpen: boolean;
  sidebarCollapsed: boolean; // alias — kept for backwards compat
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
  projectCreatePanelOpen: boolean;
  taskCreatePanelOpen: boolean;
  taskCreateDraft: TaskCreateDraft;
  filePreviewOpen: boolean;
  filePreviewFiles: FilePreviewItem[];
  filePreviewIndex: number;
  settingsModalOpen: boolean;
  settingsSection: string;
  projectSettingsModalOpen: boolean;
  projectSettingsSection: string;
  videoSettingsModalOpen: boolean;
  videoSettingsSection: string;
  pageHeaderContext: PageHeaderContext;

  // Sidebar
  setSidebarOpen: (open: boolean) => void;
  toggleSidebar: () => void;
  setSidebarCollapsed: (collapsed: boolean) => void;
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
  openProjectCreatePanel: () => void;
  closeProjectCreatePanel: () => void;
  openTaskCreatePanel: (draft?: TaskCreateDraft) => void;
  closeTaskCreatePanel: () => void;
  openFilePreview: (files: FilePreviewItem[], initialIndex?: number) => void;
  closeFilePreview: () => void;
  openSettingsModal: (section?: string) => void;
  closeSettingsModal: () => void;
  openProjectSettingsModal: (section?: string) => void;
  closeProjectSettingsModal: () => void;
  openVideoSettingsModal: (section?: string) => void;
  closeVideoSettingsModal: () => void;
  setPageHeaderContext: (context: PageHeaderContext) => void;
  clearPageHeaderContext: () => void;
}

export const useUIStore = create<UIState>()(
  persist(
    (set) => ({
      sidebarOpen: true,
      sidebarCollapsed: false,
      theme: 'system',
      scenesView: 'list',
      preferredAiProvider: null,
      chatPanelOpen: false,
      chatPanelWidth: 400,
      chatExpanded: false,
      workspaceModalOpen: false,
      projectCreatePanelOpen: false,
      taskCreatePanelOpen: false,
      taskCreateDraft: {},
      filePreviewOpen: false,
      filePreviewFiles: [],
      filePreviewIndex: 0,
      settingsModalOpen: false,
      settingsSection: 'perfil',
      projectSettingsModalOpen: false,
      projectSettingsSection: 'general',
      videoSettingsModalOpen: false,
      videoSettingsSection: 'general',
      pageHeaderContext: null,

      setSidebarOpen: (open) => set({ sidebarOpen: open, sidebarCollapsed: !open }),
      toggleSidebar: () => set((s) => ({ sidebarOpen: !s.sidebarOpen, sidebarCollapsed: s.sidebarOpen })),
      setSidebarCollapsed: (collapsed) => set({ sidebarCollapsed: collapsed, sidebarOpen: !collapsed }),
      setTheme: (theme) => {
        set({ theme });
        if (typeof window === 'undefined') return;
        // Single source of truth: localStorage['kiyoko-theme']
        localStorage.setItem('kiyoko-theme', theme);
        const prefersDark = window.matchMedia('(prefers-color-scheme: dark)').matches;
        const isDark = theme === 'dark' || (theme === 'system' && prefersDark);
        document.documentElement.classList.toggle('dark', isDark);
        document.documentElement.setAttribute('data-theme', isDark ? 'dark' : 'light');
      },
      setScenesView: (scenesView) => set({ scenesView }),
      setPreferredAiProvider: (preferredAiProvider) => set({ preferredAiProvider }),
      toggleChat: () => set((s) => ({ chatPanelOpen: !s.chatPanelOpen, chatExpanded: false })),
      expandChat: () => set({ chatExpanded: true, chatPanelOpen: false }),
      collapseChat: () => set({ chatExpanded: false, chatPanelOpen: true }),
      setChatWidth: (chatPanelWidth) => set({ chatPanelWidth }),
      openWorkspaceModal: () => set({ workspaceModalOpen: true }),
      closeWorkspaceModal: () => set({ workspaceModalOpen: false }),
      openProjectCreatePanel: () => {
        useAIStore.getState().closeChat();
        set({ projectCreatePanelOpen: true });
      },
      closeProjectCreatePanel: () => set({ projectCreatePanelOpen: false }),
      openTaskCreatePanel: (draft = {}) => {
        useAIStore.getState().closeChat();
        set({ taskCreatePanelOpen: true, taskCreateDraft: draft });
      },
      closeTaskCreatePanel: () => set({ taskCreatePanelOpen: false, taskCreateDraft: {} }),
      openFilePreview: (files, initialIndex = 0) => set({
        filePreviewOpen: true,
        filePreviewFiles: files,
        filePreviewIndex: initialIndex,
      }),
      closeFilePreview: () => set({
        filePreviewOpen: false,
        filePreviewFiles: [],
        filePreviewIndex: 0,
      }),
      openSettingsModal: (section = 'perfil') => set({ settingsModalOpen: true, settingsSection: section }),
      closeSettingsModal: () => set({ settingsModalOpen: false }),
      openProjectSettingsModal: (section = 'general') => set({ projectSettingsModalOpen: true, projectSettingsSection: section }),
      closeProjectSettingsModal: () => set({ projectSettingsModalOpen: false }),
      openVideoSettingsModal: (section = 'general') => set({ videoSettingsModalOpen: true, videoSettingsSection: section }),
      closeVideoSettingsModal: () => set({ videoSettingsModalOpen: false }),
      setPageHeaderContext: (pageHeaderContext) => set({ pageHeaderContext }),
      clearPageHeaderContext: () => set({ pageHeaderContext: null }),
    }),
    {
      name: 'kiyoko-ui',
      partialize: (state) => ({
        sidebarOpen: state.sidebarOpen,
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
