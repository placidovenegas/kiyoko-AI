'use client';

import { useRef, useEffect, useCallback, useState } from 'react';
import {
  Bot,
  Plus,
  MessageSquare,
  Maximize2,
  Minimize2,
  X,
  Sparkles,
  Scissors,
  Clock,
  Users,
  BookOpen,
  Database,
  Palette,
  FileText,
  Film,
  ChevronDown,
} from 'lucide-react';
import { cn } from '@/lib/utils/cn';
import { useKiyokoChat } from '@/hooks/useKiyokoChat';
import { ChatMessage } from '@/components/chat/ChatMessage';
import { ChatInput } from '@/components/chat/ChatInput';
import { ChatHistorySidebar } from '@/components/chat/ChatHistorySidebar';
import { createClient } from '@/lib/supabase/client';
import type { AiActionPlan } from '@/types/ai-actions';

// ---------------------------------------------------------------------------
// Types
// ---------------------------------------------------------------------------

interface KiyokoChatProps {
  mode: 'panel' | 'expanded';
  onClose?: () => void;
  onToggleExpand?: () => void;
  projectSlug?: string;
}

// ---------------------------------------------------------------------------
// Quick actions
// ---------------------------------------------------------------------------

const QUICK_ACTIONS = [
  { label: 'Revisar personajes', icon: Users, prompt: 'Revisa los personajes y dime si hay inconsistencias o mejoras posibles. Analiza sus descripciones visuales, reglas y apariciones.' },
  { label: 'Reducir escenas', icon: Scissors, prompt: 'Analiza todas las escenas y sugiere cuales eliminar, fusionar o acortar. Justifica cada sugerencia.' },
  { label: 'Ordenar timeline', icon: Clock, prompt: 'Revisa el orden de las escenas, los arcos narrativos y el timeline. Sugiere mejoras en la estructura.' },
  { label: 'Explicar proyecto', icon: BookOpen, prompt: 'Explicame el proyecto completo: la historia, las escenas, los personajes, los fondos y el flujo narrativo.' },
  { label: 'Generar prompts', icon: Sparkles, prompt: 'Genera prompts de imagen profesionales en ingles para todas las escenas que no tengan prompt. Incluye estilo, composicion y detalles.' },
  { label: 'Estado de la DB', icon: Database, prompt: 'Dame un resumen del estado actual de la base de datos: cuantas escenas, personajes, fondos, problemas detectados y que falta por completar.' },
  { label: 'Mejorar paleta', icon: Palette, prompt: 'Analiza la paleta de colores del proyecto y sugiere mejoras basadas en el estilo visual y la plataforma objetivo.' },
  { label: 'Revisar issues', icon: FileText, prompt: 'Revisa los problemas detectados en el proyecto (project_issues) y dame un plan para resolverlos.' },
] as const;

// ---------------------------------------------------------------------------
// KiyokoChat
// ---------------------------------------------------------------------------

export function KiyokoChat({ mode, onClose, onToggleExpand, projectSlug }: KiyokoChatProps) {
  const messagesEndRef = useRef<HTMLDivElement>(null);
  const [projectTitle, setProjectTitle] = useState<string | null>(null);
  const [showHistoryDropdown, setShowHistoryDropdown] = useState(false);

  const {
    messages,
    isStreaming,
    conversationId,
    conversations,
    isExpanded,
    attachedImages,
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
    addImages,
    removeImage,
    clearSuggestions,
    videoCuts,
    activeVideoCutId,
    setActiveVideoCut,
  } = useKiyokoChat();

  // ---- Fetch project info & set project context ----
  useEffect(() => {
    if (!projectSlug) return;
    const supabase = createClient();
    supabase
      .from('projects')
      .select('id, title')
      .eq('slug', projectSlug)
      .single()
      .then(({ data }) => {
        if (data) {
          setProjectTitle(data.title as string);
          setProject(data.id as string, projectSlug);
        }
      });
  }, [projectSlug, setProject]);

  // ---- Load conversations on mount ----
  useEffect(() => {
    loadConversations();
  }, [loadConversations]);

  // ---- Auto scroll to bottom ----
  useEffect(() => {
    messagesEndRef.current?.scrollIntoView({ behavior: 'smooth' });
  }, [messages]);

  // ---- Send message handler ----
  const handleSend = useCallback(
    (text: string) => {
      sendMessage(text);
    },
    [sendMessage],
  );

  // ---- Quick action handler ----
  const handleQuickAction = useCallback(
    (prompt: string) => {
      sendMessage(prompt);
    },
    [sendMessage],
  );

  // ---- Suggestion click handler ----
  const handleSuggestionClick = useCallback(
    (suggestion: string) => {
      sendMessage(suggestion);
      clearSuggestions();
    },
    [sendMessage, clearSuggestions],
  );

  // ---- Action plan handlers ----
  const handleExecute = useCallback(
    (messageId: string, plan: AiActionPlan) => {
      executeActionPlan(messageId, plan);
    },
    [executeActionPlan],
  );

  const handleCancel = useCallback(
    (messageId: string) => {
      cancelActionPlan(messageId);
    },
    [cancelActionPlan],
  );

  const handleModify = useCallback(
    (prefill: string) => {
      // The ChatInput doesn't expose setInput, so we send the prefill as a suggestion
      // In practice, this would focus the input and prefill it
    },
    [],
  );

  const handleHistorySelect = useCallback(
    (convId: string) => {
      loadConversation(convId);
      setShowHistoryDropdown(false);
    },
    [loadConversation],
  );

  const handleNewChat = useCallback(() => {
    startNewConversation();
    setShowHistoryDropdown(false);
  }, [startNewConversation]);

  const isExpandedMode = mode === 'expanded';

  return (
    <div className={cn('flex flex-col bg-background h-full', isExpandedMode && 'flex-row')}>
      {/* ---- History sidebar (expanded mode only) ---- */}
      {isExpandedMode && (
        <ChatHistorySidebar
          conversations={conversations}
          activeConversationId={conversationId}
          onSelect={handleHistorySelect}
          onNewChat={handleNewChat}
        />
      )}

      {/* ---- Main chat area ---- */}
      <div className="flex flex-col flex-1 min-w-0 h-full">
        {/* ---- Header ---- */}
        <div className="flex items-center gap-2 h-11 px-3 shrink-0 border-b border-border bg-card/50">
          <div className="flex items-center justify-center size-7 rounded-lg bg-primary/10">
            <Bot size={15} className="text-primary" />
          </div>
          <div className="flex-1 min-w-0">
            <span className="text-xs font-semibold text-foreground">Kiyoko AI</span>
            {projectTitle && (
              <span className="text-[11px] text-muted-foreground ml-1.5 truncate">
                — {projectTitle}
              </span>
            )}
            {isStreaming && !videoCuts.length && (
              <span className="text-[10px] text-primary ml-2 animate-pulse">
                respondiendo...
              </span>
            )}
          </div>
          <div className="flex items-center gap-0.5">
            {/* History toggle (panel mode — dropdown) */}
            {!isExpandedMode && (
              <button
                type="button"
                onClick={() => setShowHistoryDropdown(!showHistoryDropdown)}
                className={cn(
                  'flex items-center justify-center size-7 rounded-md transition-colors',
                  showHistoryDropdown
                    ? 'text-primary bg-primary/10'
                    : 'text-muted-foreground hover:text-foreground hover:bg-accent',
                )}
                title="Historial"
              >
                <MessageSquare size={14} />
              </button>
            )}
            {/* New chat */}
            <button
              type="button"
              onClick={handleNewChat}
              className="flex items-center justify-center size-7 rounded-md text-muted-foreground hover:text-foreground hover:bg-accent transition-colors"
              title="Nuevo chat"
            >
              <Plus size={14} />
            </button>
            {/* Expand / Minimize */}
            {onToggleExpand && (
              <button
                type="button"
                onClick={onToggleExpand}
                className="flex items-center justify-center size-7 rounded-md text-muted-foreground hover:text-foreground hover:bg-accent transition-colors"
                title={isExpandedMode ? 'Minimizar' : 'Expandir'}
              >
                {isExpandedMode ? <Minimize2 size={14} /> : <Maximize2 size={14} />}
              </button>
            )}
            {/* Close */}
            {onClose && !isExpandedMode && (
              <button
                type="button"
                onClick={onClose}
                className="flex items-center justify-center size-7 rounded-md text-muted-foreground hover:text-foreground hover:bg-accent transition-colors"
                title="Cerrar"
              >
                <X size={14} />
              </button>
            )}
          </div>
        </div>

        {/* ---- History dropdown (panel mode) ---- */}
        {!isExpandedMode && showHistoryDropdown && (
          <div className="border-b border-border bg-card max-h-52 overflow-y-auto shrink-0">
            {conversations.length === 0 ? (
              <p className="px-3 py-4 text-center text-xs text-muted-foreground">
                Sin conversaciones previas
              </p>
            ) : (
              conversations.map((conv) => (
                <button
                  key={conv.id}
                  type="button"
                  onClick={() => handleHistorySelect(conv.id)}
                  className={cn(
                    'flex items-center gap-2.5 w-full px-3 py-2 text-left transition-colors hover:bg-accent',
                    conversationId === conv.id && 'bg-accent',
                  )}
                >
                  <MessageSquare size={12} className="shrink-0 text-muted-foreground" />
                  <div className="min-w-0 flex-1">
                    <p className="text-xs font-medium text-foreground truncate">{conv.title}</p>
                    <p className="text-[10px] text-muted-foreground">
                      {new Date(conv.created_at).toLocaleDateString('es-ES', {
                        day: 'numeric',
                        month: 'short',
                      })}
                      {' · '}
                      {conv.message_count} msgs
                    </p>
                  </div>
                </button>
              ))
            )}
          </div>
        )}

        {/* ---- Video cut selector ---- */}
        {videoCuts.length > 0 && (
          <div className="shrink-0 px-3 py-1.5 border-b border-border bg-card/30 flex items-center gap-1.5 overflow-x-auto">
            <Film size={12} className="text-muted-foreground shrink-0" />
            {videoCuts.map((cut) => (
              <button
                key={cut.id}
                type="button"
                onClick={() => setActiveVideoCut(cut.id)}
                className={cn(
                  'flex items-center gap-1.5 px-2.5 py-1 rounded-md text-[11px] font-medium whitespace-nowrap transition-colors',
                  activeVideoCutId === cut.id
                    ? 'bg-primary/15 text-primary border border-primary/30'
                    : 'text-muted-foreground hover:text-foreground hover:bg-accent border border-transparent',
                )}
              >
                <span className="size-2 rounded-full shrink-0" style={{ backgroundColor: cut.color }} />
                {cut.name}
                <span className="text-[9px] opacity-60">{cut.target_duration_seconds}s</span>
              </button>
            ))}
          </div>
        )}

        {/* ---- Messages area ---- */}
        <div className="flex-1 overflow-y-auto min-h-0 px-4 py-4 space-y-4">
          {/* Empty state */}
          {messages.length === 0 && (
            <div className="flex flex-col items-center justify-center h-full text-center">
              <div className="flex items-center justify-center size-16 rounded-2xl bg-primary/10 mb-4">
                <Bot size={32} className="text-primary" />
              </div>
              <p className="text-base font-semibold text-foreground mb-1">
                Kiyoko AI
              </p>
              <p className="text-sm text-muted-foreground max-w-sm mb-6">
                Tu directora creativa. Puedo analizar, modificar y mejorar cualquier parte de tu proyecto.
              </p>

              {/* Quick actions grid */}
              <div className="grid grid-cols-2 gap-2 max-w-md w-full">
                {QUICK_ACTIONS.map((action) => (
                  <button
                    key={action.label}
                    type="button"
                    onClick={() => handleQuickAction(action.prompt)}
                    className={cn(
                      'flex items-center gap-2 px-3 py-2.5 rounded-xl text-left',
                      'text-xs font-medium text-muted-foreground',
                      'bg-card border border-border',
                      'hover:border-primary/30 hover:text-primary hover:bg-primary/5',
                      'transition-all duration-150',
                    )}
                  >
                    <action.icon size={14} className="shrink-0" />
                    <span>{action.label}</span>
                  </button>
                ))}
              </div>
            </div>
          )}

          {/* Message list */}
          {messages.map((message) => (
            <ChatMessage
              key={message.id}
              message={message}
              onExecute={handleExecute}
              onCancel={handleCancel}
              onModify={handleModify}
              onUndo={undoBatch}
            />
          ))}

          <div ref={messagesEndRef} />
        </div>

        {/* ---- Suggestions bar ---- */}
        {suggestions.length > 0 && !isStreaming && (
          <div className="shrink-0 px-3 py-2 border-t border-border bg-card/50">
            <p className="text-[10px] font-semibold text-muted-foreground uppercase tracking-wider mb-1.5">
              Sugerencias
            </p>
            <div className="flex flex-wrap gap-1.5">
              {suggestions.map((suggestion, i) => (
                <button
                  key={i}
                  type="button"
                  onClick={() => handleSuggestionClick(suggestion)}
                  className={cn(
                    'flex items-center gap-1.5 px-2.5 py-1.5 rounded-lg',
                    'text-xs font-medium text-muted-foreground',
                    'bg-background border border-border',
                    'hover:border-primary/30 hover:text-primary',
                    'transition-colors duration-150',
                  )}
                >
                  <Sparkles size={10} />
                  {suggestion}
                </button>
              ))}
            </div>
          </div>
        )}

        {/* ---- Input area ---- */}
        <ChatInput
          onSend={handleSend}
          onStop={stopStreaming}
          isStreaming={isStreaming}
          activeProvider={activeProvider}
          placeholder={
            projectTitle
              ? `Preguntale a Kiyoko sobre "${projectTitle}"...`
              : 'Escribe un mensaje...'
          }
        />
      </div>
    </div>
  );
}
