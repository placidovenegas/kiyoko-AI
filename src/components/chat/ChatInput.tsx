'use client';

import { useRef, useCallback, useState } from 'react';
import { Send, Square } from 'lucide-react';
import { cn } from '@/lib/utils/cn';

// ---------------------------------------------------------------------------
// Types
// ---------------------------------------------------------------------------

interface ChatInputProps {
  onSend: (text: string) => void;
  onStop: () => void;
  isStreaming: boolean;
  activeProvider: string | null;
  placeholder?: string;
}

// ---------------------------------------------------------------------------
// Provider names
// ---------------------------------------------------------------------------

const PROVIDER_NAMES: Record<string, string> = {
  groq: 'Groq',
  mistral: 'Mistral',
  gemini: 'Gemini',
  cerebras: 'Cerebras',
  grok: 'Grok',
  deepseek: 'DeepSeek',
  claude: 'Claude',
  openai: 'OpenAI',
};

// ---------------------------------------------------------------------------
// ChatInput
// ---------------------------------------------------------------------------

export function ChatInput({
  onSend,
  onStop,
  isStreaming,
  activeProvider,
  placeholder = 'Escribe un mensaje...',
}: ChatInputProps) {
  const textareaRef = useRef<HTMLTextAreaElement>(null);
  const [input, setInput] = useState('');

  // ---- Auto resize textarea ----
  const handleInputChange = useCallback((e: React.ChangeEvent<HTMLTextAreaElement>) => {
    setInput(e.target.value);
    const textarea = e.target;
    textarea.style.height = 'auto';
    textarea.style.height = `${Math.min(textarea.scrollHeight, 140)}px`;
  }, []);

  // ---- Send ----
  const handleSend = useCallback(() => {
    const text = input.trim();
    if (!text) return;
    if (isStreaming) onStop();
    onSend(text);
    setInput('');
    if (textareaRef.current) {
      textareaRef.current.style.height = 'auto';
    }
  }, [input, isStreaming, onSend, onStop]);

  // ---- Keyboard ----
  const handleKeyDown = useCallback(
    (e: React.KeyboardEvent) => {
      if (e.key === 'Enter' && !e.shiftKey) {
        e.preventDefault();
        handleSend();
      }
    },
    [handleSend],
  );

  const hasText = input.trim().length > 0;

  return (
    <div className="shrink-0 px-3 py-2.5 border-t border-border">
      {/* Streaming indicator */}
      {isStreaming && (
        <div className="flex items-center justify-between mb-2 px-1">
          <div className="flex items-center gap-2">
            <div className="flex gap-1">
              <span className="size-1.5 rounded-full bg-primary animate-bounce" style={{ animationDelay: '0ms' }} />
              <span className="size-1.5 rounded-full bg-primary animate-bounce" style={{ animationDelay: '150ms' }} />
              <span className="size-1.5 rounded-full bg-primary animate-bounce" style={{ animationDelay: '300ms' }} />
            </div>
            <span className="text-xs text-muted-foreground">
              {activeProvider
                ? `${PROVIDER_NAMES[activeProvider] ?? activeProvider} respondiendo...`
                : 'Kiyoko pensando...'}
            </span>
          </div>
          <button
            type="button"
            onClick={onStop}
            className="flex items-center gap-1.5 px-2.5 py-1 rounded-lg text-xs font-medium text-muted-foreground hover:text-foreground hover:bg-accent transition-colors"
          >
            <Square size={10} className="fill-current" />
            Detener
          </button>
        </div>
      )}

      {/* Input */}
      <div className="flex items-center gap-2 bg-card border border-border rounded-xl px-3 py-2.5 focus-within:border-primary/40 transition-colors min-h-11">
        <textarea
          ref={textareaRef}
          value={input}
          onChange={handleInputChange}
          onKeyDown={handleKeyDown}
          placeholder={isStreaming ? 'Escribe para cancelar y enviar...' : placeholder}
          rows={1}
          className="flex-1 bg-transparent text-sm text-foreground placeholder:text-muted-foreground resize-none outline-none max-h-35 min-h-5 leading-5"
        />
        <button
          type="button"
          onClick={hasText ? handleSend : isStreaming ? onStop : undefined}
          disabled={!hasText && !isStreaming}
          className={cn(
            'flex items-center justify-center size-8 rounded-lg shrink-0 transition-colors',
            hasText
              ? 'bg-primary text-primary-foreground hover:bg-primary/90'
              : isStreaming
                ? 'text-muted-foreground hover:text-foreground hover:bg-accent'
                : 'text-muted-foreground/30 cursor-not-allowed',
          )}
        >
          {isStreaming && !hasText ? (
            <Square size={14} className="fill-current" />
          ) : (
            <Send size={14} />
          )}
        </button>
      </div>
    </div>
  );
}
