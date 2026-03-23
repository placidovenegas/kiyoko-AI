'use client';

import { useEffect, useMemo, useRef, useState } from 'react';
import { useChat } from '@ai-sdk/react';
import { DefaultChatTransport, type UIMessage } from 'ai';
import { usePathname, useParams } from 'next/navigation';
import { useAIStore } from '@/stores/ai-store';
import { useExecuteAiActions } from '@/hooks/use-execute-ai-actions';
import { useRealtimeUpdates } from '@/hooks/use-realtime-updates';
import { getChatLocationFromPath, getWelcomeMessage, getQuickActions } from '@/lib/ai/chat-context';
import { AIModeSwitcher } from './AIModeSwitcher';
import { ChatMessage } from './ChatMessage';
import { QuickActions } from './QuickActions';
import { ConversationList } from './ConversationList';
import type { AiActionPlan } from '@/types/ai-actions';

function makeWelcomeMessage(text: string): UIMessage {
  return { id: 'welcome', role: 'assistant' as const, parts: [{ type: 'text', text }] };
}

function makeAssistantMessage(id: string, text: string): UIMessage {
  return { id, role: 'assistant' as const, parts: [{ type: 'text', text }] };
}

function getMessageText(message: UIMessage): string {
  return message.parts
    .filter((p): p is { type: 'text'; text: string } => p.type === 'text')
    .map((p) => p.text)
    .join('');
}

export function ChatSidebar() {
  const pathname = usePathname();
  const params = useParams() as Record<string, string>;
  const messagesEndRef = useRef<HTMLDivElement>(null);
  const [input, setInput] = useState('');

  const { isOpen, aiMode, conversationId, setConversationId, setPendingPlan, closeChat } = useAIStore();

  // Detect context from URL
  const location = useMemo(
    () => getChatLocationFromPath(pathname, params),
    [pathname, params],
  );

  const projectId = 'shortId' in location ? (location as { shortId: string }).shortId : undefined;
  const videoId = 'videoShortId' in location ? (location as { videoShortId: string }).videoShortId : undefined;
  const sceneId = 'sceneShortId' in location ? (location as { sceneShortId: string }).sceneShortId : undefined;

  const welcomeMessage = useMemo(() => getWelcomeMessage(location), [location]);
  const quickActions = useMemo(() => getQuickActions(location), [location]);

  // Realtime subscription for AI action results
  useRealtimeUpdates({ projectId, enabled: isOpen });

  // Execute AI action plan mutation
  const { mutate: executeActions, isPending: isExecutingPlan } = useExecuteAiActions();

  // Transport with dynamic body params
  const transport = useMemo(
    () => new DefaultChatTransport({
      api: '/api/ai/chat',
      body: { projectId, videoId, sceneId, contextType: location.type, aiMode, conversationId },
    }),
    // eslint-disable-next-line react-hooks/exhaustive-deps
    [projectId, videoId, sceneId, location.type, aiMode, conversationId],
  );

  const {
    messages,
    sendMessage,
    status,
    setMessages,
    error,
  } = useChat({
    transport,
    messages: [makeWelcomeMessage(welcomeMessage)],
    onFinish: ({ message }) => {
      const text = getMessageText(message);
      const navMatch = text.match(/\[NAVIGATE:\s*\w+\|([^\]]+)\]/);
      if (navMatch && typeof window !== 'undefined') {
        window.location.href = navMatch[1];
      }
    },
  });

  const isLoading = status === 'streaming' || status === 'submitted';

  // Reset conversation when context changes (user navigates)
  useEffect(() => {
    setConversationId(null);
    setMessages([makeWelcomeMessage(welcomeMessage)] as UIMessage[]);
  // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [location.type, projectId, videoId]);

  // Auto-scroll to bottom on new messages
  useEffect(() => {
    messagesEndRef.current?.scrollIntoView({ behavior: 'smooth' });
  }, [messages]);

  // Handle quick action — inject prompt as user input and submit
  function handleQuickAction(prompt: string) {
    sendMessage({ text: prompt });
  }

  // Handle action plan confirmation
  function handleConfirmPlan(plan: AiActionPlan) {
    if (!projectId) return;
    setPendingPlan(null);
    executeActions(
      { plan, projectId, conversationId: conversationId ?? undefined },
      {
        onSuccess: ({ successCount }) => {
          setMessages((prev) => [
            ...prev,
            makeAssistantMessage(crypto.randomUUID(), `✅ ${successCount} acción(es) aplicada(s) correctamente.`),
          ] as UIMessage[]);
        },
        onError: (err) => {
          setMessages((prev) => [
            ...prev,
            makeAssistantMessage(crypto.randomUUID(), `❌ Error al aplicar: ${err.message}`),
          ] as UIMessage[]);
        },
      },
    );
  }

  // Load historical conversation
  function handleSelectConversation(convId: string) {
    setConversationId(convId);
  }

  function handleSubmit(e: React.FormEvent) {
    e.preventDefault();
    if (!input.trim() || isLoading) return;
    sendMessage({ text: input });
    setInput('');
  }

  if (!isOpen) return null;

  return (
    <aside
      className="flex h-full w-[380px] shrink-0 flex-col border-l border-gray-200 bg-white
                 dark:border-gray-800 dark:bg-gray-950"
    >
      {/* Header */}
      <div className="flex items-center justify-between border-b border-gray-200 px-3 py-2.5 dark:border-gray-800">
        <div className="flex items-center gap-2">
          <span className="text-sm font-semibold">Director IA</span>
          <span className="rounded-full bg-blue-100 px-1.5 py-0.5 text-xs text-blue-600 dark:bg-blue-900/30 dark:text-blue-400">
            {location.type}
          </span>
        </div>
        <div className="flex items-center gap-2">
          <AIModeSwitcher />
          <button
            onClick={closeChat}
            className="rounded p-1 text-gray-400 transition-colors hover:text-gray-600 dark:hover:text-gray-300"
            title="Cerrar chat"
          >
            ✕
          </button>
        </div>
      </div>

      {/* Conversation history */}
      <ConversationList
        projectId={projectId}
        videoId={videoId}
        contextType={location.type}
        onSelect={handleSelectConversation}
      />

      {/* Messages */}
      <div className="flex-1 space-y-3 overflow-y-auto p-3">
        {messages.map((message) => (
          <ChatMessage
            key={message.id}
            message={message}
            onConfirmPlan={handleConfirmPlan}
            onCancelPlan={() => {/* user cancelled — no action needed */}}
            isExecutingPlan={isExecutingPlan}
          />
        ))}

        {/* Loading indicator */}
        {isLoading && (
          <div className="flex justify-start">
            <div className="rounded-xl bg-gray-100 px-3 py-2.5 text-sm dark:bg-gray-800">
              <span className="animate-pulse text-gray-400">···</span>
            </div>
          </div>
        )}

        {/* Error display */}
        {error && (
          <div className="rounded-lg bg-red-50 px-3 py-2 text-xs text-red-600 dark:bg-red-900/20 dark:text-red-400">
            {error.message}
          </div>
        )}

        <div ref={messagesEndRef} />
      </div>

      {/* Quick actions (shown only when chat is fresh) */}
      {messages.length <= 1 && (
        <QuickActions actions={quickActions} onAction={handleQuickAction} />
      )}

      {/* Input */}
      <form
        id="chat-form"
        onSubmit={handleSubmit}
        className="flex gap-2 border-t border-gray-200 p-3 dark:border-gray-800"
      >
        <input
          value={input}
          onChange={(e) => setInput(e.target.value)}
          placeholder="Escribe un mensaje..."
          disabled={isLoading}
          className="min-w-0 flex-1 rounded-lg border-0 bg-gray-100 px-3 py-2 text-sm
                     focus:outline-none focus:ring-2 focus:ring-blue-500 disabled:opacity-50
                     dark:bg-gray-800 dark:text-gray-100 dark:placeholder-gray-400"
        />
        <button
          type="submit"
          disabled={isLoading || !input.trim()}
          className="rounded-lg bg-blue-600 px-3 py-2 text-sm font-medium text-white
                     transition-colors hover:bg-blue-700 disabled:cursor-not-allowed disabled:opacity-40"
        >
          {isLoading ? '⏳' : '→'}
        </button>
      </form>
    </aside>
  );
}
