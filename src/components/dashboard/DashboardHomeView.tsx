'use client';

import Link from 'next/link';
import { useMemo, useState } from 'react';
import { useQuery } from '@tanstack/react-query';
import {
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
import type { Project } from '@/types';
import { useDashboard } from '@/providers/DashboardBootstrap';
import { useDashboardOverview } from '@/hooks/useDashboardOverview';
import { useDebounce } from '@/hooks/useDebounce';
import { useFavorites } from '@/hooks/useFavorites';
import { createClient } from '@/lib/supabase/client';
import { ProjectGrid } from '@/components/project/ProjectGrid';
import { Button } from '@heroui/react';
import { AiAssistBar, type AiAssistAction } from '@/components/ai/AiAssistBar';
import { AiResultDrawer, type AiResultPayload } from '@/components/ai/AiResultDrawer';
import { queryKeys } from '@/lib/query/keys';
import { fetchWorkspaceProjects } from '@/lib/queries/projects';
import { useUIStore } from '@/stores/useUIStore';
import { MetricCard } from '@/components/shared/MetricCard';
import { ActivityItem } from '@/components/shared/ActivityItem';
import { TaskPreviewCard } from '@/components/shared/TaskPreviewCard';
import { FilterPills } from '@/components/shared/FilterPills';
import { EmptyState } from '@/components/shared/EmptyState';

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
    { id: 'all', label: 'Todos', count: counts.all },
    { id: 'in_progress', label: 'En progreso', count: counts.inProgress },
    { id: 'completed', label: 'Completados', count: counts.completed },
    { id: 'archived', label: 'Archivados', count: counts.archived },
    { id: 'favorites', label: 'Favoritos', count: counts.favorites, icon: Star },
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
          <MetricCard icon={FolderOpen} label="PROYECTOS" value={projects.length} helper="Base activa del workspace" tone="primary" />
          <MetricCard icon={CheckSquare} label="TAREAS ACTIVAS" value={overview?.pendingTasksCount ?? 0} helper={`${overview?.overdueTasksCount ?? 0} vencidas o fuera de foco.`} tone="warning" />
          <MetricCard icon={Zap} label="TOKENS MES" value={formatTokens(overview?.tokensThisMonth ?? 0)} helper={`Coste estimado ${formatUsd(overview?.monthlyCostUsd ?? 0)}.`} tone="info" />
          <MetricCard icon={TrendingUp} label="EN PROGRESO" value={counts.inProgress} helper="Proyectos que realmente están moviendo trabajo ahora." tone="success" />
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
                    className="mt-2 w-full rounded-2xl border border-border bg-background px-4 py-3 pl-9 text-sm text-foreground outline-none transition-colors placeholder:text-muted-foreground focus:border-primary/30 focus:ring-2 focus:ring-primary/10 sm:w-64"
                  />
                </div>

                <div className="relative">
                  <ArrowDownWideNarrow className="absolute left-3 top-1/2 size-4 -translate-y-1/2 text-muted-foreground" />
                  <select
                    value={sort}
                    onChange={(event) => setSort(event.target.value as SortOption)}
                    className="mt-2 w-full appearance-none rounded-2xl border border-border bg-background px-4 py-3 pl-9 pr-9 text-sm text-foreground outline-none transition-colors placeholder:text-muted-foreground focus:border-primary/30 focus:ring-2 focus:ring-primary/10"
                  >
                    {SORT_OPTIONS.map((option) => (
                      <option key={option.value} value={option.value}>{option.label}</option>
                    ))}
                  </select>
                </div>
              </div>
            </div>

            <FilterPills
              filters={filters}
              active={activeFilter}
              onChange={(id) => setActiveFilter(id as StatusFilter)}
              className="mt-4"
            />
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
            ) : (overview?.focusTasks ?? []).length === 0 ? (
              <EmptyState icon={CheckSquare} title="No hay tareas activas en foco" compact />
            ) : (
              <div className="space-y-2">
                {(overview?.focusTasks ?? []).map((task) => {
                  const project = projects.find((candidate) => candidate.id === task.projectId);
                  return (
                    <TaskPreviewCard
                      key={task.id}
                      title={task.title}
                      projectName={project?.title}
                      priority={task.priority}
                      dueDate={task.dueDate}
                      href={`/project/${project?.short_id ?? ''}/tasks`}
                    />
                  );
                })}
              </div>
            )}
          </section>

          <section className="space-y-3">
            <div className="flex items-center justify-between">
              <h3 className="text-sm font-semibold uppercase tracking-[0.18em] text-muted-foreground">Actividad reciente</h3>
              <span className="text-xs text-muted-foreground">{overview?.recentActivity.length ?? 0} eventos</span>
            </div>
            {overviewQuery.isLoading ? (
              <div className="h-48 animate-pulse rounded-2xl border border-border bg-card" />
            ) : (overview?.recentActivity ?? []).length === 0 ? (
              <EmptyState icon={Clock} title="No hay actividad reciente" compact />
            ) : (
              <div className="space-y-2">
                {(overview?.recentActivity ?? []).map((entry) => (
                  <ActivityItem
                    key={entry.id}
                    action={entry.action}
                    entityType={entry.entity_type}
                    timestamp={entry.created_at ?? ''}
                  />
                ))}
              </div>
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
