'use client';

import { useState, useRef, useEffect, useCallback, useMemo } from 'react';
import {
  Send,
  Bot,
  Loader2,
  Check,
  X,
  Pencil,
  Trash2,
  Plus,
  ArrowUpDown,
  UserPlus,
  UserMinus,
  ImageIcon,
  MessageSquare,
  Undo2,
  AlertTriangle,
  Sparkles,
  Scissors,
  Clock,
  Users,
  BookOpen,
} from 'lucide-react';
import { cn } from '@/lib/utils/cn';
import { toast } from 'sonner';
import ReactMarkdown from 'react-markdown';
import type { Scene } from '@/types/scene';
import type { Character } from '@/types/character';
import type { Background } from '@/types/background';
import type { AiActionPlan, AiAction, AiActionResult } from '@/types/ai-actions';
import { executeActionPlan, undoBatch } from '@/lib/ai/action-executor';
import { createClient } from '@/lib/supabase/client';

/* ------------------------------------------------------------------ */
/*  Types                                                              */
/* ------------------------------------------------------------------ */

interface Message {
  id: string;
  role: 'user' | 'assistant';
  content: string;
  timestamp: Date;
  actionPlan?: AiActionPlan;
  executionResults?: AiActionResult[];
  executedBatchId?: string;
}

interface ChatStoryboardProps {
  projectId: string;
  scenes: Scene[];
  characters: Character[];
  backgrounds: Background[];
  onRefresh: () => void;
}

/* ------------------------------------------------------------------ */
/*  Quick action chips                                                 */
/* ------------------------------------------------------------------ */

const QUICK_ACTIONS = [
  { label: 'Revisar personajes', icon: Users, prompt: 'Revisa los personajes del storyboard y dime si hay inconsistencias visuales entre escenas' },
  { label: 'Reducir escenas', icon: Scissors, prompt: 'Analiza el storyboard y sugiere que escenas se pueden eliminar o fusionar para hacerlo mas corto' },
  { label: 'Ordenar timeline', icon: Clock, prompt: 'Revisa el orden de las escenas y sugiere un mejor orden para el arco narrativo' },
  { label: 'Explicar el video', icon: BookOpen, prompt: 'Explicame el video completo que cuenta este storyboard, escena por escena' },
  { label: 'Generar prompts faltantes', icon: Sparkles, prompt: 'Revisa todas las escenas y genera prompts de imagen para las que no tengan uno' },
] as const;

/* ------------------------------------------------------------------ */
/*  Action type icons                                                  */
/* ------------------------------------------------------------------ */

function getActionIcon(type: AiAction['type']) {
  switch (type) {
    case 'delete_scene': return <Trash2 size={14} className="text-red-400" />;
    case 'update_scene': return <Pencil size={14} className="text-amber-400" />;
    case 'create_scene': return <Plus size={14} className="text-emerald-400" />;
    case 'reorder_scenes': return <ArrowUpDown size={14} className="text-blue-400" />;
    case 'update_character': return <Pencil size={14} className="text-purple-400" />;
    case 'remove_character_from_scene': return <UserMinus size={14} className="text-red-400" />;
    case 'add_character_to_scene': return <UserPlus size={14} className="text-emerald-400" />;
    case 'update_prompt': return <ImageIcon size={14} className="text-cyan-400" />;
    case 'explain': return <MessageSquare size={14} className="text-foreground/40" />;
    default: return <Pencil size={14} className="text-foreground/40" />;
  }
}

/* ------------------------------------------------------------------ */
/*  Parse action plan from AI response                                 */
/* ------------------------------------------------------------------ */

function parseActionPlan(content: string): AiActionPlan | null {
  const jsonMatch = content.match(/```json\s*([\s\S]*?)```/);
  if (!jsonMatch) return null;

  try {
    const parsed = JSON.parse(jsonMatch[1]);
    if (parsed.type === 'action_plan' && Array.isArray(parsed.actions)) {
      return {
        summary_es: parsed.summary_es || '',
        actions: parsed.actions,
        total_scenes_affected: parsed.total_scenes_affected || 0,
        warnings: parsed.warnings || [],
      };
    }
  } catch {
    // Not a valid action plan
  }
  return null;
}

/** Extract text outside of the JSON code block */
function extractTextContent(content: string): string {
  return content.replace(/```json\s*[\s\S]*?```/g, '').trim();
}

/* ------------------------------------------------------------------ */
/*  ActionPlanCard                                                     */
/* ------------------------------------------------------------------ */

interface ActionPlanCardProps {
  plan: AiActionPlan;
  isExecuting: boolean;
  results: AiActionResult[] | null;
  batchId: string | null;
  onExecute: () => void;
  onCancel: () => void;
  onModify: (text: string) => void;
  onUndo: (batchId: string) => void;
}

function ActionPlanCard({
  plan,
  isExecuting,
  results,
  batchId,
  onExecute,
  onCancel,
  onModify,
  onUndo,
}: ActionPlanCardProps) {
  const executed = results !== null;
  const allSuccess = results?.every((r) => r.success) ?? false;

  return (
    <div className="rounded-xl border border-foreground/6 bg-surface-secondary overflow-hidden">
      {/* Summary */}
      <div className="px-4 py-3 border-b border-foreground/6">
        <p className="text-sm font-medium text-foreground">{plan.summary_es}</p>
        <p className="text-xs text-foreground/40 mt-1">
          {plan.total_scenes_affected} escena{plan.total_scenes_affected !== 1 ? 's' : ''} afectada{plan.total_scenes_affected !== 1 ? 's' : ''}
        </p>
      </div>

      {/* Actions list */}
      <div className="divide-y divide-foreground/6">
        {plan.actions.map((action, i) => {
          const result = results?.find((r) => r.actionId === action.id);
          return (
            <div key={action.id || i} className="px-4 py-2.5 flex items-start gap-2.5">
              <div className="mt-0.5 shrink-0">{getActionIcon(action.type)}</div>
              <div className="flex-1 min-w-0">
                <div className="flex items-center gap-2">
                  {action.target.sceneNumber && (
                    <span className="text-[10px] font-mono font-bold text-primary bg-primary/10 px-1.5 py-0.5 rounded">
                      {action.target.sceneNumber}
                    </span>
                  )}
                  {action.target.characterName && (
                    <span className="text-[10px] font-medium text-purple-400 bg-purple-400/10 px-1.5 py-0.5 rounded">
                      {action.target.characterName}
                    </span>
                  )}
                </div>
                <p className="text-xs text-foreground/70 mt-1">{action.description_es}</p>
                {action.changes.length > 0 && (
                  <div className="mt-1.5 space-y-1">
                    {action.changes.map((change, ci) => (
                      <div key={ci} className="text-[11px] font-mono">
                        <span className="text-foreground/30">{change.field}: </span>
                        {change.oldValue !== null && (
                          <span className="text-red-400/60 line-through mr-1">
                            {String(change.oldValue).slice(0, 60)}
                          </span>
                        )}
                        {change.newValue !== null && (
                          <span className="text-emerald-400">
                            {String(change.newValue).slice(0, 80)}
                          </span>
                        )}
                      </div>
                    ))}
                  </div>
                )}
              </div>
              {/* Result indicator */}
              {result && (
                <div className="shrink-0 mt-0.5">
                  {result.success ? (
                    <Check size={14} className="text-emerald-400" />
                  ) : (
                    <X size={14} className="text-red-400" />
                  )}
                </div>
              )}
            </div>
          );
        })}
      </div>

      {/* Warnings */}
      {plan.warnings.length > 0 && (
        <div className="px-4 py-2.5 border-t border-foreground/6 bg-amber-500/5">
          {plan.warnings.map((warning, i) => (
            <div key={i} className="flex items-start gap-2 text-xs text-amber-400">
              <AlertTriangle size={12} className="shrink-0 mt-0.5" />
              <span>{warning}</span>
            </div>
          ))}
        </div>
      )}

      {/* Execution results summary */}
      {executed && (
        <div className="px-4 py-2.5 border-t border-foreground/6 bg-emerald-500/5">
          <div className="flex items-center gap-2">
            {allSuccess ? (
              <Check size={14} className="text-emerald-400" />
            ) : (
              <AlertTriangle size={14} className="text-amber-400" />
            )}
            <span className="text-xs font-medium text-foreground">
              {allSuccess
                ? `${results!.length} cambio${results!.length !== 1 ? 's' : ''} aplicado${results!.length !== 1 ? 's' : ''} correctamente`
                : `${results!.filter((r) => r.success).length}/${results!.length} cambios aplicados`}
            </span>
          </div>
          {results?.filter((r) => !r.success).map((r) => (
            <p key={r.actionId} className="text-[11px] text-red-400 mt-1">
              Error: {r.error}
            </p>
          ))}
        </div>
      )}

      {/* Action buttons */}
      <div className="px-4 py-3 border-t border-foreground/6 flex items-center gap-2">
        {!executed ? (
          <>
            <button
              type="button"
              onClick={onExecute}
              disabled={isExecuting}
              className={cn(
                'flex items-center gap-1.5 px-3 py-1.5 rounded-lg text-xs font-medium transition-colors',
                'bg-emerald-500/10 text-emerald-400 hover:bg-emerald-500/20',
                isExecuting && 'opacity-50 cursor-not-allowed',
              )}
            >
              {isExecuting ? (
                <Loader2 size={12} className="animate-spin" />
              ) : (
                <Check size={12} />
              )}
              {isExecuting ? 'Aplicando...' : 'Aplicar cambios'}
            </button>
            <button
              type="button"
              onClick={onCancel}
              disabled={isExecuting}
              className="flex items-center gap-1.5 px-3 py-1.5 rounded-lg text-xs font-medium bg-red-500/10 text-red-400 hover:bg-red-500/20 transition-colors"
            >
              <X size={12} />
              Cancelar
            </button>
            <button
              type="button"
              onClick={() => onModify('Modifica el plan: ')}
              disabled={isExecuting}
              className="flex items-center gap-1.5 px-3 py-1.5 rounded-lg text-xs font-medium bg-foreground/5 text-foreground/60 hover:bg-foreground/10 transition-colors"
            >
              <Pencil size={12} />
              Modificar
            </button>
          </>
        ) : (
          batchId && (
            <button
              type="button"
              onClick={() => onUndo(batchId)}
              className="flex items-center gap-1.5 px-3 py-1.5 rounded-lg text-xs font-medium bg-amber-500/10 text-amber-400 hover:bg-amber-500/20 transition-colors"
            >
              <Undo2 size={12} />
              Deshacer
            </button>
          )
        )}
      </div>
    </div>
  );
}

/* ------------------------------------------------------------------ */
/*  ChatStoryboard                                                     */
/* ------------------------------------------------------------------ */

interface ConversationSummary {
  id: string;
  title: string;
  created_at: string;
  message_count: number;
}

export function ChatStoryboard({
  projectId,
  scenes,
  characters,
  backgrounds,
  onRefresh,
}: ChatStoryboardProps) {
  const messagesEndRef = useRef<HTMLDivElement>(null);
  const textareaRef = useRef<HTMLTextAreaElement>(null);

  const [messages, setMessages] = useState<Message[]>([]);
  const [input, setInput] = useState('');
  const [isLoading, setIsLoading] = useState(false);
  const [executingMessageId, setExecutingMessageId] = useState<string | null>(null);
  const [conversationId, setConversationId] = useState<string | null>(null);
  const [conversations, setConversations] = useState<ConversationSummary[]>([]);
  const [showConversations, setShowConversations] = useState(false);

  /* ---- Get current user ID ---- */
  const [userId, setUserId] = useState<string | null>(null);
  useEffect(() => {
    const supabase = createClient();
    supabase.auth.getUser().then(({ data }) => {
      if (data.user) setUserId(data.user.id);
    });
  }, []);

  /* ---- Load conversations list ---- */
  useEffect(() => {
    const supabase = createClient();
    supabase
      .from('ai_conversations')
      .select('id, title, created_at, messages')
      .eq('project_id', projectId)
      .eq('conversation_type', 'storyboard')
      .order('updated_at', { ascending: false })
      .limit(20)
      .then(({ data }) => {
        if (data) {
          setConversations(data.map((c: Record<string, unknown>) => ({
            id: c.id as string,
            title: c.title as string,
            created_at: c.created_at as string,
            message_count: Array.isArray(c.messages) ? c.messages.length : 0,
          })));
        }
      });
  }, [projectId]);

  /* ---- Load a conversation ---- */
  const loadConversation = useCallback(async (convId: string) => {
    const supabase = createClient();
    const { data } = await supabase
      .from('ai_conversations')
      .select('id, messages')
      .eq('id', convId)
      .single();
    if (data && Array.isArray(data.messages)) {
      setConversationId(data.id);
      setMessages(data.messages.map((m: Record<string, unknown>) => ({
        id: m.id as string || `msg-${Date.now()}`,
        role: m.role as 'user' | 'assistant',
        content: m.content as string,
        timestamp: new Date(m.timestamp as string || Date.now()),
      })));
      setShowConversations(false);
    }
  }, []);

  /* ---- Save conversation to DB ---- */
  const saveConversation = useCallback(async (msgs: Message[]) => {
    if (msgs.length === 0) return;
    const supabase = createClient();
    const serialized = msgs.map(m => ({
      id: m.id,
      role: m.role,
      content: m.content,
      timestamp: m.timestamp.toISOString(),
    }));
    const title = msgs.find(m => m.role === 'user')?.content.slice(0, 60) || 'Chat';

    if (conversationId) {
      await supabase.from('ai_conversations').update({
        messages: serialized,
        title,
      }).eq('id', conversationId);
    } else {
      const { data } = await supabase.from('ai_conversations').insert({
        project_id: projectId,
        conversation_type: 'storyboard',
        title,
        messages: serialized,
      }).select('id').single();
      if (data) setConversationId(data.id);
    }
  }, [conversationId, projectId]);

  /* ---- New conversation ---- */
  const startNewConversation = useCallback(() => {
    setMessages([]);
    setConversationId(null);
    setShowConversations(false);
  }, []);

  /* ---- Auto scroll to bottom ---- */
  useEffect(() => {
    messagesEndRef.current?.scrollIntoView({ behavior: 'smooth' });
  }, [messages]);

  /* ---- Auto resize textarea ---- */
  const handleInputChange = useCallback((e: React.ChangeEvent<HTMLTextAreaElement>) => {
    setInput(e.target.value);
    const textarea = e.target;
    textarea.style.height = 'auto';
    textarea.style.height = `${Math.min(textarea.scrollHeight, 120)}px`;
  }, []);

  /* ---- Build conversation for API ---- */
  const conversationHistory = useMemo(() => {
    return messages.map((m) => ({ role: m.role, content: m.content }));
  }, [messages]);

  /* ---- Send message ---- */
  const handleSend = useCallback(async (messageText?: string) => {
    const text = (messageText ?? input).trim();
    if (!text || isLoading) return;

    const userMessage: Message = {
      id: `user-${Date.now()}`,
      role: 'user',
      content: text,
      timestamp: new Date(),
    };

    setMessages((prev) => [...prev, userMessage]);
    setInput('');
    setIsLoading(true);

    if (textareaRef.current) {
      textareaRef.current.style.height = 'auto';
    }

    const assistantId = `assistant-${Date.now()}`;

    try {
      const res = await fetch('/api/ai/chat', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          projectId,
          messages: [...conversationHistory, { role: 'user', content: text }],
        }),
      });

      if (!res.ok) throw new Error('Failed to get response');

      setMessages((prev) => [
        ...prev,
        { id: assistantId, role: 'assistant', content: '', timestamp: new Date() },
      ]);

      const reader = res.body?.getReader();
      const decoder = new TextDecoder();
      let fullContent = '';

      if (reader) {
        let done = false;
        while (!done) {
          const { value, done: readerDone } = await reader.read();
          done = readerDone;
          if (value) {
            const chunk = decoder.decode(value, { stream: true });
            // Parse SSE data lines
            const lines = chunk.split('\n');
            for (const line of lines) {
              if (line.startsWith('data: ')) {
                try {
                  const data = JSON.parse(line.slice(6));
                  if (data.text) {
                    fullContent += data.text;
                    setMessages((prev) =>
                      prev.map((m) =>
                        m.id === assistantId ? { ...m, content: fullContent } : m,
                      ),
                    );
                  }
                } catch {
                  // Not valid JSON, might be partial
                }
              }
            }
          }
        }
      }

      // After streaming completes, check if response contains action plan
      const actionPlan = parseActionPlan(fullContent);
      if (actionPlan) {
        setMessages((prev) =>
          prev.map((m) =>
            m.id === assistantId ? { ...m, actionPlan } : m,
          ),
        );
      }
    } catch {
      setMessages((prev) => [
        ...prev,
        {
          id: `error-${Date.now()}`,
          role: 'assistant',
          content: 'Lo siento, hubo un error al procesar tu mensaje. Intenta de nuevo.',
          timestamp: new Date(),
        },
      ]);
    } finally {
      setIsLoading(false);
      // Save conversation after each exchange
      setMessages((current) => { saveConversation(current); return current; });
    }
  }, [input, isLoading, projectId, conversationHistory, saveConversation]);

  /* ---- Execute action plan ---- */
  const handleExecute = useCallback(async (messageId: string, plan: AiActionPlan) => {
    if (!userId) {
      toast.error('No se pudo identificar al usuario');
      return;
    }

    setExecutingMessageId(messageId);

    try {
      const { results, batchId } = await executeActionPlan(plan.actions, projectId, userId);

      setMessages((prev) =>
        prev.map((m) =>
          m.id === messageId
            ? { ...m, executionResults: results, executedBatchId: batchId }
            : m,
        ),
      );

      const successCount = results.filter((r) => r.success).length;
      if (successCount === results.length) {
        toast.success(`${successCount} cambio${successCount !== 1 ? 's' : ''} aplicado${successCount !== 1 ? 's' : ''}`);
      } else {
        toast.warning(`${successCount}/${results.length} cambios aplicados`);
      }

      onRefresh();
    } catch (err) {
      toast.error(err instanceof Error ? err.message : 'Error al ejecutar cambios');
    } finally {
      setExecutingMessageId(null);
    }
  }, [userId, projectId, onRefresh]);

  /* ---- Cancel action plan ---- */
  const handleCancel = useCallback((messageId: string) => {
    setMessages((prev) =>
      prev.map((m) =>
        m.id === messageId ? { ...m, actionPlan: undefined } : m,
      ),
    );
    toast.info('Plan cancelado');
  }, []);

  /* ---- Modify action plan ---- */
  const handleModify = useCallback((prefill: string) => {
    setInput(prefill);
    textareaRef.current?.focus();
  }, []);

  /* ---- Undo batch ---- */
  const handleUndo = useCallback(async (batchId: string) => {
    try {
      const { success, restoredCount } = await undoBatch(batchId);
      if (success) {
        toast.success(`${restoredCount} cambio${restoredCount !== 1 ? 's' : ''} deshecho${restoredCount !== 1 ? 's' : ''}`);
        onRefresh();
      } else {
        toast.error('No se pudieron deshacer los cambios');
      }
    } catch (err) {
      toast.error(err instanceof Error ? err.message : 'Error al deshacer');
    }
  }, [onRefresh]);

  /* ---- Key handler ---- */
  const handleKeyDown = useCallback(
    (e: React.KeyboardEvent) => {
      if (e.key === 'Enter' && !e.shiftKey) {
        e.preventDefault();
        handleSend();
      }
    },
    [handleSend],
  );

  return (
    <div className="flex flex-col h-full bg-background">
      {/* Header */}
      <div className="flex items-center gap-2 h-10 px-3 shrink-0 border-b border-foreground/6">
        <div className="flex items-center justify-center size-5 rounded bg-primary/10">
          <Bot size={12} className="text-primary" />
        </div>
        <span className="text-[12px] font-semibold text-foreground flex-1">Kiyoko AI</span>
        <div className="flex items-center gap-1">
          {/* Conversations history */}
          <button
            type="button"
            onClick={() => setShowConversations(!showConversations)}
            className="flex items-center justify-center size-6 rounded text-foreground/30 hover:text-foreground/60 hover:bg-foreground/5 transition-colors"
            title="Historial de chats"
          >
            <MessageSquare size={13} />
          </button>
          {/* New chat */}
          <button
            type="button"
            onClick={startNewConversation}
            className="flex items-center justify-center size-6 rounded text-foreground/30 hover:text-foreground/60 hover:bg-foreground/5 transition-colors"
            title="Nuevo chat"
          >
            <Plus size={13} />
          </button>
        </div>
      </div>

      {/* Conversations list dropdown */}
      {showConversations && (
        <div className="border-b border-foreground/6 bg-surface-secondary max-h-48 overflow-y-auto">
          {conversations.length === 0 ? (
            <p className="px-3 py-4 text-center text-[11px] text-foreground/30">Sin conversaciones previas</p>
          ) : (
            conversations.map((conv) => (
              <button
                key={conv.id}
                type="button"
                onClick={() => loadConversation(conv.id)}
                className={cn(
                  'flex items-center gap-2 w-full px-3 py-2 text-left transition-colors hover:bg-foreground/5',
                  conversationId === conv.id && 'bg-primary/5',
                )}
              >
                <MessageSquare size={12} className="shrink-0 text-foreground/25" />
                <div className="min-w-0 flex-1">
                  <p className="text-[11px] font-medium text-foreground/70 truncate">{conv.title}</p>
                  <p className="text-[10px] text-foreground/30">
                    {new Date(conv.created_at).toLocaleDateString('es-ES', { day: 'numeric', month: 'short' })}
                    {' · '}{conv.message_count} msgs
                  </p>
                </div>
              </button>
            ))
          )}
        </div>
      )}

      {/* Messages area */}
      <div className="flex-1 overflow-y-auto px-4 py-4 space-y-4">
        {messages.length === 0 && (
          <div className="flex flex-col items-center justify-center h-full text-center">
            <div className="flex items-center justify-center size-12 rounded-2xl bg-primary/10 mb-3">
              <Bot size={24} className="text-primary" />
            </div>
            <p className="text-sm font-medium text-foreground mb-1">
              Director Creativo
            </p>
            <p className="text-xs text-foreground/40 max-w-64">
              Puedo analizar, modificar y mejorar tu storyboard. Dime que necesitas cambiar.
            </p>
            <p className="text-[11px] text-foreground/25 mt-2">
              {scenes.length} escenas - {characters.length} personajes - {backgrounds.length} fondos
            </p>
          </div>
        )}

        {messages.map((message) => (
          <div
            key={message.id}
            className={cn(
              'flex gap-2.5',
              message.role === 'user' ? 'justify-end' : 'justify-start',
            )}
          >
            {message.role === 'assistant' && (
              <div className="flex items-start shrink-0 pt-0.5">
                <div className="flex items-center justify-center size-6 rounded-lg bg-primary/10">
                  <Bot size={14} className="text-primary" />
                </div>
              </div>
            )}
            <div className={cn('max-w-[90%] space-y-3', message.role === 'user' && 'flex justify-end')}>
              {/* Text content */}
              {message.role === 'user' ? (
                <div className="rounded-xl px-3 py-2 text-sm leading-relaxed bg-primary text-primary-foreground">
                  {message.content}
                </div>
              ) : (
                <>
                  {/* Show text portion (outside JSON block) */}
                  {(() => {
                    const textContent = message.actionPlan
                      ? extractTextContent(message.content)
                      : message.content;
                    if (!textContent && !message.actionPlan) {
                      return (
                        <div className="rounded-xl px-3 py-2 text-sm leading-relaxed bg-surface-secondary text-foreground border border-foreground/6">
                          <span className="flex items-center gap-1 text-foreground/40">
                            <Loader2 size={12} className="animate-spin" />
                            Analizando storyboard...
                          </span>
                        </div>
                      );
                    }
                    if (textContent) {
                      return (
                        <div className="rounded-xl px-3 py-2 text-sm leading-relaxed bg-surface-secondary text-foreground border border-foreground/6 prose prose-sm prose-invert max-w-none prose-p:my-1 prose-ul:my-1 prose-ol:my-1 prose-li:my-0.5 prose-headings:text-foreground prose-strong:text-foreground prose-code:text-primary prose-code:bg-surface-tertiary prose-code:px-1 prose-code:py-0.5 prose-code:rounded">
                          <ReactMarkdown>{textContent}</ReactMarkdown>
                        </div>
                      );
                    }
                    return null;
                  })()}

                  {/* Action plan card */}
                  {message.actionPlan && (
                    <ActionPlanCard
                      plan={message.actionPlan}
                      isExecuting={executingMessageId === message.id}
                      results={message.executionResults || null}
                      batchId={message.executedBatchId || null}
                      onExecute={() => handleExecute(message.id, message.actionPlan!)}
                      onCancel={() => handleCancel(message.id)}
                      onModify={handleModify}
                      onUndo={handleUndo}
                    />
                  )}
                </>
              )}
            </div>
          </div>
        ))}

        <div ref={messagesEndRef} />
      </div>

      {/* Quick actions */}
      {messages.length === 0 && (
        <div className="px-4 pb-2 flex flex-wrap gap-1.5">
          {QUICK_ACTIONS.map((action) => (
            <button
              key={action.label}
              type="button"
              onClick={() => handleSend(action.prompt)}
              className={cn(
                'flex items-center gap-1.5 px-2.5 py-1.5 rounded-lg',
                'text-xs font-medium text-foreground/60',
                'bg-surface-secondary border border-foreground/6',
                'hover:border-primary/30 hover:text-primary',
                'transition-colors duration-150',
              )}
            >
              <action.icon size={12} />
              {action.label}
            </button>
          ))}
        </div>
      )}

      {/* Input area */}
      <div className="shrink-0 px-4 py-3 border-t border-foreground/6">
        <div className="flex items-end gap-2 bg-surface-secondary border border-foreground/6 rounded-xl px-3 py-2 focus-within:border-primary/40 transition-colors">
          <textarea
            ref={textareaRef}
            value={input}
            onChange={handleInputChange}
            onKeyDown={handleKeyDown}
            placeholder="Describe los cambios que necesitas..."
            rows={1}
            className={cn(
              'flex-1 bg-transparent text-sm text-foreground placeholder:text-foreground/30',
              'resize-none outline-none max-h-30',
            )}
          />
          <button
            type="button"
            onClick={() => handleSend()}
            disabled={!input.trim() || isLoading}
            className={cn(
              'flex items-center justify-center size-7 rounded-lg shrink-0',
              'transition-colors duration-150',
              input.trim() && !isLoading
                ? 'bg-primary text-primary-foreground hover:bg-primary/90'
                : 'text-foreground/20 cursor-not-allowed',
            )}
          >
            {isLoading ? (
              <Loader2 size={14} className="animate-spin" />
            ) : (
              <Send size={14} />
            )}
          </button>
        </div>
      </div>
    </div>
  );
}
