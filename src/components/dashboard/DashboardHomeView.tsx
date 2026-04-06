'use client';

import Link from 'next/link';
import { useMemo, useState } from 'react';
import { useQuery } from '@tanstack/react-query';
import { formatDistanceToNow } from 'date-fns/formatDistanceToNow';
import { es } from 'date-fns/locale/es';
import {
  Activity,
  AlertTriangle,
  ArrowDownWideNarrow,
  CheckSquare,
  Clock,
  FolderOpen,
  Plus,
  Search,
  Sparkles,
  Star,
  TrendingUp,
  Zap,
} from 'lucide-react';
import type { ActivityLog, Project } from '@/types';
import { useDashboard } from '@/providers/DashboardBootstrap';
import { useDashboardOverview } from '@/hooks/useDashboardOverview';
import { useDebounce } from '@/hooks/useDebounce';
import { useFavorites } from '@/hooks/useFavorites';
import { createClient } from '@/lib/supabase/client';
import { ProjectGrid } from '@/components/project/ProjectGrid';
import { Button } from '@heroui/react';
import { cn } from '@/lib/utils/cn';
import { AiAssistBar, type AiAssistAction } from '@/components/ai/AiAssistBar';
import { AiResultDrawer, type AiResultPayload } from '@/components/ai/AiResultDrawer';
import { queryKeys } from '@/lib/query/keys';
import { fetchWorkspaceProjects } from '@/lib/queries/projects';
import { useUIStore } from '@/stores/useUIStore';

type StatusFilter = 'all' | 'in_progress' | 'completed' | 'archived' | 'favorites';
type SortOption = 'recent' | 'name_asc';

const SORT_OPTIONS: { label: string; value: SortOption }[] = [
  { label: 'Recientes', value: 'recent' },
  { label: 'Nombre A-Z', value: 'name_asc' },
];

const AI_ACTIONS: AiAssistAction[] = [
  {
    id: 'overview',
    label: 'Resumen operativo',
    description: 'Resume el estado del workspace, capacidad activa y señales del mes.',
    icon: Sparkles,
  },
  {
    id: 'unblock',
    label: 'Detectar bloqueos',
    description: 'Detecta cuellos de botella en tareas, escenas y actividad reciente.',
    icon: AlertTriangle,
  },
  {
    id: 'prioritize',
    label: 'Priorizar siguiente paso',
    description: 'Propone las siguientes acciones con mayor retorno para avanzar el trabajo.',
    icon: TrendingUp,
  },
];

function getGreeting(): string {
  const hour = new Date().getHours();
  if (hour < 12) return 'Buenos dias';
  if (hour < 19) return 'Buenas tardes';
  return 'Buenas noches';
}

function formatTokens(value: number): string {
  if (value >= 1_000_000) return `${(value / 1_000_000).toFixed(1)}M`;
  if (value >= 1_000) return `${(value / 1_000).toFixed(1)}k`;
  return String(value);
}

function formatUsd(value: number): string {
  return new Intl.NumberFormat('es-ES', {
    style: 'currency',
    currency: 'USD',
    maximumFractionDigits: 2,
  }).format(value);
}

function StatCard({
  icon: Icon,
  label,
  value,
  tone,
  helper,
}: {
  icon: React.ElementType;
  label: string;
  value: string | number;
  tone: string;
  helper: string;
}) {
  return (
    <div className="rounded-2xl border border-border bg-card p-4 shadow-sm">
      <div className="flex items-start justify-between gap-3">
        <div>
          <p className="text-xs font-medium uppercase tracking-[0.18em] text-muted-foreground">{label}</p>
          <p className="mt-3 text-3xl font-semibold tracking-tight text-foreground">{value}</p>
          <p className="mt-2 text-xs leading-5 text-muted-foreground">{helper}</p>
        </div>
        <div className={cn('flex size-11 items-center justify-center rounded-2xl', tone)}>
          <Icon className="size-5" />
        </div>
      </div>
    </div>
  );
}

function ActivityFeed({ items }: { items: ActivityLog[] }) {
  if (items.length === 0) {
    return (
      <div className="flex flex-col items-center rounded-2xl border border-dashed border-border py-10 text-center">
        <Clock className="size-8 text-muted-foreground/40" />
        <p className="mt-3 text-sm text-muted-foreground">No hay actividad reciente</p>
      </div>
    );
  }

  return (
    <div className="space-y-2">
      {items.map((entry) => (
        <div key={entry.id} className="flex items-start gap-3 rounded-2xl border border-border bg-card px-3 py-3">
          <div className="mt-0.5 flex size-9 shrink-0 items-center justify-center rounded-xl bg-primary/10 text-primary">
            <Activity className="size-4" />
          </div>
          <div className="min-w-0 flex-1">
            <p className="text-sm text-foreground">
              <span className="font-medium">{entry.action}</span>
              {' '}
              <span className="text-muted-foreground">{entry.entity_type}</span>
            </p>
            <p className="mt-1 text-xs text-muted-foreground">
              {entry.created_at
                ? formatDistanceToNow(new Date(entry.created_at), { addSuffix: true, locale: es })
                : ''}
            </p>
          </div>
        </div>
      ))}
    </div>
  );
}

function FocusTasks({
  tasks,
  projects,
}: {
  tasks: Array<{ id: string; title: string; dueDate: string | null; projectId: string; priority: string; }>;
  projects: Project[];
}) {
  if (tasks.length === 0) {
    return (
      <div className="flex flex-col items-center rounded-2xl border border-dashed border-border py-10 text-center">
        <CheckSquare className="size-8 text-muted-foreground/40" />
        <p className="mt-3 text-sm text-muted-foreground">No hay tareas activas en foco</p>
      </div>
    );
  }

  return (
    <div className="space-y-2">
      {tasks.map((task) => {
        const project = projects.find((candidate) => candidate.id === task.projectId);

        return (
          <div key={task.id} className="rounded-2xl border border-border bg-card px-3 py-3">
            <div className="flex items-start justify-between gap-3">
              <div className="min-w-0">
                <p className="truncate text-sm font-medium text-foreground">{task.title}</p>
                <p className="mt-1 text-xs text-muted-foreground">{project?.title ?? 'Proyecto sin nombre'}</p>
              </div>
              <span className="rounded-full bg-secondary px-2 py-1 text-[10px] font-semibold uppercase tracking-wide text-muted-foreground">
                {task.priority}
              </span>
            </div>
            <div className="mt-3 flex items-center justify-between text-xs text-muted-foreground">
              <span>{task.dueDate ? new Date(task.dueDate).toLocaleDateString('es-ES') : 'Sin fecha'}</span>
              <Link href={`/project/${project?.short_id ?? ''}/tasks`} className="font-medium text-primary">
                Abrir
              </Link>
            </div>
          </div>
        );
      })}
    </div>
  );
}

function buildAiResult(actionId: string, overview: NonNullable<ReturnType<typeof useDashboardOverview>['data']>): AiResultPayload {
  const favoriteCount = overview.projects.filter((project) => project.status === 'in_progress').length;

  if (actionId === 'unblock') {
    return {
      title: 'Bloqueos detectados',
      summary: `He revisado tu workspace. La mayor presión está en ${overview.pendingTasksCount} tareas activas y ${overview.overdueTasksCount} vencidas, con actividad reciente concentrada en ${overview.recentActivity.length} eventos.`,
      sections: [
        {
          title: 'Señales principales',
          items: [
            `${overview.overdueTasksCount} tareas requieren atención inmediata.`,
            `${overview.focusTasks.length} tareas están lo bastante cerca como para entrar en cola de foco.`,
            `${favoriteCount} proyectos están realmente avanzando ahora mismo.`,
          ],
        },
        {
          title: 'Puntos de intervención',
          items: [
            'Concentrar trabajo en un solo proyecto en progreso antes de abrir nuevas líneas.',
            'Mover tareas sin fecha a una cola secundaria o asignarles vencimiento real.',
            'Usar la actividad reciente para detectar qué área está moviendo el sistema y cuál quedó parada.',
          ],
        },
      ],
      suggestions: [
        'Resolver primero tareas vencidas con prioridad urgente o alta.',
        'Abrir el proyecto más activo y revisar si faltan escenas listas para producir.',
        'Convertir recomendaciones de IA en tareas concretas y no en notas sueltas.',
      ],
    };
  }

  if (actionId === 'prioritize') {
    return {
      title: 'Prioridad recomendada',
      summary: `La mejor siguiente acción es consolidar el frente más activo antes de dispersar trabajo. Ahora mismo tienes ${overview.projects.length} proyectos cargados, ${overview.pendingTasksCount} tareas abiertas y ${formatTokens(overview.tokensThisMonth)} tokens invertidos este mes.`,
      sections: [
        {
          title: 'Secuencia sugerida',
          items: [
            'Cerrar primero el cuello de botella operativo del proyecto más actualizado.',
            'Después revisar escenas o narración del video con más actividad reciente.',
            'Solo al final abrir exploración creativa o generación nueva con IA.',
          ],
        },
      ],
      suggestions: [
        'Tomar una tarea vencida y convertirla en la primera acción del día.',
        'Reducir cambios de contexto entre proyectos.',
        'Usar IA para resumir, no para abrir nuevas ramas sin cerrar lo actual.',
      ],
    };
  }

  return {
    title: 'Resumen operativo',
    summary: `Tu workspace con ${overview.projects.length} proyectos, ${overview.pendingTasksCount} tareas activas y coste mensual estimado de ${formatUsd(overview.monthlyCostUsd)}. El sistema ya muestra actividad suficiente para trabajar con IA contextual basada en estado real.`,
    sections: [
      {
        title: 'Capacidad actual',
        items: [
          `${overview.projects.length} proyectos accesibles en el contexto actual.`,
          `${overview.focusTasks.length} tareas en cola de foco operativa.`,
          `${overview.recentActivity.length} eventos recientes utilizables como contexto.`,
        ],
      },
      {
        title: 'Lectura ejecutiva',
        items: [
          'La base de datos ya tiene suficiente señal para un dashboard contextual útil.',
          'El siguiente salto de producto es mover esta lectura a IA por página y a un dashboard server-first.',
          'La vista actual ya puede funcionar como base visual del nuevo estándar del workspace.',
        ],
      },
    ],
    suggestions: [
      'Refactorizar después project overview con el mismo patrón.',
      'Conectar este panel a acciones reales del flujo de trabajo.',
      'Añadir métricas de uso y actividad por organización cuando el MCP de Supabase responda bien.',
    ],
  };
}

export function DashboardHomeView() {
  const { user } = useDashboard();
  const openProjectCreatePanel = useUIStore((state) => state.openProjectCreatePanel);
  const [activeFilter, setActiveFilter] = useState<StatusFilter>('all');
  const [search, setSearch] = useState('');
  const [sort, setSort] = useState<SortOption>('recent');
  const [activeAiActionId, setActiveAiActionId] = useState<string | null>(null);
  const [aiResult, setAiResult] = useState<AiResultPayload | null>(null);
  const [isAiDrawerOpen, setIsAiDrawerOpen] = useState(false);
  const debouncedSearch = useDebounce(search, 250);
  const { isFavorite } = useFavorites();
  const supabase = createClient();
  const overviewQuery = useDashboardOverview(user.id);
  const projectsQuery = useQuery<Project[]>({
    queryKey: queryKeys.projects.workspace(),
    queryFn: () => fetchWorkspaceProjects(supabase),
    staleTime: 60 * 1000,
  });

  const overview = overviewQuery.data;
  const projects = projectsQuery.data ?? overview?.projects ?? [];
  const firstName = user.full_name?.split(' ')[0] ?? '';

  const counts = useMemo(() => {
    const all = projects.length;
    const inProgress = projects.filter((project) => project.status === 'in_progress').length;
    const completed = projects.filter((project) => project.status === 'completed').length;
    const archived = projects.filter((project) => project.status === 'archived').length;
    const favorites = projects.filter((project) => isFavorite(project.id)).length;
    return { all, inProgress, completed, archived, favorites };
  }, [projects, isFavorite]);

  const filters = [
    { label: 'Todos', value: 'all' as const, count: counts.all },
    { label: 'En progreso', value: 'in_progress' as const, count: counts.inProgress },
    { label: 'Completados', value: 'completed' as const, count: counts.completed },
    { label: 'Archivados', value: 'archived' as const, count: counts.archived },
    { label: 'Favoritos', value: 'favorites' as const, count: counts.favorites, icon: Star },
  ];

  const filteredProjects = useMemo(() => {
    let result = projects;

    if (activeFilter === 'favorites') {
      result = result.filter((project) => isFavorite(project.id));
    } else if (activeFilter !== 'all') {
      result = result.filter((project) => project.status === activeFilter);
    }

    if (debouncedSearch.trim()) {
      const query = debouncedSearch.toLowerCase();
      result = result.filter((project) => (
        project.title.toLowerCase().includes(query)
        || (project.client_name?.toLowerCase().includes(query) ?? false)
        || (project.style?.toLowerCase().includes(query) ?? false)
        || (project.tags?.some((tag) => tag.toLowerCase().includes(query)) ?? false)
      ));
    }

    if (sort === 'name_asc') {
      result = [...result].sort((left, right) => left.title.localeCompare(right.title));
    }

    return result;
  }, [projects, activeFilter, debouncedSearch, sort, isFavorite]);

  const handleAiAction = (action: AiAssistAction) => {
    if (!overview) return;
    setActiveAiActionId(action.id);
    setAiResult(buildAiResult(action.id, overview));
    setIsAiDrawerOpen(true);
  };

  return (
    <div className="space-y-8 px-3 py-4 lg:px-5">
      <section className="overflow-hidden rounded-[28px] border border-border bg-[radial-gradient(circle_at_top_left,rgba(14,165,160,0.14),transparent_36%),linear-gradient(180deg,rgba(255,255,255,0.02),rgba(255,255,255,0))] p-6 shadow-sm">
        <div className="flex flex-col gap-6 lg:flex-row lg:items-end lg:justify-between">
          <div className="max-w-2xl">
            <div className="inline-flex items-center gap-2 rounded-full border border-border bg-background/70 px-3 py-1 text-xs font-medium text-muted-foreground">
              <span className="size-2 rounded-full bg-primary" />
              Workspace personal
            </div>
            <h1 className="mt-4 text-3xl font-semibold tracking-tight text-foreground lg:text-4xl">
              {getGreeting()}{firstName ? `, ${firstName}` : ''}
            </h1>
            <p className="mt-3 max-w-xl text-sm leading-6 text-muted-foreground lg:text-base">
              Un panel operativo para priorizar proyectos, controlar carga y preparar la transición a IA contextual por página.
            </p>
          </div>

          <div className="flex flex-wrap gap-2">
            <Button type="button" size="md" startContent={<Plus className="size-4" />} onClick={openProjectCreatePanel}>Nuevo proyecto</Button>
          </div>
        </div>
      </section>

      {overviewQuery.isLoading ? (
        <div className="grid gap-4 md:grid-cols-2 xl:grid-cols-4">
          {Array.from({ length: 4 }).map((_, index) => (
            <div key={index} className="h-36 animate-pulse rounded-2xl border border-border bg-card" />
          ))}
        </div>
      ) : overviewQuery.error ? (
        <div className="rounded-2xl border border-danger/30 bg-danger/5 p-5 text-sm text-danger-foreground">
          No se pudo cargar el dashboard. Revisa la conexión o el acceso al workspace.
        </div>
      ) : (
        <div className="grid gap-4 md:grid-cols-2 xl:grid-cols-4">
          <StatCard icon={FolderOpen} label="Proyectos" value={projects.length} tone="bg-primary/10 text-primary" helper="Base activa del workspace en el contexto actual." />
          <StatCard icon={CheckSquare} label="Tareas activas" value={overview?.pendingTasksCount ?? 0} tone="bg-amber-500/10 text-amber-500" helper={`${overview?.overdueTasksCount ?? 0} vencidas o fuera de foco.`} />
          <StatCard icon={Zap} label="Tokens mes" value={formatTokens(overview?.tokensThisMonth ?? 0)} tone="bg-sky-500/10 text-sky-500" helper={`Coste estimado ${formatUsd(overview?.monthlyCostUsd ?? 0)}.`} />
          <StatCard icon={TrendingUp} label="En progreso" value={counts.inProgress} tone="bg-emerald-500/10 text-emerald-500" helper="Proyectos que realmente están moviendo trabajo ahora." />
        </div>
      )}

      <div className="grid gap-6 xl:grid-cols-[minmax(0,1.45fr)_minmax(320px,0.9fr)]">
        <section className="space-y-6">
          <div className="rounded-2xl border border-border bg-card p-4 shadow-sm">
            <div className="flex flex-col gap-4 lg:flex-row lg:items-center lg:justify-between">
              <div className="flex items-center gap-3">
                <h2 className="text-xl font-semibold text-foreground">Proyectos</h2>
                <span className="inline-flex items-center justify-center rounded-full bg-primary/10 px-2.5 py-0.5 text-xs font-semibold text-primary">
                  {filteredProjects.length}
                </span>
              </div>

              <div className="flex flex-col gap-2 sm:flex-row sm:items-center">
                <div className="relative">
                  <Search className="absolute left-3 top-1/2 size-4 -translate-y-1/2 text-muted-foreground" />
                  <input
                    type="text"
                    placeholder="Buscar proyecto..."
                    value={search}
                    onChange={(event) => setSearch(event.target.value)}
                    className="h-10 w-full rounded-xl border border-border bg-background pl-9 pr-3 text-sm text-foreground outline-none transition focus:border-primary focus:ring-2 focus:ring-primary/20 sm:w-64"
                  />
                </div>

                <div className="relative">
                  <ArrowDownWideNarrow className="absolute left-3 top-1/2 size-4 -translate-y-1/2 text-muted-foreground" />
                  <select
                    value={sort}
                    onChange={(event) => setSort(event.target.value as SortOption)}
                    className="h-10 appearance-none rounded-xl border border-border bg-background pl-9 pr-9 text-sm text-foreground outline-none transition focus:border-primary focus:ring-2 focus:ring-primary/20"
                  >
                    {SORT_OPTIONS.map((option) => (
                      <option key={option.value} value={option.value}>{option.label}</option>
                    ))}
                  </select>
                </div>
              </div>
            </div>

            <div className="mt-4 flex flex-wrap gap-2">
              {filters.map((filter) => (
                <button
                  key={filter.value}
                  type="button"
                  onClick={() => setActiveFilter(filter.value)}
                  className={cn(
                    'inline-flex items-center gap-1.5 rounded-full px-3 py-1.5 text-xs font-medium transition',
                    activeFilter === filter.value
                      ? 'bg-primary text-white'
                      : 'bg-secondary text-muted-foreground hover:text-foreground'
                  )}
                >
                  {filter.icon ? <filter.icon className="size-3.5" /> : null}
                  <span>{filter.label}</span>
                  <span className={cn('rounded-full px-1.5 py-0.5 text-[10px] font-semibold', activeFilter === filter.value ? 'bg-white/20 text-white' : 'bg-background text-muted-foreground')}>
                    {filter.count}
                  </span>
                </button>
              ))}
            </div>
          </div>

          {projectsQuery.isLoading ? (
            <div className="grid grid-cols-1 gap-6 sm:grid-cols-2 lg:grid-cols-3">
              {Array.from({ length: 6 }).map((_, index) => (
                <div key={index} className="h-72 animate-pulse rounded-2xl border border-border bg-card" />
              ))}
            </div>
          ) : projectsQuery.error ? (
            <div className="rounded-2xl border border-danger/30 bg-danger/5 p-5 text-sm text-danger-foreground">
              No se pudo cargar la lista de proyectos del workspace actual.
            </div>
          ) : (
            <ProjectGrid projects={filteredProjects} />
          )}
        </section>

        <aside className="space-y-6">
          <AiAssistBar
            title="Asistencia contextual"
            description="Usa el estado real del dashboard para generar lectura operativa y próximos pasos sin salir de esta vista."
            actions={AI_ACTIONS}
            activeActionId={activeAiActionId}
            onAction={handleAiAction}
          />

          <section className="space-y-3">
            <div className="flex items-center justify-between">
              <h3 className="text-sm font-semibold uppercase tracking-[0.18em] text-muted-foreground">Cola de foco</h3>
              <Link href="/dashboard" className="text-xs font-medium text-primary">Vista general</Link>
            </div>
            {overviewQuery.isLoading ? (
              <div className="h-40 animate-pulse rounded-2xl border border-border bg-card" />
            ) : (
              <FocusTasks tasks={overview?.focusTasks ?? []} projects={projects} />
            )}
          </section>

          <section className="space-y-3">
            <div className="flex items-center justify-between">
              <h3 className="text-sm font-semibold uppercase tracking-[0.18em] text-muted-foreground">Actividad reciente</h3>
              <span className="text-xs text-muted-foreground">{overview?.recentActivity.length ?? 0} eventos</span>
            </div>
            {overviewQuery.isLoading ? (
              <div className="h-48 animate-pulse rounded-2xl border border-border bg-card" />
            ) : (
              <ActivityFeed items={overview?.recentActivity ?? []} />
            )}
          </section>
        </aside>
      </div>

      <AiResultDrawer
        open={isAiDrawerOpen}
        result={aiResult}
        onClose={() => {
          setIsAiDrawerOpen(false);
          setActiveAiActionId(null);
        }}
      />
    </div>
  );
}