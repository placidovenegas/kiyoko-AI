'use client';

import { useState, useEffect, useRef, useCallback } from 'react';
import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query';
import { createClient } from '@/lib/supabase/client';
import { useVideo } from '@/contexts/VideoContext';
import { queryKeys } from '@/lib/query/keys';
import { fetchVideoNarration } from '@/lib/queries/videos';
import { Button } from '@heroui/react';
import { cn } from '@/lib/utils/cn';
import {
  Mic, Play, Pause, Download, RefreshCw, Sparkles,
  Loader2, Volume2, Save, ChevronDown,
} from 'lucide-react';
import { toast } from 'sonner';
import type { VideoNarration } from '@/types';

// ─── Helpers ───────────────────────────────────────────────
function formatTime(ms: number): string {
  const totalSec = Math.floor(ms / 1000);
  const m = Math.floor(totalSec / 60);
  const s = totalSec % 60;
  return `${m}:${s.toString().padStart(2, '0')}`;
}

// ─── Status Badge ──────────────────────────────────────────
function StatusBadge({ status }: { status: string | null }) {
  const map: Record<string, { label: string; color: string }> = {
    ready: { label: 'ready', color: 'text-green-400' },
    generating: { label: 'generando...', color: 'text-yellow-400' },
    draft: { label: 'borrador', color: 'text-muted-foreground' },
    error: { label: 'error', color: 'text-red-400' },
  };
  const info = map[status ?? 'draft'] ?? map.draft;
  return (
    <span className={cn('text-xs font-medium', info.color)}>
      Estado: {info.label} {status === 'ready' && '\u2705'}
    </span>
  );
}

// ─── Audio Player ──────────────────────────────────────────
function AudioPlayer({ src }: { src: string }) {
  const audioRef = useRef<HTMLAudioElement | null>(null);
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

  const seek = useCallback((e: React.ChangeEvent<HTMLInputElement>) => {
    const audio = audioRef.current;
    if (!audio || !duration) return;
    const pct = Number(e.target.value) / 100;
    audio.currentTime = (pct * duration) / 1000;
  }, [duration]);

  const pct = duration > 0 ? (currentTime / duration) * 100 : 0;

  return (
    <div className="flex items-center gap-3">
      <button
        onClick={toggle}
        className="flex h-8 w-8 shrink-0 items-center justify-center rounded-full bg-primary/20 text-primary transition hover:bg-primary/30"
      >
        {playing ? <Pause className="h-4 w-4" /> : <Play className="h-4 w-4" />}
      </button>
      <input
        type="range"
        min={0}
        max={100}
        value={pct}
        onChange={seek}
        className="h-1 flex-1 cursor-pointer appearance-none rounded-full bg-secondary accent-primary"
      />
      <span className="shrink-0 text-xs tabular-nums text-muted-foreground">
        {formatTime(currentTime)}/{formatTime(duration)}
      </span>
    </div>
  );
}

// ─── Main Page ─────────────────────────────────────────────
export default function NarrationPage() {
  const { video } = useVideo();
  const supabase = createClient();
  const queryClient = useQueryClient();

  // ── Fetch current narration ──
  const { data: narration, isLoading } = useQuery({
    queryKey: queryKeys.videos.narration(video?.id ?? ''),
    queryFn: () => fetchVideoNarration(supabase, video!.id),
    enabled: !!video?.id,
  });

  // ── Fetch version count ──
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

  // ── Local state ──
  const [narrationText, setNarrationText] = useState('');
  const [speed, setSpeed] = useState(1.0);
  const [dirty, setDirty] = useState(false);

  // Sync text when narration loads
  useEffect(() => {
    if (narration) {
      setNarrationText(narration.narration_text ?? '');
      setSpeed(narration.speed ?? 1.0);
      setDirty(false);
    }
  }, [narration]);

  // ── Save mutation ──
  const saveMutation = useMutation({
    mutationFn: async () => {
      if (!video?.id) throw new Error('No video');

      if (narration) {
        // Update existing
        const { error } = await supabase
          .from('video_narrations')
          .update({
            narration_text: narrationText,
            speed,
            updated_at: new Date().toISOString(),
          })
          .eq('id', narration.id);
        if (error) throw error;
      } else {
        // Insert new
        const { error } = await supabase
          .from('video_narrations')
          .insert({
            video_id: video.id,
            narration_text: narrationText,
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
      toast.success('Narracion guardada');
    },
    onError: () => toast.error('Error al guardar'),
  });

  // ── Generate text with AI ──
  const generateTextMutation = useMutation({
    mutationFn: async () => {
      if (!video?.id) throw new Error('No video');
      const res = await fetch('/api/ai/generate-narration', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          mode: 'continuous',
          videoId: video.id,
          config: { language: 'es' },
        }),
      });
      if (!res.ok) throw new Error('API error');
      const data: { text?: string } = await res.json();
      return data.text ?? '';
    },
    onSuccess: (text) => {
      setNarrationText(text);
      setDirty(true);
      toast.success('Texto generado con IA');
    },
    onError: () => toast.error('Error al generar texto'),
  });

  // ── Generate audio TTS ──
  const generateAudioMutation = useMutation({
    mutationFn: async () => {
      if (!video?.id || !narrationText) throw new Error('No text');

      const res = await fetch('/api/ai/generate-voice', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          text: narrationText,
          voice: narration?.voice_id ?? undefined,
          language: 'es',
          speed,
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

      // Update narration record
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

  // ── Download helper ──
  const handleDownload = useCallback(() => {
    if (!narration?.audio_url) return;
    const a = document.createElement('a');
    a.href = narration.audio_url;
    a.download = `narration-${video?.short_id ?? 'audio'}.mp3`;
    a.click();
  }, [narration?.audio_url, video?.short_id]);

  // ── Loading skeleton ──
  if (isLoading) {
    return (
      <div className="flex h-full items-center justify-center bg-background">
        <Loader2 className="h-8 w-8 animate-spin text-muted-foreground" />
      </div>
    );
  }

  return (
    <div className="flex h-full flex-col overflow-y-auto bg-background p-6">
      {/* ── Header ── */}
      <div className="mb-6 flex items-center justify-between">
        <h1 className="text-lg font-semibold text-foreground">
          Narracion del video
        </h1>
        {versionCount > 0 && (
          <span className="rounded-md bg-card px-3 py-1 text-xs font-medium text-muted-foreground border border-border">
            v{narration?.version ?? 1} de {versionCount} versiones
          </span>
        )}
      </div>

      <div className="space-y-5">
        {/* ── Voice Card ── */}
        <div className="rounded-xl border border-border bg-card p-5">
          <h2 className="mb-4 flex items-center gap-2 text-sm font-semibold text-foreground">
            <Volume2 className="h-4 w-4 text-primary" /> Voz
          </h2>
          <div className="space-y-3">
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
              <Button variant="ghost" size="sm" className="rounded-md">
                <RefreshCw className="h-3.5 w-3.5 mr-2" />Cambiar voz
              </Button>
            </div>

            {/* Speed control */}
            <div className="flex items-center gap-3">
              <span className="text-xs text-muted-foreground">Velocidad:</span>
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
                className="h-1 flex-1 cursor-pointer appearance-none rounded-full bg-secondary accent-primary"
              />
              <span className="w-10 text-right text-xs font-medium text-foreground">
                {speed.toFixed(2)}x
              </span>
            </div>

            {/* Style */}
            {narration?.style && (
              <div className="flex items-center gap-2">
                <span className="text-xs text-muted-foreground">Estilo:</span>
                <span className="rounded-md bg-primary/10 px-2 py-0.5 text-xs font-medium text-primary">
                  {narration.style}
                </span>
              </div>
            )}
          </div>
        </div>

        {/* ── Narration Text Card ── */}
        <div className="rounded-xl border border-border bg-card p-5">
          <div className="mb-4 flex items-center justify-between">
            <h2 className="text-sm font-semibold text-foreground">
              Texto de la narracion
            </h2>
            <Button
              variant="secondary"
              size="sm"
              isLoading={generateTextMutation.isPending}
              onClick={() => generateTextMutation.mutate()}
              className="rounded-md"
            >
              <Sparkles className="h-3.5 w-3.5 mr-2" />Generar con IA
            </Button>
          </div>
          <textarea
            value={narrationText}
            onChange={(e) => {
              setNarrationText(e.target.value);
              setDirty(true);
            }}
            placeholder="Escribe el texto de narracion del video..."
            rows={8}
            className={cn(
              'w-full resize-y rounded-lg border bg-background px-4 py-3',
              'text-sm leading-relaxed text-foreground placeholder:text-muted-foreground',
              'focus:border-primary focus:outline-none transition',
              dirty ? 'border-primary/50' : 'border-border',
            )}
          />
          {narrationText && (
            <div className="mt-2 flex items-center justify-between">
              <span className="text-xs text-muted-foreground">
                {narrationText.split(/\s+/).filter(Boolean).length} palabras
              </span>
              {dirty && (
                <Button
                  variant="primary"
                  size="sm"
                  isLoading={saveMutation.isPending}
                  onClick={() => saveMutation.mutate()}
                  className="rounded-md"
                >
                  <Save className="h-3.5 w-3.5 mr-2" />Guardar
                </Button>
              )}
            </div>
          )}
        </div>

        {/* ── Audio Card ── */}
        <div className="rounded-xl border border-border bg-card p-5">
          <h2 className="mb-4 text-sm font-semibold text-foreground">Audio</h2>

          {narration?.audio_url ? (
            <div className="space-y-3">
              <AudioPlayer src={narration.audio_url} />
              <StatusBadge status={narration.status} />
            </div>
          ) : (
            <div className="flex items-center justify-center rounded-lg border border-dashed border-border py-8">
              <span className="text-sm text-muted-foreground">
                {narrationText ? 'Genera el audio con el boton de abajo' : 'Primero escribe o genera el texto de narracion'}
              </span>
            </div>
          )}

          <div className="mt-4 flex items-center gap-3">
            <Button
              variant="primary"
              size="md"
              isLoading={generateAudioMutation.isPending}
              disabled={!narrationText}
              onClick={() => generateAudioMutation.mutate()}
              className="rounded-md"
            >
              <Mic className="h-4 w-4 mr-2" />Generar audio TTS
            </Button>
            {narration?.audio_url && (
              <Button
                variant="outline"
                size="md"
                onClick={handleDownload}
                className="rounded-md"
              >
                <Download className="h-4 w-4 mr-2" />Descargar MP3
              </Button>
            )}
          </div>
        </div>
      </div>
    </div>
  );
}
