'use client';

import type { QuickAction } from '@/lib/ai/chat-context';

interface QuickActionsProps {
  actions: QuickAction[];
  onAction: (prompt: string) => void;
}

export function QuickActions({ actions, onAction }: QuickActionsProps) {
  if (actions.length === 0) return null;

  return (
    <div className="flex flex-wrap gap-1.5 px-3 pb-2">
      {actions.map((action) => (
        <button
          key={action.id}
          onClick={() => onAction(action.prompt)}
          className="rounded-full bg-gray-100 px-2.5 py-1.5 text-xs transition-colors
                     hover:bg-gray-200 dark:bg-gray-800 dark:hover:bg-gray-700"
        >
          {action.icon} {action.label}
        </button>
      ))}
    </div>
  );
}
