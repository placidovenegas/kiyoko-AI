'use client';

import { useState, useEffect, useCallback } from 'react';
import { cn } from '@/lib/utils/cn';
import { Play, Pause, Loader2, Volume2, User, Mic } from 'lucide-react';

interface Voice {
  id: string;
  name: string;
  gender: string;
  accent: string;
  language: string;
  provider: string;
}

interface VoiceSelectorProps {
  value: string;
  onChange: (voiceId: string) => void;
  language?: string;
  className?: string;
}

export function VoiceSelector({ value, onChange, language = 'es', className }: VoiceSelectorProps) {
  const [voices, setVoices] = useState<Voice[]>([]);
  const [loading, setLoading] = useState(true);
  const [previewingId, setPreviewingId] = useState<string | null>(null);
  const [previewAudio, setPreviewAudio] = useState<HTMLAudioElement | null>(null);

  useEffect(() => {
    async function fetchVoices() {
      try {
        const res = await fetch('/api/ai/generate-voice');
        if (!res.ok) return;
        const data = await res.json();
        setVoices(data.voices ?? []);
      } catch {
        // Ignore
      } finally {
        setLoading(false);
      }
    }
    fetchVoices();
  }, []);

  const handlePreview = useCallback(async (voiceId: string, voiceName: string) => {
    // Stop current preview
    if (previewAudio) {
      previewAudio.pause();
      previewAudio.currentTime = 0;
      setPreviewAudio(null);
    }

    if (previewingId === voiceId) {
      setPreviewingId(null);
      return;
    }

    setPreviewingId(voiceId);
    try {
      const sampleText = language === 'en'
        ? 'This is a preview of the voice you selected for narration.'
        : 'Esta es una muestra de la voz que has seleccionado para la narracion.';

      const res = await fetch('/api/ai/generate-voice', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ text: sampleText, voice: voiceId, language }),
      });

      if (!res.ok) throw new Error('Preview failed');

      const blob = await res.blob();
      const url = URL.createObjectURL(blob);
      const audio = new Audio(url);

      audio.onended = () => {
        setPreviewingId(null);
        URL.revokeObjectURL(url);
      };

      audio.play();
      setPreviewAudio(audio);
    } catch {
      setPreviewingId(null);
    }
  }, [previewAudio, previewingId, language]);

  // Filter voices by language
  const filteredVoices = voices.filter((v) =>
    v.provider === 'elevenlabs' && v.language.startsWith(language)
  );

  // Fallback: show all ElevenLabs voices if none match the language
  const displayVoices = filteredVoices.length > 0 ? filteredVoices : voices.filter((v) => v.provider === 'elevenlabs');

  if (loading) {
    return (
      <div className={cn('space-y-2', className)}>
        <span className="text-[10px] font-semibold uppercase tracking-wider text-muted-foreground">Voz</span>
        <div className="flex items-center gap-2 text-xs text-muted-foreground">
          <Loader2 className="h-3 w-3 animate-spin" /> Cargando voces...
        </div>
      </div>
    );
  }

  if (displayVoices.length === 0) {
    return (
      <div className={cn('space-y-2', className)}>
        <span className="text-[10px] font-semibold uppercase tracking-wider text-muted-foreground">Voz</span>
        <p className="text-xs text-muted-foreground">No hay voces disponibles. Configura ELEVENLABS_API_KEY.</p>
      </div>
    );
  }

  return (
    <div className={cn('space-y-2', className)}>
      <span className="text-[10px] font-semibold uppercase tracking-wider text-muted-foreground">Voz</span>
      <div className="grid grid-cols-2 gap-1.5">
        {displayVoices.map((voice) => {
          const isSelected = value === voice.id;
          const isPreviewing = previewingId === voice.id;
          return (
            <button
              key={voice.id}
              type="button"
              onClick={() => onChange(voice.id)}
              className={cn(
                'flex items-center gap-2 rounded-lg border px-3 py-2 text-left transition',
                isSelected
                  ? 'border-primary bg-primary/10 text-foreground'
                  : 'border-border bg-card text-muted-foreground hover:border-foreground/20',
              )}
            >
              <div className={cn(
                'flex h-7 w-7 shrink-0 items-center justify-center rounded-full',
                voice.gender === 'female' ? 'bg-pink-500/20 text-pink-400' : 'bg-blue-500/20 text-blue-400',
              )}>
                <User className="h-3.5 w-3.5" />
              </div>
              <div className="min-w-0 flex-1">
                <div className="flex items-center gap-1">
                  <span className="truncate text-xs font-medium">{voice.name}</span>
                  {isSelected && <Mic className="h-3 w-3 text-primary" />}
                </div>
                <span className="text-[10px] text-muted-foreground">{voice.accent}</span>
              </div>
              <button
                type="button"
                onClick={(e) => { e.stopPropagation(); handlePreview(voice.id, voice.name); }}
                className={cn(
                  'flex h-6 w-6 shrink-0 items-center justify-center rounded-full transition',
                  isPreviewing
                    ? 'bg-primary text-white'
                    : 'bg-secondary text-muted-foreground hover:bg-card hover:text-foreground',
                )}
                aria-label={`Preview voz ${voice.name}`}
              >
                {isPreviewing ? <Loader2 className="h-3 w-3 animate-spin" /> : <Play className="h-3 w-3" />}
              </button>
            </button>
          );
        })}
      </div>
    </div>
  );
}
