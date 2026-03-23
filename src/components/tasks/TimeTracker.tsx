'use client';
import { useState, useEffect, useRef } from 'react';
import { Play, Pause, Square } from 'lucide-react';
import { cn } from '@/lib/utils/cn';

interface TimeTrackerProps {
  onStop: (durationMinutes: number) => void;
  taskTitle?: string;
}

export function TimeTracker({ onStop, taskTitle }: TimeTrackerProps) {
  const [running, setRunning] = useState(false);
  const [seconds, setSeconds] = useState(0);
  const intervalRef = useRef<NodeJS.Timeout | null>(null);

  useEffect(() => {
    if (running) {
      intervalRef.current = setInterval(() => setSeconds((s) => s + 1), 1000);
    } else if (intervalRef.current) {
      clearInterval(intervalRef.current);
    }
    return () => {
      if (intervalRef.current) clearInterval(intervalRef.current);
    };
  }, [running]);

  const formatTime = (s: number) => {
    const h = Math.floor(s / 3600);
    const m = Math.floor((s % 3600) / 60);
    const sec = s % 60;
    return `${h.toString().padStart(2, '0')}:${m.toString().padStart(2, '0')}:${sec.toString().padStart(2, '0')}`;
  };

  const handleStop = () => {
    setRunning(false);
    onStop(Math.ceil(seconds / 60));
    setSeconds(0);
  };

  return (
    <div className="rounded-xl border border-border bg-card p-5">
      <div className="flex items-center justify-between">
        <div>
          <p className="text-3xl font-mono font-bold text-foreground tabular-nums">
            {formatTime(seconds)}
          </p>
          {taskTitle && (
            <p className="mt-1 text-sm text-muted-foreground">{taskTitle}</p>
          )}
        </div>
        <div className="flex items-center gap-2">
          <button
            onClick={() => setRunning(!running)}
            className={cn(
              'flex h-10 w-10 items-center justify-center rounded-full transition',
              running
                ? 'bg-amber-500/20 text-amber-400 hover:bg-amber-500/30'
                : 'bg-primary/20 text-primary hover:bg-primary/30',
            )}
          >
            {running ? (
              <Pause className="h-5 w-5" />
            ) : (
              <Play className="h-5 w-5" />
            )}
          </button>
          {(running || seconds > 0) && (
            <button
              onClick={handleStop}
              className="flex h-10 w-10 items-center justify-center rounded-full bg-red-500/20 text-red-400 transition hover:bg-red-500/30"
            >
              <Square className="h-5 w-5" />
            </button>
          )}
        </div>
      </div>
    </div>
  );
}
