'use client';

import { create } from 'zustand';
import type { AiMessage } from '@/types';

interface AiChatState {
  messages: AiMessage[];
  isStreaming: boolean;
  currentStreamText: string;

  addMessage: (message: AiMessage) => void;
  setMessages: (messages: AiMessage[]) => void;
  setIsStreaming: (isStreaming: boolean) => void;
  setCurrentStreamText: (text: string) => void;
  appendStreamText: (chunk: string) => void;
  clearChat: () => void;
}

export const useAiChatStore = create<AiChatState>()((set) => ({
  messages: [],
  isStreaming: false,
  currentStreamText: '',

  addMessage: (message) =>
    set((s) => ({ messages: [...s.messages, message] })),
  setMessages: (messages) => set({ messages }),
  setIsStreaming: (isStreaming) => set({ isStreaming }),
  setCurrentStreamText: (currentStreamText) => set({ currentStreamText }),
  appendStreamText: (chunk) =>
    set((s) => ({ currentStreamText: s.currentStreamText + chunk })),
  clearChat: () =>
    set({ messages: [], isStreaming: false, currentStreamText: '' }),
}));
