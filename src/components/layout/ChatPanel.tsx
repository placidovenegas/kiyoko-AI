'use client';

import { useState, useRef, useEffect, useCallback, useMemo } from 'react';
import { useParams, useRouter } from 'next/navigation';
import {
  Send, Bot, Loader2, X, Maximize2, Sparkles, Scissors,
  Clock, Users, BookOpen, MessageSquare, Plus,
} from 'lucide-react';
import { cn } from '@/lib/utils/cn';
import { createClient } from '@/lib/supabase/client';
import ReactMarkdown from 'react-markdown';

/* ------------------------------------------------------------------ */
/*  Types                                                              */
/* ------------------------------------------------------------------ */

interface Message {
  id: string;
  role: 'user' | 'assistant';
  content: string;
  timestamp: Date;
}

interface ChatPanelProps {
  onClose: () => void;
}

/* ------------------------------------------------------------------ */
/*  Quick actions                                                      */
/* ------------------------------------------------------------------ */

const QUICK_ACTIONS = [
  { label: 'Revisar personajes', icon: Users, prompt: 'Revisa los personajes del storyboard y dime si hay inconsistencias' },
  { label: 'Reducir escenas', icon: Scissors, prompt: 'Sugiere que escenas se pueden eliminar o fusionar' },
  { label: 'Ordenar timeline', icon: Clock, prompt: 'Revisa el orden de las escenas y sugiere mejoras' },
  { label: 'Explicar el video', icon: BookOpen, prompt: 'Explicame el video completo que cuenta este storyboard' },
  { label: 'Generar prompts', icon: Sparkles, prompt: 'Genera prompts de imagen para las escenas que no tengan' },
] as const;

/* ------------------------------------------------------------------ */
/*  ChatPanel — same chat everywhere                                   */
/* ------------------------------------------------------------------ */

export function ChatPanel({ onClose }: ChatPanelProps) {
  const params = useParams();
  const router = useRouter();
  const messagesEndRef = useRef<HTMLDivElement>(null);
  const textareaRef = useRef<HTMLTextAreaElement>(null);
  const projectSlug = params?.slug as string | undefined;

  const [messages, setMessages] = useState<Message[]>([]);
  const [input, setInput] = useState('');
  const [isLoading, setIsLoading] = useState(false);
  const [projectTitle, setProjectTitle] = useState<string | null>(null);
  const [projectId, setProjectId] = useState<string | null>(null);
  const [conversationId, setConversationId] = useState<string | null>(null);
  const [conversations, setConversations] = useState<{ id: string; title: string; created_at: string }[]>([]);
  const [showHistory, setShowHistory] = useState(false);

  // Fetch project info
  useEffect(() => {
    if (!projectSlug) return;
    const supabase = createClient();
    supabase.from('projects').select('id, title').eq('slug', projectSlug).single()
      .then(({ data }) => {
        if (data) { setProjectTitle(data.title); setProjectId(data.id); }
      });
  }, [projectSlug]);

  // Load conversation history
  useEffect(() => {
    if (!projectId) return;
    const supabase = createClient();
    supabase.from('ai_conversations').select('id, title, created_at')
      .eq('project_id', projectId).eq('conversation_type', 'storyboard')
      .order('updated_at', { ascending: false }).limit(20)
      .then(({ data }) => { if (data) setConversations(data); });
  }, [projectId]);

  // Auto scroll
  useEffect(() => {
    messagesEndRef.current?.scrollIntoView({ behavior: 'smooth' });
  }, [messages]);

  // Conversation history for API
  const conversationHistory = useMemo(() =>
    messages.map((m) => ({ role: m.role, content: m.content })),
  [messages]);

  // Save conversation
  const saveConversation = useCallback(async (msgs: Message[]) => {
    if (msgs.length === 0 || !projectId) return;
    const supabase = createClient();
    const serialized = msgs.map(m => ({ id: m.id, role: m.role, content: m.content, timestamp: m.timestamp.toISOString() }));
    const title = msgs.find(m => m.role === 'user')?.content.slice(0, 60) || 'Chat';
    if (conversationId) {
      await supabase.from('ai_conversations').update({ messages: serialized, title }).eq('id', conversationId);
    } else {
      const { data } = await supabase.from('ai_conversations').insert({
        project_id: projectId, conversation_type: 'storyboard', title, messages: serialized,
      }).select('id').single();
      if (data) setConversationId(data.id);
    }
  }, [conversationId, projectId]);

  // Load conversation
  const loadConversation = useCallback(async (convId: string) => {
    const supabase = createClient();
    const { data } = await supabase.from('ai_conversations').select('id, messages').eq('id', convId).single();
    if (data && Array.isArray(data.messages)) {
      setConversationId(data.id);
      setMessages(data.messages.map((m: Record<string, unknown>) => ({
        id: (m.id as string) || `msg-${Date.now()}`,
        role: m.role as 'user' | 'assistant',
        content: m.content as string,
        timestamp: new Date((m.timestamp as string) || Date.now()),
      })));
      setShowHistory(false);
    }
  }, []);

  // New conversation
  const startNew = useCallback(() => {
    setMessages([]); setConversationId(null); setShowHistory(false);
  }, []);

  // Input handler
  function handleInputChange(e: React.ChangeEvent<HTMLTextAreaElement>) {
    setInput(e.target.value);
    const ta = e.target;
    ta.style.height = 'auto';
    ta.style.height = `${Math.min(ta.scrollHeight, 120)}px`;
  }

  // Send message
  const handleSend = useCallback(async (messageText?: string) => {
    const text = (messageText ?? input).trim();
    if (!text || isLoading) return;

    const userMessage: Message = { id: `user-${Date.now()}`, role: 'user', content: text, timestamp: new Date() };
    setMessages((prev) => [...prev, userMessage]);
    setInput('');
    setIsLoading(true);
    if (textareaRef.current) textareaRef.current.style.height = 'auto';

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

      if (!res.ok) throw new Error('Failed');

      setMessages((prev) => [...prev, { id: assistantId, role: 'assistant', content: '', timestamp: new Date() }]);

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
            const lines = chunk.split('\n');
            for (const line of lines) {
              if (line.startsWith('data: ')) {
                try {
                  const data = JSON.parse(line.slice(6));
                  if (data.text) {
                    fullContent += data.text;
                    setMessages((prev) => prev.map((m) => m.id === assistantId ? { ...m, content: fullContent } : m));
                  }
                } catch { /* partial */ }
              }
            }
          }
        }
      }
    } catch {
      setMessages((prev) => [...prev, {
        id: `error-${Date.now()}`, role: 'assistant',
        content: 'Lo siento, hubo un error. Intenta de nuevo.', timestamp: new Date(),
      }]);
    } finally {
      setIsLoading(false);
      setMessages((current) => { saveConversation(current); return current; });
    }
  }, [input, isLoading, projectId, conversationHistory, saveConversation]);

  function handleKeyDown(e: React.KeyboardEvent) {
    if (e.key === 'Enter' && !e.shiftKey) { e.preventDefault(); handleSend(); }
  }

  return (
    <div className="flex flex-col h-full bg-background">
      {/* Header */}
      <div className="flex items-center justify-between h-12 px-4 shrink-0 border-b border-border">
        <div className="flex items-center gap-2 min-w-0">
          <div className="flex items-center justify-center size-6 rounded-lg bg-primary/10">
            <Bot size={14} className="text-primary" />
          </div>
          <span className="text-sm font-semibold text-foreground">Kiyoko AI</span>
          {projectTitle && <span className="text-xs text-muted-foreground truncate">· {projectTitle}</span>}
        </div>
        <div className="flex items-center gap-0.5">
          <button type="button" onClick={() => setShowHistory(!showHistory)} className="flex items-center justify-center size-7 rounded-md text-muted-foreground hover:text-foreground hover:bg-accent transition-colors" title="Historial">
            <MessageSquare size={14} />
          </button>
          <button type="button" onClick={startNew} className="flex items-center justify-center size-7 rounded-md text-muted-foreground hover:text-foreground hover:bg-accent transition-colors" title="Nuevo chat">
            <Plus size={14} />
          </button>
          {projectSlug && (
            <button type="button" onClick={() => { router.push(`/project/${projectSlug}/chat`); onClose(); }} className="flex items-center justify-center size-7 rounded-md text-muted-foreground hover:text-foreground hover:bg-accent transition-colors" title="Pantalla completa">
              <Maximize2 size={14} />
            </button>
          )}
          <button type="button" onClick={onClose} className="flex items-center justify-center size-7 rounded-md text-muted-foreground hover:text-foreground hover:bg-accent transition-colors" title="Cerrar">
            <X size={14} />
          </button>
        </div>
      </div>

      {/* History dropdown */}
      {showHistory && (
        <div className="border-b border-border bg-card max-h-48 overflow-y-auto">
          {conversations.length === 0 ? (
            <p className="px-3 py-4 text-center text-xs text-muted-foreground">Sin conversaciones previas</p>
          ) : conversations.map((conv) => (
            <button key={conv.id} type="button" onClick={() => loadConversation(conv.id)}
              className={cn('flex items-center gap-2 w-full px-3 py-2 text-left transition-colors hover:bg-accent', conversationId === conv.id && 'bg-accent')}>
              <MessageSquare size={12} className="shrink-0 text-muted-foreground" />
              <div className="min-w-0 flex-1">
                <p className="text-xs font-medium text-foreground truncate">{conv.title}</p>
                <p className="text-[10px] text-muted-foreground">
                  {new Date(conv.created_at).toLocaleDateString('es-ES', { day: 'numeric', month: 'short' })}
                </p>
              </div>
            </button>
          ))}
        </div>
      )}

      {/* Messages */}
      <div className="flex-1 overflow-y-auto px-4 py-4 space-y-4 min-h-0">
        {messages.length === 0 && (
          <div className="flex flex-col items-center justify-center h-full text-center">
            <div className="flex items-center justify-center size-12 rounded-2xl bg-primary/10 mb-3">
              <Bot size={24} className="text-primary" />
            </div>
            <p className="text-sm font-medium text-foreground mb-1">Director Creativo</p>
            <p className="text-xs text-muted-foreground max-w-52">
              Puedo analizar, modificar y mejorar tu storyboard. Dime que necesitas.
            </p>
            <div className="flex flex-wrap gap-1.5 mt-4 justify-center">
              {QUICK_ACTIONS.map((action) => (
                <button key={action.label} type="button" onClick={() => handleSend(action.prompt)}
                  className="flex items-center gap-1.5 px-2.5 py-1.5 rounded-lg text-xs font-medium text-muted-foreground bg-card border border-border hover:border-primary/30 hover:text-primary transition-colors">
                  <action.icon size={12} />{action.label}
                </button>
              ))}
            </div>
          </div>
        )}

        {messages.map((message) => (
          <div key={message.id} className={cn('flex gap-2.5', message.role === 'user' ? 'justify-end' : 'justify-start')}>
            {message.role === 'assistant' && (
              <div className="flex items-start shrink-0 pt-0.5">
                <div className="flex items-center justify-center size-6 rounded-lg bg-primary/10">
                  <Bot size={14} className="text-primary" />
                </div>
              </div>
            )}
            <div className={cn('max-w-[85%] rounded-xl px-3 py-2 text-sm leading-relaxed',
              message.role === 'user' ? 'bg-primary text-primary-foreground' : 'bg-card text-foreground border border-border')}>
              {message.role === 'assistant' && message.content ? (
                <div className="prose prose-sm prose-invert max-w-none prose-p:my-1 prose-headings:text-foreground">
                  <ReactMarkdown>{message.content}</ReactMarkdown>
                </div>
              ) : message.content ? (
                message.content
              ) : (
                <span className="flex items-center gap-1 text-muted-foreground">
                  <Loader2 size={12} className="animate-spin" />Pensando...
                </span>
              )}
            </div>
          </div>
        ))}
        <div ref={messagesEndRef} />
      </div>

      {/* Input */}
      <div className="shrink-0 px-4 py-3 border-t border-border">
        <div className="flex items-end gap-2 bg-card border border-border rounded-xl px-3 py-2 focus-within:border-primary/40 transition-colors">
          <textarea ref={textareaRef} value={input} onChange={handleInputChange} onKeyDown={handleKeyDown}
            placeholder="Describe los cambios que necesitas..." rows={1}
            className="flex-1 bg-transparent text-sm text-foreground placeholder:text-muted-foreground resize-none outline-none max-h-30" />
          <button type="button" onClick={() => handleSend()} disabled={!input.trim() || isLoading}
            className={cn('flex items-center justify-center size-7 rounded-lg shrink-0 transition-colors',
              input.trim() && !isLoading ? 'bg-primary text-primary-foreground hover:bg-primary/90' : 'text-muted-foreground cursor-not-allowed')}>
            {isLoading ? <Loader2 size={14} className="animate-spin" /> : <Send size={14} />}
          </button>
        </div>
      </div>
    </div>
  );
}
