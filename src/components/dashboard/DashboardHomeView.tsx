'use client';

import Link from 'next/link';
import { useMemo, useState } from 'react';
import { useQuery } from '@tanstack/react-query';
import {
  AlertTriangle,
  CheckSquare,
  FolderOpen,
  Loader2,
  Plus,
  Sparkles,
  Star,
  TrendingUp,
  Zap,
} from 'lucide-react';
import type { Project } from '@/types';
import { TextField, Input, Select, ListBox, Label } from '@heroui/react';
import type { Key } from 'react';
import { useDashboard } from '@/providers/DashboardBootstrap';
import { useDashboardOverview } from '@/hooks/useDashboardOverview';
import { useDebounce } from '@/hooks/useDebounce';
import { useFavorites } from '@/hooks/useFavorites';
import { createClient } from '@/lib/supabase/client';
import { ProjectGrid } from '@/components/project/ProjectGrid';
import { queryKeys } from '@/lib/query/keys';
import { fetchWorkspaceProjects } from '@/lib/queries/projects';
import { useUIStore } from '@/stores/useUIStore';
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
  const [analyzing, setAnalyzing] = useState(false);
  const [analysisResult, setAnalysisResult] = useState<{title: string; summary: string; recommendations: string[]; nextAction: string} | null>(null);
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

  async function handleAnalyzeWorkspace() {
    if (!overview) return;
    setAnalyzing(true);
    try {
      const result = {
        title: 'Estado del workspace',
        summary: `${overview.projects.length} proyecto${overview.projects.length !== 1 ? 's' : ''}, ${overview.pendingTasksCount} tareas activas, ${fmtTokens(overview.tokensThisMonth)} tokens este mes.`,
        recommendations: [
          overview.overdueTasksCount > 0 ? `${overview.overdueTasksCount} tarea${overview.overdueTasksCount !== 1 ? 's' : ''} vencida${overview.overdueTasksCount !== 1 ? 's' : ''} — revisar prioridades` : null,
          overview.focusTasks.length > 0 ? `${overview.focusTasks.length} tarea${overview.focusTasks.length !== 1 ? 's' : ''} en cola de foco` : null,
          counts.inProgress > 0 ? `${counts.inProgress} proyecto${counts.inProgress !== 1 ? 's' : ''} en progreso` : null,
        ].filter(Boolean) as string[],
        nextAction: overview.overdueTasksCount > 0
          ? 'Resolver tareas vencidas primero'
          : overview.focusTasks.length > 0
          ? 'Completar las tareas en cola de foco'
          : 'Todo al dia — crear nuevo contenido',
      };
      setAnalysisResult(result);
    } catch {
      // silently handle
    } finally {
      setAnalyzing(false);
    }
  }

  return (
    <div className="mx-auto max-w-7xl px-4 py-6 space-y-6">
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
          <Stat icon={CheckSquare} label="Escenas totales" value={overview?.pendingTasksCount ?? 0} sub="en todos los proyectos" tone="text-amber-500" />
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
              <TextField variant="secondary" value={search} onChange={setSearch} className="w-44">
                <Label className="sr-only">Buscar proyectos</Label>
                <Input placeholder="Buscar..." />
              </TextField>
              <Select
                variant="secondary"
                aria-label="Ordenar proyectos"
                selectedKey={sort}
                onSelectionChange={(key: Key | null) => { if (key) setSort(String(key) as 'recent' | 'name_asc'); }}
              >
                <Label className="sr-only">Ordenar</Label>
                <Select.Trigger><Select.Value /><Select.Indicator /></Select.Trigger>
                <Select.Popover><ListBox>
                  <ListBox.Item key="recent" id="recent">Recientes</ListBox.Item>
                  <ListBox.Item key="name_asc" id="name_asc">A-Z</ListBox.Item>
                </ListBox></Select.Popover>
              </Select>
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
          {/* Workspace analysis */}
          <div className="rounded-xl border border-border bg-card p-4 space-y-3">
            <button
              type="button"
              onClick={handleAnalyzeWorkspace}
              disabled={analyzing || !overview}
              className="w-full rounded-xl bg-primary py-2.5 text-sm font-medium text-primary-foreground hover:bg-primary/90 disabled:opacity-50 transition-colors flex items-center justify-center gap-2"
            >
              {analyzing ? <Loader2 className="size-4 animate-spin" /> : <Sparkles className="size-4" />}
              {analyzing ? 'Analizando...' : 'Analizar workspace'}
            </button>

            {analysisResult && (
              <div className="space-y-3 pt-2">
                <p className="text-sm text-muted-foreground">{analysisResult.summary}</p>
                {analysisResult.recommendations.length > 0 && (
                  <div className="space-y-1.5">
                    <p className="text-[10px] font-semibold uppercase tracking-wider text-muted-foreground">Recomendaciones</p>
                    {analysisResult.recommendations.map((r, i) => (
                      <p key={i} className="text-xs text-muted-foreground pl-3 border-l-2 border-primary/20">{r}</p>
                    ))}
                  </div>
                )}
                <div className="rounded-lg bg-primary/5 border border-primary/20 p-2.5">
                  <p className="text-[10px] font-semibold uppercase tracking-wider text-primary mb-1">Siguiente accion</p>
                  <p className="text-xs text-foreground">{analysisResult.nextAction}</p>
                </div>
              </div>
            )}
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

          {/* Quick actions placeholder */}
        </aside>
      </div>

    </div>
  );
}
