'use client';

import { useState } from 'react';
import { useAiConversations, useDeleteConversation } from '@/hooks/queries/use-ai-conversations';
import { useAIStore } from '@/stores/ai-store';

interface ConversationListProps {
  projectId?: string;
  videoId?: string;
  contextType?: string;
  onSelect: (conversationId: string) => void;
}

export function ConversationList({ projectId, videoId, contextType, onSelect }: ConversationListProps) {
  const [isExpanded, setIsExpanded] = useState(false);
  const { conversationId: activeId } = useAIStore();

  const { data: conversations = [], isLoading } = useAiConversations({
    projectId,
    videoId,
    contextType,
    enabled: isExpanded,
  });

  const { mutate: deleteConversation } = useDeleteConversation();

  if (!isExpanded) {
    return (
      <button
        onClick={() => setIsExpanded(true)}
        className="flex w-full items-center gap-1.5 border-b px-3 py-2 text-left text-xs text-gray-500
                   transition-colors hover:bg-gray-50 dark:border-gray-800 dark:hover:bg-gray-900"
      >
        <span>🕐</span>
        <span>Historial</span>
        <span className="ml-auto text-gray-400">▾</span>
      </button>
    );
  }

  return (
    <div className="border-b dark:border-gray-800">
      <button
        onClick={() => setIsExpanded(false)}
        className="flex w-full items-center gap-1.5 px-3 py-2 text-left text-xs font-medium text-gray-600
                   transition-colors hover:bg-gray-50 dark:text-gray-400 dark:hover:bg-gray-900"
      >
        <span>🕐</span>
        <span>Historial</span>
        <span className="ml-auto text-gray-400">▴</span>
      </button>

      <div className="max-h-48 overflow-y-auto">
        {isLoading && (
          <p className="px-3 py-2 text-xs text-gray-400">Cargando...</p>
        )}
        {!isLoading && conversations.length === 0 && (
          <p className="px-3 py-2 text-xs text-gray-400">Sin conversaciones anteriores</p>
        )}
        {conversations.map((conv) => (
          <div
            key={conv.id}
            className={`group flex items-center gap-2 px-3 py-1.5 transition-colors hover:bg-gray-50
                        dark:hover:bg-gray-900 ${activeId === conv.id ? 'bg-blue-50 dark:bg-blue-900/20' : ''}`}
          >
            <button
              onClick={() => onSelect(conv.id)}
              className="min-w-0 flex-1 text-left"
            >
              <p className="truncate text-xs font-medium text-gray-700 dark:text-gray-300">
                {conv.title || 'Sin título'}
              </p>
              <p className="text-xs text-gray-400">
                {conv.message_count} mensajes · {new Date(conv.updated_at).toLocaleDateString('es-ES')}
              </p>
            </button>
            <button
              onClick={() => deleteConversation(conv.id)}
              className="hidden shrink-0 text-xs text-gray-400 transition-colors
                         hover:text-red-500 group-hover:block"
              title="Eliminar"
            >
              ✕
            </button>
          </div>
        ))}
      </div>
    </div>
  );
}
