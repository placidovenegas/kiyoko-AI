'use client';

import { useState, useEffect, useRef, useCallback } from 'react';
import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query';
import { createClient } from '@/lib/supabase/client';
import { useVideo } from '@/contexts/VideoContext';
import { queryKeys } from '@/lib/query/keys';
import { fetchVideoNarration } from '@/lib/queries/videos';
import { cn } from '@/lib/utils/cn';
import {
  Mic, Play, Pause, Download, RefreshCw, Sparkles,
  Loader2, Volume2, Save, AudioLines, FileAudio,
  AlignLeft, List,
} from 'lucide-react';
import { toast } from 'sonner';
import type { VideoNarration } from '@/types';

// --- Helpers ---
function formatTime(ms: number): string {
  const totalSec = Math.floor(ms / 1000);
  const m = Math.floor(totalSec / 60);
  const s = totalSec % 60;
  return `${m}:${s.toString().padStart(2, '0')}`;
}

function estimateDuration(text: string): string {
  const chars = text.length;
  const seconds = Math.round(chars / 13);
  const m = Math.floor(seconds / 60);
  const s = seconds % 60;
  if (m > 0) return `~${m}m ${s}s`;
  return `~${s}s`;
}

// --- Status Badge ---
function StatusBadge({ status }: { status: string | null }) {
  const map: Record<string, { label: string; dotColor: string }> = {
    ready: { label: 'Listo', dotColor: 'bg-emerald-400' },
    generating: { label: 'Generando...', dotColor: 'bg-yellow-400 animate-pulse' },
    draft: { label: 'Borrador', dotColor: 'bg-zinc-400' },
    error: { label: 'Error', dotColor: 'bg-red-400' },
  };
  const info = map[status ?? 'draft'] ?? map.draft;
  return (
    <span className="inline-flex items-center gap-1.5 text-xs font-medium text-muted-foreground">
      <span className={cn('size-1.5 rounded-full', info.dotColor)} />
      {info.label}
    </span>
  );
}

// --- Audio Player ---
function AudioPlayer({ src }: { src: string }) {
  const audioRef = useRef<HTMLAudioElement | null>(null);
  const progressRef = useRef<HTMLDivElement | null>(null);
  const [playing, setPlaying] = useState(false);
  const [currentTime, setCurrentTime] = useState(0);
  const [duration, setDuration] = useState(0);

  useEffect(() => {
    const audio = new Audio(src);
    audioRef.current = audio;

    const onTime = () => setCurrentTime(audio.currentTime * 1000);
    const onLoaded = () => setDuration(audio.duration * 1000);
    const onEnd = () => setPlaying(false);

    audio.addEventListener('timeupdate', onTime);
    audio.addEventListener('loadedmetadata', onLoaded);
    audio.addEventListener('ended', onEnd);

    return () => {
      audio.pause();
      audio.removeEventListener('timeupdate', onTime);
      audio.removeEventListener('loadedmetadata', onLoaded);
      audio.removeEventListener('ended', onEnd);
    };
  }, [src]);

  const toggle = useCallback(() => {
    const audio = audioRef.current;
    if (!audio) return;
    if (playing) {
      audio.pause();
    } else {
      audio.play().catch(() => {/* ignore autoplay block */});
    }
    setPlaying(!playing);
  }, [playing]);

  const handleProgressClick = useCallback((e: React.MouseEvent<HTMLDivElement>) => {
    const audio = audioRef.current;
    const bar = progressRef.current;
    if (!audio || !bar || !duration) return;
    const rect = bar.getBoundingClientRect();
    const pct = Math.max(0, Math.min(1, (e.clientX - rect.left) / rect.width));
    audio.currentTime = (pct * duration) / 1000;
  }, [duration]);

  const pct = duration > 0 ? (currentTime / duration) * 100 : 0;

  return (
    <div className="space-y-3">
      <div className="flex items-center gap-4">
        <button
          onClick={toggle}
          className={cn(
            'flex size-10 shrink-0 items-center justify-center rounded-xl transition',
            playing
              ? 'bg-primary text-white'
              : 'bg-primary/10 text-primary hover:bg-primary/20',
          )}
        >
          {playing ? <Pause className="size-4" /> : <Play className="size-4 ml-0.5" />}
        </button>

        <div className="flex-1 space-y-1">
          <div
            ref={progressRef}
            onClick={handleProgressClick}
            className="group relative h-2 cursor-pointer rounded-full bg-secondary overflow-hidden"
          >
            <div
              className="absolute inset-y-0 left-0 rounded-full bg-primary transition-all duration-100"
              style={{ width: `${pct}%` }}
            />
            <div
              className="absolute top-1/2 -translate-y-1/2 size-3 rounded-full bg-primary opacity-0 group-hover:opacity-100 transition-opacity shadow-sm"
              style={{ left: `calc(${pct}% - 6px)` }}
            />
          </div>
          <div className="flex items-center justify-between">
            <span className="text-[10px] tabular-nums text-muted-foreground">
              {formatTime(currentTime)}
            </span>
            <span className="text-[10px] tabular-nums text-muted-foreground">
              {formatTime(duration)}
            </span>
          </div>
        </div>
      </div>
    </div>
  );
}

// --- Main Page ---
export default function NarrationPage() {
  const { video } = useVideo();
  const supabase = createClient();
  const queryClient = useQueryClient();

  // TTS provider toggle
  const [ttsProvider, setTtsProvider] = useState<'elevenlabs' | 'voxtral'>('elevenlabs');

  // Narration mode toggle
  const [narrationMode, setNarrationMode] = useState<'scenes' | 'continuous'>('scenes');

  // Fetch current narration
  const { data: narration, isLoading } = useQuery({
    queryKey: queryKeys.videos.narration(video?.id ?? ''),
    queryFn: () => fetchVideoNarration(supabase, video!.id),
    enabled: !!video?.id,
  });

  // Fetch version count
  const { data: versionCount = 0 } = useQuery({
    queryKey: [...queryKeys.videos.narration(video?.id ?? ''), 'count'],
    queryFn: async () => {
      const { count, error } = await supabase
        .from('video_narrations')
        .select('id', { count: 'exact', head: true })
        .eq('video_id', video!.id);
      if (error) throw error;
      return count ?? 0;
    },
    enabled: !!video?.id,
  });

  // Local state
  const [narrationText, setNarrationText] = useState('');
  const [continuousText, setContinuousText] = useState('');
  const [speed, setSpeed] = useState(1.0);
  const [dirty, setDirty] = useState(false);
  const [continuousDirty, setContinuousDirty] = useState(false);

  // Sync text when narration loads
  useEffect(() => {
    if (narration) {
      setNarrationText(narration.narration_text ?? '');
      setContinuousText(narration.narration_text ?? '');
      setSpeed(narration.speed ?? 1.0);
      setDirty(false);
      setContinuousDirty(false);
    }
  }, [narration]);

  // Save mutation
  const saveMutation = useMutation({
    mutationFn: async () => {
      if (!video?.id) throw new Error('No video');
      const textToSave = narrationMode === 'continuous' ? continuousText : narrationText;

      if (narration) {
        const { error } = await supabase
          .from('video_narrations')
          .update({
            narration_text: textToSave,
            speed,
            updated_at: new Date().toISOString(),
          })
          .eq('id', narration.id);
        if (error) throw error;
      } else {
        const { error } = await supabase
          .from('video_narrations')
          .insert({
            video_id: video.id,
            narration_text: textToSave,
            speed,
            is_current: true,
            version: 1,
            status: 'draft',
          });
        if (error) throw error;
      }
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: queryKeys.videos.narration(video?.id ?? '') });
      setDirty(false);
      setContinuousDirty(false);
      toast.success('Narracion guardada');
    },
    onError: () => toast.error('Error al guardar'),
  });

  // Generate text with AI
  const generateTextMutation = useMutation({
    mutationFn: async () => {
      if (!video?.id) throw new Error('No video');
      const res = await fetch('/api/ai/generate-narration', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          mode: narrationMode,
          videoId: video.id,
          config: { language: 'es' },
        }),
      });
      if (!res.ok) throw new Error('API error');
      const data: { text?: string } = await res.json();
      return data.text ?? '';
    },
    onSuccess: (text) => {
      if (narrationMode === 'continuous') {
        setContinuousText(text);
        setContinuousDirty(true);
      } else {
        setNarrationText(text);
        setDirty(true);
      }
      toast.success('Texto generado con IA');
    },
    onError: () => toast.error('Error al generar texto'),
  });

  // Generate audio TTS
  const generateAudioMutation = useMutation({
    mutationFn: async () => {
      if (!video?.id || !narrationText) throw new Error('No text');

      const res = await fetch('/api/ai/generate-voice', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          text: narrationMode === 'continuous' ? continuousText : narrationText,
          voice: narration?.voice_id ?? undefined,
          language: 'es',
          speed,
          provider: ttsProvider,
        }),
      });

      const ct = res.headers.get('content-type') ?? '';
      if (!res.ok || !ct.includes('audio')) throw new Error('TTS failed');

      const blob = await res.blob();
      const path = `${video.project_id}/narration/${video.id}/${Date.now()}.mp3`;
      const { error: uploadErr } = await supabase.storage
        .from('project-assets')
        .upload(path, blob, { contentType: 'audio/mpeg', upsert: true });
      if (uploadErr) throw uploadErr;

      const { data: { publicUrl } } = supabase.storage
        .from('project-assets')
        .getPublicUrl(path);

      if (narration) {
        const { error } = await supabase
          .from('video_narrations')
          .update({
            audio_url: publicUrl,
            audio_path: path,
            status: 'ready',
            updated_at: new Date().toISOString(),
          })
          .eq('id', narration.id);
        if (error) throw error;
      }
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: queryKeys.videos.narration(video?.id ?? '') });
      toast.success('Audio generado');
    },
    onError: () => toast.error('Error al generar audio'),
  });

  // Download helper
  const handleDownload = useCallback(() => {
    if (!narration?.audio_url) return;
    const a = document.createElement('a');
    a.href = narration.audio_url;
    a.download = `narration-${video?.short_id ?? 'audio'}.mp3`;
    a.click();
  }, [narration?.audio_url, video?.short_id]);

  // Continuous mode stats
  const continuousWordCount = continuousText.split(/\s+/).filter(Boolean).length;
  const continuousDuration = estimateDuration(continuousText);

  // Loading skeleton
  if (isLoading) {
    return (
      <div className="flex h-full items-center justify-center bg-background">
        <Loader2 className="size-8 animate-spin text-muted-foreground" />
      </div>
    );
  }

  return (
    <div className="mx-auto max-w-5xl px-4 py-6 space-y-6">
      {/* Header */}
      <div className="flex items-center justify-between">
        <div>
          <h1 className="text-2xl font-semibold tracking-tight text-foreground">
            Narracion
          </h1>
          <p className="mt-1 text-sm text-muted-foreground">
            Genera y edita el texto y audio de narracion para tu video.
          </p>
        </div>
        <div className="flex items-center gap-3">
          {versionCount > 0 && (
            <span className="rounded-xl bg-card px-3 py-1.5 text-xs font-medium text-muted-foreground border border-border">
              v{narration?.version ?? 1} de {versionCount}
            </span>
          )}
        </div>
      </div>

      {/* Mode toggle */}
      <div className="flex items-center gap-1 rounded-lg border border-border p-0.5 w-fit">
        <button
          type="button"
          onClick={() => setNarrationMode('scenes')}
          className={cn(
            'flex items-center gap-1.5 rounded-md px-3 py-1.5 text-sm font-medium transition',
            narrationMode === 'scenes'
              ? 'bg-secondary text-foreground'
              : 'text-muted-foreground hover:text-foreground',
          )}
        >
          <List className="size-3.5" />
          Por escenas
        </button>
        <button
          type="button"
          onClick={() => setNarrationMode('continuous')}
          className={cn(
            'flex items-center gap-1.5 rounded-md px-3 py-1.5 text-sm font-medium transition',
            narrationMode === 'continuous'
              ? 'bg-secondary text-foreground'
              : 'text-muted-foreground hover:text-foreground',
          )}
        >
          <AlignLeft className="size-3.5" />
          Continuo
        </button>
      </div>

      {/* Continuous mode */}
      {narrationMode === 'continuous' && (
        <div className="rounded-xl border border-border bg-card p-5">
          <div className="mb-4 flex items-center justify-between">
            <div className="flex items-center gap-2">
              <div className="flex items-center justify-center size-8 rounded-lg bg-primary/10 text-primary">
                <AlignLeft className="size-4" />
              </div>
              <h2 className="text-lg font-medium text-foreground">
                Narracion completa
              </h2>
            </div>
            <button
              type="button"
              onClick={() => generateTextMutation.mutate()}
              disabled={generateTextMutation.isPending}
              className="rounded-xl bg-primary px-4 py-2 text-sm font-medium text-primary-foreground hover:bg-primary/90 transition disabled:opacity-50 flex items-center gap-2"
            >
              {generateTextMutation.isPending ? (
                <Loader2 className="size-3.5 animate-spin" />
              ) : (
                <Sparkles className="size-3.5" />
              )}
              Generar con IA
            </button>
          </div>

          <textarea
            value={continuousText}
            onChange={(e) => {
              setContinuousText(e.target.value);
              setContinuousDirty(true);
            }}
            placeholder="Escribe la narracion completa del video aqui. La IA puede generar todo el texto de una sola vez para todas las escenas."
            rows={12}
            className={cn(
              'w-full resize-y rounded-xl border bg-background px-4 py-3',
              'text-sm leading-relaxed text-foreground placeholder:text-muted-foreground',
              'focus:border-primary focus:outline-none transition',
              continuousDirty ? 'border-primary/50' : 'border-border',
            )}
          />

          <div className="mt-3 flex items-center justify-between">
            <div className="flex items-center gap-4">
              <span className="text-xs text-muted-foreground">
                {continuousWordCount} palabras
              </span>
              {continuousText && (
                <span className="text-xs text-muted-foreground">
                  Duracion estimada: {continuousDuration}
                </span>
              )}
            </div>
            {continuousDirty && (
              <button
                type="button"
                onClick={() => saveMutation.mutate()}
                disabled={saveMutation.isPending}
                className="rounded-xl bg-primary px-4 py-2 text-sm font-medium text-primary-foreground hover:bg-primary/90 transition disabled:opacity-50 flex items-center gap-2"
              >
                {saveMutation.isPending ? (
                  <Loader2 className="size-3.5 animate-spin" />
                ) : (
                  <Save className="size-3.5" />
                )}
                Guardar
              </button>
            )}
          </div>
        </div>
      )}

      {/* Per-scene mode */}
      {narrationMode === 'scenes' && (
        <div className="space-y-6">
          {/* Voice Card */}
          <div className="rounded-xl border border-border bg-card p-5">
            <div className="flex items-center gap-2 mb-4">
              <div className="flex items-center justify-center size-8 rounded-lg bg-primary/10 text-primary">
                <Volume2 className="size-4" />
              </div>
              <h2 className="text-lg font-medium text-foreground">Voz</h2>
            </div>

            <div className="space-y-4">
              <div className="flex items-center justify-between">
                <div>
                  <span className="text-sm font-medium text-foreground">
                    {narration?.voice_name ?? 'Sin voz asignada'}
                  </span>
                  {narration?.provider && (
                    <span className="ml-2 text-xs text-muted-foreground">
                      ({narration.provider})
                    </span>
                  )}
                </div>
                <button
                  type="button"
                  className="rounded-xl border border-border bg-card px-3 py-1.5 text-sm font-medium text-foreground hover:bg-secondary transition flex items-center gap-2"
                >
                  <RefreshCw className="size-3.5" />
                  Cambiar voz
                </button>
              </div>

              {/* Speed control */}
              <div className="rounded-xl bg-background border border-border p-3">
                <div className="flex items-center justify-between mb-2">
                  <span className="text-xs font-medium text-muted-foreground uppercase tracking-wide">Velocidad</span>
                  <span className="text-sm font-medium text-foreground tabular-nums">
                    {speed.toFixed(2)}x
                  </span>
                </div>
                <input
                  type="range"
                  min={0.7}
                  max={1.3}
                  step={0.05}
                  value={speed}
                  onChange={(e) => {
                    setSpeed(Number(e.target.value));
                    setDirty(true);
                  }}
                  className="h-1.5 w-full cursor-pointer appearance-none rounded-full bg-secondary accent-primary"
                />
                <div className="flex items-center justify-between mt-1">
                  <span className="text-[10px] text-muted-foreground/60">0.7x</span>
                  <span className="text-[10px] text-muted-foreground/60">1.3x</span>
                </div>
              </div>

              {/* Style */}
              {narration?.style && (
                <div className="flex items-center gap-2">
                  <span className="text-xs font-medium text-muted-foreground uppercase tracking-wide">Estilo:</span>
                  <span className="rounded-lg bg-primary/10 px-2.5 py-1 text-xs font-medium text-primary">
                    {narration.style}
                  </span>
                </div>
              )}
            </div>
          </div>

          {/* Narration Text Card */}
          <div className="rounded-xl border border-border bg-card p-5">
            <div className="mb-4 flex items-center justify-between">
              <div className="flex items-center gap-2">
                <div className="flex items-center justify-center size-8 rounded-lg bg-primary/10 text-primary">
                  <FileAudio className="size-4" />
                </div>
                <h2 className="text-lg font-medium text-foreground">
                  Texto de la narracion
                </h2>
              </div>
              <button
                type="button"
                onClick={() => generateTextMutation.mutate()}
                disabled={generateTextMutation.isPending}
                className="rounded-xl bg-primary px-4 py-2 text-sm font-medium text-primary-foreground hover:bg-primary/90 transition disabled:opacity-50 flex items-center gap-2"
              >
                {generateTextMutation.isPending ? (
                  <Loader2 className="size-3.5 animate-spin" />
                ) : (
                  <Sparkles className="size-3.5" />
                )}
                Generar con IA
              </button>
            </div>

            {!narrationText && !narration ? (
              /* Empty state */
              <div className="flex flex-col items-center justify-center rounded-xl border border-dashed border-border py-12">
                <div className="flex size-12 items-center justify-center rounded-2xl bg-secondary mb-3">
                  <FileAudio className="size-6 text-muted-foreground" />
                </div>
                <p className="text-sm font-medium text-foreground">Sin texto de narracion</p>
                <p className="mt-1 text-xs text-muted-foreground text-center max-w-xs">
                  Escribe el texto manualmente o usa el boton &quot;Generar con IA&quot; para crear una narracion automatica.
                </p>
              </div>
            ) : (
              <>
                <textarea
                  value={narrationText}
                  onChange={(e) => {
                    setNarrationText(e.target.value);
                    setDirty(true);
                  }}
                  placeholder="Escribe el texto de narracion del video..."
                  rows={8}
                  className={cn(
                    'w-full resize-y rounded-xl border bg-background px-4 py-3',
                    'text-sm leading-relaxed text-foreground placeholder:text-muted-foreground',
                    'focus:border-primary focus:outline-none transition',
                    dirty ? 'border-primary/50' : 'border-border',
                  )}
                />
                {narrationText && (
                  <div className="mt-3 flex items-center justify-between">
                    <span className="text-xs text-muted-foreground">
                      {narrationText.split(/\s+/).filter(Boolean).length} palabras
                    </span>
                    {dirty && (
                      <button
                        type="button"
                        onClick={() => saveMutation.mutate()}
                        disabled={saveMutation.isPending}
                        className="rounded-xl bg-primary px-4 py-2 text-sm font-medium text-primary-foreground hover:bg-primary/90 transition disabled:opacity-50 flex items-center gap-2"
                      >
                        {saveMutation.isPending ? (
                          <Loader2 className="size-3.5 animate-spin" />
                        ) : (
                          <Save className="size-3.5" />
                        )}
                        Guardar
                      </button>
                    )}
                  </div>
                )}
              </>
            )}
          </div>

          {/* Audio Card */}
          <div className="rounded-xl border border-border bg-card p-5">
            <div className="flex items-center gap-2 mb-4">
              <div className="flex items-center justify-center size-8 rounded-lg bg-primary/10 text-primary">
                <AudioLines className="size-4" />
              </div>
              <h2 className="text-lg font-medium text-foreground">Audio</h2>
              {narration?.status && <StatusBadge status={narration.status} />}
            </div>

            {narration?.audio_url ? (
              <div className="rounded-xl bg-background border border-border p-4">
                <AudioPlayer src={narration.audio_url} />
              </div>
            ) : (
              <div className="flex flex-col items-center justify-center rounded-xl border border-dashed border-border py-10">
                <div className="flex size-12 items-center justify-center rounded-2xl bg-secondary mb-3">
                  <AudioLines className="size-6 text-muted-foreground" />
                </div>
                <p className="text-sm font-medium text-foreground">Sin audio generado</p>
                <p className="mt-1 text-xs text-muted-foreground text-center max-w-xs">
                  {narrationText
                    ? 'Genera el audio con el boton de abajo para escuchar la narracion.'
                    : 'Primero escribe o genera el texto de narracion.'}
                </p>
              </div>
            )}

            <div className="mt-4 space-y-3">
              <div className="flex items-center gap-2">
                <span className="text-[10px] text-muted-foreground">Proveedor TTS:</span>
                <div className="flex rounded-lg border border-border p-0.5">
                  <button
                    type="button"
                    onClick={() => setTtsProvider('elevenlabs')}
                    className={cn(
                      'px-2 py-1 rounded-md text-[10px] font-medium transition',
                      ttsProvider === 'elevenlabs'
                        ? 'bg-secondary text-foreground'
                        : 'text-muted-foreground hover:text-foreground',
                    )}
                  >
                    ElevenLabs
                  </button>
                  <button
                    type="button"
                    onClick={() => setTtsProvider('voxtral')}
                    className={cn(
                      'px-2 py-1 rounded-md text-[10px] font-medium transition',
                      ttsProvider === 'voxtral'
                        ? 'bg-secondary text-foreground'
                        : 'text-muted-foreground hover:text-foreground',
                    )}
                  >
                    Voxtral
                  </button>
                </div>
              </div>

              <div className="flex items-center gap-3">
              <button
                type="button"
                onClick={() => generateAudioMutation.mutate()}
                disabled={generateAudioMutation.isPending || !narrationText}
                className="rounded-xl bg-primary px-4 py-2.5 text-sm font-medium text-primary-foreground hover:bg-primary/90 transition disabled:opacity-50 flex items-center gap-2"
              >
                {generateAudioMutation.isPending ? (
                  <Loader2 className="size-4 animate-spin" />
                ) : (
                  <Mic className="size-4" />
                )}
                Generar audio TTS
              </button>
              {narration?.audio_url && (
                <button
                  type="button"
                  onClick={handleDownload}
                  className="rounded-xl border border-border bg-card px-4 py-2.5 text-sm font-medium text-foreground hover:bg-secondary transition flex items-center gap-2"
                >
                  <Download className="size-4" />
                  Descargar MP3
                </button>
              )}
              </div>
            </div>
          </div>
        </div>
      )}
    </div>
  );
}
