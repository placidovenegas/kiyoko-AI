'use client';

import { useRef, useEffect, useCallback, useState } from 'react';
import {
  MessageSquare, Plus, Maximize2, X,
  Sparkles, Square, Paperclip, Send, FileText, Image as ImageIcon,
} from 'lucide-react';
import { motion, AnimatePresence } from 'framer-motion';
import { cn } from '@/lib/utils/cn';
import { KiyokoIcon } from '@/components/ui/logo';

/* ── Types ────────────────────────────────────────────────── */

export interface ChatPanelMessage {
  id:        string;
  role:      'user' | 'ai' | 'system';
  content:   string | React.ReactNode;
  timestamp?: string;
  isFailed?: boolean;
}

export type ChatContextType = 'dashboard' | 'project' | 'video' | 'scene';

export interface ChatContextItem {
  type:  ChatContextType;
  label: string;
}

export interface ChatQuickAction {
  icon:   React.ReactNode;
  label:  string;
  prompt: string;
}

export interface ChatPanelProps {
  /* data */
  messages:     ChatPanelMessage[];
  isLoading?:   boolean;
  suggestions?: string[];
  context?:     ChatContextItem[];
  quickActions?: ChatQuickAction[];

  /* header */
  title?:    string;
  subtitle?: string;

  /* callbacks */
  onSend:      (text: string, files: File[]) => void;
  onStop?:     () => void;
  onClose?:    () => void;
  onExpand?:   () => void;
  onNewChat?:  () => void;
  onSuggestionClick?: (s: string) => void;

  /* config */
  allowFiles?:  boolean;
  placeholder?: string;
  emptyState?:  React.ReactNode;
  className?:   string;
}

/* ── Color maps ───────────────────────────────────────────── */

const CTX_COLORS: Record<ChatContextType, string> = {
  dashboard: 'bg-default-100 text-default-600 dark:bg-default-800 dark:text-default-300',
  project:   'bg-primary-50 text-primary-600 dark:bg-primary-900/40 dark:text-primary-300',
  video:     'bg-secondary-50 text-secondary-600 dark:bg-secondary-900/40 dark:text-secondary-300',
  scene:     'bg-success-50 text-success-600 dark:bg-success-900/40 dark:text-success-400',
};

const CTX_DOT: Record<ChatContextType, string> = {
  dashboard: 'bg-default-400',
  project:   'bg-primary-500',
  video:     'bg-secondary-500',
  scene:     'bg-success-500',
};

/* ── Sub-components ───────────────────────────────────────── */

function AiAvatar({ visible }: { visible: boolean }) {
  if (!visible) return <span className="size-7 shrink-0" />;
  return (
    <div className="mt-0.5 flex size-7 shrink-0 items-center justify-center rounded-xl bg-primary">
      <KiyokoIcon size={13} className="text-white" />
    </div>
  );
}

function MessageBubble({ msg, showAvatar }: { msg: ChatPanelMessage; showAvatar: boolean }) {
  const isUser   = msg.role === 'user';
  const isSystem = msg.role === 'system';

  if (isSystem) {
    return (
      <motion.div
        initial={{ opacity: 0 }}
        animate={{ opacity: 1 }}
        className="flex items-center gap-3 py-1"
      >
        <div className="h-px flex-1 bg-border" />
        <span className="shrink-0 text-[11px] text-muted-foreground">{msg.content}</span>
        <div className="h-px flex-1 bg-border" />
      </motion.div>
    );
  }

  return (
    <motion.div
      initial={{ opacity: 0, y: 6, scale: 0.98 }}
      animate={{ opacity: 1, y: 0, scale: 1 }}
      transition={{ type: 'spring', stiffness: 420, damping: 34 }}
      className={cn('flex items-start gap-2.5', isUser ? 'justify-end' : 'justify-start')}
    >
      {!isUser && <AiAvatar visible={showAvatar} />}

      <div className={cn('flex min-w-0 flex-col gap-1', isUser ? 'items-end max-w-[85%]' : 'flex-1')}>
        <div
          className={cn(
            'rounded-2xl px-3.5 py-2.5 text-sm leading-relaxed',
            isUser
              ? 'rounded-tr-sm bg-primary text-primary-foreground'
              : 'rounded-tl-sm border border-border bg-card text-foreground',
            msg.isFailed && 'opacity-60',
          )}
        >
          {msg.content}
        </div>
        {msg.timestamp && (
          <span className={cn('px-1 text-[10px] text-muted-foreground/50', isUser ? 'text-right' : 'text-left')}>
            {msg.timestamp}
          </span>
        )}
      </div>
    </motion.div>
  );
}

function LoadingBubble() {
  return (
    <motion.div
      initial={{ opacity: 0, y: 6 }}
      animate={{ opacity: 1, y: 0 }}
      className="flex items-start gap-2.5"
    >
      <AiAvatar visible />
      <div className="rounded-2xl rounded-tl-sm border border-border bg-card px-4 py-3">
        <div className="flex items-center gap-1.5">
          {[0, 1, 2].map((i) => (
            <motion.span
              key={i}
              className="size-1.5 rounded-full bg-primary/60"
              animate={{ y: [0, -4, 0] }}
              transition={{ duration: 0.6, repeat: Infinity, delay: i * 0.15, ease: 'easeInOut' }}
            />
          ))}
        </div>
      </div>
    </motion.div>
  );
}

/* ── Main component ───────────────────────────────────────── */

export function ChatPanel({
  messages,
  isLoading     = false,
  suggestions   = [],
  context,
  quickActions,
  title         = 'Kiyoko AI',
  subtitle      = 'Tu directora de video',
  onSend,
  onStop,
  onClose,
  onExpand,
  onNewChat,
  onSuggestionClick,
  allowFiles    = true,
  placeholder   = 'Escribe un mensaje...',
  emptyState,
  className,
}: ChatPanelProps) {
  const bottomRef   = useRef<HTMLDivElement>(null);
  const textareaRef = useRef<HTMLTextAreaElement>(null);
  const fileRef     = useRef<HTMLInputElement>(null);
  const [input, setInput] = useState('');
  const [files, setFiles] = useState<File[]>([]);

  /* auto-scroll */
  useEffect(() => {
    bottomRef.current?.scrollIntoView({ behavior: 'smooth' });
  }, [messages, isLoading]);

  /* textarea auto-resize */
  const handleInputChange = useCallback((e: React.ChangeEvent<HTMLTextAreaElement>) => {
    setInput(e.target.value);
    const el = e.target;
    el.style.height = 'auto';
    el.style.height = `${Math.min(el.scrollHeight, 140)}px`;
  }, []);

  /* file attach */
  const handleFileChange = useCallback((e: React.ChangeEvent<HTMLInputElement>) => {
    setFiles(prev => [...prev, ...Array.from(e.target.files ?? [])]);
    e.target.value = '';
  }, []);

  const removeFile = useCallback((i: number) => {
    setFiles(prev => prev.filter((_, j) => j !== i));
  }, []);

  /* send */
  const handleSend = useCallback(() => {
    const text = input.trim();
    if (!text && files.length === 0) return;
    onSend(text, files);
    setInput('');
    setFiles([]);
    if (textareaRef.current) textareaRef.current.style.height = 'auto';
  }, [input, files, onSend]);

  const handleKeyDown = useCallback((e: React.KeyboardEvent<HTMLTextAreaElement>) => {
    if (e.key === 'Enter' && !e.shiftKey) { e.preventDefault(); handleSend(); }
  }, [handleSend]);

  const hasContent = input.trim().length > 0 || files.length > 0;
  const showSuggestions = suggestions.length > 0 && !isLoading;

  return (
    <div className={cn('flex h-full flex-col bg-background', className)}>

      {/* ── Header ── */}
      <div className="flex h-11 shrink-0 items-center gap-2 border-b border-border bg-card/50 px-3">
        <div className="flex size-7 items-center justify-center rounded-xl bg-primary">
          <KiyokoIcon size={13} className="text-white" />
        </div>
        <div className="min-w-0 flex-1">
          <div className="flex items-center gap-2">
            <span className="text-xs font-semibold text-foreground">{title}</span>
            {isLoading && (
              <span className="animate-pulse text-[10px] text-primary">respondiendo...</span>
            )}
          </div>
          {subtitle && (
            <span className="block text-[10px] leading-none text-muted-foreground">{subtitle}</span>
          )}
        </div>
        <div className="flex items-center gap-0.5">
          {onNewChat && (
            <button
              type="button"
              onClick={onNewChat}
              className="flex size-7 items-center justify-center rounded-md text-muted-foreground transition-colors hover:bg-accent hover:text-foreground"
              title="Nuevo chat"
            >
              <MessageSquare size={14} />
            </button>
          )}
          <button
            type="button"
            onClick={onNewChat}
            className="flex size-7 items-center justify-center rounded-md text-muted-foreground transition-colors hover:bg-accent hover:text-foreground"
            title="Nueva conversación"
          >
            <Plus size={14} />
          </button>
          {onExpand && (
            <button
              type="button"
              onClick={onExpand}
              className="flex size-7 items-center justify-center rounded-md text-muted-foreground transition-colors hover:bg-accent hover:text-foreground"
              title="Expandir"
            >
              <Maximize2 size={14} />
            </button>
          )}
          {onClose && (
            <button
              type="button"
              onClick={onClose}
              className="flex size-7 items-center justify-center rounded-md text-muted-foreground transition-colors hover:bg-accent hover:text-foreground"
              title="Cerrar"
            >
              <X size={14} />
            </button>
          )}
        </div>
      </div>

      {/* ── Messages ── */}
      <div className="flex-1 space-y-4 overflow-y-auto px-4 py-4">

        {/* Empty state */}
        {messages.length === 0 && !isLoading && (
          emptyState ?? (
            <div className="flex h-full flex-col items-center justify-center gap-4 text-center">
              <div className="flex size-16 items-center justify-center rounded-2xl bg-primary/10">
                <KiyokoIcon size={32} className="text-primary" />
              </div>
              <div>
                <p className="text-sm font-semibold text-foreground">Kiyoko AI</p>
                <p className="mt-1 max-w-xs text-xs text-muted-foreground">
                  Tu directora creativa. Puedo analizar, modificar y mejorar cualquier parte de tu proyecto.
                </p>
              </div>
              {quickActions && quickActions.length > 0 && (
                <div className="grid w-full max-w-xs grid-cols-2 gap-2">
                  {quickActions.map((qa) => (
                    <button
                      key={qa.label}
                      type="button"
                      onClick={() => onSend(qa.prompt, [])}
                      className="flex items-center gap-2 rounded-xl border border-border bg-card px-3 py-2.5 text-left text-xs font-medium text-muted-foreground transition-all hover:border-primary/30 hover:bg-primary/5 hover:text-primary"
                    >
                      {qa.icon}
                      <span>{qa.label}</span>
                    </button>
                  ))}
                </div>
              )}
            </div>
          )
        )}

        {/* Message list */}
        <AnimatePresence initial={false}>
          {messages.map((msg, i) => {
            const prev = messages[i - 1];
            const showAvatar = msg.role === 'ai' && prev?.role !== 'ai';
            return (
              <MessageBubble key={msg.id} msg={msg} showAvatar={showAvatar} />
            );
          })}
          {isLoading && <LoadingBubble key="loading" />}
        </AnimatePresence>

        <div ref={bottomRef} />
      </div>

      {/* ── Suggestions ── */}
      <AnimatePresence>
        {showSuggestions && (
          <motion.div
            initial={{ opacity: 0, y: 4 }}
            animate={{ opacity: 1, y: 0 }}
            exit={{ opacity: 0, y: 4 }}
            className="shrink-0 border-t border-border bg-card/50 px-3 py-2"
          >
            <p className="mb-1.5 text-[10px] font-semibold uppercase tracking-wider text-muted-foreground">
              Sugerencias
            </p>
            <div className="flex flex-wrap gap-1.5">
              {suggestions.map((s, idx) => (
                <button
                  key={idx}
                  type="button"
                  onClick={() => onSuggestionClick?.(s)}
                  className="flex items-center gap-1.5 rounded-lg border border-border bg-background px-2.5 py-1.5 text-xs font-medium text-muted-foreground transition-colors hover:border-primary/30 hover:text-primary"
                >
                  <Sparkles size={10} />
                  {s}
                </button>
              ))}
            </div>
          </motion.div>
        )}
      </AnimatePresence>

      {/* ── Input area ── */}
      <div className="shrink-0 border-t border-border">

        {/* Streaming bar */}
        <AnimatePresence>
          {isLoading && (
            <motion.div
              initial={{ opacity: 0, height: 0 }}
              animate={{ opacity: 1, height: 'auto' }}
              exit={{ opacity: 0, height: 0 }}
              className="flex items-center justify-between border-b border-border/50 px-4 py-2"
            >
              <div className="flex items-center gap-2">
                <div className="flex gap-1">
                  {[0, 1, 2].map((i) => (
                    <span
                      key={i}
                      className="size-1.5 rounded-full bg-primary animate-bounce"
                      style={{ animationDelay: `${i * 150}ms` }}
                    />
                  ))}
                </div>
                <span className="text-xs text-muted-foreground">Kiyoko pensando...</span>
              </div>
              {onStop && (
                <button
                  type="button"
                  onClick={onStop}
                  className="flex items-center gap-1.5 rounded-lg px-2.5 py-1 text-xs font-medium text-muted-foreground transition-colors hover:bg-accent hover:text-foreground"
                >
                  <Square size={10} className="fill-current" />
                  Detener
                </button>
              )}
            </motion.div>
          )}
        </AnimatePresence>

        {/* File previews */}
        {files.length > 0 && (
          <div className="flex flex-wrap gap-1.5 px-3 pt-2">
            {files.map((file, i) => (
              <span
                key={i}
                className="flex items-center gap-1.5 rounded-lg border border-border bg-muted px-2.5 py-1.5 text-xs text-foreground"
              >
                {file.type.startsWith('image/')
                  ? <ImageIcon className="size-3.5 shrink-0 text-primary" />
                  : <FileText className="size-3.5 shrink-0 text-primary" />
                }
                <span className="max-w-28 truncate">{file.name}</span>
                <button
                  type="button"
                  onClick={() => removeFile(i)}
                  className="ml-0.5 text-muted-foreground transition-colors hover:text-foreground"
                >
                  <X className="size-3" />
                </button>
              </span>
            ))}
          </div>
        )}

        {/* Input box */}
        <div className="mx-3 my-2.5 flex min-h-11 items-center gap-2 rounded-xl border border-border bg-card px-3 py-2.5 transition-colors focus-within:border-primary/40">
          {allowFiles && (
            <>
              <button
                type="button"
                onClick={() => fileRef.current?.click()}
                className="shrink-0 text-muted-foreground/60 transition-colors hover:text-muted-foreground"
                aria-label="Adjuntar archivo"
              >
                <Paperclip size={15} />
              </button>
              <input
                ref={fileRef}
                type="file"
                multiple
                className="hidden"
                onChange={handleFileChange}
                accept="image/*,.pdf,.doc,.docx,.txt,.md"
              />
            </>
          )}

          <textarea
            ref={textareaRef}
            value={input}
            onChange={handleInputChange}
            onKeyDown={handleKeyDown}
            placeholder={isLoading ? 'Escribe para cancelar y enviar...' : placeholder}
            rows={1}
            className="min-h-5 max-h-36 flex-1 resize-none bg-transparent text-sm leading-5 text-foreground outline-none placeholder:text-muted-foreground"
          />

          <button
            type="button"
            onClick={hasContent ? handleSend : isLoading ? onStop : undefined}
            disabled={!hasContent && !isLoading}
            className={cn(
              'flex size-8 shrink-0 items-center justify-center rounded-lg transition-all',
              hasContent
                ? 'bg-primary text-primary-foreground shadow-sm hover:bg-primary/90'
                : isLoading
                  ? 'text-muted-foreground hover:bg-accent hover:text-foreground'
                  : 'cursor-not-allowed text-muted-foreground/30',
            )}
          >
            {isLoading && !hasContent
              ? <Square size={14} className="fill-current" />
              : <Send size={14} />
            }
          </button>
        </div>

        {/* Context chips */}
        {context && context.length > 0 && (
          <div className="flex flex-wrap gap-1.5 px-4 pb-3">
            {context.map((ctx, i) => (
              <span
                key={i}
                className={cn(
                  'inline-flex items-center gap-1.5 rounded-full px-2.5 py-0.5 text-[11px] font-medium',
                  CTX_COLORS[ctx.type],
                )}
              >
                <span className={cn('size-1.5 rounded-full shrink-0', CTX_DOT[ctx.type])} />
                {ctx.label}
              </span>
            ))}
          </div>
        )}
      </div>
    </div>
  );
}
