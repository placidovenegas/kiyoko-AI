'use client';

import Link from 'next/link';
import { useRouter } from 'next/navigation';
import { useMemo, useState, type ReactNode } from 'react';
import {
  DndContext,
  DragOverlay,
  PointerSensor,
  useDraggable,
  useDroppable,
  useSensor,
  useSensors,
  type DragEndEvent,
  type DragStartEvent,
} from '@dnd-kit/core';
import { CSS } from '@dnd-kit/utilities';
import {
  ArrowUpDown,
  CalendarClock,
  ChevronDown,
  CheckSquare,
  Eye,
  FolderOpen,
  KanbanSquare,
  List,
  ListTodo,
  Loader2,
  MoreHorizontal,
  Plus,
  Search,
  Sparkles,
  Table2,
  Video,
} from 'lucide-react';
import { Popover } from '@heroui/react';
import { useDashboard } from '@/providers/DashboardBootstrap';
import { useDashboardTasks } from '@/hooks/useDashboardTasks';
import { cn } from '@/lib/utils/cn';
import { useUIStore } from '@/stores/useUIStore';
import type { DashboardTask } from '@/lib/queries/tasks';
import type { TaskCategory, TaskPriority, TaskStatus } from '@/types';

type TaskFilter = 'all' | 'overdue' | 'urgent' | 'completed';
type SortMode = 'priority' | 'due' | 'recent';
type TaskViewMode = 'board' | 'list' | 'table';
type TaskBoardStatus = Extract<TaskStatus, 'pending' | 'in_progress' | 'in_review' | 'blocked' | 'completed'>;

type Tone = {
  chip: string;
  dot: string;
};

type BoardColumnDef = {
  value: TaskBoardStatus;
  label: string;
  description: string;
};

const FILTER_OPTIONS: { value: TaskFilter; label: string }[] = [
  { value: 'all', label: 'Todas' },
  { value: 'overdue', label: 'Vencidas' },
  { value: 'urgent', label: 'Urgentes' },
  { value: 'completed', label: 'Completadas' },
];

const SORT_OPTIONS: { value: SortMode; label: string }[] = [
  { value: 'priority', label: 'Prioridad alta' },
  { value: 'due', label: 'Fecha mas cercana' },
  { value: 'recent', label: 'Mas recientes' },
];

const VIEW_OPTIONS: Array<{ value: TaskViewMode; label: string; icon: typeof KanbanSquare }> = [
  { value: 'board', label: 'Board', icon: KanbanSquare },
  { value: 'list', label: 'Lista', icon: List },
  { value: 'table', label: 'Tabla', icon: Table2 },
];

const BOARD_COLUMNS: BoardColumnDef[] = [
  { value: 'pending', label: 'Pendientes', description: 'Lo siguiente que conviene activar.' },
  { value: 'in_progress', label: 'En progreso', description: 'Trabajo abierto y en ejecucion.' },
  { value: 'in_review', label: 'En revision', description: 'Pendientes de validar o cerrar.' },
  { value: 'blocked', label: 'Bloqueadas', description: 'Requieren desbloqueo o decision.' },
  { value: 'completed', label: 'Completadas', description: 'Trabajo ya resuelto.' },
];

function priorityTone(priority: TaskPriority): Tone {
  switch (priority) {
    case 'urgent':
      return { chip: 'border-red-500/20 bg-red-500/12 text-red-300', dot: 'bg-red-400' };
    case 'high':
      return { chip: 'border-orange-500/20 bg-orange-500/12 text-orange-300', dot: 'bg-orange-400' };
    case 'medium':
      return { chip: 'border-sky-500/20 bg-sky-500/12 text-sky-300', dot: 'bg-sky-400' };
    default:
      return { chip: 'border-zinc-500/20 bg-zinc-500/12 text-zinc-300', dot: 'bg-zinc-400' };
  }
}

function statusTone(status: TaskBoardStatus): Tone {
  switch (status) {
    case 'pending':
      return { chip: 'border-zinc-500/20 bg-zinc-500/12 text-zinc-300', dot: 'bg-zinc-400' };
    case 'in_progress':
      return { chip: 'border-amber-500/20 bg-amber-500/12 text-amber-300', dot: 'bg-amber-400' };
    case 'in_review':
      return { chip: 'border-blue-500/20 bg-blue-500/12 text-blue-300', dot: 'bg-blue-400' };
    case 'blocked':
      return { chip: 'border-rose-500/20 bg-rose-500/12 text-rose-300', dot: 'bg-rose-400' };
    case 'completed':
      return { chip: 'border-emerald-500/20 bg-emerald-500/12 text-emerald-300', dot: 'bg-emerald-400' };
  }
}

function categoryTone(category: TaskCategory): Tone {
  switch (category) {
    case 'prompt':
      return { chip: 'border-violet-500/20 bg-violet-500/12 text-violet-300', dot: 'bg-violet-400' };
    case 'image_gen':
      return { chip: 'border-pink-500/20 bg-pink-500/12 text-pink-300', dot: 'bg-pink-400' };
    case 'video_gen':
      return { chip: 'border-cyan-500/20 bg-cyan-500/12 text-cyan-300', dot: 'bg-cyan-400' };
    case 'review':
      return { chip: 'border-blue-500/20 bg-blue-500/12 text-blue-300', dot: 'bg-blue-400' };
    case 'export':
      return { chip: 'border-emerald-500/20 bg-emerald-500/12 text-emerald-300', dot: 'bg-emerald-400' };
    case 'editing':
      return { chip: 'border-indigo-500/20 bg-indigo-500/12 text-indigo-300', dot: 'bg-indigo-400' };
    case 'issue':
      return { chip: 'border-red-500/20 bg-red-500/12 text-red-300', dot: 'bg-red-400' };
    case 'annotation':
      return { chip: 'border-teal-500/20 bg-teal-500/12 text-teal-300', dot: 'bg-teal-400' };
    case 'meeting':
      return { chip: 'border-orange-500/20 bg-orange-500/12 text-orange-300', dot: 'bg-orange-400' };
    case 'voiceover':
      return { chip: 'border-rose-500/20 bg-rose-500/12 text-rose-300', dot: 'bg-rose-400' };
    case 'script':
      return { chip: 'border-sky-500/20 bg-sky-500/12 text-sky-300', dot: 'bg-sky-400' };
    default:
      return { chip: 'border-zinc-500/20 bg-zinc-500/12 text-zinc-300', dot: 'bg-zinc-400' };
  }
}

function categoryLabel(category: TaskCategory) {
  const labels: Record<TaskCategory, string> = {
    script: 'Guion',
    prompt: 'Prompt',
    image_gen: 'Imagen',
    video_gen: 'Video',
    review: 'Revision',
    export: 'Exportacion',
    meeting: 'Reunion',
    voiceover: 'Locucion',
    editing: 'Edicion',
    issue: 'Incidencia',
    annotation: 'Anotacion',
    other: 'Otro',
  };
  return labels[category] ?? category;
}

function statusLabel(status: TaskBoardStatus) {
  switch (status) {
    case 'pending':
      return 'Pendiente';
    case 'in_progress':
      return 'En progreso';
    case 'in_review':
      return 'En revision';
    case 'blocked':
      return 'Bloqueada';
    case 'completed':
      return 'Completada';
  }
}

function statusActionLabel(status: TaskBoardStatus) {
  switch (status) {
    case 'pending':
      return 'Empezar';
    case 'in_progress':
      return 'Enviar a revision';
    case 'in_review':
      return 'Completar';
    case 'blocked':
      return 'Desbloquear';
    case 'completed':
      return 'Reabrir';
  }
}

function statusActionTarget(status: TaskBoardStatus): TaskBoardStatus {
  switch (status) {
    case 'pending':
      return 'in_progress';
    case 'in_progress':
      return 'in_review';
    case 'in_review':
      return 'completed';
    case 'blocked':
      return 'pending';
    case 'completed':
      return 'pending';
  }
}

function priorityWeight(priority: TaskPriority) {
  switch (priority) {
    case 'urgent':
      return 4;
    case 'high':
      return 3;
    case 'medium':
      return 2;
    default:
      return 1;
  }
}

function isOverdue(task: DashboardTask) {
  if (!task.due_date || task.status === 'completed') return false;
  return new Date(task.due_date).getTime() < Date.now();
}

function formatDueLabel(task: DashboardTask) {
  if (!task.due_date) return 'Sin fecha';

  const dueAt = new Date(task.due_date);
  if (Number.isNaN(dueAt.getTime())) return 'Sin fecha';

  const today = new Date();
  today.setHours(0, 0, 0, 0);
  const dueDay = new Date(dueAt);
  dueDay.setHours(0, 0, 0, 0);

  const diffDays = Math.round((dueDay.getTime() - today.getTime()) / 86_400_000);
  if (diffDays === 0) return 'Hoy';
  if (diffDays === 1) return 'Manana';
  if (diffDays === -1) return 'Ayer';
  if (diffDays < 0) return `Hace ${Math.abs(diffDays)} dias`;
  if (diffDays <= 7) return `En ${diffDays} dias`;

  return dueAt.toLocaleDateString('es-ES', { day: 'numeric', month: 'short' });
}

function createdAtTimestamp(task: DashboardTask) {
  return new Date(task.created_at ?? 0).getTime();
}

function dueTimestamp(task: DashboardTask) {
  if (!task.due_date) return null;

  const timestamp = new Date(task.due_date).getTime();
  return Number.isNaN(timestamp) ? null : timestamp;
}

function compareTasks(left: DashboardTask, right: DashboardTask, sortMode: SortMode) {
  const leftCreated = createdAtTimestamp(left);
  const rightCreated = createdAtTimestamp(right);
  const leftDue = dueTimestamp(left);
  const rightDue = dueTimestamp(right);
  const leftPriority = priorityWeight(left.priority);
  const rightPriority = priorityWeight(right.priority);

  if (sortMode === 'priority') {
    const priorityDiff = rightPriority - leftPriority;
    if (priorityDiff !== 0) return priorityDiff;

    const overdueDiff = Number(isOverdue(right)) - Number(isOverdue(left));
    if (overdueDiff !== 0) return overdueDiff;

    if (leftDue !== null || rightDue !== null) {
      if (leftDue === null) return 1;
      if (rightDue === null) return -1;
      if (leftDue !== rightDue) return leftDue - rightDue;
    }

    return rightCreated - leftCreated;
  }

  if (sortMode === 'due') {
    if (leftDue !== null || rightDue !== null) {
      if (leftDue === null) return 1;
      if (rightDue === null) return -1;
      if (leftDue !== rightDue) return leftDue - rightDue;
    }

    const priorityDiff = rightPriority - leftPriority;
    if (priorityDiff !== 0) return priorityDiff;

    return rightCreated - leftCreated;
  }

  const recentDiff = rightCreated - leftCreated;
  if (recentDiff !== 0) return recentDiff;

  const priorityDiff = rightPriority - leftPriority;
  if (priorityDiff !== 0) return priorityDiff;

  if (leftDue !== null || rightDue !== null) {
    if (leftDue === null) return 1;
    if (rightDue === null) return -1;
    if (leftDue !== rightDue) return leftDue - rightDue;
  }

  return 0;
}

function chipClassName(tone: Tone) {
  return cn('inline-flex items-center gap-1 rounded-full border px-2 py-0.5 text-[9px] font-medium', tone.chip);
}

type FilterOption<T extends string> = {
  value: T;
  label: string;
};

const filterControlClassName = 'flex h-12 w-full items-center gap-3 rounded-2xl border border-border bg-background/80 px-3 text-sm text-foreground shadow-sm transition-colors hover:border-primary/20';

function FilterSelect<T extends string>({
  value,
  options,
  onChange,
  icon,
  ariaLabel,
  disabled = false,
}: {
  value: T;
  options: Array<FilterOption<T>>;
  onChange: (value: T) => void;
  icon: ReactNode;
  ariaLabel: string;
  disabled?: boolean;
}) {
  const selected = options.find((option) => option.value === value) ?? options[0];

  return (
    <Popover>
      <Popover.Trigger>
        <button
          type="button"
          aria-label={ariaLabel}
          disabled={disabled}
          className={cn(filterControlClassName, 'justify-between disabled:cursor-not-allowed disabled:opacity-50')}
        >
          <span className="flex min-w-0 items-center gap-3">
            <span className="flex h-7 w-7 shrink-0 items-center justify-center rounded-xl border border-border bg-background text-muted-foreground">
              {icon}
            </span>
            <span className="truncate text-left text-sm font-medium text-foreground">{selected?.label}</span>
          </span>
          <ChevronDown className="h-4 w-4 shrink-0 text-muted-foreground" />
        </button>
      </Popover.Trigger>
      <Popover.Content placement="bottom start" className="w-(--trigger-width) min-w-56 rounded-2xl border border-border bg-popover p-1 shadow-xl">
        <div className="space-y-1">
          {options.map((option) => (
            <button
              key={option.value}
              type="button"
              onClick={() => onChange(option.value)}
              className={cn(
                'flex w-full items-center rounded-xl px-3 py-2.5 text-left text-sm transition-colors',
                option.value === value ? 'bg-accent text-foreground' : 'text-muted-foreground hover:bg-accent hover:text-foreground',
              )}
            >
              {option.label}
            </button>
          ))}
        </div>
      </Popover.Content>
    </Popover>
  );
}

function StatusChip({ status }: { status: TaskBoardStatus }) {
  const tone = statusTone(status);
  return (
    <span className={chipClassName(tone)}>
      <span className={cn('h-1.5 w-1.5 rounded-full', tone.dot)} />
      {statusLabel(status).toLowerCase()}
    </span>
  );
}

function PriorityChip({ priority }: { priority: TaskPriority }) {
  const tone = priorityTone(priority);
  return (
    <span className={chipClassName(tone)}>
      <span className={cn('h-1.5 w-1.5 rounded-full', tone.dot)} />
      {priority.toLowerCase()}
    </span>
  );
}

function CategoryChip({ category }: { category: TaskCategory }) {
  const tone = categoryTone(category);
  return (
    <span className={chipClassName(tone)}>
      <span className={cn('h-1.5 w-1.5 rounded-full', tone.dot)} />
      {categoryLabel(category).toLowerCase()}
    </span>
  );
}

interface TaskCardProps {
  task: DashboardTask;
  projectName: string;
  videoName: string | null;
  pending: boolean;
  compact?: boolean;
  dragging?: boolean;
  showStatusChip?: boolean;
  onOpen: (taskId: string) => void;
  onAdvance: (task: DashboardTask) => void;
  onMove: (task: DashboardTask, status: TaskBoardStatus) => void;
}

function TaskActionsMenu({ task, pending, onAdvance, onMove }: { task: DashboardTask; pending: boolean; onAdvance: (task: DashboardTask) => void; onMove: (task: DashboardTask, status: TaskBoardStatus) => void }) {
  const status = task.status as TaskBoardStatus;

  return (
    <Popover>
      <Popover.Trigger>
        <button
          type="button"
          aria-label="Acciones de tarea"
          data-task-actions-trigger="true"
          className="inline-flex h-8 w-8 items-center justify-center rounded-lg border border-border bg-background text-muted-foreground transition-colors hover:bg-accent hover:text-foreground"
        >
          <MoreHorizontal className="h-4 w-4" />
        </button>
      </Popover.Trigger>
      <Popover.Content
        data-task-actions-menu="true"
        className="w-56 overflow-hidden rounded-xl border border-border bg-popover p-1 shadow-xl"
      >
        <div className="space-y-1">
          <Link
            href={`/dashboard/tasks/${task.id}`}
            className="flex items-center rounded-lg px-3 py-2 text-sm text-foreground transition-colors hover:bg-accent"
          >
            <Eye className="mr-2 h-4 w-4 text-muted-foreground" />
            Abrir
          </Link>
          <button
            type="button"
            onClick={() => onAdvance(task)}
            disabled={pending}
            className="flex w-full items-center rounded-lg px-3 py-2 text-sm text-foreground transition-colors hover:bg-accent disabled:opacity-50"
          >
            {pending ? <Loader2 className="mr-2 h-4 w-4 animate-spin text-muted-foreground" /> : <Sparkles className="mr-2 h-4 w-4 text-muted-foreground" />}
            {statusActionLabel(status)}
          </button>
          <div className="border-t border-border px-3 pt-2 pb-1 text-[11px] font-medium uppercase tracking-[0.14em] text-muted-foreground">
            Cambiar estado
          </div>
          {BOARD_COLUMNS.filter((column) => column.value !== status).map((column) => (
            <button
              key={column.value}
              type="button"
              onClick={() => onMove(task, column.value)}
              disabled={pending}
              className="flex w-full items-center rounded-lg px-3 py-2 text-sm text-foreground transition-colors hover:bg-accent disabled:opacity-50"
            >
              <span className={cn('mr-2 h-2 w-2 rounded-full', statusTone(column.value).dot)} />
              {column.label}
            </button>
          ))}
        </div>
      </Popover.Content>
    </Popover>
  );
}

function TaskCard({ task, projectName, videoName, pending, compact = false, dragging = false, showStatusChip = true, onOpen, onAdvance, onMove }: TaskCardProps) {
  const status = task.status as TaskBoardStatus;

  return (
    <article
      onClick={(event) => {
        const target = event.target as HTMLElement;
        if (target.closest('[data-task-actions-trigger="true"]') || target.closest('[data-task-actions-menu="true"]')) {
          return;
        }
        onOpen(task.id);
      }}
      className={cn(
        'cursor-pointer rounded-2xl border border-border bg-card p-4 shadow-sm transition-colors hover:border-primary/20 hover:bg-accent-soft-hover',
        dragging ? 'rotate-1 border-primary/40 shadow-xl' : '',
      )}
    >
      <div className="flex items-start justify-between gap-3">
        <div className="min-w-0">
          <h3 className="truncate text-sm font-semibold text-foreground">{task.title}</h3>
          <p className="mt-1 text-xs text-muted-foreground">{projectName}</p>
        </div>
        <div className="flex items-center gap-2">
          {isOverdue(task) ? <span className="rounded-full bg-red-500/12 px-2 py-1 text-[10px] font-semibold uppercase tracking-[0.14em] text-red-300">Vencida</span> : null}
          <TaskActionsMenu task={task} pending={pending} onAdvance={onAdvance} onMove={onMove} />
        </div>
      </div>

      {task.description ? (
        <p className={cn('mt-3 text-sm leading-6 text-muted-foreground', compact ? 'line-clamp-2' : 'line-clamp-4')}>
          {task.description}
        </p>
      ) : null}

      <div className="mt-3 flex flex-wrap gap-2">
        <PriorityChip priority={task.priority} />
        {showStatusChip ? <StatusChip status={status} /> : null}
        <CategoryChip category={task.category} />
      </div>

      <div className="mt-3 flex flex-wrap gap-2 text-xs text-muted-foreground">
        <span className="inline-flex items-center gap-1 rounded-full border border-border bg-background px-2 py-1">
          <CalendarClock className="h-3.5 w-3.5" />
          {formatDueLabel(task)}
        </span>
        {videoName ? (
          <span className="inline-flex items-center gap-1 rounded-full border border-border bg-background px-2 py-1">
            <Video className="h-3.5 w-3.5" />
            {videoName}
          </span>
        ) : null}
      </div>
    </article>
  );
}

interface DraggableTaskCardProps extends TaskCardProps {
  id: string;
}

function DraggableTaskCard({ id, ...props }: DraggableTaskCardProps) {
  const { attributes, listeners, setNodeRef, transform, isDragging } = useDraggable({
    id,
    data: { taskId: props.task.id },
  });

  return (
    <div
      ref={setNodeRef}
      style={{ transform: CSS.Translate.toString(transform) }}
      className={cn(isDragging ? 'opacity-40' : '')}
      {...listeners}
      {...attributes}
    >
      <TaskCard {...props} dragging={isDragging} />
    </div>
  );
}

function DroppableColumn({ column, count, children }: { column: BoardColumnDef; count: number; children: ReactNode }) {
  const { isOver, setNodeRef } = useDroppable({ id: `column:${column.value}`, data: { status: column.value } });

  return (
    <div className="w-85 shrink-0 rounded-2xl border border-border bg-background/60 p-3">
      <div className="flex items-start justify-between gap-3 border-b border-border px-1 pb-3">
        <div>
          <h3 className="text-sm font-semibold text-foreground">{column.label}</h3>
          <p className="mt-1 text-xs leading-5 text-muted-foreground">{column.description}</p>
        </div>
        <span className="rounded-full bg-card px-2 py-1 text-[10px] font-semibold uppercase tracking-[0.14em] text-muted-foreground">
          {count}
        </span>
      </div>

      <div ref={setNodeRef} className={cn('mt-3 min-h-24 space-y-3 rounded-2xl p-1 transition-colors', isOver ? 'bg-primary/5' : '')}>
        {children}
      </div>
    </div>
  );
}

interface DashboardTasksViewProps {
  lockedProjectId?: string;
  lockedProjectName?: string;
}

export function DashboardTasksView({ lockedProjectId, lockedProjectName }: DashboardTasksViewProps = {}) {
  const router = useRouter();
  const { user } = useDashboard();
  const openTaskCreatePanel = useUIStore((state) => state.openTaskCreatePanel);
  const [search, setSearch] = useState('');
  const [filter, setFilter] = useState<TaskFilter>('all');
  const [projectFilter, setProjectFilter] = useState(lockedProjectId ?? 'all');
  const [videoFilter, setVideoFilter] = useState('all');
  const [sortMode, setSortMode] = useState<SortMode>('priority');
  const [viewMode, setViewMode] = useState<TaskViewMode>('board');
  const [activeTaskId, setActiveTaskId] = useState<string | null>(null);
  const { projects, videos, tasks, projectsQuery, tasksQuery, updateTaskStatus, videosQuery } = useDashboardTasks(user.id);

  const sensors = useSensors(
    useSensor(PointerSensor, {
      activationConstraint: { distance: 8 },
    }),
  );

  const projectsById = useMemo(() => new Map(projects.map((project) => [project.id, project])), [projects]);
  const videosById = useMemo(() => new Map(videos.map((video) => [video.id, video])), [videos]);
  const tasksById = useMemo(() => new Map(tasks.map((task) => [task.id, task])), [tasks]);
  const effectiveProjectFilter = lockedProjectId ?? projectFilter;
  const scopedTasks = useMemo(
    () => (lockedProjectId ? tasks.filter((task) => task.project_id === lockedProjectId) : tasks),
    [lockedProjectId, tasks],
  );

  const videoFilterOptions = useMemo(() => {
    if (effectiveProjectFilter === 'all') return videos;
    return videos.filter((video) => video.project_id === effectiveProjectFilter);
  }, [effectiveProjectFilter, videos]);

  const projectOptions = useMemo(
    () => [{ value: 'all', label: 'Todos los proyectos' }, ...projects.map((project) => ({ value: project.id, label: project.title }))],
    [projects],
  );

  const videoOptions = useMemo(
    () => [{ value: 'all', label: 'Todos los videos' }, ...videoFilterOptions.map((video) => ({ value: video.id, label: video.title }))],
    [videoFilterOptions],
  );

  const filteredTasks = useMemo(() => {
    const normalizedSearch = search.trim().toLowerCase();

    return [...scopedTasks]
      .filter((task) => {
        const projectName = projectsById.get(task.project_id)?.title ?? '';
        const videoName = task.video_id ? videosById.get(task.video_id)?.title ?? '' : '';
        const matchesSearch = normalizedSearch.length === 0
          || task.title.toLowerCase().includes(normalizedSearch)
          || task.description?.toLowerCase().includes(normalizedSearch)
          || projectName.toLowerCase().includes(normalizedSearch)
          || videoName.toLowerCase().includes(normalizedSearch);

        if (!matchesSearch) return false;
    if (effectiveProjectFilter !== 'all' && task.project_id !== effectiveProjectFilter) return false;
        if (videoFilter !== 'all' && task.video_id !== videoFilter) return false;
        if (filter === 'urgent') return task.priority === 'urgent';
        if (filter === 'overdue') return isOverdue(task);
        if (filter === 'completed') return task.status === 'completed';
        return true;
      })
      .sort((left, right) => compareTasks(left, right, sortMode));
  }, [effectiveProjectFilter, filter, projectsById, scopedTasks, search, sortMode, videoFilter, videosById]);

  const boardColumns = useMemo(
    () => BOARD_COLUMNS.map((column) => ({ ...column, tasks: filteredTasks.filter((task) => task.status === column.value) })),
    [filteredTasks],
  );

  const overdueCount = useMemo(() => scopedTasks.filter((task) => isOverdue(task)).length, [scopedTasks]);
  const urgentCount = useMemo(() => scopedTasks.filter((task) => task.priority === 'urgent' && task.status !== 'completed').length, [scopedTasks]);
  const completedCount = useMemo(() => scopedTasks.filter((task) => task.status === 'completed').length, [scopedTasks]);
  const activeCount = scopedTasks.length - completedCount;
  const loading = projectsQuery.isLoading || tasksQuery.isLoading || videosQuery.isLoading;
  const activeTask = activeTaskId ? tasksById.get(activeTaskId) ?? null : null;
  const tasksLabel = lockedProjectName ? `Tareas de ${lockedProjectName}` : 'Operacion de tareas';
  const tasksDescription = lockedProjectName
    ? 'Mismo sistema operativo del board principal, filtrado al proyecto actual.'
    : 'Gestiona el trabajo con vista kanban arrastrable, lista operativa o tabla compacta segun el momento.';
  const badgeLabel = lockedProjectName ? 'Proyecto' : 'Tasks';

  function moveTask(task: DashboardTask, status: TaskBoardStatus) {
    if (task.status === status) return;
    updateTaskStatus.mutate({ taskId: task.id, projectId: task.project_id, status });
  }

  function advanceTask(task: DashboardTask) {
    moveTask(task, statusActionTarget(task.status as TaskBoardStatus));
  }

  function openTask(taskId: string) {
    router.push(`/dashboard/tasks/${taskId}`);
  }

  function handleDragStart(event: DragStartEvent) {
    const taskId = String(event.active.data.current?.taskId ?? '').trim();
    setActiveTaskId(taskId || null);
  }

  function handleDragEnd(event: DragEndEvent) {
    const taskId = String(event.active.data.current?.taskId ?? '').trim();
    const overStatus = String(event.over?.data.current?.status ?? '').trim() as TaskBoardStatus | '';
    setActiveTaskId(null);

    if (!taskId || !overStatus) return;
    const task = tasksById.get(taskId);
    if (!task) return;
    moveTask(task, overStatus);
  }

  function renderTaskCard(task: DashboardTask, compact = false) {
    const projectName = projectsById.get(task.project_id)?.title ?? 'Proyecto';
    const videoName = task.video_id ? videosById.get(task.video_id)?.title ?? null : null;
    const pending = updateTaskStatus.isPending && updateTaskStatus.variables?.taskId === task.id;

    return (
      <TaskCard
        task={task}
        projectName={projectName}
        videoName={videoName}
        pending={pending}
        compact={compact}
        showStatusChip={viewMode !== 'board'}
        onOpen={openTask}
        onAdvance={advanceTask}
        onMove={moveTask}
      />
    );
  }

  return (
    <div className="space-y-6 px-3 py-4 lg:px-5">
      <section className="overflow-hidden rounded-[28px] border border-border bg-[radial-gradient(circle_at_top_left,rgba(245,165,36,0.14),transparent_36%),linear-gradient(180deg,rgba(255,255,255,0.02),rgba(255,255,255,0))] p-6 shadow-sm">
        <div className="flex flex-col gap-5 lg:flex-row lg:items-end lg:justify-between">
          <div className="max-w-2xl">
            <div className="inline-flex items-center gap-2 rounded-full border border-border bg-background/70 px-3 py-1 text-xs font-medium text-muted-foreground">
              <ListTodo className="size-3.5 text-primary" />
              {badgeLabel}
            </div>
            <h1 className="mt-4 text-3xl font-semibold tracking-tight text-foreground lg:text-4xl">{tasksLabel}</h1>
            <p className="mt-3 max-w-xl text-sm leading-6 text-muted-foreground lg:text-base">
              {tasksDescription}
            </p>
            <div className="mt-5 flex flex-wrap items-center gap-3">
              <button type="button" onClick={() => openTaskCreatePanel(lockedProjectId ? { projectId: lockedProjectId, source: 'project-tasks' } : { source: 'dashboard-tasks' })} className="inline-flex h-11 items-center justify-center rounded-xl bg-primary px-5 text-sm font-semibold text-primary-foreground transition-opacity hover:opacity-90">
                <Plus className="mr-2 h-4 w-4" />
                Crear tarea
              </button>
            </div>
          </div>

          <div className="grid grid-cols-2 gap-3 sm:grid-cols-4">
            <div className="rounded-2xl border border-border bg-background/85 px-4 py-3">
              <p className="text-[11px] uppercase tracking-[0.16em] text-muted-foreground">Activas</p>
              <p className="mt-1 text-2xl font-semibold text-foreground">{activeCount}</p>
            </div>
            <div className="rounded-2xl border border-border bg-background/85 px-4 py-3">
              <p className="text-[11px] uppercase tracking-[0.16em] text-muted-foreground">Urgentes</p>
              <p className="mt-1 text-2xl font-semibold text-foreground">{urgentCount}</p>
            </div>
            <div className="rounded-2xl border border-border bg-background/85 px-4 py-3">
              <p className="text-[11px] uppercase tracking-[0.16em] text-muted-foreground">Vencidas</p>
              <p className="mt-1 text-2xl font-semibold text-foreground">{overdueCount}</p>
            </div>
            <div className="rounded-2xl border border-border bg-background/85 px-4 py-3">
              <p className="text-[11px] uppercase tracking-[0.16em] text-muted-foreground">Completadas</p>
              <p className="mt-1 text-2xl font-semibold text-foreground">{completedCount}</p>
            </div>
          </div>
        </div>
      </section>

      <section>
        <div className="rounded-2xl border border-border bg-card p-4 shadow-sm">
          <div className="flex flex-col gap-4 lg:flex-row lg:items-start lg:justify-between">
            <div>
              <h2 className="text-lg font-semibold text-foreground">Cola operativa</h2>
              <p className="mt-1 text-sm text-muted-foreground">Filtra por riesgo, proyecto o video, cambia de vista y arrastra tareas entre columnas cuando uses board.</p>
            </div>

            <div className="flex flex-wrap gap-2 rounded-2xl border border-border bg-background p-1">
              {VIEW_OPTIONS.map((option) => {
                const Icon = option.icon;
                return (
                  <button
                    key={option.value}
                    type="button"
                    onClick={() => setViewMode(option.value)}
                    className={cn(
                      'inline-flex h-10 items-center gap-2 rounded-xl px-4 text-sm font-medium transition-colors',
                      viewMode === option.value
                        ? 'bg-primary text-primary-foreground shadow-sm'
                        : 'text-muted-foreground hover:bg-accent hover:text-foreground',
                    )}
                  >
                    <Icon className="h-4 w-4" />
                    {option.label}
                  </button>
                );
              })}
            </div>
          </div>

          <div className={cn('mt-4 grid gap-3', viewMode === 'board' ? 'md:grid-cols-2 xl:grid-cols-4' : 'md:grid-cols-2 xl:grid-cols-5')}>
            <div className="xl:col-span-1">
              <label className="flex h-12 w-full items-center gap-3 rounded-2xl border border-border bg-background/80 px-3 text-sm text-foreground shadow-sm transition-colors hover:border-primary/20 focus-within:border-primary/30 focus-within:ring-2 focus-within:ring-primary/10">
                <span className="flex h-7 w-7 shrink-0 items-center justify-center rounded-xl border border-border bg-background text-muted-foreground">
                  <Search className="size-4" />
                </span>
                <input
                  type="text"
                  value={search}
                  onChange={(event) => setSearch(event.target.value)}
                  placeholder="Buscar por tarea, proyecto o video..."
                  className="h-full w-full bg-transparent text-sm text-foreground outline-none placeholder:text-muted-foreground"
                />
              </label>
            </div>

            {!lockedProjectId ? (
              <FilterSelect
                value={projectFilter}
                options={projectOptions}
                ariaLabel="Proyecto"
                icon={<FolderOpen className="h-4 w-4" />}
                onChange={(value) => {
                  setProjectFilter(value);
                  setVideoFilter('all');
                }}
              />
            ) : null}

            <FilterSelect value={videoFilter} options={videoOptions} ariaLabel="Video" icon={<Video className="h-4 w-4" />} onChange={setVideoFilter} disabled={videoOptions.length <= 1} />

            <FilterSelect value={sortMode} options={SORT_OPTIONS} ariaLabel="Orden" icon={<ArrowUpDown className="h-4 w-4" />} onChange={setSortMode} />

            {viewMode !== 'board' ? (
              <FilterSelect value={filter} options={FILTER_OPTIONS} ariaLabel="Filtro de estado" icon={<CheckSquare className="h-4 w-4" />} onChange={setFilter} />
            ) : null}
          </div>

          {viewMode === 'board' ? (
            <div className="mt-4 flex items-center gap-2 rounded-2xl border border-border bg-background/70 px-3 py-2.5 text-xs text-muted-foreground">
              <KanbanSquare className="h-3.5 w-3.5 text-primary" />
              Arrastra tarjetas entre columnas para cambiar su estado.
            </div>
          ) : null}

          <div className="mt-5 space-y-3">
            {loading ? (
              Array.from({ length: 6 }).map((_, index) => (
                <div key={index} className="h-28 animate-pulse rounded-2xl border border-border bg-background/70" />
              ))
            ) : projectsQuery.error || tasksQuery.error ? (
              <div className="rounded-2xl border border-danger/30 bg-danger/5 p-5 text-sm text-danger-foreground">
                No se pudieron cargar las tareas del workspace.
              </div>
            ) : filteredTasks.length === 0 ? (
              <div className="flex flex-col items-center justify-center rounded-2xl border border-dashed border-border py-16 text-center">
                <CheckSquare className="mb-3 h-10 w-10 text-muted-foreground/30" />
                <h3 className="text-lg font-medium text-foreground">No hay tareas en esta vista</h3>
                <p className="mt-2 max-w-md text-sm leading-6 text-muted-foreground">
                  Ajusta los filtros o crea una tarea nueva para empezar a organizar el trabajo.
                </p>
                <button type="button" onClick={() => openTaskCreatePanel(lockedProjectId ? { projectId: lockedProjectId, source: 'project-tasks' } : { source: 'dashboard-tasks' })} className="mt-5 inline-flex h-11 items-center justify-center rounded-xl bg-primary px-5 text-sm font-semibold text-primary-foreground transition-opacity hover:opacity-90">
                  <Plus className="mr-2 h-4 w-4" />
                  Crear tarea
                </button>
              </div>
            ) : viewMode === 'board' ? (
              <DndContext sensors={sensors} onDragStart={handleDragStart} onDragEnd={handleDragEnd} onDragCancel={() => setActiveTaskId(null)}>
                <div className="overflow-x-auto pb-2">
                  <div className="flex min-w-max gap-4">
                    {boardColumns.map((column) => (
                      <DroppableColumn key={column.value} column={column} count={column.tasks.length}>
                        {column.tasks.length === 0 ? (
                          <div className="rounded-2xl border border-dashed border-border bg-card/50 px-4 py-6 text-center text-xs leading-5 text-muted-foreground">
                            Suelta aqui una tarea.
                          </div>
                        ) : column.tasks.map((task) => {
                          const projectName = projectsById.get(task.project_id)?.title ?? 'Proyecto';
                          const videoName = task.video_id ? videosById.get(task.video_id)?.title ?? null : null;
                          const pending = updateTaskStatus.isPending && updateTaskStatus.variables?.taskId === task.id;
                          return (
                            <DraggableTaskCard
                              key={task.id}
                              id={`task:${task.id}`}
                              task={task}
                              projectName={projectName}
                              videoName={videoName}
                              pending={pending}
                              onOpen={openTask}
                              onAdvance={advanceTask}
                              onMove={moveTask}
                            />
                          );
                        })}
                      </DroppableColumn>
                    ))}
                  </div>
                </div>
                <DragOverlay>
                  {activeTask ? renderTaskCard(activeTask) : null}
                </DragOverlay>
              </DndContext>
            ) : viewMode === 'list' ? (
              <div className="space-y-3">
                {filteredTasks.map((task) => (
                  <div key={task.id}>{renderTaskCard(task, true)}</div>
                ))}
              </div>
            ) : (
              <div className="overflow-x-auto rounded-2xl border border-border">
                <table className="min-w-full divide-y divide-border bg-card text-sm">
                  <thead className="bg-background/80">
                    <tr>
                      <th className="px-4 py-3 text-left font-medium text-muted-foreground">Tarea</th>
                      <th className="px-4 py-3 text-left font-medium text-muted-foreground">Proyecto</th>
                      <th className="px-4 py-3 text-left font-medium text-muted-foreground">Video</th>
                      <th className="px-4 py-3 text-left font-medium text-muted-foreground">Prioridad</th>
                      <th className="px-4 py-3 text-left font-medium text-muted-foreground">Estado</th>
                      <th className="px-4 py-3 text-left font-medium text-muted-foreground">Categoria</th>
                      <th className="px-4 py-3 text-left font-medium text-muted-foreground">Fecha</th>
                      <th className="px-4 py-3 text-right font-medium text-muted-foreground">Acciones</th>
                    </tr>
                  </thead>
                  <tbody className="divide-y divide-border">
                    {filteredTasks.map((task) => {
                      const projectName = projectsById.get(task.project_id)?.title ?? 'Proyecto';
                      const videoName = task.video_id ? videosById.get(task.video_id)?.title ?? 'Sin video' : 'Sin video';
                      const pending = updateTaskStatus.isPending && updateTaskStatus.variables?.taskId === task.id;
                      return (
                        <tr key={task.id} className="hover:bg-accent-soft-hover">
                          <td className="px-4 py-3 align-top">
                            <div>
                              <p className="font-medium text-foreground">{task.title}</p>
                              {task.description ? <p className="mt-1 line-clamp-2 text-xs leading-5 text-muted-foreground">{task.description}</p> : null}
                            </div>
                          </td>
                          <td className="px-4 py-3 align-top text-muted-foreground">{projectName}</td>
                          <td className="px-4 py-3 align-top text-muted-foreground">{videoName}</td>
                          <td className="px-4 py-3 align-top"><PriorityChip priority={task.priority} /></td>
                          <td className="px-4 py-3 align-top"><StatusChip status={task.status as TaskBoardStatus} /></td>
                          <td className="px-4 py-3 align-top"><CategoryChip category={task.category} /></td>
                          <td className="px-4 py-3 align-top text-muted-foreground">{formatDueLabel(task)}</td>
                          <td className="px-4 py-3 align-top">
                            <div className="flex justify-end">
                              <TaskActionsMenu task={task} pending={pending} onAdvance={advanceTask} onMove={moveTask} />
                            </div>
                          </td>
                        </tr>
                      );
                    })}
                  </tbody>
                </table>
              </div>
            )}
          </div>
        </div>
      </section>
    </div>
  );
}
