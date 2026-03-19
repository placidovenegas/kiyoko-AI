'use client';

import { useState, useRef, useEffect, useCallback } from 'react';
import { cn } from '@/lib/utils/cn';
import { Play, Pause, Download, RotateCcw, Volume2, Loader2, Trash2 } from 'lucide-react';

interface NarrationPlayerProps {
  src: string;
  sceneLabel?: string;
  duration?: number;
  onDelete?: () => void;
  compact?: boolean;
  className?: string;
}

export function NarrationPlayer({
  src,
  sceneLabel,
  duration,
  onDelete,
  compact,
  className,
}: NarrationPlayerProps) {
  const audioRef = useRef<HTMLAudioElement>(null);
  const [playing, setPlaying] = useState(false);
  const [currentTime, setCurrentTime] = useState(0);
  const [audioDuration, setAudioDuration] = useState(duration || 0);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    const audio = audioRef.current;
    if (!audio) return;

    const onLoaded = () => { setAudioDuration(audio.duration); setLoading(false); };
    const onTimeUpdate = () => setCurrentTime(audio.currentTime);
    const onEnded = () => { setPlaying(false); setCurrentTime(0); };
    const onPlay = () => setPlaying(true);
    const onPause = () => setPlaying(false);

    audio.addEventListener('loadedmetadata', onLoaded);
    audio.addEventListener('timeupdate', onTimeUpdate);
    audio.addEventListener('ended', onEnded);
    audio.addEventListener('play', onPlay);
    audio.addEventListener('pause', onPause);

    // If already loaded
    if (audio.readyState >= 2) {
      setAudioDuration(audio.duration);
      setLoading(false);
    }

    return () => {
      audio.removeEventListener('loadedmetadata', onLoaded);
      audio.removeEventListener('timeupdate', onTimeUpdate);
      audio.removeEventListener('ended', onEnded);
      audio.removeEventListener('play', onPlay);
      audio.removeEventListener('pause', onPause);
    };
  }, [src]);

  const togglePlay = useCallback(() => {
    const audio = audioRef.current;
    if (!audio) return;
    if (playing) { audio.pause(); } else { audio.play(); }
  }, [playing]);

  const restart = useCallback(() => {
    const audio = audioRef.current;
    if (!audio) return;
    audio.currentTime = 0;
    audio.play();
  }, []);

  const seek = useCallback((e: React.MouseEvent<HTMLDivElement>) => {
    const audio = audioRef.current;
    if (!audio || !audioDuration) return;
    const rect = e.currentTarget.getBoundingClientRect();
    const pct = (e.clientX - rect.left) / rect.width;
    audio.currentTime = pct * audioDuration;
  }, [audioDuration]);

  const formatTime = (s: number) => {
    if (!s || isNaN(s)) return '0:00';
    const min = Math.floor(s / 60);
    const sec = Math.floor(s % 60);
    return `${min}:${sec.toString().padStart(2, '0')}`;
  };

  const progressPct = audioDuration > 0 ? (currentTime / audioDuration) * 100 : 0;

  if (compact) {
    return (
      <div className={cn('flex items-center gap-2', className)}>
        <audio ref={audioRef} src={src} preload="metadata" />
        <button
          type="button"
          onClick={togglePlay}
          disabled={loading}
          aria-label={playing ? 'Pausar' : 'Reproducir'}
          className={cn(
            'flex h-7 w-7 shrink-0 items-center justify-center rounded-full transition',
            playing ? 'bg-brand-500 text-white' : 'bg-surface-tertiary text-foreground-muted hover:bg-surface-secondary',
          )}
        >
          {loading ? <Loader2 className="h-3 w-3 animate-spin" /> : playing ? <Pause className="h-3 w-3" /> : <Play className="h-3 w-3 ml-0.5" />}
        </button>
        <div className="h-1.5 flex-1 cursor-pointer rounded-full bg-surface-tertiary" onClick={seek}>
          <div className="h-full rounded-full bg-brand-500 transition-all" style={{ width: `${progressPct}%` }} />
        </div>
        <span className="text-[10px] tabular-nums text-foreground-muted">{formatTime(currentTime)}</span>
      </div>
    );
  }

  return (
    <div className={cn('rounded-lg border border-surface-tertiary bg-surface-secondary p-3', className)}>
      <audio ref={audioRef} src={src} preload="metadata" />

      {/* Header */}
      <div className="mb-2 flex items-center justify-between">
        <div className="flex items-center gap-1.5">
          <Volume2 className="h-3.5 w-3.5 text-brand-500" />
          <span className="text-xs font-medium text-foreground">
            {sceneLabel ? `Audio - ${sceneLabel}` : 'Audio de narracion'}
          </span>
        </div>
        <div className="flex items-center gap-1">
          <a
            href={src}
            download={`narracion${sceneLabel ? `-${sceneLabel}` : ''}.mp3`}
            className="flex h-6 w-6 items-center justify-center rounded-md text-foreground-muted transition hover:bg-surface-tertiary hover:text-foreground"
            aria-label="Descargar audio"
          >
            <Download className="h-3 w-3" />
          </a>
          {onDelete && (
            <button
              type="button"
              onClick={onDelete}
              className="flex h-6 w-6 items-center justify-center rounded-md text-red-400 transition hover:bg-red-500/10"
              aria-label="Eliminar audio"
            >
              <Trash2 className="h-3 w-3" />
            </button>
          )}
        </div>
      </div>

      {/* Controls */}
      <div className="flex items-center gap-2">
        <button
          type="button"
          onClick={togglePlay}
          disabled={loading}
          aria-label={playing ? 'Pausar' : 'Reproducir'}
          className={cn(
            'flex h-8 w-8 shrink-0 items-center justify-center rounded-full transition',
            playing ? 'bg-brand-500 text-white' : 'bg-surface-tertiary text-foreground hover:bg-brand-500/20 hover:text-brand-500',
          )}
        >
          {loading ? <Loader2 className="h-4 w-4 animate-spin" /> : playing ? <Pause className="h-4 w-4" /> : <Play className="h-4 w-4 ml-0.5" />}
        </button>

        <button
          type="button"
          onClick={restart}
          aria-label="Reiniciar"
          className="flex h-6 w-6 shrink-0 items-center justify-center rounded-md text-foreground-muted transition hover:text-foreground"
        >
          <RotateCcw className="h-3 w-3" />
        </button>

        {/* Progress bar */}
        <div className="flex flex-1 items-center gap-2">
          <span className="w-8 text-right text-[10px] tabular-nums text-foreground-muted">{formatTime(currentTime)}</span>
          <div className="h-2 flex-1 cursor-pointer rounded-full bg-surface-tertiary" onClick={seek}>
            <div
              className="relative h-full rounded-full bg-brand-500 transition-all"
              style={{ width: `${progressPct}%` }}
            >
              <div className="absolute -right-1.5 top-1/2 h-3 w-3 -translate-y-1/2 rounded-full border-2 border-brand-500 bg-white shadow-sm" />
            </div>
          </div>
          <span className="w-8 text-[10px] tabular-nums text-foreground-muted">{formatTime(audioDuration)}</span>
        </div>
      </div>
    </div>
  );
}
