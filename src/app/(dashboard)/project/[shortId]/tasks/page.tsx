'use client';

import { useQuery } from '@tanstack/react-query';
import { useProject } from '@/contexts/ProjectContext';
import { createClient } from '@/lib/supabase/client';
import { queryKeys } from '@/lib/query/keys';
import { useParams } from 'next/navigation';
import { Plus, ListTodo, Calendar } from 'lucide-react';
import type { Task, TaskPriority, TaskStatus, TaskCategory } from '@/types';

/* ── Priority config ── */
const PRIORITY_DOT: Record<string, string> = {
  urgent: 'bg-red-500',
  high: 'bg-amber-500',
  medium: 'bg-blue-500',
  low: 'bg-zinc-400',
};

const PRIORITY_LABEL: Record<string, string> = {
  urgent: 'Urgente',
  high: 'Alta',
  medium: 'Media',
  low: 'Baja',
};

/* ── Status config ── */
const STATUS_CONFIG: Record<string, { label: string; className: string }> = {
  pending: { label: 'Pendiente', className: 'bg-zinc-500/10 text-zinc-400 border-zinc-500/20' },
  in_progress: { label: 'En progreso', className: 'bg-amber-500/10 text-amber-400 border-amber-500/20' },
  in_review: { label: 'En revision', className: 'bg-blue-500/10 text-blue-400 border-blue-500/20' },
  blocked: { label: 'Bloqueada', className: 'bg-rose-500/10 text-rose-400 border-rose-500/20' },
  completed: { label: 'Completada', className: 'bg-emerald-500/10 text-emerald-400 border-emerald-500/20' },
};

/* ── Category config ── */
const CATEGORY_CONFIG: Record<string, { label: string; className: string }> = {
  script: { label: 'Guion', className: 'bg-sky-500/10 text-sky-400' },
  prompt: { label: 'Prompt', className: 'bg-violet-500/10 text-violet-400' },
  image_gen: { label: 'Imagen', className: 'bg-pink-500/10 text-pink-400' },
  video_gen: { label: 'Video', className: 'bg-cyan-500/10 text-cyan-400' },
  review: { label: 'Revision', className: 'bg-blue-500/10 text-blue-400' },
  export: { label: 'Exportacion', className: 'bg-emerald-500/10 text-emerald-400' },
  meeting: { label: 'Reunion', className: 'bg-orange-500/10 text-orange-400' },
  voiceover: { label: 'Locucion', className: 'bg-rose-500/10 text-rose-400' },
  editing: { label: 'Edicion', className: 'bg-indigo-500/10 text-indigo-400' },
  issue: { label: 'Incidencia', className: 'bg-red-500/10 text-red-400' },
  annotation: { label: 'Anotacion', className: 'bg-teal-500/10 text-teal-400' },
  other: { label: 'Otro', className: 'bg-zinc-500/10 text-zinc-400' },
};

function formatDueDate(dateStr: string | null): string {
  if (!dateStr) return '';
  const date = new Date(dateStr);
  const now = new Date();
  const diffMs = date.getTime() - now.getTime();
  const diffDays = Math.ceil(diffMs / (1000 * 60 * 60 * 24));

  if (diffDays < 0) return `Vencida (${Math.abs(diffDays)}d)`;
  if (diffDays === 0) return 'Hoy';
  if (diffDays === 1) return 'Manana';
  return date.toLocaleDateString('es-ES', { day: 'numeric', month: 'short' });
}

function dueDateColor(dateStr: string | null, status: string | null): string {
  if (!dateStr || status === 'completed') return 'text-muted-foreground';
  const diffMs = new Date(dateStr).getTime() - Date.now();
  const diffDays = Math.ceil(diffMs / (1000 * 60 * 60 * 24));
  if (diffDays < 0) return 'text-red-400';
  if (diffDays <= 1) return 'text-amber-400';
  return 'text-muted-foreground';
}

export default function ProjectTasksPage() {
  const { project, loading: projectLoading } = useProject();
  const params = useParams();
  const shortId = params.shortId as string;

  const { data: tasks = [], isLoading } = useQuery({
    queryKey: queryKeys.tasks.byProject(project?.id ?? ''),
    queryFn: async () => {
      const supabase = createClient();
      const { data, error } = await supabase
        .from('tasks')
        .select('*')
        .eq('project_id', project!.id)
        .order('created_at', { ascending: false });
      if (error) throw error;
      return (data ?? []) as Task[];
    },
    enabled: !!project?.id,
  });

  const loading = projectLoading || isLoading;

  // Sort: urgent first, then by due date, completed at the end
  const sortedTasks = [...tasks].sort((a, b) => {
    // Completed tasks always at the end
    if (a.status === 'completed' && b.status !== 'completed') return 1;
    if (b.status === 'completed' && a.status !== 'completed') return -1;

    // Priority order
    const priorityOrder: Record<string, number> = { urgent: 0, high: 1, medium: 2, low: 3 };
    const aPriority = priorityOrder[a.priority ?? 'low'] ?? 3;
    const bPriority = priorityOrder[b.priority ?? 'low'] ?? 3;
    if (aPriority !== bPriority) return aPriority - bPriority;

    // Due date (soonest first)
    if (a.due_date && b.due_date) return new Date(a.due_date).getTime() - new Date(b.due_date).getTime();
    if (a.due_date) return -1;
    if (b.due_date) return 1;

    return 0;
  });

  const activeCount = tasks.filter((t) => t.status !== 'completed').length;

  /* ── Loading skeleton ── */
  if (loading) {
    return (
      <div className="mx-auto max-w-7xl px-4 py-6 space-y-6">
        <div className="flex items-center justify-between">
          <div className="h-8 w-36 animate-pulse rounded-lg bg-secondary" />
          <div className="h-9 w-36 animate-pulse rounded-lg bg-secondary" />
        </div>
        <div className="space-y-2">
          {Array.from({ length: 6 }).map((_, i) => (
            <div key={i} className="h-16 animate-pulse rounded-xl bg-secondary" />
          ))}
        </div>
      </div>
    );
  }

  if (!project) return null;

  return (
    <div className="mx-auto max-w-7xl px-4 py-6 space-y-6">
      {/* ── Header ── */}
      <div className="flex items-center justify-between">
        <div className="flex items-center gap-3">
          <h1 className="text-2xl font-semibold tracking-tight text-foreground">Tareas</h1>
          <span className="rounded-full bg-secondary px-2.5 py-0.5 text-xs font-medium text-muted-foreground">
            {activeCount} activas
          </span>
        </div>
        <button
          type="button"
          className="inline-flex items-center gap-1.5 rounded-lg bg-primary px-3 py-2 text-sm font-medium text-white transition hover:bg-primary/90"
        >
          <Plus className="h-4 w-4" />
          Nueva tarea
        </button>
      </div>

      {/* ── Empty state ── */}
      {tasks.length === 0 && (
        <div className="flex flex-col items-center justify-center rounded-xl border border-dashed border-border bg-card py-16">
          <ListTodo className="mb-3 h-10 w-10 text-muted-foreground/30" />
          <h3 className="mb-1 text-lg font-semibold text-foreground">Sin tareas</h3>
          <p className="mb-4 max-w-sm text-center text-sm text-muted-foreground">
            Crea tu primera tarea para organizar el trabajo de este proyecto.
          </p>
          <button
            type="button"
            className="inline-flex items-center gap-1.5 rounded-lg bg-primary px-4 py-2 text-sm font-medium text-white transition hover:bg-primary/90"
          >
            <Plus className="h-4 w-4" />
            Crear tarea
          </button>
        </div>
      )}

      {/* ── Task list ── */}
      {sortedTasks.length > 0 && (
        <div className="space-y-2">
          {/* Column headers */}
          <div className="hidden sm:grid sm:grid-cols-[auto_1fr_auto_auto_auto] items-center gap-3 px-4 py-1.5">
            <div className="w-2.5" />
            <span className="text-xs font-semibold uppercase tracking-wider text-muted-foreground">Tarea</span>
            <span className="text-xs font-semibold uppercase tracking-wider text-muted-foreground text-right">Categoria</span>
            <span className="text-xs font-semibold uppercase tracking-wider text-muted-foreground text-right w-24">Fecha</span>
            <span className="text-xs font-semibold uppercase tracking-wider text-muted-foreground text-right w-24">Estado</span>
          </div>

          {sortedTasks.map((task) => {
            const priorityDot = PRIORITY_DOT[task.priority ?? 'low'] ?? PRIORITY_DOT.low;
            const status = STATUS_CONFIG[task.status ?? 'pending'] ?? STATUS_CONFIG.pending;
            const category = CATEGORY_CONFIG[task.category ?? 'other'] ?? CATEGORY_CONFIG.other;
            const dueText = formatDueDate(task.due_date);
            const dueColor = dueDateColor(task.due_date, task.status);
            const isCompleted = task.status === 'completed';

            return (
              <div
                key={task.id}
                className={`rounded-xl border border-border bg-card p-4 transition hover:border-primary/20 ${isCompleted ? 'opacity-60' : ''}`}
              >
                {/* Mobile layout */}
                <div className="sm:hidden space-y-2">
                  <div className="flex items-start gap-2">
                    <span className={`mt-1.5 h-2.5 w-2.5 shrink-0 rounded-full ${priorityDot}`} title={PRIORITY_LABEL[task.priority ?? 'low']} />
                    <div className="min-w-0 flex-1">
                      <h3 className={`text-sm font-medium text-foreground ${isCompleted ? 'line-through' : ''}`}>
                        {task.title}
                      </h3>
                    </div>
                  </div>
                  <div className="flex items-center gap-2 pl-[18px]">
                    <span className={`rounded px-1.5 py-0.5 text-[10px] font-medium ${category.className}`}>
                      {category.label}
                    </span>
                    <span className={`rounded-full border px-2 py-0.5 text-[10px] font-medium ${status.className}`}>
                      {status.label}
                    </span>
                    {dueText && (
                      <span className={`flex items-center gap-1 text-[10px] ${dueColor}`}>
                        <Calendar className="h-3 w-3" />
                        {dueText}
                      </span>
                    )}
                  </div>
                </div>

                {/* Desktop layout */}
                <div className="hidden sm:grid sm:grid-cols-[auto_1fr_auto_auto_auto] items-center gap-3">
                  {/* Priority dot */}
                  <span className={`h-2.5 w-2.5 rounded-full ${priorityDot}`} title={PRIORITY_LABEL[task.priority ?? 'low']} />

                  {/* Title */}
                  <h3 className={`truncate text-sm font-medium text-foreground ${isCompleted ? 'line-through' : ''}`}>
                    {task.title}
                  </h3>

                  {/* Category badge */}
                  <span className={`rounded px-1.5 py-0.5 text-[10px] font-medium ${category.className}`}>
                    {category.label}
                  </span>

                  {/* Due date */}
                  <span className={`flex items-center justify-end gap-1 text-xs w-24 ${dueColor}`}>
                    {dueText && (
                      <>
                        <Calendar className="h-3 w-3" />
                        {dueText}
                      </>
                    )}
                  </span>

                  {/* Status badge */}
                  <span className={`rounded-full border px-2 py-0.5 text-[10px] font-medium text-right w-24 ${status.className}`}>
                    {status.label}
                  </span>
                </div>
              </div>
            );
          })}
        </div>
      )}
    </div>
  );
}
