'use client';

import { useState } from 'react';
import { Copy, Check, Image, Film } from 'lucide-react';
import { cn } from '@/lib/utils/cn';

export interface PromptPreviewData {
  scene_number?: number;
  scene_title?: string;
  prompt_type?: 'image' | 'video';
  prompt_en: string;
  description_local?: string;
  tags?: string[];
}

interface PromptPreviewCardProps {
  data: PromptPreviewData;
}

export function PromptPreviewCard({ data }: PromptPreviewCardProps) {
  const [copied, setCopied] = useState(false);
  const isVideo = data.prompt_type === 'video';

  const handleCopy = () => {
    navigator.clipboard.writeText(data.prompt_en).then(() => {
      setCopied(true);
      setTimeout(() => setCopied(false), 2000);
    });
  };

  return (
    <div className="mt-2.5 rounded-xl border border-border overflow-hidden text-xs">
      {/* Header */}
      <div className="flex items-center gap-2 px-3 py-2 bg-muted/50 border-b border-border">
        {isVideo ? (
          <Film size={12} className="text-purple-500 shrink-0" />
        ) : (
          <Image size={12} className="text-blue-500 shrink-0" />
        )}
        <span className="font-semibold text-foreground flex-1 min-w-0 truncate">
          {data.scene_title
            ? `#${data.scene_number ?? '?'} ${data.scene_title}`
            : `Prompt ${isVideo ? 'video' : 'imagen'}`}
        </span>
        <span className={cn(
          'px-1.5 py-0.5 rounded text-[10px] font-semibold uppercase',
          isVideo
            ? 'bg-purple-500/10 text-purple-500 dark:text-purple-400'
            : 'bg-blue-500/10 text-blue-500 dark:text-blue-400',
        )}>
          {isVideo ? 'Video' : 'Imagen'}
        </span>
      </div>

      {/* Prompt EN */}
      <div className="p-3 border-b border-border">
        <div className="flex items-start justify-between gap-2">
          <div>
            <p className="text-[10px] font-semibold text-muted-foreground uppercase tracking-wide mb-1">
              Prompt (EN)
            </p>
            <p className="text-foreground leading-relaxed font-mono text-[11px] whitespace-pre-wrap">
              {data.prompt_en}
            </p>
          </div>
          <button
            type="button"
            onClick={handleCopy}
            className="shrink-0 flex items-center justify-center size-6 rounded-md text-muted-foreground hover:text-foreground hover:bg-accent transition-colors"
            title="Copiar prompt"
          >
            {copied ? <Check size={12} /> : <Copy size={12} />}
          </button>
        </div>
      </div>

      {/* Description (user language) */}
      {data.description_local && (
        <div className="p-3 border-b border-border bg-muted/30">
          <p className="text-[10px] font-semibold text-muted-foreground uppercase tracking-wide mb-1">
            Lo que se verá
          </p>
          <p className="text-foreground/80 leading-relaxed">{data.description_local}</p>
        </div>
      )}

      {/* Tags */}
      {data.tags && data.tags.length > 0 && (
        <div className="px-3 py-2 flex flex-wrap gap-1">
          {data.tags.map((tag) => (
            <span
              key={tag}
              className="px-1.5 py-0.5 rounded bg-accent text-muted-foreground text-[10px]"
            >
              {tag}
            </span>
          ))}
        </div>
      )}
    </div>
  );
}
