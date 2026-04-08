'use client';

import { useState } from 'react';

interface ExpandablePromptProps {
  text?: string | null;
  fallback?: string;
}

export function ExpandablePrompt({ text, fallback = 'Sin prompt' }: ExpandablePromptProps) {
  const [expanded, setExpanded] = useState(false);

  if (!text) {
    return <p className="flex-1 min-w-0 text-xs text-muted-foreground/40 italic px-3 py-1.5">{fallback}</p>;
  }

  return (
    <button
      type="button"
      onClick={() => setExpanded(!expanded)}
      className="flex-1 min-w-0 text-left font-mono text-xs text-muted-foreground bg-background rounded-lg px-3 py-1.5 cursor-pointer hover:bg-accent/50 transition-all"
      title={expanded ? 'Click para colapsar' : 'Click para expandir'}
    >
      <span className={expanded ? '' : 'block overflow-hidden whitespace-nowrap text-ellipsis'}>
        {text}
      </span>
    </button>
  );
}
