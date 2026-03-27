'use client';

import { useMemo, useState } from 'react';
import Link from 'next/link';
import { useRouter } from 'next/navigation';
import { useQuery } from '@tanstack/react-query';
import { createClient } from '@/lib/supabase/client';
import { queryKeys } from '@/lib/query/keys';
import { cn } from '@/lib/utils/cn';
import { ProjectGrid } from '@/components/project/ProjectGrid';
import { Button } from '@/components/ui/button';
import { useUIStore } from '@/stores/useUIStore';
import { useDebounce } from '@/hooks/useDebounce';
import { useFavorites } from '@/hooks/useFavorites';
import { formatDistanceToNow } from 'date-fns/formatDistanceToNow';
import { es } from 'date-fns/locale/es';
import {
  Search, Plus, FolderOpen, Activity,
  ArrowDownWideNarrow, Sparkles, CheckSquare, Zap, Star,
  Clock,
} from 'lucide-react';
import type { Project, Profile, ActivityLog } from '@/types';

type StatusFilter = 'all' | 'in_progress' | 'completed' | 'archived' | 'favorites';
type SortOption = 'recent' | 'name_asc';

const SORT_OPTIONS: { label: string; value: SortOption }[] = [
  { label: 'Recientes', value: 'recent' },
  { label: 'Nombre A-Z', value: 'name_asc' },
];

function getGreeting(): string {
  const hour = new Date().getHours();
  if (hour < 12) return 'Buenos dias';
  if (hour < 19) return 'Buenas tardes';
  return 'Buenas noches';
}

function StatCard({ icon: Icon, value, label, accent, href }: {
  icon: React.ElementType;
  value: number | string;
  label: string;
  accent: string;
  href?: string;
}) {
  const router = useRouter();

  return (
    <button
      type="button"
      onClick={() => href && router.push(href)}
      className={cn(
        'flex items-center gap-3 rounded-xl border border-border bg-card p-4 text-left transition',
        'hover:border-primary/30 hover:bg-secondary',
        href && 'cursor-pointer',
      )}
    >
      <div className={cn('flex h-10 w-10 items-center justify-center rounded-lg', accent)}>
        <Icon className="h-5 w-5" />
      </div>
      <div>
        <p className="text-3xl font-bold text-foreground">{value}</p>
        <p className="text-xs text-muted-foreground">{label}</p>
      </div>
    </button>
  );
}

function SkeletonCard() {
  return (
    <div className="overflow-hidden rounded-xl border border-border bg-card">
      <div className="aspect-video w-full animate-pulse bg-secondary" />
      <div className="flex flex-col gap-3 p-4">
        <div className="h-5 w-3/4 animate-pulse rounded bg-secondary" />
        <div className="h-3 w-1/2 animate-pulse rounded bg-secondary" />
        <div className="h-1.5 w-full animate-pulse rounded-full bg-secondary" />
        <div className="flex justify-between">
          <div className="h-5 w-20 animate-pulse rounded-full bg-secondary" />
          <div className="h-3 w-16 animate-pulse rounded bg-secondary" />
        </div>
      </div>
    </div>
  );
}

function StatsSkeleton() {
  return (
    <div className="grid grid-cols-1 gap-4 sm:grid-cols-2 lg:grid-cols-4">
      {Array.from({ length: 4 }).map((_, i) => (
        <div key={i} className="flex items-center gap-3 rounded-xl border border-border bg-card p-4">
          <div className="h-10 w-10 animate-pulse rounded-lg bg-secondary" />
          <div className="flex flex-col gap-1.5">
            <div className="h-6 w-12 animate-pulse rounded bg-secondary" />
            <div className="h-3 w-20 animate-pulse rounded bg-secondary" />
          </div>
        </div>
      ))}
    </div>
  );
}

function ActivitySkeleton() {
  return (
    <div className="space-y-3">
      {Array.from({ length: 3 }).map((_, i) => (
        <div key={i} className="flex items-center gap-3 p-2">
          <div className="h-8 w-8 animate-pulse rounded-lg bg-secondary" />
          <div className="flex flex-1 flex-col gap-1.5">
            <div className="h-4 w-3/4 animate-pulse rounded bg-secondary" />
            <div className="h-3 w-1/4 animate-pulse rounded bg-secondary" />
          </div>
        </div>
      ))}
    </div>
  );
}

export default function DashboardPage() {
  const [activeFilter, setActiveFilter] = useState<StatusFilter>('all');
  const [search, setSearch] = useState('');
  const [sort, setSort] = useState<SortOption>('recent');
  const currentOrgId = useUIStore((s) => s.currentOrgId);
  const debouncedSearch = useDebounce(search, 300);
  const { isFavorite } = useFavorites();

  // Fetch user profile for greeting
  const { data: profile } = useQuery<Profile | null>({
    queryKey: ['profile', 'me'],
    queryFn: async () => {
      const supabase = createClient();
      const { data: { user } } = await supabase.auth.getUser();
      if (!user) return null;
      const { data } = await supabase
        .from('profiles')
        .select('*')
        .eq('id', user.id)
        .single();
      return data;
    },
    staleTime: 5 * 60 * 1000,
  });

  // Fetch projects
  const { data: projects = [], isLoading: projectsLoading } = useQuery<Project[]>({
    queryKey: currentOrgId
      ? queryKeys.projects.byOrg(currentOrgId)
      : queryKeys.projects.all,
    queryFn: async () => {
      const supabase = createClient();
      let query = supabase
        .from('projects')
        .select('*')
        .order('updated_at', { ascending: false });

      if (currentOrgId) {
        query = query.eq('organization_id', currentOrgId);
      }

      const { data, error } = await query;
      if (error) throw error;
      return data ?? [];
    },
  });

  // Fetch pending tasks count
  const { data: pendingTasksCount = 0 } = useQuery<number>({
    queryKey: ['dashboard', 'pending-tasks'],
    queryFn: async () => {
      const supabase = createClient();
      const { count } = await supabase
        .from('tasks')
        .select('*', { count: 'exact', head: true })
        .in('status', ['pending', 'in_progress']);
      return count ?? 0;
    },
    staleTime: 60 * 1000,
  });

  // Fetch AI tokens used this month
  const { data: tokensThisMonth = 0 } = useQuery<number>({
    queryKey: ['dashboard', 'tokens-month'],
    queryFn: async () => {
      const supabase = createClient();
      const startOfMonth = new Date();
      startOfMonth.setDate(1);
      startOfMonth.setHours(0, 0, 0, 0);

      const { data } = await supabase
        .from('ai_usage_logs')
        .select('input_tokens, output_tokens')
        .gte('created_at', startOfMonth.toISOString());

      if (!data) return 0;
      return data.reduce(
        (sum, row) => sum + (row.input_tokens ?? 0) + (row.output_tokens ?? 0),
        0,
      );
    },
    staleTime: 2 * 60 * 1000,
  });

  // Fetch recent activity
  const { data: recentActivity = [], isLoading: activityLoading } = useQuery<ActivityLog[]>({
    queryKey: ['dashboard', 'recent-activity'],
    queryFn: async () => {
      const supabase = createClient();
      const { data } = await supabase
        .from('activity_log')
        .select('*')
        .order('created_at', { ascending: false })
        .limit(5);
      return (data ?? []) as ActivityLog[];
    },
    staleTime: 30 * 1000,
  });

  // Derived counts
  const counts = useMemo(() => {
    const all = projects.length;
    const in_progress = projects.filter((p) => p.status === 'in_progress').length;
    const completed = projects.filter((p) => p.status === 'completed').length;
    const archived = projects.filter((p) => p.status === 'archived').length;
    const favorites = projects.filter((p) => isFavorite(p.id)).length;
    return { all, in_progress, completed, archived, favorites };
  }, [projects, isFavorite]);

  const filters: { label: string; value: StatusFilter; count: number; icon?: React.ElementType }[] = [
    { label: 'Todos', value: 'all', count: counts.all },
    { label: 'En progreso', value: 'in_progress', count: counts.in_progress },
    { label: 'Completados', value: 'completed', count: counts.completed },
    { label: 'Archivados', value: 'archived', count: counts.archived },
    { label: 'Favoritos', value: 'favorites', count: counts.favorites, icon: Star },
  ];

  // Filter + search + sort
  const filtered = useMemo(() => {
    let result = projects;

    if (activeFilter === 'favorites') {
      result = result.filter((p) => isFavorite(p.id));
    } else if (activeFilter !== 'all') {
      result = result.filter((p) => p.status === activeFilter);
    }

    if (debouncedSearch.trim()) {
      const q = debouncedSearch.toLowerCase();
      result = result.filter(
        (p) =>
          p.title.toLowerCase().includes(q) ||
          (p.client_name && p.client_name.toLowerCase().includes(q)) ||
          (p.style && p.style.toLowerCase().includes(q)) ||
          (p.tags && p.tags.some((t: string) => t.toLowerCase().includes(q))),
      );
    }

    if (sort === 'name_asc') {
      result = [...result].sort((a, b) => a.title.localeCompare(b.title));
    }

    return result;
  }, [projects, activeFilter, debouncedSearch, sort, isFavorite]);

  const firstName = profile?.full_name?.split(' ')[0] ?? '';

  function formatTokens(n: number): string {
    if (n >= 1_000_000) return `${(n / 1_000_000).toFixed(1)}M`;
    if (n >= 1_000) return `${(n / 1_000).toFixed(1)}k`;
    return String(n);
  }

  return (
    <div className="h-full overflow-y-auto bg-background p-6">
      {/* Greeting */}
      <div className="mb-8">
        <h1 className="text-2xl font-semibold text-foreground">
          {getGreeting()}{firstName ? `, ${firstName}` : ''}
        </h1>
        <p className="mt-1 text-sm text-muted-foreground">
          Gestiona tus proyectos y sigue tu progreso
        </p>
      </div>

      {/* Stats */}
      {projectsLoading ? (
        <div className="mb-8">
          <StatsSkeleton />
        </div>
      ) : (
        <div className="mb-8 grid grid-cols-1 gap-4 sm:grid-cols-2 lg:grid-cols-4">
          <StatCard
            icon={FolderOpen}
            value={projects.length}
            label="Proyectos"
            accent="bg-primary/10 text-primary"
            href="/dashboard"
          />
          <StatCard
            icon={CheckSquare}
            value={pendingTasksCount}
            label="Tareas pendientes"
            accent="bg-amber-500/10 text-amber-400"
          />
          <StatCard
            icon={Activity}
            value={counts.in_progress}
            label="En progreso"
            accent="bg-emerald-500/10 text-emerald-400"
          />
          <StatCard
            icon={Zap}
            value={formatTokens(tokensThisMonth)}
            label="Tokens este mes"
            accent="bg-purple-500/10 text-purple-400"
            href="/settings"
          />
        </div>
      )}

      {/* Header row: title + search + actions */}
      <div className="mb-6 flex flex-col gap-4 sm:flex-row sm:items-center sm:justify-between">
        <div className="flex items-center gap-3">
          <h2 className="text-2xl font-semibold text-foreground">Proyectos</h2>
          {!projectsLoading && (
            <span className="inline-flex items-center justify-center rounded-full bg-primary/10 px-2.5 py-0.5 text-xs font-semibold text-primary">
              {projects.length}
            </span>
          )}
        </div>
        <div className="flex items-center gap-2">
          {/* Search */}
          <div className="relative">
            <Search className="absolute left-3 top-1/2 h-4 w-4 -translate-y-1/2 text-muted-foreground" />
            <input
              type="text"
              placeholder="Buscar proyecto..."
              value={search}
              onChange={(e) => setSearch(e.target.value)}
              className={cn(
                'h-9 w-full rounded-lg border border-border bg-input pl-9 pr-3 text-sm text-foreground',
                'placeholder:text-muted-foreground',
                'transition focus:border-primary focus:outline-none focus:ring-2 focus:ring-primary/20',
                'sm:w-56',
              )}
            />
          </div>
          <Link href="/new">
            <Button size="md" startContent={<Plus className="h-4 w-4" />} className="rounded-md">
              <span className="hidden sm:inline">Nuevo Proyecto</span>
            </Button>
          </Link>
          <Link href="/new?mode=ai">
            <Button variant="secondary" size="md" startContent={<Sparkles className="h-4 w-4" />} className="rounded-md">
              <span className="hidden sm:inline">Generar con IA</span>
            </Button>
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
                'flex items-center gap-1.5 rounded-full px-3.5 py-1.5 text-xs font-medium transition',
                activeFilter === f.value
                  ? 'bg-primary text-white shadow-sm'
                  : 'bg-card text-muted-foreground hover:bg-secondary hover:text-foreground',
              )}
            >
              {f.icon && <f.icon className="h-3 w-3" />}
              {f.label}
              <span
                className={cn(
                  'inline-flex items-center justify-center rounded-full px-1.5 text-[10px] font-semibold',
                  activeFilter === f.value
                    ? 'bg-white/20 text-white'
                    : 'bg-secondary text-muted-foreground',
                )}
              >
                {f.count}
              </span>
            </button>
          ))}
        </div>
        <div className="relative">
          <ArrowDownWideNarrow className="absolute left-3 top-1/2 h-3.5 w-3.5 -translate-y-1/2 text-muted-foreground" />
          <select
            value={sort}
            onChange={(e) => setSort(e.target.value as SortOption)}
            className={cn(
              'h-8 appearance-none rounded-lg border border-border bg-input pl-8 pr-8 text-xs text-muted-foreground',
              'transition focus:border-primary focus:outline-none focus:ring-2 focus:ring-primary/20',
            )}
          >
            {SORT_OPTIONS.map((opt) => (
              <option key={opt.value} value={opt.value}>
                {opt.label}
              </option>
            ))}
          </select>
        </div>
      </div>

      {/* Content */}
      {projectsLoading ? (
        <div className="grid grid-cols-1 gap-6 sm:grid-cols-2 lg:grid-cols-3">
          <SkeletonCard />
          <SkeletonCard />
          <SkeletonCard />
          <SkeletonCard />
          <SkeletonCard />
          <SkeletonCard />
        </div>
      ) : (
        <ProjectGrid projects={filtered} />
      )}

      {/* Recent Activity */}
      <div className="mt-8 rounded-xl border border-border bg-card p-6">
        <div className="mb-4 flex items-center justify-between">
          <h3 className="text-sm font-semibold uppercase tracking-wider text-muted-foreground">
            Actividad reciente
          </h3>
        </div>
        {activityLoading ? (
          <ActivitySkeleton />
        ) : recentActivity.length === 0 ? (
          <div className="flex flex-col items-center py-8 text-center">
            <Clock className="h-8 w-8 text-muted-foreground/40" />
            <p className="mt-2 text-sm text-muted-foreground">No hay actividad reciente</p>
          </div>
        ) : (
          <div className="space-y-1">
            {recentActivity.map((entry) => (
              <div
                key={entry.id}
                className="flex items-center gap-3 rounded-lg border-b border-border p-2 last:border-0 transition hover:bg-secondary"
              >
                <div className="flex h-8 w-8 shrink-0 items-center justify-center rounded-lg bg-primary/10">
                  <Activity className="h-4 w-4 text-primary" />
                </div>
                <div className="min-w-0 flex-1">
                  <p className="truncate text-sm text-foreground">
                    <span className="font-medium">{entry.action}</span>
                    {' '}
                    <span className="text-muted-foreground">{entry.entity_type}</span>
                  </p>
                </div>
                <span className="shrink-0 text-xs text-muted-foreground">
                  {entry.created_at
                    ? formatDistanceToNow(new Date(entry.created_at), { addSuffix: true, locale: es })
                    : ''}
                </span>
              </div>
            ))}
          </div>
        )}
      </div>
    </div>
  );
}
