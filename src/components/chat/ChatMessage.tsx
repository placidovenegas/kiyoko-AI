'use client';

import { useState, useMemo } from 'react';
import { Bot, Loader2, Copy, Check } from 'lucide-react';
import ReactMarkdown from 'react-markdown';
import remarkGfm from 'remark-gfm';
import type { Components } from 'react-markdown';
import { cn } from '@/lib/utils/cn';
import { ActionPlanCard } from '@/components/chat/ActionPlanCard';
import type { KiyokoMessage } from '@/hooks/useKiyokoChat';
import type { AiActionPlan } from '@/types/ai-actions';

// ---------------------------------------------------------------------------
// Types
// ---------------------------------------------------------------------------

interface ChatMessageProps {
  message: KiyokoMessage;
  onExecute: (messageId: string, plan: AiActionPlan) => void;
  onCancel: (messageId: string) => void;
  onModify: (text: string) => void;
  onUndo: (batchId: string) => void;
}

// ---------------------------------------------------------------------------
// Helpers
// ---------------------------------------------------------------------------

function parseActionPlan(content: string): AiActionPlan | null {
  const jsonMatch = content.match(/```json\s*([\s\S]*?)```/);
  if (!jsonMatch) return null;
  try {
    const parsed: unknown = JSON.parse(jsonMatch[1]);
    if (
      typeof parsed === 'object' &&
      parsed !== null &&
      'type' in parsed &&
      (parsed as Record<string, unknown>).type === 'action_plan' &&
      'actions' in parsed &&
      Array.isArray((parsed as Record<string, unknown>).actions)
    ) {
      const p = parsed as Record<string, unknown>;
      return {
        summary_es: (p.summary_es as string) || '',
        actions: p.actions as AiActionPlan['actions'],
        total_scenes_affected: (p.total_scenes_affected as number) || 0,
        warnings: (p.warnings as string[]) || [],
      };
    }
  } catch {
    // invalid JSON
  }
  return null;
}

function extractTextContent(content: string): string {
  return content
    .replace(/```json\s*[\s\S]*?```/g, '')
    .replace(/\[SUGERENCIAS\][\s\S]*?(?:\[\/SUGERENCIAS\]|$)/g, '')
    .trim();
}

function formatTime(date: Date): string {
  return date.toLocaleTimeString('es-ES', { hour: '2-digit', minute: '2-digit' });
}

// ---------------------------------------------------------------------------
// Code block with copy
// ---------------------------------------------------------------------------

function CodeBlock({ children, className }: { children: string; className?: string }) {
  const [copied, setCopied] = useState(false);
  const language = className?.replace('language-', '') || '';

  const handleCopy = () => {
    navigator.clipboard.writeText(children).then(() => {
      setCopied(true);
      setTimeout(() => setCopied(false), 2000);
    });
  };

  return (
    <div className="relative group my-3">
      {language && (
        <div className="flex items-center justify-between px-3 py-1.5 bg-accent/80 rounded-t-lg border border-b-0 border-border">
          <span className="text-[10px] font-mono text-muted-foreground uppercase tracking-wider">{language}</span>
          <button
            type="button"
            onClick={handleCopy}
            className="flex items-center gap-1 text-[10px] text-muted-foreground hover:text-foreground transition-colors"
          >
            {copied ? <Check size={10} /> : <Copy size={10} />}
            {copied ? 'Copiado' : 'Copiar'}
          </button>
        </div>
      )}
      <pre
        className={cn(
          'overflow-x-auto p-3 bg-accent/40 text-xs font-mono border border-border',
          language ? 'rounded-b-lg' : 'rounded-lg',
        )}
      >
        <code>{children}</code>
      </pre>
      {!language && (
        <button
          type="button"
          onClick={handleCopy}
          className="absolute top-2 right-2 opacity-0 group-hover:opacity-100 flex items-center justify-center size-6 rounded bg-background/80 border border-border text-muted-foreground hover:text-foreground transition-all"
        >
          {copied ? <Check size={10} /> : <Copy size={10} />}
        </button>
      )}
    </div>
  );
}

// ---------------------------------------------------------------------------
// Markdown components with remark-gfm table support
// ---------------------------------------------------------------------------

const mdComponents: Components = {
  // ---- Code ----
  code: ({ children, className, ...props }) => {
    const isBlock = className?.startsWith('language-') ||
      (typeof children === 'string' && children.includes('\n'));
    if (isBlock) {
      return <CodeBlock className={className}>{String(children)}</CodeBlock>;
    }
    return (
      <code className="text-primary bg-accent px-1 py-0.5 rounded text-xs font-mono" {...props}>
        {children}
      </code>
    );
  },
  pre: ({ children }) => <>{children}</>,

  // ---- Tables (remark-gfm + CSS classes from globals.css) ----
  table: ({ children }) => (
    <div className="chat-table-wrap">
      <table className="chat-table">{children}</table>
    </div>
  ),
  thead: ({ children }) => <thead>{children}</thead>,
  th: ({ children }) => <th>{children}</th>,
  td: ({ children }) => {
    // Detect hex color values and render a color dot
    const text = typeof children === 'string' ? children : '';
    const hexMatch = text.match(/^#([0-9A-Fa-f]{6})$/);
    if (hexMatch) {
      return (
        <td>
          <span className="chat-color-dot" style={{ backgroundColor: text }} />
          <code className="text-[10px] font-mono opacity-70">{text}</code>
        </td>
      );
    }
    return <td>{children}</td>;
  },
  tr: ({ children }) => <tr>{children}</tr>,

  // ---- Headings ----
  h1: ({ children }) => (
    <h1 className="text-base font-bold text-foreground mt-4 mb-2 pb-1.5 border-b border-border/50">{children}</h1>
  ),
  h2: ({ children }) => (
    <h2 className="text-sm font-bold text-foreground mt-3 mb-1.5">{children}</h2>
  ),
  h3: ({ children }) => (
    <h3 className="text-[13px] font-semibold text-foreground mt-2.5 mb-1">{children}</h3>
  ),
  h4: ({ children }) => (
    <h4 className="text-xs font-semibold text-foreground/80 mt-2 mb-1">{children}</h4>
  ),

  // ---- Text elements ----
  p: ({ children }) => (
    <p className="text-[13px] leading-relaxed text-foreground/90 my-1.5">{children}</p>
  ),
  a: ({ children, href }) => (
    <a href={href} target="_blank" rel="noopener noreferrer" className="text-primary hover:underline">{children}</a>
  ),
  strong: ({ children }) => (
    <strong className="font-semibold text-foreground">{children}</strong>
  ),
  em: ({ children }) => (
    <em className="italic text-foreground/80">{children}</em>
  ),

  // ---- Lists ----
  ul: ({ children }) => (
    <ul className="list-disc pl-4 space-y-0.5 my-1.5">{children}</ul>
  ),
  ol: ({ children }) => (
    <ol className="list-decimal pl-4 space-y-0.5 my-1.5">{children}</ol>
  ),
  li: ({ children }) => (
    <li className="text-[13px] leading-relaxed text-foreground/85">{children}</li>
  ),

  // ---- Other ----
  blockquote: ({ children }) => (
    <blockquote className="border-l-2 border-primary/30 pl-3 my-2 text-muted-foreground italic">{children}</blockquote>
  ),
  hr: () => <hr className="my-3 border-border/50" />,
};

// ---------------------------------------------------------------------------
// ChatMessage
// ---------------------------------------------------------------------------

export function ChatMessage({ message, onExecute, onCancel, onModify, onUndo }: ChatMessageProps) {
  const isUser = message.role === 'user';
  const actionPlan = !isUser
    ? (message.actionPlan ?? parseActionPlan(message.content))
    : null;
  const textContent = !isUser
    ? (actionPlan ? extractTextContent(message.content) : message.content.replace(/\[SUGERENCIAS\][\s\S]*?(?:\[\/SUGERENCIAS\]|$)/g, '').trim())
    : message.content;

  const renderedMarkdown = useMemo(() => {
    if (!textContent) return null;
    return (
      <ReactMarkdown remarkPlugins={[remarkGfm]} components={mdComponents}>
        {textContent}
      </ReactMarkdown>
    );
  }, [textContent]);

  return (
    <div className={cn('flex gap-2.5', isUser ? 'justify-end' : 'justify-start')}>
      {/* Bot avatar */}
      {!isUser && (
        <div className="flex items-start shrink-0 pt-0.5">
          <div className="flex items-center justify-center size-7 rounded-lg bg-primary/10">
            <Bot size={14} className="text-primary" />
          </div>
        </div>
      )}

      <div className={cn('space-y-2 min-w-0', isUser ? 'max-w-[85%] flex flex-col items-end' : 'flex-1')}>
        {/* User message */}
        {isUser ? (
          <div className="rounded-2xl rounded-tr-sm px-3.5 py-2 text-sm leading-relaxed bg-primary text-primary-foreground">
            {message.content}
          </div>
        ) : (
          <>
            {/* Assistant text content */}
            {(() => {
              if (!textContent && !actionPlan) {
                return (
                  <div className="rounded-2xl rounded-tl-sm px-4 py-3 bg-card border border-border">
                    <div className="flex items-center gap-2 text-muted-foreground">
                      <div className="flex gap-1">
                        <span className="size-1.5 rounded-full bg-primary/60 animate-bounce" style={{ animationDelay: '0ms' }} />
                        <span className="size-1.5 rounded-full bg-primary/60 animate-bounce" style={{ animationDelay: '150ms' }} />
                        <span className="size-1.5 rounded-full bg-primary/60 animate-bounce" style={{ animationDelay: '300ms' }} />
                      </div>
                      <span className="text-xs">Kiyoko pensando...</span>
                    </div>
                  </div>
                );
              }
              if (textContent) {
                return (
                  <div className="rounded-2xl rounded-tl-sm px-4 py-3 text-sm leading-relaxed bg-card text-foreground border border-border overflow-hidden">
                    {renderedMarkdown}
                  </div>
                );
              }
              return null;
            })()}

            {/* Action plan card */}
            {actionPlan && (
              <ActionPlanCard
                plan={actionPlan}
                isExecuting={message.isExecuting ?? false}
                results={message.executionResults ?? null}
                batchId={message.executedBatchId ?? null}
                onExecute={() => onExecute(message.id, actionPlan)}
                onCancel={() => onCancel(message.id)}
                onModify={onModify}
                onUndo={onUndo}
              />
            )}
          </>
        )}

        {/* Timestamp */}
        <p className={cn('text-[10px] text-muted-foreground/50 px-1', isUser ? 'text-right' : 'text-left')}>
          {formatTime(message.timestamp)}
        </p>
      </div>
    </div>
  );
}
