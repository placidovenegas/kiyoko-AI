'use client';
import { useState, useRef } from 'react';
import { cn } from '@/lib/utils/cn';
import { Play, Pause, RotateCcw } from 'lucide-react';
import type { SceneVideoClip } from '@/types';

interface SceneClipPlayerProps {
  clips: SceneVideoClip[];
}

export function SceneClipPlayer({ clips }: SceneClipPlayerProps) {
  const [playing, setPlaying] = useState(false);
  const [activeClip, setActiveClip] = useState(0);
  const videoRef = useRef<HTMLVideoElement>(null);

  const sortedClips = [...clips].sort(
    (a, b) => (a.extension_number ?? 0) - (b.extension_number ?? 0),
  );
  const totalDuration = sortedClips.reduce(
    (sum, c) => sum + (c.duration_seconds ?? 0),
    0,
  );
  const hasVideo = sortedClips.some((c) => c.file_url);

  return (
    <div className="space-y-3">
      {/* Player area */}
      <div className="relative aspect-video rounded-lg bg-background flex items-center justify-center overflow-hidden">
        {hasVideo && sortedClips[activeClip]?.file_url ? (
          <video
            ref={videoRef}
            src={sortedClips[activeClip].file_url!}
            className="h-full w-full object-contain"
            onEnded={() => {
              if (activeClip < sortedClips.length - 1) {
                setActiveClip(activeClip + 1);
              } else {
                setPlaying(false);
                setActiveClip(0);
              }
            }}
          />
        ) : (
          <div className="text-center">
            <Play className="mx-auto h-8 w-8 text-muted-foreground/60" />
            <p className="mt-2 text-xs text-muted-foreground">Sin clips generados</p>
          </div>
        )}
      </div>

      {/* Clip indicators */}
      <div className="flex items-center gap-1">
        {sortedClips.map((clip, i) => (
          <button
            key={clip.id}
            onClick={() => setActiveClip(i)}
            className={cn(
              'h-7 rounded flex items-center justify-center px-2 text-[10px] font-medium transition',
              clip.clip_type === 'base'
                ? 'bg-primary/20 text-primary'
                : 'bg-purple-500/20 text-purple-400',
              i === activeClip && 'ring-1 ring-white/30',
            )}
            style={{ flex: clip.duration_seconds ?? 6 }}
          >
            {clip.clip_type === 'base' ? '\u25A0 base' : `+${clip.extension_number}`}{' '}
            {clip.duration_seconds}s
          </button>
        ))}
        {sortedClips.length > 0 && (
          <span className="ml-2 text-[11px] text-muted-foreground">
            Total: {totalDuration}s
          </span>
        )}
      </div>

      {/* Controls */}
      {hasVideo && (
        <div className="flex items-center gap-2">
          <button
            onClick={() => {
              if (videoRef.current) {
                if (playing) {
                  videoRef.current.pause();
                } else {
                  void videoRef.current.play();
                }
                setPlaying(!playing);
              }
            }}
            className="flex h-8 w-8 items-center justify-center rounded-lg bg-secondary text-foreground transition hover:bg-primary"
          >
            {playing ? (
              <Pause className="h-4 w-4" />
            ) : (
              <Play className="h-4 w-4" />
            )}
          </button>
          <button
            onClick={() => {
              setActiveClip(0);
              setPlaying(false);
            }}
            className="flex h-8 w-8 items-center justify-center rounded-lg bg-secondary text-muted-foreground transition hover:text-foreground"
          >
            <RotateCcw className="h-4 w-4" />
          </button>
        </div>
      )}
    </div>
  );
}
