'use client';

import { useCallback } from 'react';
import { useAiChatStore } from '@/stores/useAiChatStore';
import type { AiMessage } from '@/types';

export function useAiChat(projectId: string | undefined) {
  const store = useAiChatStore();

  const sendMessage = useCallback(
    async (content: string) => {
      if (!projectId) return;

      const userMessage: AiMessage = {
        id: crypto.randomUUID(),
        role: 'user',
        content,
        timestamp: new Date().toISOString(),
      };

      store.addMessage(userMessage);
      store.setIsStreaming(true);
      store.setCurrentStreamText('');

      try {
        const response = await fetch('/api/ai/chat', {
          method: 'POST',
          headers: { 'Content-Type': 'application/json' },
          body: JSON.stringify({
            projectId,
            messages: [...store.messages, userMessage].map((m) => ({
              role: m.role,
              content: m.content,
            })),
          }),
        });

        if (!response.ok) throw new Error('Chat request failed');

        const reader = response.body?.getReader();
        const decoder = new TextDecoder();

        if (reader) {
          let fullText = '';
          while (true) {
            const { done, value } = await reader.read();
            if (done) break;
            const chunk = decoder.decode(value, { stream: true });
            fullText += chunk;
            store.setCurrentStreamText(fullText);
          }

          const assistantMessage: AiMessage = {
            id: crypto.randomUUID(),
            role: 'assistant',
            content: fullText,
            timestamp: new Date().toISOString(),
          };
          store.addMessage(assistantMessage);
        }
      } catch {
        const errorMessage: AiMessage = {
          id: crypto.randomUUID(),
          role: 'assistant',
          content: 'Lo siento, hubo un error al procesar tu mensaje. Inténtalo de nuevo.',
          timestamp: new Date().toISOString(),
        };
        store.addMessage(errorMessage);
      } finally {
        store.setIsStreaming(false);
        store.setCurrentStreamText('');
      }
    },
    [projectId, store]
  );

  return {
    messages: store.messages,
    isStreaming: store.isStreaming,
    currentStreamText: store.currentStreamText,
    sendMessage,
    clearChat: store.clearChat,
  };
}
