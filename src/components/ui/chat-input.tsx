'use client';

import { useState, useRef, useCallback } from 'react';
import { Paperclip, Send, X, FileText, Image as ImageIcon } from 'lucide-react';
import { cn } from '@/lib/utils/cn';

/* ── Context chip types ───────────────────────────────────── */

export type ChatContextItem = {
  type: 'dashboard' | 'project' | 'video' | 'scene';
  label: string;
};

const CONTEXT_COLORS: Record<ChatContextItem['type'], string> = {
  dashboard: 'bg-default-100 text-default-600 dark:bg-default-800 dark:text-default-300',
  project:   'bg-primary-50 text-primary-600 dark:bg-primary-900/40 dark:text-primary-300',
  video:     'bg-secondary-50 text-secondary-600 dark:bg-secondary-900/40 dark:text-secondary-300',
  scene:     'bg-success-50 text-success-600 dark:bg-success-900/40 dark:text-success-400',
};

const CONTEXT_DOT: Record<ChatContextItem['type'], string> = {
  dashboard: 'bg-default-400',
  project:   'bg-primary-500',
  video:     'bg-secondary-500',
  scene:     'bg-success-500',
};

/* ── Props ────────────────────────────────────────────────── */

export interface ChatInputProps {
  onSend?:      (message: string, files: File[]) => void;
  placeholder?: string;
  context?:     ChatContextItem[];
  disabled?:    boolean;
  isInvalid?:   boolean;
  errorMessage?: string;
  className?:   string;
}

/* ── Component ───────────────────────────────────────────── */

export function ChatInput({
  onSend,
  placeholder = 'Escribe un mensaje...',
  context,
  disabled,
  isInvalid,
  errorMessage,
  className,
}: ChatInputProps) {
  const [message, setMessage] = useState('');
  const [files,   setFiles]   = useState<File[]>([]);
  const fileRef     = useRef<HTMLInputElement>(null);
  const textareaRef = useRef<HTMLTextAreaElement>(null);

  const handleSend = useCallback(() => {
    if (!message.trim() && files.length === 0) return;
    onSend?.(message.trim(), files);
    setMessage('');
    setFiles([]);
    if (textareaRef.current) textareaRef.current.style.height = 'auto';
  }, [message, files, onSend]);

  const handleKeyDown = (e: React.KeyboardEvent<HTMLTextAreaElement>) => {
    if (e.key === 'Enter' && !e.shiftKey) {
      e.preventDefault();
      handleSend();
    }
  };

  const handleFileChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    setFiles(prev => [...prev, ...Array.from(e.target.files ?? [])]);
    e.target.value = '';
  };

  const autoResize = (e: React.ChangeEvent<HTMLTextAreaElement>) => {
    setMessage(e.target.value);
    const el = e.target;
    el.style.height = 'auto';
    el.style.height = `${Math.min(el.scrollHeight, 160)}px`;
  };

  const canSend = (message.trim().length > 0 || files.length > 0) && !disabled;

  return (
    <div className={cn('flex flex-col gap-2', className)}>

      {/* Attached file previews */}
      {files.length > 0 && (
        <div className="flex flex-wrap gap-1.5 px-1">
          {files.map((file, i) => (
            <span
              key={i}
              className="flex items-center gap-1.5 rounded-lg border border-border bg-muted px-2.5 py-1.5 text-xs text-foreground"
            >
              {file.type.startsWith('image/')
                ? <ImageIcon className="size-3.5 shrink-0 text-primary-500" />
                : <FileText className="size-3.5 shrink-0 text-primary-500" />
              }
              <span className="max-w-30 truncate">{file.name}</span>
              <button
                type="button"
                onClick={() => setFiles(prev => prev.filter((_, j) => j !== i))}
                className="ml-0.5 text-muted-foreground transition-colors hover:text-foreground"
              >
                <X className="size-3" />
              </button>
            </span>
          ))}
        </div>
      )}

      {/* Input box */}
      <div
        className={cn(
          'flex items-end gap-2 rounded-2xl border bg-muted/40 px-3 py-2.5',
          'transition-colors focus-within:bg-background',
          isInvalid
            ? 'border-danger-500 focus-within:border-danger-500'
            : 'border-border focus-within:border-primary-400',
          disabled && 'pointer-events-none opacity-50',
        )}
      >
        {/* Attach button */}
        <button
          type="button"
          onClick={() => fileRef.current?.click()}
          className="mb-0.5 flex size-7 shrink-0 items-center justify-center rounded-lg text-muted-foreground transition-colors hover:bg-muted hover:text-foreground"
          aria-label="Adjuntar archivo"
        >
          <Paperclip className="size-4" />
        </button>
        <input
          ref={fileRef}
          type="file"
          multiple
          className="hidden"
          onChange={handleFileChange}
          accept="image/*,.pdf,.doc,.docx,.txt,.md"
        />

        {/* Textarea — auto-grows */}
        <textarea
          ref={textareaRef}
          value={message}
          onChange={autoResize}
          onKeyDown={handleKeyDown}
          placeholder={placeholder}
          rows={1}
          disabled={disabled}
          className={cn(
            'flex-1 resize-none bg-transparent py-0.5 text-sm leading-relaxed text-foreground',
            'placeholder:text-muted-foreground outline-none',
          )}
          style={{ minHeight: '24px', maxHeight: '160px' }}
        />

        {/* Send button */}
        <button
          type="button"
          onClick={handleSend}
          disabled={!canSend}
          className={cn(
            'mb-0.5 flex size-7 shrink-0 items-center justify-center rounded-lg transition-all',
            canSend
              ? 'bg-primary-500 text-white shadow-sm hover:bg-primary-600'
              : 'cursor-not-allowed bg-muted text-muted-foreground',
          )}
          aria-label="Enviar mensaje"
        >
          <Send className="size-3.5" />
        </button>
      </div>

      {/* Error message */}
      {isInvalid && errorMessage && (
        <p className="px-1 text-xs text-danger-500">{errorMessage}</p>
      )}

      {/* Context chips — no label, just chips */}
      {context && context.length > 0 && (
        <div className="flex flex-wrap gap-1.5 px-1">
          {context.map((ctx, i) => (
            <span
              key={i}
              className={cn(
                'inline-flex items-center gap-1.5 rounded-full px-2.5 py-0.5 text-[11px] font-medium',
                CONTEXT_COLORS[ctx.type],
              )}
            >
              <span className={cn('size-1.5 rounded-full', CONTEXT_DOT[ctx.type])} />
              {ctx.label}
            </span>
          ))}
        </div>
      )}
    </div>
  );
}
