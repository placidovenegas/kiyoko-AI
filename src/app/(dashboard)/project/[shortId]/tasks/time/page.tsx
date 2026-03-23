'use client';

import { useState, useEffect, useCallback } from 'react';
import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query';
import { createClient } from '@/lib/supabase/client';
import { useProject } from '@/contexts/ProjectContext';
import { queryKeys } from '@/lib/query/keys';
import { KButton } from '@/components/ui/kiyoko-button';
import {
  Loader2, Clock, Play, Square, CalendarDays, Timer,
} from 'lucide-react';
import type { TimeEntry } from '@/types';

function formatDuration(minutes: number): string {
  const h = Math.floor(minutes / 60);
  const m = Math.round(minutes % 60);
  return h > 0 ? `${h}h ${m}m` : `${m}m`;
}

function formatElapsed(startedAt: string): string {
  const diff = Date.now() - new Date(startedAt).getTime();
  const totalSeconds = Math.floor(diff / 1000);
  const h = Math.floor(totalSeconds / 3600);
  const m = Math.floor((totalSeconds % 3600) / 60);
  const s = totalSeconds % 60;
  return `${h.toString().padStart(2, '0')}:${m.toString().padStart(2, '0')}:${s.toString().padStart(2, '0')}`;
}

export default function TimeTrackingPage() {
  const { project } = useProject();
  const supabase = createClient();
  const queryClient = useQueryClient();

  const [description, setDescription] = useState('');
  const [elapsed, setElapsed] = useState('00:00:00');

  const { data: entries = [], isLoading } = useQuery({
    queryKey: queryKeys.timeEntries.byProject(project?.id ?? ''),
    queryFn: async () => {
      const { data, error } = await supabase
        .from('time_entries')
        .select('*')
        .eq('project_id', project!.id)
        .order('started_at', { ascending: false });
      if (error) throw error;
      return data as TimeEntry[];
    },
    enabled: !!project?.id,
  });

  const runningEntry = entries.find((e) => e.is_running);

  // Timer tick
  const updateElapsed = useCallback(() => {
    if (runningEntry) {
      setElapsed(formatElapsed(runningEntry.started_at));
    } else {
      setElapsed('00:00:00');
    }
  }, [runningEntry]);

  useEffect(() => {
    updateElapsed();
    const interval = setInterval(updateElapsed, 1000);
    return () => clearInterval(interval);
  }, [updateElapsed]);

  // Start timer
  const startMutation = useMutation({
    mutationFn: async () => {
      if (!project) throw new Error('No project');
      const { data: { user } } = await supabase.auth.getUser();
      if (!user) throw new Error('No auth');

      const { error } = await supabase.from('time_entries').insert({
        project_id: project.id,
        user_id: user.id,
        started_at: new Date().toISOString(),
        is_running: true,
        description: description || null,
      });
      if (error) throw error;
    },
    onSuccess: () => {
      void queryClient.invalidateQueries({ queryKey: queryKeys.timeEntries.byProject(project?.id ?? '') });
      setDescription('');
    },
  });

  // Stop timer
  const stopMutation = useMutation({
    mutationFn: async () => {
      if (!runningEntry) return;
      const now = new Date();
      const started = new Date(runningEntry.started_at);
      const durationMinutes = (now.getTime() - started.getTime()) / 60000;

      const { error } = await supabase
        .from('time_entries')
        .update({
          is_running: false,
          ended_at: now.toISOString(),
          duration_minutes: Math.round(durationMinutes),
        })
        .eq('id', runningEntry.id);
      if (error) throw error;
    },
    onSuccess: () => {
      void queryClient.invalidateQueries({ queryKey: queryKeys.timeEntries.byProject(project?.id ?? '') });
    },
  });

  // Group entries by day
  const completedEntries = entries.filter((e) => !e.is_running);
  const grouped = completedEntries.reduce<Record<string, TimeEntry[]>>((acc, entry) => {
    const day = new Date(entry.started_at).toLocaleDateString('es-ES', {
      weekday: 'long', day: 'numeric', month: 'long',
    });
    if (!acc[day]) acc[day] = [];
    acc[day].push(entry);
    return acc;
  }, {});

  // Summary
  const today = new Date().toDateString();
  const todayMinutes = completedEntries
    .filter((e) => new Date(e.started_at).toDateString() === today)
    .reduce((sum, e) => sum + (e.duration_minutes ?? 0), 0);

  const weekStart = new Date();
  weekStart.setDate(weekStart.getDate() - weekStart.getDay());
  weekStart.setHours(0, 0, 0, 0);
  const weekMinutes = completedEntries
    .filter((e) => new Date(e.started_at) >= weekStart)
    .reduce((sum, e) => sum + (e.duration_minutes ?? 0), 0);

  if (isLoading) {
    return (
      <div className="flex h-full items-center justify-center bg-background">
        <Loader2 className="h-8 w-8 animate-spin text-muted-foreground" />
      </div>
    );
  }

  return (
    <div className="flex h-full flex-col overflow-y-auto bg-background p-6">
      {/* Header */}
      <div className="mb-6 flex items-center gap-3">
        <Clock className="h-5 w-5 text-primary" />
        <h1 className="text-lg font-semibold text-foreground">Registro de tiempo</h1>
      </div>

      {/* Timer */}
      <div className="mb-6 rounded-xl border border-border bg-card p-6">
        <div className="flex flex-col items-center gap-4 sm:flex-row">
          {/* Elapsed display */}
          <div className="flex items-center gap-3">
            <Timer className={`h-6 w-6 ${runningEntry ? 'animate-pulse text-primary' : 'text-muted-foreground'}`} />
            <span className="font-mono text-3xl font-bold text-foreground">{elapsed}</span>
          </div>

          {/* Description input */}
          <input
            value={runningEntry ? (runningEntry.description ?? '') : description}
            onChange={(e) => setDescription(e.target.value)}
            placeholder="Descripcion (opcional)"
            disabled={!!runningEntry}
            className="flex-1 rounded-lg border border-border bg-background p-2.5 text-sm text-foreground placeholder:text-muted-foreground focus:border-primary focus:outline-none disabled:opacity-50"
          />

          {/* Start/Stop */}
          {runningEntry ? (
            <KButton
              variant="primary"
              size="md"
              icon={<Square className="h-4 w-4" />}
              onClick={() => stopMutation.mutate()}
              disabled={stopMutation.isPending}
            >
              Detener
            </KButton>
          ) : (
            <KButton
              variant="primary"
              size="md"
              icon={<Play className="h-4 w-4" />}
              onClick={() => startMutation.mutate()}
              disabled={startMutation.isPending}
            >
              Iniciar
            </KButton>
          )}
        </div>
      </div>

      {/* Summary cards */}
      <div className="mb-6 grid grid-cols-2 gap-4">
        <div className="rounded-xl border border-border bg-card p-5">
          <p className="text-xs text-muted-foreground">Hoy</p>
          <p className="mt-1 text-2xl font-bold text-primary">{formatDuration(todayMinutes)}</p>
        </div>
        <div className="rounded-xl border border-border bg-card p-5">
          <p className="text-xs text-muted-foreground">Esta semana</p>
          <p className="mt-1 text-2xl font-bold text-primary">{formatDuration(weekMinutes)}</p>
        </div>
      </div>

      {/* History */}
      {completedEntries.length === 0 ? (
        <div className="flex flex-1 flex-col items-center justify-center rounded-xl border border-dashed border-border bg-card p-12">
          <Clock className="mb-4 h-12 w-12 text-muted-foreground" />
          <h2 className="mb-2 text-lg font-semibold text-foreground">Sin registros</h2>
          <p className="max-w-sm text-center text-sm text-muted-foreground">
            Inicia el temporizador para registrar tu tiempo de trabajo.
          </p>
        </div>
      ) : (
        <div className="space-y-6">
          {Object.entries(grouped).map(([day, dayEntries]) => (
            <div key={day}>
              <div className="mb-3 flex items-center gap-2">
                <CalendarDays className="h-4 w-4 text-muted-foreground" />
                <h3 className="text-sm font-medium capitalize text-foreground">{day}</h3>
                <span className="text-xs text-muted-foreground">
                  ({formatDuration(dayEntries.reduce((s, e) => s + (e.duration_minutes ?? 0), 0))})
                </span>
              </div>
              <div className="rounded-xl border border-border bg-card divide-y divide-border">
                {dayEntries.map((entry) => (
                  <div key={entry.id} className="flex items-center gap-4 px-5 py-3">
                    <Clock className="h-4 w-4 shrink-0 text-muted-foreground" />
                    <div className="min-w-0 flex-1">
                      <p className="truncate text-sm text-foreground">
                        {entry.description || 'Sin descripcion'}
                      </p>
                      <p className="text-xs text-muted-foreground">
                        {new Date(entry.started_at).toLocaleTimeString('es-ES', { hour: '2-digit', minute: '2-digit' })}
                        {entry.ended_at && (
                          <> - {new Date(entry.ended_at).toLocaleTimeString('es-ES', { hour: '2-digit', minute: '2-digit' })}</>
                        )}
                      </p>
                    </div>
                    <span className="shrink-0 font-mono text-sm font-medium text-primary">
                      {formatDuration(entry.duration_minutes ?? 0)}
                    </span>
                  </div>
                ))}
              </div>
            </div>
          ))}
        </div>
      )}
    </div>
  );
}
