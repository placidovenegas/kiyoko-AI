'use client';

import { useState, useMemo } from 'react';
import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query';
import { createClient } from '@/lib/supabase/client';
import { useProject } from '@/contexts/ProjectContext';
import { queryKeys } from '@/lib/query/keys';
import { cn } from '@/lib/utils/cn';
import { KButton } from '@/components/ui/kiyoko-button';
import { toast } from 'sonner';
import {
  Plus,
  LayoutGrid,
  List,
  Loader2,
  CheckSquare,
  Circle,
  Clock,
  Eye,
  CheckCircle2,
  Sparkles,
  AlertCircle,
} from 'lucide-react';
import { TaskCreateModal } from '@/components/tasks/TaskCreateModal';
import type { Task, TaskStatus, TaskPriority, TaskCategory } from '@/types';

/* ── Column definitions ────────────────────────────────── */
const COLUMNS = [
  { id: 'pending' as const, label: 'Pendiente', color: 'border-t-zinc-500', icon: Circle, iconColor: 'text-zinc-400' },
  { id: 'in_progress' as const, label: 'En progreso', color: 'border-t-amber-500', icon: Clock, iconColor: 'text-amber-400' },
  { id: 'in_review' as const, label: 'En revision', color: 'border-t-purple-500', icon: Eye, iconColor: 'text-purple-400' },
  { id: 'completed' as const, label: 'Completado', color: 'border-t-emerald-500', icon: CheckCircle2, iconColor: 'text-emerald-400' },
] as const;

const PRIORITY_COLORS: Record<TaskPriority, string> = {
  low: 'text-emerald-400',
  medium: 'text-amber-400',
  high: 'text-orange-400',
  urgent: 'text-red-400',
};

const PRIORITY_DOT: Record<TaskPriority, string> = {
  low: 'bg-emerald-400',
  medium: 'bg-amber-400',
  high: 'bg-orange-400',
  urgent: 'bg-red-400',
};

const PRIORITY_LABELS: Record<TaskPriority, string> = {
  low: 'Baja',
  medium: 'Media',
  high: 'Alta',
  urgent: 'Urgente',
};

const CATEGORY_ICONS: Record<TaskCategory, string> = {
  script: '\u{1F4DD}',
  prompt: '\u{270F}\u{FE0F}',
  image_gen: '\u{1F4F8}',
  video_gen: '\u{1F3AC}',
  review: '\u{1F441}',
  export: '\u{1F4E4}',
  meeting: '\u{1F4C5}',
  voiceover: '\u{1F399}\u{FE0F}',
  editing: '\u{2702}\u{FE0F}',
  issue: '\u{1F41B}',
  annotation: '\u{1F4AC}',
  other: '\u{1F4CB}',
};

type ViewMode = 'kanban' | 'list';

/* ── Task Card ─────────────────────────────────────────── */
function TaskCard({ task }: { task: Task }) {
  const priority = task.priority as TaskPriority;
  const category = task.category as TaskCategory;

  return (
    <div className="rounded-lg border border-border bg-card p-3 transition hover:border-primary/30">
      <p className="text-sm font-medium text-foreground line-clamp-2">
        {task.title}
      </p>
      {task.description && (
        <p className="mt-1 line-clamp-2 text-xs text-muted-foreground">
          {task.description}
        </p>
      )}
      <div className="mt-2 flex items-center gap-2 text-[11px] text-muted-foreground">
        <span className="inline-flex items-center gap-1">
          <span
            className={cn('inline-block h-1.5 w-1.5 rounded-full', PRIORITY_DOT[priority])}
          />
          <span className={PRIORITY_COLORS[priority]}>
            {PRIORITY_LABELS[priority]}
          </span>
        </span>
        <span>{CATEGORY_ICONS[category] ?? CATEGORY_ICONS.other}</span>
        {task.due_date && (
          <span>
            {new Date(task.due_date).toLocaleDateString('es-ES', {
              day: 'numeric',
              month: 'short',
            })}
          </span>
        )}
        {task.created_by === 'ai' && (
          <Sparkles className="h-3 w-3 text-purple-400" />
        )}
      </div>
    </div>
  );
}

/* ── Skeleton ──────────────────────────────────────────── */
function KanbanSkeleton() {
  return (
    <div className="grid grid-cols-4 gap-4 h-full">
      {Array.from({ length: 4 }).map((_, i) => (
        <div key={i} className="flex flex-col rounded-xl border-t-2 border-t-zinc-700 bg-card/50">
          <div className="p-3">
            <div className="h-4 w-24 animate-pulse rounded bg-secondary" />
          </div>
          <div className="flex-1 space-y-2 px-2 pb-2">
            {Array.from({ length: 2 }).map((_, j) => (
              <div key={j} className="h-20 animate-pulse rounded-lg bg-secondary" />
            ))}
          </div>
        </div>
      ))}
    </div>
  );
}

/* ── Main Page ─────────────────────────────────────────── */
export default function TasksPage() {
  const { project, loading: projectLoading } = useProject();
  const supabase = createClient();
  const queryClient = useQueryClient();
  const [viewMode, setViewMode] = useState<ViewMode>('kanban');
  const [createModalOpen, setCreateModalOpen] = useState(false);

  const {
    data: tasks = [],
    isLoading,
  } = useQuery({
    queryKey: queryKeys.tasks.byProject(project?.id ?? ''),
    queryFn: async () => {
      const { data, error } = await supabase
        .from('tasks')
        .select('*')
        .eq('project_id', project!.id)
        .order('sort_order');
      if (error) throw error;
      return data as Task[];
    },
    enabled: !!project?.id,
  });

  const updateTaskStatus = useMutation({
    mutationFn: async ({
      taskId,
      newStatus,
    }: {
      taskId: string;
      newStatus: TaskStatus;
    }) => {
      const { error } = await supabase
        .from('tasks')
        .update({ status: newStatus })
        .eq('id', taskId);
      if (error) throw error;
    },
    onMutate: async ({ taskId, newStatus }) => {
      await queryClient.cancelQueries({
        queryKey: queryKeys.tasks.byProject(project?.id ?? ''),
      });
      const prev = queryClient.getQueryData<Task[]>(
        queryKeys.tasks.byProject(project?.id ?? ''),
      );
      queryClient.setQueryData<Task[]>(
        queryKeys.tasks.byProject(project?.id ?? ''),
        (old) =>
          old?.map((t) =>
            t.id === taskId ? { ...t, status: newStatus } : t,
          ),
      );
      return { prev };
    },
    onError: (_err, _vars, context) => {
      if (context?.prev) {
        queryClient.setQueryData(
          queryKeys.tasks.byProject(project?.id ?? ''),
          context.prev,
        );
      }
      toast.error('Error al actualizar la tarea');
    },
    onSettled: () => {
      queryClient.invalidateQueries({
        queryKey: queryKeys.tasks.byProject(project?.id ?? ''),
      });
    },
  });

  const tasksByStatus = useMemo(() => {
    const map: Record<string, Task[]> = {};
    for (const col of COLUMNS) {
      map[col.id] = [];
    }
    for (const task of tasks) {
      const status = task.status as string;
      if (map[status]) {
        map[status].push(task);
      }
    }
    return map;
  }, [tasks]);

  const loading = isLoading || projectLoading;

  if (loading) {
    return (
      <div className="flex h-full flex-col overflow-hidden">
        <div className="shrink-0 border-b border-border px-6 py-4">
          <div className="h-7 w-32 animate-pulse rounded-lg bg-secondary" />
        </div>
        <div className="flex-1 overflow-auto p-6">
          <KanbanSkeleton />
        </div>
      </div>
    );
  }

  return (
    <div className="flex h-full flex-col overflow-hidden">
      {/* Header */}
      <div className="shrink-0 border-b border-border px-6 py-4">
        <div className="flex items-center justify-between">
          <div>
            <h2 className="text-lg font-semibold text-foreground">Tareas</h2>
            <p className="text-sm text-muted-foreground">
              {tasks.length} tareas en el proyecto
            </p>
          </div>
          <div className="flex items-center gap-2">
            <KButton
              variant="ai"
              size="sm"
              icon={<Sparkles className="h-3.5 w-3.5" />}
              onClick={() =>
                toast.info('Proximamente: generar plan de tareas con IA')
              }
            >
              Generar con IA
            </KButton>
            <KButton
              size="sm"
              icon={<Plus className="h-3.5 w-3.5" />}
              onClick={() => setCreateModalOpen(true)}
            >
              Nueva tarea
            </KButton>
          </div>
        </div>

        {/* View mode toggle */}
        <div className="mt-3 flex items-center gap-1 rounded-lg border border-border p-0.5 w-fit">
          {([
            { key: 'kanban' as const, label: 'Kanban', icon: LayoutGrid },
            { key: 'list' as const, label: 'Lista', icon: List },
          ]).map((mode) => {
            const Icon = mode.icon;
            return (
              <button
                key={mode.key}
                onClick={() => setViewMode(mode.key)}
                className={cn(
                  'inline-flex items-center gap-1 rounded-md px-2.5 py-1.5 text-xs font-medium transition',
                  viewMode === mode.key
                    ? 'bg-secondary text-foreground shadow-sm'
                    : 'text-muted-foreground hover:text-foreground',
                )}
              >
                <Icon className="h-3.5 w-3.5" />
                {mode.label}
              </button>
            );
          })}
        </div>
      </div>

      {/* Content */}
      <div className="flex-1 overflow-auto p-6">
        {viewMode === 'kanban' && (
          <div className="grid grid-cols-4 gap-4 h-full min-h-100">
            {COLUMNS.map((col) => {
              const columnTasks = tasksByStatus[col.id] ?? [];
              const Icon = col.icon;
              return (
                <div
                  key={col.id}
                  className={cn(
                    'flex flex-col rounded-xl border-t-2 bg-background/50',
                    col.color,
                  )}
                >
                  {/* Column header */}
                  <div className="flex items-center gap-2 px-3 py-3">
                    <Icon className={cn('h-4 w-4', col.iconColor)} />
                    <span className="text-sm font-semibold text-foreground">
                      {col.label}
                    </span>
                    <span className="rounded-full bg-secondary px-1.5 py-0.5 text-[10px] font-bold text-muted-foreground">
                      {columnTasks.length}
                    </span>
                  </div>

                  {/* Tasks */}
                  <div className="flex-1 space-y-2 overflow-y-auto px-2 pb-2">
                    {columnTasks.length === 0 ? (
                      <div className="flex items-center justify-center rounded-lg border border-dashed border-border py-8">
                        <p className="text-xs text-muted-foreground">Sin tareas</p>
                      </div>
                    ) : (
                      columnTasks.map((task) => (
                        <TaskCard key={task.id} task={task} />
                      ))
                    )}
                  </div>
                </div>
              );
            })}
          </div>
        )}

        {viewMode === 'list' && (
          <div className="space-y-1">
            {tasks.length === 0 ? (
              <div className="flex flex-col items-center justify-center rounded-xl border border-dashed border-border py-16">
                <CheckSquare className="mb-3 h-10 w-10 text-muted-foreground/60" />
                <h3 className="mb-1 text-lg font-semibold text-foreground">
                  No hay tareas
                </h3>
                <p className="text-sm text-muted-foreground">
                  Crea tareas manualmente o genera un plan con IA
                </p>
              </div>
            ) : (
              tasks.map((task) => {
                const status = task.status as TaskStatus;
                const priority = task.priority as TaskPriority;
                const statusCol = COLUMNS.find((c) => c.id === status);
                const StatusIcon = statusCol?.icon ?? Circle;
                return (
                  <div
                    key={task.id}
                    className="flex items-center gap-3 rounded-lg px-3 py-2 transition hover:bg-card"
                  >
                    <button
                      onClick={() => {
                        const nextStatus: TaskStatus =
                          status === 'completed' ? 'pending' : 'completed';
                        updateTaskStatus.mutate({
                          taskId: task.id,
                          newStatus: nextStatus,
                        });
                      }}
                      aria-label={
                        status === 'completed'
                          ? 'Reabrir tarea'
                          : 'Completar tarea'
                      }
                      className={statusCol?.iconColor}
                    >
                      <StatusIcon className="h-4 w-4" />
                    </button>
                    <span
                      className={cn(
                        'flex-1 text-sm',
                        status === 'completed'
                          ? 'text-muted-foreground line-through'
                          : 'text-foreground',
                      )}
                    >
                      {task.title}
                    </span>
                    <span className="inline-flex items-center gap-1">
                      <span
                        className={cn(
                          'inline-block h-1.5 w-1.5 rounded-full',
                          PRIORITY_DOT[priority],
                        )}
                      />
                      <span
                        className={cn(
                          'text-[10px] font-medium',
                          PRIORITY_COLORS[priority],
                        )}
                      >
                        {PRIORITY_LABELS[priority]}
                      </span>
                    </span>
                    {task.due_date && (
                      <span className="text-[10px] text-muted-foreground">
                        {new Date(task.due_date).toLocaleDateString('es-ES', {
                          day: 'numeric',
                          month: 'short',
                        })}
                      </span>
                    )}
                  </div>
                );
              })
            )}
          </div>
        )}
      </div>

      {/* Create Modal */}
      {project?.id && (
        <TaskCreateModal
          open={createModalOpen}
          onClose={() => setCreateModalOpen(false)}
          projectId={project.id}
          onCreated={() => {
            queryClient.invalidateQueries({
              queryKey: queryKeys.tasks.byProject(project.id),
            });
          }}
        />
      )}
    </div>
  );
}
