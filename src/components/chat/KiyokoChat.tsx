'use client';

import { useRef, useEffect, useCallback, useState, useMemo } from 'react';
import { usePathname } from 'next/navigation';
import { Sparkles } from 'lucide-react';
import { useKiyokoChat } from '@/hooks/useKiyokoChat';
import type { KiyokoMessage } from '@/hooks/useKiyokoChat';
import { useAIStore } from '@/stores/ai-store';
import { ChatMessage } from '@/components/chat/ChatMessage';
import { ChatInput } from '@/components/chat/ChatInput';
import { ChatHistorySidebar } from '@/components/chat/ChatHistorySidebar';
import { KiyokoHeader } from '@/components/kiyoko/KiyokoHeader';
import { KiyokoEmptyState } from '@/components/kiyoko/KiyokoEmptyState';
import { createClient } from '@/lib/supabase/client';
import type { AiActionPlan } from '@/types/ai-actions';

// ---------------------------------------------------------------------------
// Types
// ---------------------------------------------------------------------------

interface KiyokoChatProps {
  mode: 'panel' | 'expanded';
  onClose?: () => void;
  projectSlug?: string;
}

const LAST_CONVERSATION_KEY = 'kiyoko-last-conversation-id';
const HISTORY_WIDTH_KEY = 'kiyoko-history-width';

// ---------------------------------------------------------------------------
// KiyokoChat
// ---------------------------------------------------------------------------

export function KiyokoChat({ mode, onClose }: KiyokoChatProps) {
  const pathname = usePathname();
  const messagesEndRef = useRef<HTMLDivElement>(null);
  const [projectTitle, setProjectTitle] = useState<string | null>(null);
  const [videoTitle, setVideoTitle] = useState<string | null>(null);
  const [historyWidth, setHistoryWidth] = useState(() => {
    if (typeof window === 'undefined') return 240;
    const saved = localStorage.getItem(HISTORY_WIDTH_KEY);
    if (saved) {
      const w = parseInt(saved, 10);
      if (!isNaN(w) && w >= 180 && w <= 480) return w;
    }
    return 240;
  });
  const hasRestoredRef = useRef(false);

  const {
    messages,
    isStreaming,
    conversationId,
    conversations,
    suggestions,
    sendMessage,
    stopStreaming,
    activeProvider,
    executeActionPlan,
    cancelActionPlan,
    undoBatch,
    loadConversation,
    loadConversations,
    startNewConversation,
    setProject,
    setContext,
    clearSuggestions,
    projectId: chatProjectId,
  } = useKiyokoChat();

  const isExpandedMode = mode === 'expanded';
  const activeAgent = useAIStore((s) => s.activeAgent);

  // ---- Parse URL context ----
  const projectShortId = useMemo(() => {
    const m = pathname.match(/\/project\/([^/]+)/);
    return m ? m[1] : null;
  }, [pathname]);

  const videoShortId = useMemo(() => {
    const m = pathname.match(/\/video\/([^/]+)/);
    return m ? m[1] : null;
  }, [pathname]);

  const sceneShortId = useMemo(() => {
    const m = pathname.match(/\/scene\/([^/]+)/);
    return m ? m[1] : null;
  }, [pathname]);

  const isOrgRoute = pathname.startsWith('/organizations/');

  // ---- Context label + type ----
  const contextLabel = useMemo(() => {
    if (videoTitle) return videoTitle;
    if (projectTitle) return projectTitle;
    if (isOrgRoute) return 'Organización';
    return 'Dashboard';
  }, [videoTitle, projectTitle, isOrgRoute]);

  const contextType = useMemo((): 'dashboard' | 'organization' | 'project' | 'video' | 'scene' => {
    if (sceneShortId && videoShortId) return 'scene';
    if (videoShortId) return 'video';
    if (projectShortId) return 'project';
    if (isOrgRoute) return 'organization';
    return 'dashboard';
  }, [sceneShortId, videoShortId, projectShortId, isOrgRoute]);

  // ---- Persist historyWidth ----
  useEffect(() => {
    localStorage.setItem(HISTORY_WIDTH_KEY, historyWidth.toString());
  }, [historyWidth]);

  // ---- Fetch project info from URL ----
  useEffect(() => {
    const supabase = createClient();
    const query = projectShortId
      ? supabase.from('projects').select('id, title, slug').eq('short_id', projectShortId).single()
      : Promise.resolve({ data: null });

    query.then(({ data }) => {
      setProjectTitle(data ? (data.title as string) : null);
      if (data) {
        setProject(data.id as string, data.slug as string);
        // Only set project-level context if we're not in a video (video effect will override)
        if (!videoShortId) setContext('project', null, null);
      } else {
        setProject(null, null);
        if (!videoShortId) setContext('dashboard', null, null);
      }
    });
  }, [projectShortId, videoShortId, setProject, setContext]);

  // ---- Fetch video info from URL + update context level ----
  // RULE (Section 16): New conversation every time user enters a video.
  // Context is always fresh — old conversations are saved but NOT restored.
  const prevVideoRef = useRef<string | null>(null);

  useEffect(() => {
    const supabase = createClient();
    const videoQuery = videoShortId
      ? supabase.from('videos').select('id, title').eq('short_id', videoShortId).single()
      : Promise.resolve({ data: null });

    videoQuery.then(async ({ data: videoData }) => {
      setVideoTitle(videoData ? (videoData.title as string) : null);

      if (videoData) {
        // Start fresh conversation when entering a different video (Section 16)
        if (prevVideoRef.current !== videoShortId) {
          prevVideoRef.current = videoShortId;
          startNewConversation();
        }

        // If we have a scene in the URL, resolve its ID and set scene context
        if (sceneShortId) {
          const { data: sceneData } = await supabase
            .from('scenes')
            .select('id')
            .eq('short_id', sceneShortId)
            .single();
          setContext('scene', videoData.id as string, sceneData?.id as string ?? null);
        } else {
          setContext('video', videoData.id as string, null);
        }
      } else if (!projectShortId) {
        prevVideoRef.current = null;
        setContext('dashboard', null, null);
      }
    });
  }, [videoShortId, sceneShortId, projectShortId, setContext, startNewConversation]);

  // ---- Load conversations on mount ----
  useEffect(() => {
    loadConversations();
  }, [loadConversations]);

  // ---- Restore last conversation on mount ----
  useEffect(() => {
    if (hasRestoredRef.current) return;
    const lastId = localStorage.getItem(LAST_CONVERSATION_KEY);
    if (lastId) {
      hasRestoredRef.current = true;
      loadConversation(lastId);
    }
  }, [loadConversation]);

  // ---- Persist active conversationId ----
  useEffect(() => {
    if (conversationId) {
      localStorage.setItem(LAST_CONVERSATION_KEY, conversationId);
    }
  }, [conversationId]);

  // ---- Auto scroll ----
  const prevMessageCountRef = useRef(0);
  useEffect(() => {
    const isNewMessage = messages.length > prevMessageCountRef.current;
    prevMessageCountRef.current = messages.length;
    if (!messagesEndRef.current) return;
    messagesEndRef.current.scrollIntoView({
      behavior: isNewMessage ? 'smooth' : 'instant',
    });
  }, [messages]);

  // ---- Handlers ----
  const handleSend = useCallback(
    (text: string) => { sendMessage(text); },
    [sendMessage],
  );

  const handleQuickAction = useCallback(
    (prompt: string) => { sendMessage(prompt); },
    [sendMessage],
  );

  const handleSuggestionClick = useCallback(
    (suggestion: string) => { sendMessage(suggestion); clearSuggestions(); },
    [sendMessage, clearSuggestions],
  );

  const handleExecute = useCallback(
    (messageId: string, plan: AiActionPlan) => { executeActionPlan(messageId, plan); },
    [executeActionPlan],
  );

  const handleCancel = useCallback(
    (messageId: string) => { cancelActionPlan(messageId); },
    [cancelActionPlan],
  );

  const [prefillText, setPrefillText] = useState<string | null>(null);
  const handleModify = useCallback((text: string) => { setPrefillText(text); }, []);
  const handlePrefillConsumed = useCallback(() => { setPrefillText(null); }, []);

  const handleWorkflowAction = useCallback(
    (_actionId: string, label: string) => { sendMessage(label); },
    [sendMessage],
  );

  const handleHistorySelect = useCallback(
    (convId: string) => { loadConversation(convId); },
    [loadConversation],
  );

  const handleNewChat = useCallback(() => {
    startNewConversation();
    localStorage.removeItem(LAST_CONVERSATION_KEY);
  }, [startNewConversation]);

  // ---- Resize handler (expanded history) ----
  const handleHistoryResizeMouseDown = useCallback((e: React.MouseEvent) => {
    e.preventDefault();
    const startX = e.clientX;
    const startW = historyWidth;
    const onMove = (ev: MouseEvent) => {
      const newW = Math.max(180, Math.min(480, startW + (ev.clientX - startX)));
      setHistoryWidth(newW);
    };
    const onUp = () => {
      document.removeEventListener('mousemove', onMove);
      document.removeEventListener('mouseup', onUp);
      document.body.style.cursor = '';
      document.body.style.userSelect = '';
    };
    document.addEventListener('mousemove', onMove);
    document.addEventListener('mouseup', onUp);
    document.body.style.cursor = 'col-resize';
    document.body.style.userSelect = 'none';
  }, [historyWidth]);

  // ---- Placeholder ----
  const placeholder = projectTitle
    ? `Pregúntale a Kiyoko sobre "${projectTitle}"...`
    : 'Escribe un mensaje a Kiyoko...';

  return (
    <div className="flex flex-col h-full bg-background text-foreground relative overflow-hidden">

      {/* ================================================================
          Expanded mode layout: LEFT history sidebar (always) + RIGHT main
          ================================================================ */}
      {isExpandedMode ? (
        <div className="flex flex-1 min-h-0">
          {/* History sidebar — always visible when expanded, resizable */}
          <div
            className="shrink-0 h-full overflow-hidden"
            style={{ width: historyWidth }}
          >
            <ChatHistorySidebar
              conversations={conversations}
              activeConversationId={conversationId}
              onSelect={handleHistorySelect}
              onNewChat={handleNewChat}
            />
          </div>

          {/* Resize handle */}
          <div
            className="w-1 shrink-0 cursor-col-resize bg-transparent hover:bg-teal-500/40 active:bg-teal-500/60 relative group"
            onMouseDown={handleHistoryResizeMouseDown}
          >
            <div className="absolute inset-y-0 left-1/2 -translate-x-1/2 w-px bg-border group-hover:bg-teal-500/40 transition-colors" />
          </div>

          {/* Main chat */}
          <div className="flex flex-col flex-1 min-w-0 h-full">
            <KiyokoHeader
              contextLabel={contextLabel}
              isStreaming={isStreaming}
              onNewChat={handleNewChat}
            />
            <ChatBody
              messages={messages}
              suggestions={suggestions}
              isStreaming={isStreaming}
              activeAgent={activeAgent}
              projectId={chatProjectId}
              handleQuickAction={handleQuickAction}
              handleSuggestionClick={handleSuggestionClick}
              handleExecute={handleExecute}
              handleCancel={handleCancel}
              handleModify={handleModify}
              handleWorkflowAction={handleWorkflowAction}
              undoBatch={undoBatch}
              messagesEndRef={messagesEndRef}
              handleSend={handleSend}
              stopStreaming={stopStreaming}
              onClearConversation={handleNewChat}
              activeProvider={activeProvider}
              placeholder={placeholder}
              isExpandedMode
              contextLabel={contextLabel}
              contextType={contextType}
              prefillText={prefillText}
              onPrefillConsumed={handlePrefillConsumed}
            />
          </div>
        </div>

      ) : (
        /* ================================================================
           Panel mode layout: chat + history side by side (flex row)
           ================================================================ */
        <div className="flex flex-1 min-h-0">
          {/* Main chat */}
          <div className="flex flex-col flex-1 min-w-0 min-h-0">
            <KiyokoHeader
              contextLabel={contextLabel}
              isStreaming={isStreaming}
              onNewChat={handleNewChat}
              onHistoryToggle={() => {}}
            />
            <ChatBody
              messages={messages}
              suggestions={suggestions}
              isStreaming={isStreaming}
              activeAgent={activeAgent}
              projectId={chatProjectId}
              handleQuickAction={handleQuickAction}
              handleSuggestionClick={handleSuggestionClick}
              handleExecute={handleExecute}
              handleCancel={handleCancel}
              handleModify={handleModify}
              handleWorkflowAction={handleWorkflowAction}
              undoBatch={undoBatch}
              messagesEndRef={messagesEndRef}
              handleSend={handleSend}
              stopStreaming={stopStreaming}
              onClearConversation={handleNewChat}
              activeProvider={activeProvider}
              placeholder={placeholder}
              isExpandedMode={false}
              contextLabel={contextLabel}
              contextType={contextType}
              prefillText={prefillText}
              onPrefillConsumed={handlePrefillConsumed}
            />
          </div>
        </div>
      )}
    </div>
  );
}

// ---------------------------------------------------------------------------
// ChatBody (internal)
// ---------------------------------------------------------------------------

interface ChatBodyProps {
  messages: KiyokoMessage[];
  suggestions: string[];
  isStreaming: boolean;
  activeAgent: string;
  projectId: string | null;
  handleQuickAction: (prompt: string) => void;
  handleSuggestionClick: (suggestion: string) => void;
  handleExecute: (messageId: string, plan: AiActionPlan) => void;
  handleCancel: (messageId: string) => void;
  handleModify: (prefill: string) => void;
  handleWorkflowAction: (actionId: string, label: string) => void;
  undoBatch: (batchId: string) => void;
  messagesEndRef: React.RefObject<HTMLDivElement | null>;
  handleSend: (text: string, files?: File[]) => void;
  stopStreaming: () => void;
  onClearConversation: () => void;
  activeProvider: string | null;
  placeholder: string;
  isExpandedMode: boolean;
  contextLabel: string;
  contextType: 'dashboard' | 'organization' | 'project' | 'video' | 'scene';
  prefillText: string | null;
  onPrefillConsumed: () => void;
}

function ChatBody({
  messages,
  suggestions,
  isStreaming,
  activeAgent,
  projectId,
  handleQuickAction,
  handleSuggestionClick,
  handleExecute,
  handleCancel,
  handleModify,
  handleWorkflowAction,
  undoBatch,
  messagesEndRef,
  handleSend,
  stopStreaming,
  onClearConversation,
  activeProvider,
  placeholder,
  contextLabel,
  contextType,
  prefillText,
  onPrefillConsumed,
}: ChatBodyProps) {
  return (
    <div className="flex flex-col flex-1 min-h-0">
      {/* Messages area */}
      <div className="flex-1 overflow-y-auto min-h-0 px-4 py-4 space-y-4 overscroll-contain">
        {/* Empty state — contextual quick actions (Section 23.8) */}
        {messages.length === 0 && (
          <KiyokoEmptyState
            contextLevel={contextType}
            contextLabel={contextLabel}
            onQuickAction={handleQuickAction}
          />
        )}

        {/* Message list */}
        {messages.map((message) => (
          <ChatMessage
            key={message.id}
            message={message}
            activeAgent={activeAgent}
            projectId={projectId ?? undefined}
            onExecute={handleExecute}
            onCancel={handleCancel}
            onModify={handleModify}
            onSend={handleSend}
            onUndo={undoBatch}
            onWorkflowAction={handleWorkflowAction}
          />
        ))}

        <div ref={messagesEndRef} />
      </div>

      {/* Suggestions — above input */}
      {suggestions.length > 0 && !isStreaming && (
        <div className="shrink-0 px-3 pb-1.5 pt-2 border-t border-border">
          <div className="flex flex-wrap gap-1.5">
            {suggestions.map((suggestion, i) => (
              <button
                key={i}
                type="button"
                onClick={() => handleSuggestionClick(suggestion)}
                className="flex items-center gap-1.5 px-2.5 py-1.5 rounded-lg text-xs font-medium text-muted-foreground bg-muted border border-border hover:border-teal-500/30 hover:text-teal-400 transition-colors duration-150"
              >
                <Sparkles size={10} />
                {suggestion}
              </button>
            ))}
          </div>
        </div>
      )}

      {/* Input */}
      <div className="shrink-0">
        <ChatInput
          onSend={handleSend}
          onStop={stopStreaming}
          onClearConversation={onClearConversation}
          isStreaming={isStreaming}
          activeProvider={activeProvider}
          allowFiles
          placeholder={placeholder}
          contextLabel={contextLabel}
          contextType={contextType}
          prefillText={prefillText}
          onPrefillConsumed={onPrefillConsumed}
        />
      </div>
    </div>
  );
}
