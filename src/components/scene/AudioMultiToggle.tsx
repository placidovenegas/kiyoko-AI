'use client';

import { useState, useCallback } from 'react';
import { cn } from '@/lib/utils/cn';
import { AUDIO_FLAGS, type AudioFlag } from '@/lib/constants/scene-options';
import { Tooltip } from '@heroui/react';

interface AudioMultiToggleProps {
  activeFlags: string[];
  onChange: (flags: string[]) => void;
  musicNotes?: string;
  onMusicNotesChange?: (notes: string) => void;
  ambientNotes?: string;
  onAmbientNotesChange?: (notes: string) => void;
  disabled?: boolean;
  className?: string;
}

export function AudioMultiToggle({
  activeFlags,
  onChange,
  musicNotes = '',
  onMusicNotesChange,
  ambientNotes = '',
  onAmbientNotesChange,
  disabled,
  className,
}: AudioMultiToggleProps) {
  const toggleFlag = useCallback(
    (key: string) => {
      if (disabled) return;

      if (key === 'silent') {
        // Silent deactivates everything else
        if (activeFlags.includes('silent')) {
          onChange([]);
        } else {
          onChange(['silent']);
        }
        return;
      }

      // Any other flag: remove silent if active, toggle the flag
      let next = activeFlags.filter((f) => f !== 'silent');
      if (next.includes(key)) {
        next = next.filter((f) => f !== key);
      } else {
        next = [...next, key];
      }

      // If nothing selected, default to silent
      if (next.length === 0) {
        next = ['silent'];
      }

      onChange(next);
    },
    [activeFlags, onChange, disabled],
  );

  return (
    <div className={cn('space-y-2', className)}>
      <span className="text-[10px] font-semibold uppercase tracking-wider text-muted-foreground">
        Audio
      </span>
      <div className="flex flex-wrap gap-1.5" role="group" aria-label="Configuracion de audio">
        {AUDIO_FLAGS.map((flag: AudioFlag) => {
          const isActive = activeFlags.includes(flag.key);
          const Icon = flag.icon;
          return (
            <Tooltip key={flag.key}>
              <Tooltip.Trigger>
                <button
                  type="button"
                  onClick={() => toggleFlag(flag.key)}
                  disabled={disabled}
                  aria-pressed={isActive}
                  aria-label={flag.label}
                  className={cn(
                    'inline-flex items-center gap-1.5 rounded-md px-2.5 py-1.5 text-xs font-medium transition-colors',
                    'focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-ring focus-visible:ring-offset-1',
                    isActive
                      ? 'bg-primary text-white'
                      : 'bg-secondary text-muted-foreground hover:bg-card',
                    disabled && 'cursor-not-allowed opacity-50',
                  )}
                >
                  <Icon className="h-3.5 w-3.5" />
                  {flag.label}
                </button>
              </Tooltip.Trigger>
              <Tooltip.Content>{flag.description}</Tooltip.Content>
            </Tooltip>
          );
        })}
      </div>

      {/* Conditional inputs for music and ambient */}
      {activeFlags.includes('music') && onMusicNotesChange && (
        <input
          type="text"
          value={musicNotes}
          onChange={(e) => onMusicNotesChange(e.target.value)}
          placeholder="Describe la musica de fondo..."
          disabled={disabled}
          aria-label="Notas de musica de fondo"
          className="w-full rounded-md border border-border bg-card px-2.5 py-1.5 text-xs text-foreground outline-none placeholder:text-muted-foreground focus:border-primary focus:ring-1 focus:ring-primary"
        />
      )}
      {activeFlags.includes('ambient') && onAmbientNotesChange && (
        <input
          type="text"
          value={ambientNotes}
          onChange={(e) => onAmbientNotesChange(e.target.value)}
          placeholder="Describe los sonidos ambiente..."
          disabled={disabled}
          aria-label="Notas de sonido ambiente"
          className="w-full rounded-md border border-border bg-card px-2.5 py-1.5 text-xs text-foreground outline-none placeholder:text-muted-foreground focus:border-primary focus:ring-1 focus:ring-primary"
        />
      )}
    </div>
  );
}
