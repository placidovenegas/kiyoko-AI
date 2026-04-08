'use client';

import { useRef, useEffect } from 'react';
import { Sparkles, Send, Loader2, Check, Clock, Camera } from 'lucide-react';
import { cn } from '@/lib/utils/cn';
import type { IaMessage, SuggestionData } from './scene-work-types';
import { PHASES, ANGLES, MOVEMENTS } from './scene-work-types';
import type { Character, Background } from '@/types';

interface ChatProps {
  messages: IaMessage[];
  processing: boolean;
  input: string;
  onInputChange: (val: string) => void;
  onSend: (directText?: string) => void;
  onUseSuggestion: (data: SuggestionData) => void;
  characters: Character[];
  backgrounds: Background[];
  isEdit: boolean;
}

/* ── Markdown-ish line renderer ──────────────────────────── */

function ChatLine({ line }: { line: string }) {
  if (line === '---') return <hr className="border-border my-1" />;
  if (line.startsWith('**') && line.includes(':**')) {
    const parts = line.match(/^\*\*(.+?):\*\*\s?(.*)/);
    if (parts) return <p className="text-xs"><strong className="font-semibold text-foreground">{parts[1]}:</strong> {parts[2]}</p>;
  }
  if (line.startsWith('**') && line.endsWith('**')) {
    return <p className="text-xs font-semibold text-foreground mt-2">{line.replace(/\*\*/g, '')}</p>;
  }
  if (!line.trim()) return null;
  return <p className="text-xs text-muted-foreground">{line}</p>;
}

/* ── Suggestion Card ─────────────────────────────────────── */

function SuggestionCard({ data, onUse, onAnother, characters, backgrounds }: {
  data: SuggestionData;
  onUse: () => void;
  onAnother: () => void;
  characters: Character[];
  backgrounds: Background[];
}) {
  const phase = PHASES.find(p => p.value === data.arcPhase);
  const angle = ANGLES.find(a => a.value === data.cameraAngle);
  const movement = MOVEMENTS.find(m => m.value === data.cameraMovement);
  const chars = characters.filter(c => data.characterIds.includes(c.id));
  const bgs = backgrounds.filter(b => data.backgroundIds.includes(b.id));

  return (
    <div className="rounded-xl border border-primary/20 bg-primary/5 p-3 space-y-2">
      <p className="text-sm font-semibold text-foreground">{data.title}</p>
      {data.description && <p className="text-xs text-muted-foreground line-clamp-2">{data.description}</p>}

      <div className="flex flex-wrap items-center gap-2 text-[11px] text-muted-foreground">
        {phase && (
          <span className="inline-flex items-center gap-1">
            <span className={cn('size-2 rounded-full', phase.color)} />{phase.label}
          </span>
        )}
        <span className="flex items-center gap-1"><Clock className="size-3" />{data.duration}s</span>
        {angle && <span className="flex items-center gap-1"><Camera className="size-3" />{angle.label}</span>}
        {movement && <span>{movement.label}</span>}
      </div>

      {chars.length > 0 && (
        <div className="flex items-center gap-1 text-[11px] text-muted-foreground">
          <span className="font-medium">Personajes:</span>
          {chars.map(c => (
            <span key={c.id} className="inline-flex items-center gap-0.5 rounded bg-card border border-border px-1.5 py-0.5 text-[10px]">
              <span className="size-3 rounded-full text-[7px] font-bold text-white flex items-center justify-center"
                style={{ backgroundColor: c.color_accent ?? '#666' }}>{c.initials?.[0] ?? c.name[0]}</span>
              {c.name}
            </span>
          ))}
        </div>
      )}

      {bgs.length > 0 && (
        <p className="text-[11px] text-muted-foreground">
          <span className="font-medium">Fondo:</span> {bgs.map(b => b.name).join(', ')}
        </p>
      )}

      <div className="flex items-center gap-2 pt-1">
        <button type="button" onClick={onUse}
          className="flex items-center gap-1.5 rounded-lg bg-primary px-3 py-1.5 text-xs font-medium text-primary-foreground hover:bg-primary/90 transition-colors">
          <Check className="size-3" />Usar
        </button>
        <button type="button" onClick={onAnother}
          className="rounded-lg border border-border bg-card px-3 py-1.5 text-xs font-medium text-muted-foreground hover:border-primary/30 hover:text-foreground transition-colors">
          Otra opcion
        </button>
      </div>
    </div>
  );
}

/* ── Main Chat ───────────────────────────────────────────── */

export function SceneWorkChat({ messages, processing, input, onInputChange, onSend, onUseSuggestion, characters, backgrounds, isEdit }: ChatProps) {
  const endRef = useRef<HTMLDivElement>(null);

  useEffect(() => { endRef.current?.scrollIntoView({ behavior: 'smooth' }); }, [messages]);

  return (
    <div className="flex flex-col h-full">
      {/* Header */}
      <div className="flex items-center gap-2 px-4 py-2.5 border-b border-border shrink-0">
        <Sparkles className="size-3.5 text-primary" />
        <span className="text-xs font-medium text-foreground">Kiyoko IA</span>
      </div>

      {/* Messages */}
      <div className="flex-1 overflow-y-auto px-4 py-3 space-y-3">
        {messages.length === 0 && !processing && (
          <div className="space-y-3 py-2">
            <p className="text-xs text-muted-foreground">
              {isEdit
                ? 'Te ayudo a mejorar esta escena. Dime que quieres cambiar.'
                : 'Selecciona donde insertar la escena y te sugerire que crear. O describe lo que quieres.'}
            </p>
            {!isEdit && (
              <div className="flex flex-wrap gap-1.5">
                {['Gancho visual', 'Transicion suave', 'Close-up emocional', 'Escena de accion'].map(s => (
                  <button key={s} type="button" onClick={() => onSend(s)}
                    className="rounded-lg border border-border bg-card px-2.5 py-1.5 text-[11px] text-muted-foreground hover:border-primary/30 hover:text-foreground transition-colors">
                    {s}
                  </button>
                ))}
              </div>
            )}
          </div>
        )}

        {messages.map(msg => (
          <div key={msg.id}>
            <div className={cn('flex gap-2', msg.role === 'user' ? 'justify-end' : '')}>
              {msg.role === 'assistant' && (
                <div className="flex size-6 items-center justify-center rounded-md bg-primary/10 text-primary shrink-0 mt-0.5">
                  <Sparkles className="size-3" />
                </div>
              )}
              <div className={cn('rounded-xl px-3 py-2 text-sm max-w-[90%]',
                msg.role === 'user'
                  ? 'bg-primary text-primary-foreground whitespace-pre-line'
                  : 'bg-background border border-border text-foreground')}>
                {msg.role === 'assistant' ? (
                  <div className="space-y-1">
                    {msg.content.split('\n').map((line, i) => <ChatLine key={i} line={line} />)}
                  </div>
                ) : msg.content}
              </div>
            </div>

            {/* Suggestion card */}
            {msg.suggestion && (
              <div className="mt-2 ml-8">
                <SuggestionCard
                  data={msg.suggestion}
                  onUse={() => onUseSuggestion(msg.suggestion!)}
                  onAnother={() => onSend('Dame otra opcion diferente')}
                  characters={characters}
                  backgrounds={backgrounds}
                />
              </div>
            )}
          </div>
        ))}

        {processing && (
          <div className="flex gap-2">
            <div className="flex size-6 items-center justify-center rounded-md bg-primary/10 text-primary shrink-0">
              <Sparkles className="size-3 animate-pulse" />
            </div>
            <div className="rounded-xl bg-background border border-border px-3 py-2 text-sm text-muted-foreground">
              <Loader2 className="size-3.5 animate-spin inline mr-1.5" />Pensando...
            </div>
          </div>
        )}
        <div ref={endRef} />
      </div>

      {/* Input */}
      <div className="flex items-end gap-2 px-4 py-3 border-t border-border shrink-0">
        <textarea value={input} onChange={e => onInputChange(e.target.value)}
          onKeyDown={e => { if (e.key === 'Enter' && !e.shiftKey) { e.preventDefault(); onSend(); } }}
          placeholder="Describe que quieres..." rows={2}
          className="flex-1 resize-none rounded-xl border border-border bg-background px-3 py-2 text-sm outline-none placeholder:text-muted-foreground/50 focus:border-primary/30" />
        <button type="button" onClick={() => onSend()} disabled={!input.trim() || processing}
          className="flex size-9 items-center justify-center rounded-xl bg-primary text-primary-foreground hover:bg-primary/90 disabled:opacity-50 transition-colors shrink-0">
          <Send className="size-4" />
        </button>
      </div>
    </div>
  );
}
