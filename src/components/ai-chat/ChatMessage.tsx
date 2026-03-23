'use client';

import { useMemo } from 'react';
import type { UIMessage as Message } from 'ai';
import type { AiActionPlan } from '@/types/ai-actions';
import { ActionPlanView } from './ActionPlanView';

// ---------------------------------------------------------------------------
// Message content parser
// ---------------------------------------------------------------------------

interface ParsedMessage {
  cleanContent: string;
  actionPlan: AiActionPlan | null;
  inlineActions: { id: string; label: string }[];
  promptBlocks: string[];
}

function parseMessageContent(content: string): ParsedMessage {
  let cleanContent = content;
  let actionPlan: AiActionPlan | null = null;
  const inlineActions: { id: string; label: string }[] = [];
  const promptBlocks: string[] = [];

  // Extract action plan from ```json block with type: "action_plan"
  cleanContent = cleanContent.replace(/```json\s*([\s\S]*?)```/g, (_match, json) => {
    try {
      const parsed = JSON.parse(json.trim()) as Record<string, unknown>;
      if (parsed.type === 'action_plan' && Array.isArray(parsed.actions)) {
        actionPlan = {
          summary_es: (parsed.summary_es as string) ?? '',
          actions: parsed.actions as AiActionPlan['actions'],
          total_scenes_affected: (parsed.total_scenes_affected as number) ?? 0,
          warnings: (parsed.warnings as string[]) ?? [],
        };
        return ''; // Remove from clean content
      }
    } catch { /* not JSON */ }
    return _match; // Keep non-action-plan code blocks
  });

  // Extract prompt blocks ```prompt
  cleanContent = cleanContent.replace(/```prompt\s*([\s\S]*?)```/g, (_match, prompt) => {
    promptBlocks.push(prompt.trim());
    return ''; // Replace with nothing — rendered separately
  });

  // Extract inline action buttons [ACTIONS: id|label, id2|label2]
  cleanContent = cleanContent.replace(/\[ACTIONS:\s*([^\]]+)\]/g, (_match, actionsStr) => {
    const parts = (actionsStr as string).split(',').map((s: string) => s.trim());
    for (const part of parts) {
      const [id, label] = part.split('|');
      if (id && label) inlineActions.push({ id: id.trim(), label: label.trim() });
    }
    return '';
  });

  // Remove navigation markers from visible text
  cleanContent = cleanContent.replace(/\[NAVIGATE:[^\]]+\]/g, '');

  // Remove [SUGERENCIAS] blocks from clean content (suggestions are shown separately)
  cleanContent = cleanContent.replace(/\[SUGERENCIAS\]([\s\S]*?)(?:\[\/SUGERENCIAS\]|$)/, '').trim();

  return { cleanContent: cleanContent.trim(), actionPlan, inlineActions, promptBlocks };
}

// ---------------------------------------------------------------------------
// PromptBlock — copyable prompt display
// ---------------------------------------------------------------------------

function PromptBlock({ prompt }: { prompt: string }) {
  const copy = () => navigator.clipboard.writeText(prompt).catch(() => {});
  return (
    <div className="relative mt-2 rounded-lg bg-gray-900 p-3">
      <p className="mb-1 text-xs font-medium text-gray-400">Prompt generado</p>
      <pre className="whitespace-pre-wrap break-words text-xs text-green-400">{prompt}</pre>
      <button
        onClick={copy}
        className="absolute right-2 top-2 rounded px-2 py-1 text-xs text-gray-400
                   transition-colors hover:bg-gray-700 hover:text-white"
      >
        📋
      </button>
    </div>
  );
}

// ---------------------------------------------------------------------------
// ChatMessage component
// ---------------------------------------------------------------------------

interface ChatMessageProps {
  message: Message;
  onConfirmPlan?: (plan: AiActionPlan) => void;
  onCancelPlan?: () => void;
  onAction?: (actionId: string) => void;
  isExecutingPlan?: boolean;
}

export function ChatMessage({
  message,
  onConfirmPlan,
  onCancelPlan,
  onAction,
  isExecutingPlan,
}: ChatMessageProps) {
  const isUser = message.role === 'user';

  const rawContent = message.parts
    .filter((p): p is { type: 'text'; text: string } => p.type === 'text')
    .map((p) => p.text)
    .join('');

  const { cleanContent, actionPlan, inlineActions, promptBlocks } = useMemo(
    () => parseMessageContent(rawContent),
    [rawContent],
  );

  return (
    <div className={`flex ${isUser ? 'justify-end' : 'justify-start'}`}>
      <div
        className={`max-w-[90%] rounded-xl px-3 py-2.5 text-sm ${
          isUser
            ? 'bg-blue-600 text-white'
            : 'bg-gray-100 text-gray-800 dark:bg-gray-800 dark:text-gray-100'
        }`}
      >
        {/* Main text */}
        {cleanContent && (
          <p className="whitespace-pre-wrap leading-relaxed">{cleanContent}</p>
        )}

        {/* Prompt blocks (copyable) */}
        {promptBlocks.map((p, i) => (
          <PromptBlock key={i} prompt={p} />
        ))}

        {/* Action plan confirmation */}
        {actionPlan && onConfirmPlan && onCancelPlan && (
          <ActionPlanView
            plan={actionPlan}
            onConfirm={() => onConfirmPlan(actionPlan)}
            onCancel={onCancelPlan}
            isExecuting={isExecutingPlan}
          />
        )}

        {/* Inline action buttons */}
        {inlineActions.length > 0 && (
          <div className="mt-2 flex flex-wrap gap-1.5">
            {inlineActions.map((action) => (
              <button
                key={action.id}
                onClick={() => onAction?.(action.id)}
                className={`rounded-md px-2.5 py-1.5 text-xs transition-colors ${
                  isUser
                    ? 'bg-white/15 hover:bg-white/25'
                    : 'bg-gray-200 hover:bg-gray-300 dark:bg-gray-700 dark:hover:bg-gray-600'
                }`}
              >
                {action.label}
              </button>
            ))}
          </div>
        )}
      </div>
    </div>
  );
}
