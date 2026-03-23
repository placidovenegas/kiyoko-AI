import { create } from 'zustand';
import { persist } from 'zustand/middleware';
import type { AiActionPlan } from '@/types/ai-actions';

// ---- Panel display modes ----
export type KiyokoPanelMode = 'minimized' | 'sidebar' | 'floating' | 'fullscreen';

// ---- Active agent indicator ----
export type KiyokoActiveAgent = 'router' | 'scenes' | 'prompts' | 'editor';

interface AIState {
  // ---- Chat panel UI ----
  isOpen: boolean;
  mode: KiyokoPanelMode;
  sidebarWidth: number; // px, min 320, max 600, default 420
  activeAgent: KiyokoActiveAgent;

  toggleChat: () => void;
  openChat: (mode?: KiyokoPanelMode) => void;
  closeChat: () => void;
  setMode: (mode: KiyokoPanelMode) => void;
  setSidebarWidth: (width: number) => void;
  setActiveAgent: (agent: KiyokoActiveAgent) => void;

  // ---- Provider mode ----
  // "auto" = fallback chain; any other value = specific providerId
  aiMode: string;
  setAIMode: (mode: string) => void;

  // ---- Active conversation ----
  conversationId: string | null;
  setConversationId: (id: string | null) => void;

  // ---- Pending action plan (awaiting user confirmation) ----
  pendingPlan: AiActionPlan | null;
  setPendingPlan: (plan: AiActionPlan | null) => void;

  // ---- Last image analysis result ----
  lastImageAnalysis: Record<string, unknown> | null;
  setLastImageAnalysis: (analysis: Record<string, unknown> | null) => void;

  // ---- Creation in progress (blocks input while creating) ----
  isCreating: boolean;
  creatingLabel: string | null;
  setCreating: (creating: boolean, label?: string) => void;
}

const SIDEBAR_WIDTH_MIN = 320;
const SIDEBAR_WIDTH_MAX = 600;
const SIDEBAR_WIDTH_DEFAULT = 420;

function clampWidth(w: number): number {
  return Math.min(SIDEBAR_WIDTH_MAX, Math.max(SIDEBAR_WIDTH_MIN, w));
}

export const useAIStore = create<AIState>()(
  persist(
    (set) => ({
      isOpen: false,
      mode: 'sidebar' as KiyokoPanelMode,
      sidebarWidth: SIDEBAR_WIDTH_DEFAULT,
      activeAgent: 'router' as KiyokoActiveAgent,

      toggleChat: () => set((s) => ({ isOpen: !s.isOpen })),
      openChat: (mode) => set((s) => ({
        isOpen: true,
        ...(mode ? { mode } : {}),
      })),
      closeChat: () => set({ isOpen: false }),
      setMode: (mode) => set({ mode }),
      setSidebarWidth: (width) => set({ sidebarWidth: clampWidth(width) }),
      setActiveAgent: (agent) => set({ activeAgent: agent }),

      aiMode: 'auto',
      setAIMode: (mode) => set({ aiMode: mode }),

      conversationId: null,
      setConversationId: (id) => set({ conversationId: id }),

      pendingPlan: null,
      setPendingPlan: (plan) => set({ pendingPlan: plan }),

      lastImageAnalysis: null,
      setLastImageAnalysis: (analysis) => set({ lastImageAnalysis: analysis }),

      isCreating: false,
      creatingLabel: null,
      setCreating: (creating, label) => set({ isCreating: creating, creatingLabel: label ?? null }),
    }),
    {
      name: 'kiyoko-ai-store',
      // Persist UI preferences only, not transient state
      partialize: (s) => ({
        isOpen: s.isOpen,
        mode: s.mode,
        sidebarWidth: s.sidebarWidth,
        aiMode: s.aiMode,
      }),
    },
  ),
);
