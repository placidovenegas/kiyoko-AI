'use client';

import { useState, useEffect, useCallback } from 'react';
import { useProject } from '@/contexts/ProjectContext';
import { createClient } from '@/lib/supabase/client';
import { toast } from 'sonner';
import {
  Plus,
  Sparkles,
  ListTodo,
  Calendar,
  LayoutGrid,
  Circle,
  Clock,
  Eye,
  CheckCircle2,
  AlertCircle,
} from 'lucide-react';
import { TaskCreateModal } from '@/components/tasks/TaskCreateModal';

interface Task {
  id: string;
  title: string;
  description: string | null;
  status: 'pending' | 'in_progress' | 'in_review' | 'completed' | 'blocked';
  priority: 'low' | 'medium' | 'high' | 'urgent';
  category: string;
  due_date: string | null;
  scheduled_date: string | null;
  created_by: string;
  created_at: string;
}

type ViewMode = 'board' | 'list' | 'calendar';

const STATUS_COLUMNS = [
  { key: 'pending', label: 'Pendiente', icon: Circle, color: 'text-gray-400' },
  { key: 'in_progress', label: 'En proceso', icon: Clock, color: 'text-blue-400' },
  { key: 'in_review', label: 'En revision', icon: Eye, color: 'text-amber-400' },
  { key: 'completed', label: 'Completado', icon: CheckCircle2, color: 'text-green-400' },
] as const;

const PRIORITY_COLORS: Record<string, string> = {
  low: 'bg-gray-500/20 text-gray-400',
  medium: 'bg-blue-500/20 text-blue-400',
  high: 'bg-amber-500/20 text-amber-400',
  urgent: 'bg-red-500/20 text-red-400',
};

const PRIORITY_LABELS: Record<string, string> = {
  low: 'Baja',
  medium: 'Media',
  high: 'Alta',
  urgent: 'Urgente',
};

export default function TasksPage() {
  const { project, loading: projectLoading } = useProject();
  const [tasks, setTasks] = useState<Task[]>([]);
  const [loading, setLoading] = useState(true);
  const [viewMode, setViewMode] = useState<ViewMode>('board');
  const [createModalOpen, setCreateModalOpen] = useState(false);

  const fetchTasks = useCallback(async () => {
    if (!project?.id) return;
    setLoading(true);
    const supabase = createClient();
    const { data } = await supabase
      .from('tasks')
      .select('*')
      .eq('project_id', project.id)
      .order('sort_order');
    setTasks((data as Task[]) ?? []);
    setLoading(false);
  }, [project?.id]);

  useEffect(() => {
    if (!projectLoading && project?.id) fetchTasks();
  }, [fetchTasks, projectLoading, project?.id]);

  const updateTaskStatus = useCallback(async (taskId: string, newStatus: string) => {
    const supabase = createClient();
    const { error } = await supabase.from('tasks').update({ status: newStatus }).eq('id', taskId);
    if (error) { toast.error('Error al actualizar'); return; }
    setTasks((prev) => prev.map((t) => t.id === taskId ? { ...t, status: newStatus as Task['status'] } : t));
  }, []);

  if (loading || projectLoading) {
    return (
      <div className="space-y-6 p-6">
        <div className="h-8 w-48 animate-pulse rounded-lg bg-surface-secondary" />
        <div className="grid grid-cols-4 gap-4">
          {Array.from({ length: 4 }).map((_, i) => (
            <div key={i} className="h-64 animate-pulse rounded-xl bg-surface-secondary" />
          ))}
        </div>
      </div>
    );
  }

  return (
    <div className="flex h-full flex-col overflow-hidden">
      {/* Header */}
      <div className="shrink-0 border-b border-foreground/[0.06] px-6 py-4">
        <div className="flex items-center justify-between">
          <div>
            <h2 className="text-lg font-bold text-foreground">Tareas</h2>
            <p className="text-sm text-foreground-muted">{tasks.length} tareas en el proyecto</p>
          </div>
          <div className="flex items-center gap-2">
            <button
              onClick={() => toast.info('Proximamente: generar plan de tareas con IA')}
              className="inline-flex items-center gap-1.5 rounded-lg border border-surface-tertiary px-3 py-2 text-sm font-medium text-foreground-secondary transition hover:bg-surface-secondary"
            >
              <Sparkles className="h-4 w-4" /> Generar con IA
            </button>
            <button
              onClick={() => setCreateModalOpen(true)}
              className="inline-flex items-center gap-1.5 rounded-lg bg-brand-500 px-3 py-2 text-sm font-medium text-white transition hover:bg-brand-600"
            >
              <Plus className="h-4 w-4" /> Nueva tarea
            </button>
          </div>
        </div>

        {/* View mode toggle */}
        <div className="mt-3 flex items-center gap-1 rounded-lg border border-surface-tertiary p-0.5 w-fit">
          {([
            { key: 'board', label: 'Tablero', icon: LayoutGrid },
            { key: 'list', label: 'Lista', icon: ListTodo },
            { key: 'calendar', label: 'Calendario', icon: Calendar },
          ] as const).map((mode) => (
            <button
              key={mode.key}
              onClick={() => setViewMode(mode.key)}
              className={`inline-flex items-center gap-1 rounded-md px-2.5 py-1.5 text-xs font-medium transition ${
                viewMode === mode.key
                  ? 'bg-surface-secondary text-foreground shadow-sm'
                  : 'text-foreground-muted hover:text-foreground'
              }`}
            >
              <mode.icon className="h-3.5 w-3.5" /> {mode.label}
            </button>
          ))}
        </div>
      </div>

      {/* Content */}
      <div className="flex-1 overflow-auto p-6">
        {viewMode === 'board' && (
          <div className="grid grid-cols-4 gap-4 h-full">
            {STATUS_COLUMNS.map((col) => {
              const columnTasks = tasks.filter((t) => t.status === col.key);
              const Icon = col.icon;
              return (
                <div key={col.key} className="flex flex-col rounded-xl bg-surface-secondary/50">
                  {/* Column header */}
                  <div className="flex items-center gap-2 px-3 py-3">
                    <Icon className={`h-4 w-4 ${col.color}`} />
                    <span className="text-sm font-semibold text-foreground">{col.label}</span>
                    <span className="rounded-full bg-surface-tertiary px-1.5 py-0.5 text-[10px] font-bold text-foreground-muted">
                      {columnTasks.length}
                    </span>
                  </div>

                  {/* Tasks */}
                  <div className="flex-1 space-y-2 overflow-y-auto px-2 pb-2">
                    {columnTasks.length === 0 ? (
                      <div className="flex items-center justify-center rounded-lg border border-dashed border-surface-tertiary py-8">
                        <p className="text-xs text-foreground-muted">Sin tareas</p>
                      </div>
                    ) : (
                      columnTasks.map((task) => (
                        <div
                          key={task.id}
                          className="rounded-lg border border-surface-tertiary bg-surface p-3 transition hover:border-brand-500/30"
                        >
                          <p className="text-sm font-medium text-foreground">{task.title}</p>
                          {task.description && (
                            <p className="mt-1 line-clamp-2 text-xs text-foreground-muted">{task.description}</p>
                          )}
                          <div className="mt-2 flex items-center gap-1.5">
                            <span className={`rounded-full px-1.5 py-0.5 text-[10px] font-medium ${PRIORITY_COLORS[task.priority]}`}>
                              {PRIORITY_LABELS[task.priority]}
                            </span>
                            {task.due_date && (
                              <span className="text-[10px] text-foreground-muted">
                                {new Date(task.due_date).toLocaleDateString('es-ES', { day: 'numeric', month: 'short' })}
                              </span>
                            )}
                            {task.created_by === 'ai' && (
                              <Sparkles className="h-3 w-3 text-purple-400" />
                            )}
                          </div>
                        </div>
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
              <div className="flex flex-col items-center justify-center rounded-xl border border-dashed border-surface-tertiary py-16">
                <ListTodo className="mb-3 h-10 w-10 text-foreground-muted/30" />
                <h3 className="mb-1 text-lg font-semibold text-foreground">No hay tareas</h3>
                <p className="text-sm text-foreground-muted">Crea tareas manualmente o genera un plan con IA</p>
              </div>
            ) : (
              tasks.map((task) => {
                const statusCol = STATUS_COLUMNS.find((c) => c.key === task.status);
                const StatusIcon = statusCol?.icon ?? Circle;
                return (
                  <div key={task.id} className="flex items-center gap-3 rounded-lg px-3 py-2 transition hover:bg-surface-secondary">
                    <button
                      onClick={() => {
                        const nextStatus = task.status === 'completed' ? 'pending' : 'completed';
                        updateTaskStatus(task.id, nextStatus);
                      }}
                      aria-label={task.status === 'completed' ? 'Reabrir tarea' : 'Completar tarea'}
                      className={statusCol?.color}
                    >
                      <StatusIcon className="h-4 w-4" />
                    </button>
                    <span className={`flex-1 text-sm ${task.status === 'completed' ? 'text-foreground-muted line-through' : 'text-foreground'}`}>
                      {task.title}
                    </span>
                    <span className={`rounded-full px-1.5 py-0.5 text-[10px] font-medium ${PRIORITY_COLORS[task.priority]}`}>
                      {PRIORITY_LABELS[task.priority]}
                    </span>
                    {task.due_date && (
                      <span className="text-[10px] text-foreground-muted">
                        {new Date(task.due_date).toLocaleDateString('es-ES', { day: 'numeric', month: 'short' })}
                      </span>
                    )}
                  </div>
                );
              })
            )}
          </div>
        )}

        {viewMode === 'calendar' && (
          <div className="flex flex-col items-center justify-center rounded-xl border border-dashed border-surface-tertiary py-16">
            <Calendar className="mb-3 h-10 w-10 text-foreground-muted/30" />
            <h3 className="mb-1 text-lg font-semibold text-foreground">Vista Calendario</h3>
            <p className="text-sm text-foreground-muted">Proximamente: vista calendario con tareas y videos programados</p>
          </div>
        )}
      </div>

      {/* Create Modal */}
      {project?.id && (
        <TaskCreateModal
          open={createModalOpen}
          onClose={() => setCreateModalOpen(false)}
          projectId={project.id}
          onCreated={fetchTasks}
        />
      )}
    </div>
  );
}
