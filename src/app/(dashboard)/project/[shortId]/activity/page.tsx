'use client';

import { useQuery } from '@tanstack/react-query';
import { useProject } from '@/contexts/ProjectContext';
import { createClient } from '@/lib/supabase/client';
import {
  Activity,
  Film,
  Image,
  Users,
  Settings,
  MessageSquare,
  Sparkles,
  FileText,
  Trash2,
  Plus,
  Pencil,
  Upload,
} from 'lucide-react';
import type { ActivityLog } from '@/types';

const ACTION_ICONS: Record<string, typeof Activity> = {
  create: Plus,
  update: Pencil,
  delete: Trash2,
  generate: Sparkles,
  upload: Upload,
  publish: FileText,
  comment: MessageSquare,
  settings: Settings,
};

const ENTITY_ICONS: Record<string, typeof Activity> = {
  video: Film,
  scene: Image,
  character: Users,
  project: Settings,
  publication: FileText,
};

function timeAgo(dateStr: string | null): string {
  if (!dateStr) return '';
  const diff = Date.now() - new Date(dateStr).getTime();
  const minutes = Math.floor(diff / 60000);
  if (minutes < 1) return 'Ahora mismo';
  if (minutes < 60) return `Hace ${minutes}m`;
  const hours = Math.floor(minutes / 60);
  if (hours < 24) return `Hace ${hours}h`;
  const days = Math.floor(hours / 24);
  if (days < 7) return `Hace ${days}d`;
  const weeks = Math.floor(days / 7);
  if (weeks < 4) return `Hace ${weeks}sem`;
  return new Date(dateStr).toLocaleDateString('es-ES', { day: 'numeric', month: 'short' });
}

function getActionColor(action: string): string {
  switch (action) {
    case 'create': return 'bg-emerald-500/20 text-emerald-400';
    case 'delete': return 'bg-red-500/20 text-red-400';
    case 'generate': return 'bg-purple-500/20 text-purple-400';
    case 'update': return 'bg-blue-500/20 text-blue-400';
    case 'publish': return 'bg-amber-500/20 text-amber-400';
    default: return 'bg-zinc-500/20 text-zinc-400';
  }
}

export default function ActivityPage() {
  const { project, loading: projectLoading } = useProject();

  const { data: activities = [], isLoading } = useQuery({
    queryKey: ['activity', project?.id],
    queryFn: async () => {
      const supabase = createClient();
      const { data, error } = await supabase
        .from('activity_log')
        .select('*')
        .eq('project_id', project!.id)
        .order('created_at', { ascending: false })
        .limit(100);
      if (error) throw error;
      return (data ?? []) as ActivityLog[];
    },
    enabled: !!project?.id,
  });

  const loading = projectLoading || isLoading;

  // ── Loading skeleton ──
  if (loading) {
    return (
      <div className="space-y-4 p-6">
        <div className="h-8 w-40 animate-pulse rounded-lg bg-card" />
        {Array.from({ length: 8 }).map((_, i) => (
          <div key={i} className="flex gap-3">
            <div className="h-8 w-8 animate-pulse rounded-full bg-card" />
            <div className="flex-1 space-y-1">
              <div className="h-4 w-3/4 animate-pulse rounded bg-card" />
              <div className="h-3 w-24 animate-pulse rounded bg-card" />
            </div>
          </div>
        ))}
      </div>
    );
  }

  return (
    <div className="mx-auto max-w-3xl h-full overflow-y-auto space-y-6 p-6">
      {/* Header */}
      <div>
        <h1 className="text-lg font-semibold text-foreground">Actividad</h1>
        <p className="mt-1 text-sm text-muted-foreground">Historial de acciones recientes en el proyecto</p>
      </div>

      {/* ── Empty state ── */}
      {activities.length === 0 && (
        <div className="flex flex-col items-center justify-center rounded-xl border border-dashed border-border bg-card py-16">
          <Activity className="mb-3 h-10 w-10 text-muted-foreground/30" />
          <h3 className="mb-1 text-lg font-semibold text-foreground">Sin actividad</h3>
          <p className="text-sm text-muted-foreground">Aun no hay acciones registradas en este proyecto</p>
        </div>
      )}

      {/* ── Timeline ── */}
      {activities.length > 0 && (
        <div className="relative">
          {/* Vertical line */}
          <div className="absolute left-4 top-0 bottom-0 w-px bg-secondary" />

          <div className="space-y-1">
            {activities.map((entry) => {
              const ActionIcon = ACTION_ICONS[entry.action] ?? Activity;
              const EntityIcon = ENTITY_ICONS[entry.entity_type] ?? Activity;
              const colorClass = getActionColor(entry.action);

              return (
                <div key={entry.id} className="group relative flex items-start gap-4 rounded-lg px-1 py-3 transition hover:bg-card">
                  {/* Icon node */}
                  <div className={`z-10 flex h-8 w-8 shrink-0 items-center justify-center rounded-full ${colorClass}`}>
                    <ActionIcon className="h-3.5 w-3.5" />
                  </div>

                  {/* Content */}
                  <div className="min-w-0 flex-1">
                    <div className="flex items-start justify-between gap-2">
                      <p className="text-sm text-foreground">{entry.description}</p>
                      <span className="shrink-0 text-xs text-muted-foreground">{timeAgo(entry.created_at)}</span>
                    </div>
                    <div className="mt-1 flex items-center gap-2">
                      <EntityIcon className="h-3 w-3 text-muted-foreground" />
                      <span className="text-xs text-muted-foreground capitalize">{entry.entity_type}</span>
                      {entry.entity_id && (
                        <span className="rounded bg-secondary px-1.5 py-0.5 font-mono text-[10px] text-muted-foreground">
                          {entry.entity_id.slice(0, 8)}
                        </span>
                      )}
                    </div>
                  </div>
                </div>
              );
            })}
          </div>
        </div>
      )}
    </div>
  );
}
