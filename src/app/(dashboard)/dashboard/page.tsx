'use client';

import { useEffect, useMemo, useState } from 'react';
import Link from 'next/link';
import { createClient } from '@/lib/supabase/client';
import { cn } from '@/lib/utils/cn';
import { ProjectGrid } from '@/components/project/ProjectGrid';
import type { Project } from '@/components/project/ProjectCard';
import {
  IconSearch,
  IconPlus,
  IconFolder,
  IconMovie,
  IconPlayerPlay,
  IconSortDescending,
} from '@tabler/icons-react';
import { useOrgStore } from '@/stores/useOrgStore';

type StatusFilter = 'all' | 'in_progress' | 'completed' | 'archived';
type SortOption = 'recent' | 'name_asc' | 'most_progress';

const sortOptions: { label: string; value: SortOption }[] = [
  { label: 'Recientes', value: 'recent' },
  { label: 'Nombre A-Z', value: 'name_asc' },
  { label: 'Mas avanzados', value: 'most_progress' },
];

function SkeletonCard() {
  return (
    <div className="overflow-hidden rounded-xl border border-surface-tertiary bg-surface">
      <div className="aspect-video w-full animate-pulse bg-surface-tertiary" />
      <div className="flex flex-col gap-3 p-4">
        <div className="h-5 w-3/4 animate-pulse rounded bg-surface-tertiary" />
        <div className="h-3 w-1/2 animate-pulse rounded bg-surface-tertiary" />
        <div className="h-3 w-2/3 animate-pulse rounded bg-surface-tertiary" />
        <div className="h-1.5 w-full animate-pulse rounded-full bg-surface-tertiary" />
        <div className="flex justify-between">
          <div className="h-5 w-20 animate-pulse rounded-full bg-surface-tertiary" />
          <div className="h-3 w-16 animate-pulse rounded bg-surface-tertiary" />
        </div>
      </div>
    </div>
  );
}

export default function DashboardPage() {
  const [projects, setProjects] = useState<Project[]>([]);
  const [loading, setLoading] = useState(true);
  const [activeFilter, setActiveFilter] = useState<StatusFilter>('all');
  const [search, setSearch] = useState('');
  const [sort, setSort] = useState<SortOption>('recent');
  const { currentOrgId } = useOrgStore();

  useEffect(() => {
    async function fetchProjects() {
      setLoading(true);
      const supabase = createClient();
      let query = supabase
        .from('projects')
        .select('*')
        .order('updated_at', { ascending: false });

      // Filter by organization if one is selected
      if (currentOrgId) {
        query = query.eq('organization_id', currentOrgId);
      }

      const { data, error } = await query;

      if (!error && data) {
        setProjects(data as Project[]);
      }
      setLoading(false);
    }

    fetchProjects();
  }, [currentOrgId]);

  // Counts per filter
  const counts = useMemo(() => {
    const all = projects.length;
    const inProgress = projects.filter((p) => p.status === 'in_progress').length;
    const completed = projects.filter((p) => p.status === 'completed').length;
    const archived = projects.filter((p) => p.status === 'archived').length;
    return { all, in_progress: inProgress, completed, archived };
  }, [projects]);

  // Quick stats
  const stats = useMemo(() => {
    const totalScenes = projects.reduce((sum, p) => sum + p.total_scenes, 0);
    const activeProjects = projects.filter(
      (p) => p.status === 'in_progress' || p.status === 'draft',
    ).length;
    return { total: projects.length, totalScenes, activeProjects };
  }, [projects]);

  const filters: { label: string; value: StatusFilter; count: number }[] = [
    { label: 'Todos', value: 'all', count: counts.all },
    { label: 'En progreso', value: 'in_progress', count: counts.in_progress },
    { label: 'Completados', value: 'completed', count: counts.completed },
    { label: 'Archivados', value: 'archived', count: counts.archived },
  ];

  const filtered = useMemo(() => {
    let result = projects;

    if (activeFilter !== 'all') {
      result = result.filter((p) => p.status === activeFilter);
    }

    if (search.trim()) {
      const q = search.toLowerCase();
      result = result.filter(
        (p) =>
          p.title.toLowerCase().includes(q) ||
          (p.client_name && p.client_name.toLowerCase().includes(q)),
      );
    }

    // Sort
    switch (sort) {
      case 'name_asc':
        result = [...result].sort((a, b) => a.title.localeCompare(b.title));
        break;
      case 'most_progress':
        result = [...result].sort((a, b) => b.completion_percentage - a.completion_percentage);
        break;
      case 'recent':
      default:
        // Already sorted by updated_at from the query
        break;
    }

    return result;
  }, [projects, activeFilter, search, sort]);

  return (
    <div className="h-full overflow-y-auto p-6">
      {/* Quick stats row */}
      {!loading && projects.length > 0 && (
        <div className="mb-6 grid grid-cols-3 gap-4">
          <div className="flex items-center gap-3 rounded-xl bg-surface-secondary p-4 transition-colors duration-150">
            <div className="flex h-10 w-10 items-center justify-center rounded-lg bg-brand-500/10">
              <IconFolder size={20} className="text-brand-500" />
            </div>
            <div>
              <p className="text-2xl font-bold text-foreground">{stats.total}</p>
              <p className="text-xs text-foreground-muted">Proyectos</p>
            </div>
          </div>
          <div className="flex items-center gap-3 rounded-xl bg-surface-secondary p-4 transition-colors duration-150">
            <div className="flex h-10 w-10 items-center justify-center rounded-lg bg-emerald-500/10">
              <IconMovie size={20} className="text-emerald-500" />
            </div>
            <div>
              <p className="text-2xl font-bold text-foreground">{stats.totalScenes}</p>
              <p className="text-xs text-foreground-muted">Escenas totales</p>
            </div>
          </div>
          <div className="flex items-center gap-3 rounded-xl bg-surface-secondary p-4 transition-colors duration-150">
            <div className="flex h-10 w-10 items-center justify-center rounded-lg bg-amber-500/10">
              <IconPlayerPlay size={20} className="text-amber-500" />
            </div>
            <div>
              <p className="text-2xl font-bold text-foreground">{stats.activeProjects}</p>
              <p className="text-xs text-foreground-muted">Activos</p>
            </div>
          </div>
        </div>
      )}

      {/* Header */}
      <div className="mb-6 flex flex-col gap-4 sm:flex-row sm:items-center sm:justify-between">
        <div className="flex items-center gap-3">
          <h1 className="text-2xl font-bold text-foreground">Mis Proyectos</h1>
          {!loading && (
            <span className="inline-flex items-center justify-center rounded-full bg-brand-500/10 px-2.5 py-0.5 text-xs font-semibold text-brand-500">
              {projects.length}
            </span>
          )}
        </div>
        <div className="flex items-center gap-3">
          {/* Search */}
          <div className="relative">
            <IconSearch
              size={16}
              className="absolute left-3 top-1/2 -translate-y-1/2 text-foreground-muted"
            />
            <input
              type="text"
              placeholder="Buscar proyecto..."
              value={search}
              onChange={(e) => setSearch(e.target.value)}
              className={cn(
                'h-9 w-full rounded-lg border border-foreground-muted/20 bg-surface pl-9 pr-3 text-sm text-foreground',
                'placeholder:text-foreground-muted',
                'transition-all duration-150',
                'focus:border-brand-500 focus:outline-none focus:ring-2 focus:ring-brand-500/20',
                'sm:w-56',
              )}
            />
          </div>
          <Link
            href="/new"
            className={cn(
              'flex items-center gap-2 rounded-lg bg-brand-500 px-4 py-2 text-sm font-medium text-white',
              'transition-all duration-150 hover:bg-brand-600 hover:shadow-md',
            )}
          >
            <IconPlus size={16} />
            <span className="hidden sm:inline">Nuevo Proyecto</span>
          </Link>
        </div>
      </div>

      {/* Filters + Sort */}
      <div className="mb-6 flex flex-col gap-4 sm:flex-row sm:items-center sm:justify-between">
        <div className="flex flex-wrap gap-2">
          {filters.map((f) => (
            <button
              key={f.value}
              onClick={() => setActiveFilter(f.value)}
              className={cn(
                'flex items-center gap-1.5 rounded-full px-3.5 py-1.5 text-xs font-medium',
                'transition-all duration-150',
                activeFilter === f.value
                  ? 'bg-brand-500 text-white shadow-sm'
                  : 'bg-surface-secondary text-foreground-secondary hover:bg-surface-tertiary',
              )}
            >
              {f.label}
              <span
                className={cn(
                  'inline-flex items-center justify-center rounded-full px-1.5 text-[10px] font-semibold',
                  activeFilter === f.value
                    ? 'bg-white/20 text-white'
                    : 'bg-surface-tertiary text-foreground-muted',
                )}
              >
                {f.count}
              </span>
            </button>
          ))}
        </div>
        <div className="relative">
          <IconSortDescending
            size={14}
            className="absolute left-3 top-1/2 -translate-y-1/2 text-foreground-muted"
          />
          <select
            value={sort}
            onChange={(e) => setSort(e.target.value as SortOption)}
            className={cn(
              'h-8 appearance-none rounded-lg border border-foreground-muted/20 bg-surface pl-8 pr-8 text-xs text-foreground-secondary',
              'transition-all duration-150',
              'focus:border-brand-500 focus:outline-none focus:ring-2 focus:ring-brand-500/20',
            )}
          >
            {sortOptions.map((opt) => (
              <option key={opt.value} value={opt.value}>
                {opt.label}
              </option>
            ))}
          </select>
        </div>
      </div>

      {/* Content */}
      {loading ? (
        <div className="grid grid-cols-1 gap-6 sm:grid-cols-2 lg:grid-cols-3">
          <SkeletonCard />
          <SkeletonCard />
          <SkeletonCard />
        </div>
      ) : (
        <ProjectGrid projects={filtered} />
      )}
    </div>
  );
}
