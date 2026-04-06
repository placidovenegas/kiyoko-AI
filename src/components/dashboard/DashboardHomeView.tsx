'use client';

import Link from 'next/link';
import { useMemo, useState } from 'react';
import { useQuery } from '@tanstack/react-query';
import {
  AlertTriangle,
  BarChart3,
  CheckSquare,
  FolderOpen,
  Layers,
  Plus,
  Sparkles,
  Star,
  TrendingUp,
  Users,
  Zap,
} from 'lucide-react';
import type { Project } from '@/types';
import { useDashboard } from '@/providers/DashboardBootstrap';
import { useDashboardOverview } from '@/hooks/useDashboardOverview';
import { useDebounce } from '@/hooks/useDebounce';
import { useFavorites } from '@/hooks/useFavorites';
import { createClient } from '@/lib/supabase/client';
import { ProjectGrid } from '@/components/project/ProjectGrid';
import { type AiAssistAction } from '@/components/ai/AiAssistBar';
import { AiResultDrawer, type AiResultPayload } from '@/components/ai/AiResultDrawer';
import { queryKeys } from '@/lib/query/keys';
import { fetchWorkspaceProjects } from '@/lib/queries/projects';
import { useUIStore } from '@/stores/useUIStore';
import { TaskPreviewCard } from '@/components/shared/TaskPreviewCard';
import { FilterPills } from '@/components/shared/FilterPills';
import { EmptyState } from '@/components/shared/EmptyState';
import { cn } from '@/lib/utils/cn';

/* ── Helpers ─────────────────────────────────────────────── */

type StatusFilter = 'all' | 'in_progress' | 'completed' | 'archived' | 'favorites';

function getGreeting(): string {
  const h = new Date().getHours();
  return h < 12 ? 'Buenos días' : h < 19 ? 'Buenas tardes' : 'Buenas noches';
}

function fmtTokens(v: number): string {
  if (v >= 1_000_000) return `${(v / 1_000_000).toFixed(1)}M`;
  if (v >= 1_000) return `${(v / 1_000).toFixed(1)}k`;
  return String(v);
}

function fmtUsd(v: number): string {
  return new Intl.NumberFormat('es-ES', { style: 'currency', currency: 'USD', maximumFractionDigits: 2 }).format(v);
}

/* ── AI actions ──────────────────────────────────────────── */

const AI_ACTIONS: AiAssistAction[] = [
  { id: 'overview', label: 'Resumen operativo', description: 'Estado del workspace y señales del mes.', icon: Sparkles },
  { id: 'unblock', label: 'Detectar bloqueos', description: 'Cuellos de botella en tareas y escenas.', icon: AlertTriangle },
  { id: 'prioritize', label: 'Siguiente paso', description: 'Acciones con mayor retorno.', icon: TrendingUp },
];

function buildAiResult(id: string, o: NonNullable<ReturnType<typeof useDashboardOverview>['data']>): AiResultPayload {
  if (id === 'unblock') return { title: 'Bloqueos detectados', summary: `${o.overdueTasksCount} tareas vencidas, ${o.pendingTasksCount} activas.`, sections: [{ title: 'Señales', items: [`${o.overdueTasksCount} requieren atención inmediata.`, `${o.focusTasks.length} en cola de foco.`] }, { title: 'Intervención', items: ['Concentrar en un proyecto antes de abrir nuevas líneas.', 'Mover tareas sin fecha a cola secundaria.'] }], suggestions: ['Resolver tareas vencidas urgentes primero.', 'Revisar proyecto más activo.'] };
  if (id === 'prioritize') return { title: 'Prioridad recomendada', summary: `${o.projects.length} proyectos, ${o.pendingTasksCount} tareas, ${fmtTokens(o.tokensThisMonth)} tokens este mes.`, sections: [{ title: 'Secuencia', items: ['Cerrar cuello de botella del proyecto más activo.', 'Revisar escenas del video con más actividad.', 'IA solo para tareas cerradas, no nuevas ramas.'] }], suggestions: ['Tomar tarea vencida como primera acción.', 'Reducir cambios de contexto.'] };
  return { title: 'Resumen operativo', summary: `${o.projects.length} proyectos, ${o.pendingTasksCount} tareas, coste ${fmtUsd(o.monthlyCostUsd)}/mes.`, sections: [{ title: 'Capacidad', items: [`${o.projects.length} proyectos activos.`, `${o.focusTasks.length} tareas en foco.`, `${o.recentActivity.length} eventos recientes.`] }], suggestions: ['Conectar panel a acciones reales.', 'Añadir métricas por proyecto.'] };
}

/* ── Compact stat ─────────────────────────────────────────── */

function Stat({ icon: Icon, label, value, sub, tone = 'text-muted-foreground' }: {
  icon: React.ElementType; label: string; value: string | number; sub?: string; tone?: string;
}) {
  return (
    <div className="flex items-center gap-3 rounded-xl border border-border bg-card px-4 py-3">
      <div className={cn('flex size-8 items-center justify-center rounded-lg bg-muted/60', tone)}>
        <Icon className="size-4" />
      </div>
      <div className="min-w-0">
        <p className="text-lg font-semibold tabular-nums text-foreground">{value}</p>
        <p className="text-[11px] text-muted-foreground truncate">{label}{sub ? ` · ${sub}` : ''}</p>
      </div>
    </div>
  );
}

/* ── Main ─────────────────────────────────────────────────── */

export function DashboardHomeView() {
  const { user } = useDashboard();
  const openProjectCreatePanel = useUIStore((s) => s.openProjectCreatePanel);
  const [activeFilter, setActiveFilter] = useState<StatusFilter>('all');
  const [search, setSearch] = useState('');
  const [sort, setSort] = useState<'recent' | 'name_asc'>('recent');
  const [aiResult, setAiResult] = useState<AiResultPayload | null>(null);
  const [aiOpen, setAiOpen] = useState(false);
  const debouncedSearch = useDebounce(search, 250);
  const { isFavorite } = useFavorites();
  const supabase = createClient();

  const overviewQ = useDashboardOverview(user.id);
  const projectsQ = useQuery<Project[]>({
    queryKey: queryKeys.projects.workspace(),
    queryFn: () => fetchWorkspaceProjects(supabase),
    staleTime: 60_000,
  });

  const overview = overviewQ.data;
  const projects = projectsQ.data ?? overview?.projects ?? [];
  const firstName = user.full_name?.split(' ')[0] ?? '';

  const counts = useMemo(() => ({
    all: projects.length,
    inProgress: projects.filter((p) => p.status === 'in_progress').length,
    completed: projects.filter((p) => p.status === 'completed').length,
    archived: projects.filter((p) => p.status === 'archived').length,
    favorites: projects.filter((p) => isFavorite(p.id)).length,
  }), [projects, isFavorite]);

  const filtered = useMemo(() => {
    let r = projects;
    if (activeFilter === 'favorites') r = r.filter((p) => isFavorite(p.id));
    else if (activeFilter !== 'all') r = r.filter((p) => p.status === activeFilter);
    if (debouncedSearch.trim()) {
      const q = debouncedSearch.toLowerCase();
      r = r.filter((p) => p.title.toLowerCase().includes(q) || p.client_name?.toLowerCase().includes(q));
    }
    if (sort === 'name_asc') r = [...r].sort((a, b) => a.title.localeCompare(b.title));
    return r;
  }, [projects, activeFilter, debouncedSearch, sort, isFavorite]);

  const handleAi = (a: AiAssistAction) => {
    if (!overview) return;
    setAiResult(buildAiResult(a.id, overview));
    setAiOpen(true);
  };

  return (
    <div className="mx-auto max-w-7xl px-4 py-6 space-y-6" style={{ background: 'radial-gradient(ellipse at top left, rgba(5,139,150,0.06) 0%, transparent 50%), radial-gradient(ellipse at bottom right, rgba(254,106,60,0.04) 0%, transparent 50%)' }}>
      {/* ── Header ──────────────────────────────────────── */}
      <div className="flex items-end justify-between">
        <div>
          <h1 className="text-2xl font-semibold tracking-tight">
            {getGreeting()}{firstName ? `, ${firstName}` : ''}
          </h1>
          <p className="mt-1 text-sm text-muted-foreground">Gestiona tus proyectos y sigue tu progreso</p>
        </div>
        <button
          type="button"
          onClick={openProjectCreatePanel}
          className="inline-flex items-center gap-2 rounded-xl bg-primary px-4 py-2.5 text-sm font-medium text-primary-foreground hover:bg-primary/90 transition-colors"
        >
          <Plus className="size-4" />
          Nuevo proyecto
        </button>
      </div>

      {/* ── Stats row ───────────────────────────────────── */}
      {overviewQ.isLoading ? (
        <div className="grid gap-3 grid-cols-2 lg:grid-cols-4">
          {[0,1,2,3].map((i) => <div key={i} className="h-16 animate-pulse rounded-xl border border-border bg-card" />)}
        </div>
      ) : (
        <div className="grid gap-3 grid-cols-2 lg:grid-cols-4">
          <Stat icon={FolderOpen} label="Proyectos" value={projects.length} tone="text-primary" />
          <Stat icon={CheckSquare} label="Tareas activas" value={overview?.pendingTasksCount ?? 0} sub={`${overview?.overdueTasksCount ?? 0} vencidas`} tone="text-amber-500" />
          <Stat icon={Zap} label="Tokens mes" value={fmtTokens(overview?.tokensThisMonth ?? 0)} sub={fmtUsd(overview?.monthlyCostUsd ?? 0)} tone="text-sky-500" />
          <Stat icon={TrendingUp} label="En progreso" value={counts.inProgress} tone="text-emerald-500" />
        </div>
      )}

      {/* ── Main grid ───────────────────────────────────── */}
      <div className="grid gap-6 xl:grid-cols-[1fr_320px]">
        {/* Left: Projects */}
        <div className="space-y-4">
          {/* Search + sort + filters */}
          <div className="flex flex-col gap-3 sm:flex-row sm:items-center sm:justify-between">
            <div className="flex items-center gap-2">
              <h2 className="text-lg font-semibold">Proyectos</h2>
              <span className="text-xs font-medium text-primary bg-primary/10 rounded-full px-2 py-0.5">{filtered.length}</span>
            </div>
            <div className="flex items-center gap-2">
              <div className="relative">
                <input
                  type="text"
                  placeholder="Buscar..."
                  value={search}
                  onChange={(e) => setSearch(e.target.value)}
                  className="h-8 w-44 rounded-lg border border-border bg-background pl-8 pr-3 text-xs text-foreground outline-none placeholder:text-muted-foreground focus:border-primary/30 focus:ring-1 focus:ring-primary/10"
                />
                <svg className="absolute left-2.5 top-1/2 -translate-y-1/2 size-3.5 text-muted-foreground" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={2}><circle cx="11" cy="11" r="8"/><path d="m21 21-4.3-4.3"/></svg>
              </div>
              <select
                value={sort}
                onChange={(e) => setSort(e.target.value as 'recent' | 'name_asc')}
                className="h-8 appearance-none rounded-lg border border-border bg-card px-3 pr-7 text-xs text-foreground outline-none cursor-pointer hover:border-primary/30 focus:border-primary/30 focus:ring-1 focus:ring-primary/10 transition-colors"
                style={{ backgroundImage: `url("data:image/svg+xml,%3Csvg xmlns='http://www.w3.org/2000/svg' width='12' height='12' viewBox='0 0 24 24' fill='none' stroke='%23888' stroke-width='2'%3E%3Cpath d='m6 9 6 6 6-6'/%3E%3C/svg%3E")`, backgroundPosition: 'right 8px center', backgroundRepeat: 'no-repeat' }}
              >
                <option value="recent">Recientes</option>
                <option value="name_asc">A-Z</option>
              </select>
            </div>
          </div>

          <FilterPills
            filters={[
              { id: 'all', label: 'Todos', count: counts.all },
              { id: 'in_progress', label: 'En progreso', count: counts.inProgress },
              { id: 'completed', label: 'Completados', count: counts.completed },
              { id: 'archived', label: 'Archivados', count: counts.archived },
              { id: 'favorites', label: 'Favoritos', count: counts.favorites, icon: Star },
            ]}
            active={activeFilter}
            onChange={(id) => setActiveFilter(id as StatusFilter)}
          />

          {projectsQ.isLoading ? (
            <div className="grid gap-4 grid-cols-1 sm:grid-cols-2 lg:grid-cols-3">
              {[0,1,2].map((i) => <div key={i} className="h-56 animate-pulse rounded-xl border border-border bg-card" />)}
            </div>
          ) : (
            <ProjectGrid projects={filtered} />
          )}
        </div>

        {/* Right: Sidebar */}
        <aside className="space-y-5">
          {/* AI Assist — compact */}
          <div className="rounded-xl border border-border bg-card p-4 space-y-3">
            <div className="flex items-center gap-2">
              <Sparkles className="size-4 text-primary" />
              <p className="text-sm font-medium">Asistente IA</p>
            </div>
            <div className="space-y-1.5">
              {AI_ACTIONS.map((a) => {
                const Icon = a.icon;
                return (
                  <button
                    key={a.id}
                    type="button"
                    onClick={() => handleAi(a)}
                    className="flex w-full items-center gap-2.5 rounded-lg px-2.5 py-2 text-left text-xs text-muted-foreground hover:bg-accent hover:text-foreground transition-colors"
                  >
                    <Icon className="size-3.5 shrink-0" />
                    <span>{a.label}</span>
                  </button>
                );
              })}
            </div>
          </div>

          {/* Workspace overview — visual analysis */}
          {overview && (
            <div className="rounded-xl border border-border bg-card p-4 space-y-3">
              <p className="text-xs font-semibold uppercase tracking-wider text-muted-foreground">Resumen del workspace</p>
              <div className="grid grid-cols-2 gap-2">
                <div className="rounded-lg bg-primary/5 border border-primary/10 p-3 text-center">
                  <p className="text-xl font-bold text-primary tabular-nums">{projects.length}</p>
                  <p className="text-[10px] text-muted-foreground mt-0.5">Proyectos</p>
                </div>
                <div className="rounded-lg bg-amber-500/5 border border-amber-500/10 p-3 text-center">
                  <p className="text-xl font-bold text-amber-500 tabular-nums">{overview.pendingTasksCount}</p>
                  <p className="text-[10px] text-muted-foreground mt-0.5">Tareas</p>
                </div>
                <div className="rounded-lg bg-sky-500/5 border border-sky-500/10 p-3 text-center">
                  <p className="text-xl font-bold text-sky-500 tabular-nums">{fmtTokens(overview.tokensThisMonth)}</p>
                  <p className="text-[10px] text-muted-foreground mt-0.5">Tokens</p>
                </div>
                <div className="rounded-lg bg-emerald-500/5 border border-emerald-500/10 p-3 text-center">
                  <p className="text-xl font-bold text-emerald-500 tabular-nums">{overview.recentActivity.length}</p>
                  <p className="text-[10px] text-muted-foreground mt-0.5">Eventos</p>
                </div>
              </div>
              {overview.overdueTasksCount > 0 && (
                <div className="flex items-center gap-2 rounded-lg bg-danger-500/5 border border-danger-500/10 px-3 py-2">
                  <AlertTriangle className="size-3.5 text-danger-500 shrink-0" />
                  <p className="text-xs text-danger-500">{overview.overdueTasksCount} tarea{overview.overdueTasksCount > 1 ? 's' : ''} vencida{overview.overdueTasksCount > 1 ? 's' : ''}</p>
                </div>
              )}
            </div>
          )}

          {/* Focus tasks */}
          <div className="space-y-2">
            <div className="flex items-center justify-between">
              <p className="text-xs font-semibold uppercase tracking-wider text-muted-foreground">Cola de foco</p>
              <Link href="/dashboard/tasks" className="text-xs text-primary hover:text-primary/80">Ver todo</Link>
            </div>
            {overviewQ.isLoading ? (
              <div className="h-24 animate-pulse rounded-xl border border-border bg-card" />
            ) : (overview?.focusTasks ?? []).length === 0 ? (
              <EmptyState icon={CheckSquare} title="Sin tareas en foco" compact />
            ) : (
              <div className="space-y-1.5">
                {(overview?.focusTasks ?? []).slice(0, 4).map((t) => {
                  const proj = projects.find((p) => p.id === t.projectId);
                  return <TaskPreviewCard key={t.id} title={t.title} projectName={proj?.title} priority={t.priority} dueDate={t.dueDate} href={`/project/${proj?.short_id ?? ''}/tasks`} />;
                })}
              </div>
            )}
          </div>
        </aside>
      </div>

      {/* AI Result Modal */}
      <AiResultDrawer open={aiOpen} result={aiResult} onClose={() => setAiOpen(false)} />
    </div>
  );
}
