'use client';

import { useState, useRef, useEffect, useCallback } from 'react';
import { useParams, usePathname } from 'next/navigation';
import {
  X,
  Minimize2,
  Send,
  Bot,
  Sparkles,
  FileText,
  Wand2,
  Loader2,
} from 'lucide-react';
import { cn } from '@/lib/utils/cn';
import { createClient } from '@/lib/supabase/client';

/* ------------------------------------------------------------------ */
/*  Types                                                              */
/* ------------------------------------------------------------------ */

interface Message {
  id: string;
  role: 'user' | 'assistant';
  content: string;
  timestamp: Date;
}

interface ProjectContext {
  id: string;
  name: string;
}

interface ChatPanelProps {
  onClose: () => void;
}

/* ------------------------------------------------------------------ */
/*  Quick action chips                                                 */
/* ------------------------------------------------------------------ */

const QUICK_ACTIONS = [
  { label: 'Resumir', icon: FileText, prompt: 'Resume el contenido de este proyecto' },
  { label: 'Mejorar', icon: Wand2, prompt: 'Sugiere mejoras para este proyecto' },
  { label: 'Ideas', icon: Sparkles, prompt: 'Dame ideas creativas para este proyecto' },
] as const;

/* ------------------------------------------------------------------ */
/*  ChatPanel                                                          */
/* ------------------------------------------------------------------ */

export function ChatPanel({ onClose }: ChatPanelProps) {
  const params = useParams();
  const pathname = usePathname();
  const messagesEndRef = useRef<HTMLDivElement>(null);
  const textareaRef = useRef<HTMLTextAreaElement>(null);

  const [messages, setMessages] = useState<Message[]>([]);
  const [input, setInput] = useState('');
  const [isLoading, setIsLoading] = useState(false);
  const [projectContext, setProjectContext] = useState<ProjectContext | null>(null);

  // Extract project ID from URL
  const projectId = params?.id as string | undefined;

  /* ---- Fetch project context ---- */
  useEffect(() => {
    if (!projectId) {
      setProjectContext(null);
      return;
    }

    async function fetchProject() {
      const supabase = createClient();
      const { data } = await supabase
        .from('projects')
        .select('id, name')
        .eq('id', projectId)
        .single();

      if (data) {
        setProjectContext({ id: data.id, name: data.name });
      }
    }

    fetchProject();
  }, [projectId]);

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

    // Reset textarea height
    if (textareaRef.current) {
      textareaRef.current.style.height = 'auto';
    }

    try {
      const res = await fetch('/api/ai/chat', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          message: text,
          projectId: projectContext?.id,
          history: messages.map((m) => ({ role: m.role, content: m.content })),
        }),
      });

      if (!res.ok) throw new Error('Failed to get response');

      // Handle streaming response
      const reader = res.body?.getReader();
      const decoder = new TextDecoder();

      const assistantId = `assistant-${Date.now()}`;
      setMessages((prev) => [
        ...prev,
        { id: assistantId, role: 'assistant', content: '', timestamp: new Date() },
      ]);

      if (reader) {
        let done = false;
        while (!done) {
          const { value, done: readerDone } = await reader.read();
          done = readerDone;
          if (value) {
            const chunk = decoder.decode(value, { stream: true });
            setMessages((prev) =>
              prev.map((m) =>
                m.id === assistantId ? { ...m, content: m.content + chunk } : m
              )
            );
          }
        }
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
    }
  }, [input, isLoading, messages, projectContext]);

  /* ---- Key handler ---- */
  const handleKeyDown = useCallback(
    (e: React.KeyboardEvent) => {
      if (e.key === 'Enter' && !e.shiftKey) {
        e.preventDefault();
        handleSend();
      }
    },
    [handleSend]
  );

  return (
    <div className="flex flex-col h-full bg-background border-l border-border">
      {/* Header */}
      <div className="flex items-center justify-between h-12 px-4 shrink-0 border-b border-border/40">
        <div className="flex items-center gap-2 min-w-0">
          <Bot size={16} className="shrink-0 text-primary" />
          <div className="min-w-0">
            <span className="text-sm font-semibold text-foreground">Kiyoko AI</span>
            {projectContext && (
              <span className="ml-1.5 text-xs text-foreground/40 truncate">
                - {projectContext.name}
              </span>
            )}
          </div>
        </div>
        <div className="flex items-center gap-1">
          <button
            type="button"
            onClick={onClose}
            className="flex items-center justify-center size-7 rounded-md text-foreground/40 hover:text-foreground hover:bg-card transition-colors"
            title="Minimizar"
          >
            <Minimize2 size={14} />
          </button>
          <button
            type="button"
            onClick={onClose}
            className="flex items-center justify-center size-7 rounded-md text-foreground/40 hover:text-foreground hover:bg-card transition-colors"
            title="Cerrar"
          >
            <X size={14} />
          </button>
        </div>
      </div>

      {/* Messages area */}
      <div className="flex-1 overflow-y-auto px-4 py-4 space-y-4">
        {messages.length === 0 && (
          <div className="flex flex-col items-center justify-center h-full text-center">
            <div className="flex items-center justify-center size-12 rounded-2xl bg-primary/10 mb-3">
              <Bot size={24} className="text-primary" />
            </div>
            <p className="text-sm font-medium text-foreground mb-1">
              Hola, soy Kiyoko
            </p>
            <p className="text-xs text-foreground/40 max-w-52">
              Tu asistente de IA para guiones. Preguntame lo que necesites.
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
            <div
              className={cn(
                'max-w-[85%] rounded-xl px-3 py-2 text-sm leading-relaxed',
                message.role === 'user'
                  ? 'bg-primary text-primary-foreground'
                  : 'bg-card text-foreground border border-border',
              )}
            >
              {message.content || (
                <span className="flex items-center gap-1 text-foreground/40">
                  <Loader2 size={12} className="animate-spin" />
                  Pensando...
                </span>
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
                'bg-card border border-border',
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
      <div className="shrink-0 px-4 py-3 border-t border-border">
        <div className="flex items-end gap-2 bg-card border border-border rounded-xl px-3 py-2 focus-within:border-primary/40 transition-colors">
          <textarea
            ref={textareaRef}
            value={input}
            onChange={handleInputChange}
            onKeyDown={handleKeyDown}
            placeholder="Escribe un mensaje..."
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
