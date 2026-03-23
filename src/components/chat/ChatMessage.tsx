'use client';

import { useState, useMemo, useCallback } from 'react';
import { Copy, Check, RotateCcw, Volume2, Send } from 'lucide-react';
import ReactMarkdown from 'react-markdown';
import remarkGfm from 'remark-gfm';
import type { Components } from 'react-markdown';
import { cn } from '@/lib/utils/cn';
import { ActionPlanCard } from '@/components/chat/ActionPlanCard';
import { PreviewCard } from '@/components/chat/PreviewCard';
import { OptionsBlock } from '@/components/chat/OptionsBlock';
import { ScenePlanTimeline } from '@/components/chat/ScenePlanTimeline';
import { EntitySelector } from '@/components/chat/EntitySelector';
import { DiffView } from '@/components/chat/DiffView';
import { PromptPreviewCard } from '@/components/chat/PromptPreviewCard';
import type { PromptPreviewData } from '@/components/chat/PromptPreviewCard';
import { ProjectSummaryCard } from '@/components/chat/ProjectSummaryCard';
import type { ProjectSummaryData } from '@/components/chat/ProjectSummaryCard';
import { CharacterCreationCard } from '@/components/chat/CharacterCreationCard';
import type { CharacterCreationData } from '@/components/chat/CharacterCreationCard';
import { BackgroundCreationCard } from '@/components/chat/BackgroundCreationCard';
import type { BackgroundCreationData } from '@/components/chat/BackgroundCreationCard';
import { VideoCreationCard } from '@/components/chat/VideoCreationCard';
import type { VideoCreationData } from '@/components/chat/VideoCreationCard';
import { SceneDetailCard } from '@/components/chat/SceneDetailCard';
import type { SceneDetailData } from '@/components/chat/SceneDetailCard';
import { ResourceListCard } from '@/components/chat/ResourceListCard';
import type { ResourceListData } from '@/components/chat/ResourceListCard';
import { VideoSummaryCard } from '@/components/chat/VideoSummaryCard';
import type { VideoSummaryData } from '@/components/chat/VideoSummaryCard';
import type { SelectableEntity } from '@/components/chat/EntitySelector';
import { KiyokoIcon } from '@/components/ui/logo';
import type { KiyokoMessage } from '@/hooks/useKiyokoChat';
import type { AiActionPlan } from '@/types/ai-actions';
import { parseAiMessage } from '@/lib/ai/parse-ai-message';
import type { ScenePlanItem } from '@/components/chat/ScenePlanTimeline';

// ---------------------------------------------------------------------------
// Types
// ---------------------------------------------------------------------------

import { GitMerge, Clapperboard, Camera, Pencil as PencilIcon } from 'lucide-react';

// Agent badge config — Lucide icons (matches KiyokoHeader)
const AGENT_BADGE: Record<string, {
  label: string;
  Icon: React.ComponentType<{ size?: number; className?: string }>;
}> = {
  router:  { label: 'Router',  Icon: GitMerge },
  scenes:  { label: 'Escenas', Icon: Clapperboard },
  prompts: { label: 'Prompts', Icon: Camera },
  editor:  { label: 'Editor',  Icon: PencilIcon },
};

interface ChatMessageProps {
  message: KiyokoMessage;
  activeAgent?: string;
  projectId?: string;
  onExecute: (messageId: string, plan: AiActionPlan) => void;
  onCancel: (messageId: string) => void;
  onModify: (text: string) => void;
  onSend?: (text: string) => void;
  onUndo: (batchId: string) => void;
  onWorkflowAction?: (actionId: string, label: string) => void;
  // Entidades disponibles en el contexto actual (para bloques [SELECT:type])
  contextEntities?: {
    scenes?: SelectableEntity[];
    videos?: SelectableEntity[];
    characters?: SelectableEntity[];
    backgrounds?: SelectableEntity[];
  };
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

function parseWorkflowActions(content: string): { id: string; label: string }[] {
  const match = content.match(/\[WORKFLOW:\s*([^\]]+)\]/);
  if (!match) return [];
  return (match[1] as string)
    .split(',')
    .map((s) => s.trim())
    .flatMap((s) => {
      const [id, label] = s.split('|');
      if (!id?.trim() || !label?.trim()) return [];
      return [{ id: id.trim(), label: label.trim() }];
    });
}

function parseAudioUrl(content: string): string | null {
  const match = content.match(/\[AUDIO:\s*(https?:\/\/[^\]]+)\]/);
  return match ? match[1].trim() : null;
}

function extractTextContent(content: string): string {
  return content
    // Nuevos bloques v5
    .replace(/\[(ACTION_PLAN|PREVIEW(?::\w+)?|SELECT(?::\w+)?|OPTIONS|DIFF(?::\w+)?|PROMPT_PREVIEW(?::\w+)?|SCENE_PLAN|PROJECT_SUMMARY|CREATE(?::\w+)?|SCENE_DETAIL|RESOURCE_LIST|VIDEO_SUMMARY|SUGGESTIONS)\][\s\S]*?\[\/(?:ACTION_PLAN|PREVIEW(?::\w+)?|SELECT(?::\w+)?|OPTIONS|DIFF(?::\w+)?|PROMPT_PREVIEW(?::\w+)?|SCENE_PLAN|PROJECT_SUMMARY|CREATE(?::\w+)?|SCENE_DETAIL|RESOURCE_LIST|VIDEO_SUMMARY|SUGGESTIONS)\]/g, '')
    // Bloques legacy
    .replace(/```json\s*[\s\S]*?```/g, '')
    .replace(/\[SUGERENCIAS\][\s\S]*?(?:\[\/SUGERENCIAS\]|$)/g, '')
    .replace(/\[WORKFLOW:[^\]]*\]/g, '')
    .replace(/\[AUDIO:[^\]]*\]/g, '')
    .replace(/\n{3,}/g, '\n\n')
    .trim();
}

function formatTime(date: Date): string {
  return date.toLocaleTimeString('es-ES', { hour: '2-digit', minute: '2-digit' });
}

// ---------------------------------------------------------------------------
// Interactive choices parser
// Detects lines starting with ☐ / □ / - [ ] as selectable options and groups
// them with any immediately preceding heading (line ending in ':') as context.
// ---------------------------------------------------------------------------

export interface ChoiceGroup {
  heading: string | null; // e.g. "Duración del vídeo"
  items: string[];        // raw option texts
}

type ContentSegment =
  | { type: 'markdown'; content: string }
  | { type: 'choices'; groups: ChoiceGroup[] };

const CHOICE_RE = /^[☐□]\s+(.+)$|^-\s+\[\s*\]\s+(.+)$/;
const HEADING_RE = /^#{1,4}\s+.+$|^.+:$/; // e.g. "## Duración" or "Duración del vídeo:"

function parseContentSegments(content: string): ContentSegment[] {
  const lines = content.split('\n');
  const segments: ContentSegment[] = [];

  let markdownBuf: string[] = [];
  let currentGroups: ChoiceGroup[] = [];
  let currentGroup: ChoiceGroup | null = null;
  let pendingHeading: string | null = null;

  const flushMarkdown = () => {
    const text = markdownBuf.join('\n').trim();
    if (text) segments.push({ type: 'markdown', content: text });
    markdownBuf = [];
  };

  const flushChoices = () => {
    if (currentGroup && currentGroup.items.length > 0) {
      currentGroups.push(currentGroup);
      currentGroup = null;
    }
    if (currentGroups.length > 0) {
      segments.push({ type: 'choices', groups: currentGroups });
      currentGroups = [];
    }
    pendingHeading = null;
  };

  for (let i = 0; i < lines.length; i++) {
    const line = lines[i];
    const choiceMatch = line.match(CHOICE_RE);

    if (choiceMatch) {
      // Start or continue a choice block
      if (markdownBuf.length > 0) {
        // Check if the last non-empty markdown line is a heading (context for this group)
        const lastNonEmpty = [...markdownBuf].reverse().find((l) => l.trim() !== '');
        if (lastNonEmpty && HEADING_RE.test(lastNonEmpty.trim())) {
          pendingHeading = lastNonEmpty.trim().replace(/^#{1,4}\s+/, '').replace(/:$/, '');
          // Remove that heading from markdownBuf (it becomes the group heading)
          const idx = markdownBuf.lastIndexOf(lastNonEmpty);
          markdownBuf.splice(idx, 1);
        }
        flushMarkdown();
      }

      const itemText = (choiceMatch[1] ?? choiceMatch[2]).trim();

      if (!currentGroup) {
        currentGroup = { heading: pendingHeading, items: [] };
        pendingHeading = null;
      }
      currentGroup.items.push(itemText);
    } else {
      // Non-choice line
      if (currentGroup && currentGroup.items.length > 0) {
        // End of current group
        currentGroups.push(currentGroup);
        currentGroup = null;

        // If this line is a heading, buffer it as pending for next group
        if (HEADING_RE.test(line.trim()) && line.trim() !== '') {
          pendingHeading = line.trim().replace(/^#{1,4}\s+/, '').replace(/:$/, '');
          // Don't add to markdownBuf — it'll be consumed by the next choice group
        } else if (line.trim() !== '') {
          // Non-heading line after choices: flush current groups and restart markdown
          flushChoices();
          markdownBuf.push(line);
        }
        // empty lines between groups: ignore
      } else {
        flushChoices();
        markdownBuf.push(line);
      }
    }
  }

  // Flush remaining
  if (currentGroup && currentGroup.items.length > 0) {
    currentGroups.push(currentGroup);
  }
  if (currentGroups.length > 0) {
    flushChoices();
  }
  flushMarkdown();

  return segments;
}

// ---------------------------------------------------------------------------
// ChoiceSelector component
// ---------------------------------------------------------------------------

interface ChoiceSelectorProps {
  segments: ContentSegment[];
  onConfirm: (selected: string[]) => void;
}

function ChoiceSelector({ segments, onConfirm }: ChoiceSelectorProps) {
  const [selected, setSelected] = useState<Set<string>>(new Set());

  const toggle = useCallback((item: string) => {
    setSelected((prev) => {
      const next = new Set(prev);
      if (next.has(item)) next.delete(item);
      else next.add(item);
      return next;
    });
  }, []);

  const handleConfirm = () => {
    if (selected.size === 0) return;
    onConfirm([...selected]);
    setSelected(new Set());
  };

  return (
    <div className="space-y-3">
      {segments.map((seg, si) => {
        if (seg.type === 'markdown') {
          return (
            <ReactMarkdown key={si} remarkPlugins={[remarkGfm]} components={mdComponents}>
              {seg.content}
            </ReactMarkdown>
          );
        }

        return (
          <div key={si} className="space-y-3">
            {seg.groups.map((group, gi) => (
              <div key={gi}>
                {group.heading && (
                  <p className="text-[11px] font-semibold text-gray-500 dark:text-zinc-400 uppercase tracking-wide mb-1.5">
                    {group.heading}
                  </p>
                )}
                <div className="flex flex-col gap-1">
                  {group.items.map((item) => {
                    const isOn = selected.has(item);
                    return (
                      <button
                        key={item}
                        type="button"
                        onClick={() => toggle(item)}
                        className={cn(
                          'flex items-center gap-2 w-full text-left px-2.5 py-1.5 rounded-lg text-xs transition-all duration-100',
                          isOn
                            ? 'bg-teal-500/12 text-teal-700 dark:text-teal-300 border border-teal-500/35'
                            : 'bg-white/60 dark:bg-white/3 text-gray-700 dark:text-zinc-300 border border-gray-200 dark:border-white/8 hover:bg-gray-50 dark:hover:bg-white/6 hover:border-gray-300 dark:hover:border-white/15',
                        )}
                      >
                        <span className={cn(
                          'flex items-center justify-center size-4 rounded border shrink-0 transition-colors',
                          isOn ? 'bg-teal-500 border-teal-500' : 'border-gray-300 dark:border-zinc-600',
                        )}>
                          {isOn && <Check size={9} className="text-white" />}
                        </span>
                        <span className="leading-snug">{item}</span>
                      </button>
                    );
                  })}
                </div>
              </div>
            ))}
          </div>
        );
      })}

      {/* Confirm button */}
      {selected.size > 0 && (
        <button
          type="button"
          onClick={handleConfirm}
          className="flex items-center gap-1.5 px-3 py-1.5 rounded-lg text-xs font-semibold bg-teal-600 hover:bg-teal-500 text-white transition-colors mt-1"
        >
          <Send size={11} />
          Enviar selección ({selected.size})
        </button>
      )}
    </div>
  );
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
        <div className="flex items-center justify-between px-3 py-1.5 bg-gray-100/60 dark:bg-white/4 rounded-t-lg border border-b-0 border-gray-300 dark:border-white/8">
          <span className="text-[10px] font-mono text-gray-500 dark:text-zinc-500 uppercase tracking-wider">{language}</span>
          <button
            type="button"
            onClick={handleCopy}
            className="flex items-center gap-1 text-[10px] text-gray-500 dark:text-zinc-500 hover:text-gray-900 dark:hover:text-zinc-100 transition-colors"
          >
            {copied ? <Check size={10} /> : <Copy size={10} />}
            {copied ? 'Copiado' : 'Copiar'}
          </button>
        </div>
      )}
      <pre
        className={cn(
          'overflow-x-auto p-3 bg-gray-50/80 dark:bg-black/30 text-gray-900 dark:text-zinc-100 text-xs font-mono border border-gray-300 dark:border-white/8',
          language ? 'rounded-b-lg' : 'rounded-lg',
        )}
      >
        <code>{children}</code>
      </pre>
      {!language && (
        <button
          type="button"
          onClick={handleCopy}
          className="absolute top-2 right-2 opacity-0 group-hover:opacity-100 flex items-center justify-center size-6 rounded bg-gray-100/80 dark:bg-black/40 border border-gray-300 dark:border-white/10 text-gray-500 dark:text-zinc-500 hover:text-gray-900 dark:hover:text-zinc-100 transition-all"
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
      <code className="text-teal-400 bg-gray-100 dark:bg-white/8 px-1 py-0.5 rounded text-xs font-mono" {...props}>
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
    <h1 className="text-base font-bold text-gray-900 dark:text-zinc-100 mt-4 mb-2 pb-1.5 border-b border-gray-300 dark:border-white/8">{children}</h1>
  ),
  h2: ({ children }) => (
    <h2 className="text-sm font-bold text-gray-900 dark:text-zinc-100 mt-3 mb-1.5">{children}</h2>
  ),
  h3: ({ children }) => (
    <h3 className="text-[13px] font-semibold text-gray-900 dark:text-zinc-100 mt-2.5 mb-1">{children}</h3>
  ),
  h4: ({ children }) => (
    <h4 className="text-xs font-semibold text-gray-900 dark:text-zinc-100 mt-2 mb-1">{children}</h4>
  ),

  // ---- Text elements ----
  p: ({ children }) => (
    <p className="text-[13px] leading-relaxed text-gray-900 dark:text-zinc-100 my-1.5">{children}</p>
  ),
  a: ({ children, href }) => (
    <a href={href} target="_blank" rel="noopener noreferrer" className="text-teal-400 hover:underline">{children}</a>
  ),
  strong: ({ children }) => (
    <strong className="font-semibold text-gray-900 dark:text-zinc-100">{children}</strong>
  ),
  em: ({ children }) => (
    <em className="italic text-gray-900 dark:text-zinc-100">{children}</em>
  ),

  // ---- Lists ----
  ul: ({ children }) => (
    <ul className="list-disc pl-4 space-y-0.5 my-1.5">{children}</ul>
  ),
  ol: ({ children }) => (
    <ol className="list-decimal pl-4 space-y-0.5 my-1.5">{children}</ol>
  ),
  li: ({ children }) => (
    <li className="text-[13px] leading-relaxed text-gray-900 dark:text-zinc-100">{children}</li>
  ),

  // ---- Other ----
  blockquote: ({ children }) => (
    <blockquote className="border-l-2 border-teal-500/30 pl-3 my-2 text-gray-500 dark:text-zinc-500 italic">{children}</blockquote>
  ),
  hr: () => <hr className="my-3 border-gray-300 dark:border-white/8" />,
};

// ---------------------------------------------------------------------------
// CopyButton — for message copy
// ---------------------------------------------------------------------------

function CopyMessageButton({ text }: { text: string }) {
  const [copied, setCopied] = useState(false);
  const handleCopy = () => {
    navigator.clipboard.writeText(text).then(() => {
      setCopied(true);
      setTimeout(() => setCopied(false), 2000);
    });
  };
  return (
    <button
      type="button"
      onClick={handleCopy}
      title="Copiar mensaje"
      className="flex items-center justify-center size-5 rounded text-gray-400 dark:text-zinc-600 hover:text-gray-700 dark:hover:text-zinc-300 hover:bg-gray-100 dark:hover:bg-white/8 transition-colors"
    >
      {copied ? <Check size={11} /> : <Copy size={11} />}
    </button>
  );
}

// ---------------------------------------------------------------------------
// AudioPlayer
// ---------------------------------------------------------------------------

function AudioPlayer({ url }: { url: string }) {
  return (
    <div className="mt-2 flex items-center gap-2 rounded-lg bg-gray-100 dark:bg-white/5 border border-gray-200 dark:border-white/8 px-3 py-2">
      <Volume2 size={13} className="shrink-0 text-teal-500" />
      <audio controls src={url} className="flex-1 h-7 min-w-0" style={{ accentColor: '#14b8a6' }} />
    </div>
  );
}

// ---------------------------------------------------------------------------
// ChatMessage
// ---------------------------------------------------------------------------

export function ChatMessage({ message, activeAgent, projectId, onExecute, onCancel, onModify, onSend, onUndo, onWorkflowAction, contextEntities }: ChatMessageProps) {
  const isUser = message.role === 'user';

  // Parsear todos los bloques especiales del mensaje del asistente
  const parsedBlocks = useMemo(
    () => !isUser ? parseAiMessage(message.content) : null,
    [isUser, message.content],
  );

  const actionPlan = !isUser
    ? (message.actionPlan ?? parseActionPlan(message.content))
    : null;

  const workflowActions = !isUser ? parseWorkflowActions(message.content) : [];
  const audioUrl = !isUser ? (message.audioUrl ?? parseAudioUrl(message.content)) : null;

  // Determine contextual button label based on first action type
  const confirmLabel = useMemo(() => {
    if (!actionPlan?.actions?.length) return undefined;
    const firstType = (actionPlan.actions[0] as { type?: string }).type ?? '';
    if (firstType === 'create_project') return 'Crear proyecto';
    if (firstType.includes('scene')) return 'Crear escenas';
    if (firstType.includes('video')) return 'Crear video';
    if (firstType.includes('character')) return 'Crear personaje';
    if (firstType.includes('background')) return 'Crear fondo';
    return 'Guardar cambios';
  }, [actionPlan]);

  // Los bloques especiales que vienen del nuevo parser
  const specialBlocks = parsedBlocks?.blocks ?? [];
  const previewBlocks = specialBlocks.filter((b) => b.type === 'PREVIEW');
  const optionsBlocks = specialBlocks.filter((b) => b.type === 'OPTIONS');
  const scenePlanBlocks = specialBlocks.filter((b) => b.type === 'SCENE_PLAN');
  const selectBlocks = specialBlocks.filter((b) => b.type === 'SELECT');
  const diffBlocks = specialBlocks.filter((b) => b.type === 'DIFF');
  const promptPreviewBlocks = specialBlocks.filter((b) => b.type === 'PROMPT_PREVIEW');
  const projectSummaryBlocks = specialBlocks.filter((b) => b.type === 'PROJECT_SUMMARY');
  const createBlocks = specialBlocks.filter((b) => b.type === 'CREATE');
  const sceneDetailBlocks = specialBlocks.filter((b) => b.type === 'SCENE_DETAIL');
  const resourceListBlocks = specialBlocks.filter((b) => b.type === 'RESOURCE_LIST');
  const videoSummaryBlocks = specialBlocks.filter((b) => b.type === 'VIDEO_SUMMARY');

  const textContent = !isUser
    ? extractTextContent(message.content)
    : message.content;

  // Detect interactive choices (☐ lines) in assistant messages
  const contentSegments = useMemo(
    () => !isUser ? parseContentSegments(textContent) : null,
    [isUser, textContent],
  );
  const hasChoices = contentSegments?.some((s) => s.type === 'choices') ?? false;

  const handleChoiceConfirm = useCallback((items: string[]) => {
    const text = items.join(', ');
    if (onSend) {
      onSend(text);
    } else {
      onModify(text);
    }
  }, [onSend, onModify]);

  const renderedMarkdown = useMemo(() => {
    if (!textContent || hasChoices) return null;
    return (
      <ReactMarkdown remarkPlugins={[remarkGfm]} components={mdComponents}>
        {textContent}
      </ReactMarkdown>
    );
  }, [textContent, hasChoices]);

  const agentBadge = !isUser && activeAgent ? AGENT_BADGE[activeAgent] : null;

  return (
    <div className={cn('group', isUser ? 'flex flex-col items-end' : '')}>
      {/* ---- Message header line: avatar + name + agent + time ---- */}
      <div className={cn('flex items-center gap-1.5 mb-1', isUser ? 'flex-row-reverse' : '')}>
        {!isUser ? (
          <>
            <div className="flex items-center justify-center size-5 rounded-md bg-teal-600 shrink-0">
              <KiyokoIcon size={10} className="text-white" />
            </div>
            <span className="text-[11px] font-semibold text-foreground">Kiyoko</span>
            {agentBadge && (
              <span className="flex items-center gap-0.5 text-[10px] text-muted-foreground">
                · <agentBadge.Icon size={9} /> {agentBadge.label}
              </span>
            )}
          </>
        ) : (
          <span className="text-[11px] font-semibold text-foreground">Tú</span>
        )}
        <span className="text-[10px] text-muted-foreground/60">· {formatTime(message.timestamp)}</span>
      </div>

      {/* ---- Message body (NO bubble — clean flat style per Section 23.9) ---- */}
      <div className={cn('space-y-1.5 min-w-0', isUser ? 'max-w-[85%] text-right' : 'flex-1 pl-6.5')}>
        {/* User message — no bubble */}
        {isUser ? (
          <div className="text-[13px] leading-relaxed text-foreground">
            {/* Image thumbnails (uploaded) */}
            {message.images && message.images.length > 0 && (
              <div className="flex flex-wrap gap-2 mb-2 justify-end">
                {message.images.map((url, i) => (
                  <a
                    key={i}
                    href={url}
                    target="_blank"
                    rel="noopener noreferrer"
                    className="block rounded-lg overflow-hidden border border-border hover:border-teal-500/40 transition-colors"
                  >
                    <img
                      src={url}
                      alt={`Imagen adjunta ${i + 1}`}
                      className="w-40 h-32 object-cover"
                      loading="lazy"
                    />
                  </a>
                ))}
              </div>
            )}
            {message.content && <span>{message.content}</span>}
          </div>
        ) : (
          <>
            {/* Assistant text content — no bubble background */}
            {(() => {
              if (!textContent && !actionPlan) {
                return (
                  <div className="flex items-center gap-2 text-muted-foreground py-1">
                    <div className="flex gap-1">
                      <span className="size-1.5 rounded-full bg-teal-500/60 animate-bounce" style={{ animationDelay: '0ms' }} />
                      <span className="size-1.5 rounded-full bg-teal-500/60 animate-bounce" style={{ animationDelay: '150ms' }} />
                      <span className="size-1.5 rounded-full bg-teal-500/60 animate-bounce" style={{ animationDelay: '300ms' }} />
                    </div>
                    <span className="text-xs">Kiyoko pensando...</span>
                  </div>
                );
              }
              if (textContent || hasChoices) {
                return (
                  <div className="text-[13px] leading-relaxed text-foreground overflow-hidden">
                    {/* Interactive choices or plain markdown */}
                    {hasChoices && contentSegments
                      ? <ChoiceSelector segments={contentSegments} onConfirm={handleChoiceConfirm} />
                      : renderedMarkdown
                    }

                    {/* Audio player */}
                    {audioUrl && <AudioPlayer url={audioUrl} />}

                    {/* [SCENE_PLAN] — Timeline visual de escenas propuestas */}
                    {scenePlanBlocks.map((b, i) => {
                      const scenes = Array.isArray(b.data) ? b.data as ScenePlanItem[] : [];
                      if (!scenes.length) return null;
                      return <ScenePlanTimeline key={i} scenes={scenes} />;
                    })}

                    {/* [OPTIONS] — Botones de selección */}
                    {optionsBlocks.map((b, i) => {
                      const options: string[] = Array.isArray(b.data)
                        ? b.data as string[]
                        : typeof b.data === 'string'
                          ? b.data.split('\n').map((s) => s.replace(/^[☐□\-*•]\s*/, '').trim()).filter(Boolean)
                          : [];
                      if (!options.length) return null;
                      return (
                        <div key={i} className="mt-2.5">
                          <OptionsBlock
                            options={options}
                            onSelect={(opt) => onSend ? onSend(opt) : onModify(opt)}
                          />
                        </div>
                      );
                    })}

                    {/* [SELECT:type] — Selector de entidades */}
                    {selectBlocks.map((b, i) => {
                      const entityType = (b.subtype ?? 'scene') as 'scene' | 'video' | 'character' | 'background';
                      const entities = contextEntities?.[`${entityType}s` as keyof typeof contextEntities] ?? [];
                      return (
                        <div key={i} className="mt-2.5">
                          <EntitySelector
                            entityType={entityType}
                            entities={entities}
                            onSelect={(entity) => onSend ? onSend(`He seleccionado: ${entity.label} (${entity.id})`) : onModify(`He seleccionado: ${entity.label}`)}
                          />
                        </div>
                      );
                    })}

                    {/* [DIFF] — Antes vs después */}
                    {diffBlocks.map((b, i) => {
                      const d = typeof b.data === 'object' && b.data !== null
                        ? b.data as { field?: string; before?: string; after?: string }
                        : { field: '', before: '', after: '' };
                      return (
                        <DiffView
                          key={i}
                          field={d.field ?? b.subtype ?? 'Cambio'}
                          before={d.before ?? ''}
                          after={d.after ?? ''}
                        />
                      );
                    })}

                    {/* [PROMPT_PREVIEW] — Preview de prompt generado */}
                    {promptPreviewBlocks.map((b, i) => {
                      const d = typeof b.data === 'object' && b.data !== null
                        ? b.data as PromptPreviewData
                        : { prompt_en: String(b.data ?? '') };
                      return <PromptPreviewCard key={i} data={d} />;
                    })}

                    {/* [PROJECT_SUMMARY] — Rich project status card */}
                    {projectSummaryBlocks.map((b, i) => {
                      const d = typeof b.data === 'object' && b.data !== null
                        ? b.data as ProjectSummaryData
                        : null;
                      if (!d) return null;
                      return <ProjectSummaryCard key={i} data={d} />;
                    })}

                    {/* [CREATE:character] / [CREATE:background] — Interactive creation forms */}
                    {createBlocks.map((b, i) => {
                      const entityType = b.subtype;
                      const prefillData = typeof b.data === 'object' && b.data !== null
                        ? b.data as Record<string, string>
                        : {};

                      if (entityType === 'character') {
                        return (
                          <CharacterCreationCard
                            key={`create-char-${i}`}
                            projectId={projectId}
                            prefill={{
                              name: prefillData.name,
                              role: prefillData.role,
                              description: prefillData.description,
                              personality: prefillData.personality,
                              visual_description: prefillData.visual_description,
                            }}
                            onCreated={(msg) => onSend ? onSend(msg) : onModify(msg)}
                            onCancel={() => {}}
                          />
                        );
                      }

                      if (entityType === 'background') {
                        return (
                          <BackgroundCreationCard
                            key={`create-bg-${i}`}
                            projectId={projectId}
                            prefill={{
                              name: prefillData.name,
                              location_type: prefillData.location_type,
                              time_of_day: prefillData.time_of_day,
                              description: prefillData.description,
                            }}
                            onCreated={(msg) => onSend ? onSend(msg) : onModify(msg)}
                            onCancel={() => {}}
                          />
                        );
                      }

                      if (entityType === 'video') {
                        return (
                          <VideoCreationCard
                            key={`create-vid-${i}`}
                            projectId={projectId}
                            prefill={{
                              title: prefillData.title,
                              platform: prefillData.platform,
                              target_duration_seconds: prefillData.target_duration_seconds ? Number(prefillData.target_duration_seconds) : undefined,
                              description: prefillData.description,
                            }}
                            onCreated={(msg) => onSend ? onSend(msg) : onModify(msg)}
                            onCancel={() => {}}
                          />
                        );
                      }

                      return null;
                    })}

                    {/* [SCENE_DETAIL] — Rich scene card with all relations */}
                    {sceneDetailBlocks.map((b, i) => {
                      const d = typeof b.data === 'object' && b.data !== null
                        ? b.data as SceneDetailData
                        : null;
                      if (!d) return null;
                      return (
                        <SceneDetailCard
                          key={`scene-detail-${i}`}
                          data={d}
                          onAction={(action) => onSend ? onSend(action) : onModify(action)}
                        />
                      );
                    })}

                    {/* [RESOURCE_LIST] — Characters or backgrounds grid */}
                    {resourceListBlocks.map((b, i) => {
                      const d = typeof b.data === 'object' && b.data !== null
                        ? b.data as ResourceListData
                        : null;
                      if (!d) return null;
                      return (
                        <ResourceListCard
                          key={`resource-${i}`}
                          data={d}
                          onAction={(action) => onSend ? onSend(action) : onModify(action)}
                        />
                      );
                    })}

                    {/* [VIDEO_SUMMARY] — Rich video status card */}
                    {videoSummaryBlocks.map((b, i) => {
                      const d = typeof b.data === 'object' && b.data !== null ? b.data as VideoSummaryData : null;
                      if (!d) return null;
                      return <VideoSummaryCard key={`vid-sum-${i}`} data={d} onAction={(a) => onSend ? onSend(a) : onModify(a)} />;
                    })}

                    {/* Workflow action buttons */}
                    {workflowActions.length > 0 && (
                      <div className="flex flex-wrap gap-1.5 mt-3 pt-2.5 border-t border-gray-200 dark:border-white/8">
                        {workflowActions.map((action) => (
                          <button
                            key={action.id}
                            type="button"
                            onClick={() => onWorkflowAction?.(action.id, action.label)}
                            className="px-3 py-1.5 rounded-lg text-xs font-medium bg-teal-500/10 text-teal-700 dark:text-teal-400 border border-teal-500/25 hover:bg-teal-500/20 hover:border-teal-500/40 transition-colors"
                          >
                            {action.label}
                          </button>
                        ))}
                      </div>
                    )}
                  </div>
                );
              }
              return null;
            })()}

            {/* [PREVIEW:type] — Tarjetas de previsualización antes de guardar */}
            {previewBlocks.map((b, i) => {
              const data = (typeof b.data === 'object' && b.data !== null)
                ? b.data as Record<string, unknown>
                : {};
              const confirmed = (message.executionResults?.every((r) => r.success)) ?? false;
              return (
                <PreviewCard
                  key={i}
                  type={b.subtype ?? 'scene'}
                  data={data}
                  isExecuting={message.isExecuting ?? false}
                  isConfirmed={confirmed}
                  confirmLabel={confirmLabel}
                  onConfirm={() => actionPlan
                    ? onExecute(message.id, actionPlan)
                    : onSend?.(`Confirmo guardar los datos mostrados`)}
                  onEdit={() => onSend?.(`¿Qué quiero cambiar?`)}
                  onCancel={() => onCancel(message.id)}
                />
              );
            })}

            {/* Action plan card — hide when preview handles confirm, BUT show if execution had errors */}
            {actionPlan && (
              previewBlocks.length === 0 ||
              (message.executionResults !== undefined && !message.executionResults.every((r) => r.success))
            ) && (
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

        {/* Bottom row: action buttons (time is in header now) */}
        <div className={cn(
          'flex items-center gap-1 mt-0.5 opacity-0 group-hover:opacity-100 transition-opacity',
          isUser ? 'justify-end' : 'justify-start pl-6.5',
        )}>
          {/* Copy button (assistant messages) */}
          {!isUser && textContent && <CopyMessageButton text={textContent} />}

          {/* Retry button (user messages) */}
          {isUser && message.content && (
            <button
              type="button"
              onClick={() => onModify(message.content)}
              title="Editar y reenviar"
              className="flex items-center justify-center size-5 rounded text-muted-foreground hover:text-foreground hover:bg-accent transition-colors"
            >
              <RotateCcw size={11} />
            </button>
          )}
        </div>
      </div>
    </div>
  );
}
