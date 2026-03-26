'use client';

import { useState } from 'react';
import { useQuery } from '@tanstack/react-query';
import { useProject } from '@/contexts/ProjectContext';
import { createClient } from '@/lib/supabase/client';
import { queryKeys } from '@/lib/query/keys';
import Link from 'next/link';
import { useParams } from 'next/navigation';
import {
  Plus,
  Calendar,
  LayoutGrid,
  Globe,
  Clock,
  Eye,
  Heart,
  MessageSquare,
  FileText,
  Film,
  Image as ImageIcon,
} from 'lucide-react';
import type { Publication } from '@/types';

type ViewMode = 'grid' | 'calendar';

const STATUS_CONFIG: Record<string, { label: string; color: string; bg: string }> = {
  draft: { label: 'Borrador', color: 'text-muted-foreground', bg: 'bg-zinc-500/10' },
  scheduled: { label: 'Programado', color: 'text-blue-400', bg: 'bg-blue-500/10' },
  published: { label: 'Publicado', color: 'text-emerald-400', bg: 'bg-emerald-500/10' },
  failed: { label: 'Fallido', color: 'text-red-400', bg: 'bg-red-500/10' },
};

const TYPE_ICONS: Record<string, typeof Film> = {
  video: Film,
  image: ImageIcon,
  carousel: LayoutGrid,
  story: FileText,
};

function formatDate(dateStr: string | null): string {
  if (!dateStr) return '-';
  return new Date(dateStr).toLocaleDateString('es-ES', {
    day: 'numeric',
    month: 'short',
    year: 'numeric',
    hour: '2-digit',
    minute: '2-digit',
  });
}

export default function PublicationsPage() {
  const { project, loading: projectLoading } = useProject();
  const params = useParams();
  const shortId = params.shortId as string;
  const [viewMode, setViewMode] = useState<ViewMode>('grid');

  const { data: publications = [], isLoading } = useQuery({
    queryKey: queryKeys.publications.byProject(project?.id ?? ''),
    queryFn: async () => {
      const supabase = createClient();
      const { data, error } = await supabase
        .from('publications')
        .select('*')
        .eq('project_id', project!.id)
        .order('created_at', { ascending: false });
      if (error) throw error;
      return (data ?? []) as Publication[];
    },
    enabled: !!project?.id,
  });

  const loading = projectLoading || isLoading;

  // ── Loading skeleton ──
  if (loading) {
    return (
      <div className="space-y-6 p-6">
        <div className="flex items-center justify-between">
          <div className="h-8 w-48 animate-pulse rounded-lg bg-secondary" />
          <div className="h-9 w-32 animate-pulse rounded-lg bg-secondary" />
        </div>
        <div className="grid grid-cols-1 gap-4 sm:grid-cols-2 lg:grid-cols-3">
          {Array.from({ length: 6 }).map((_, i) => (
            <div key={i} className="h-48 animate-pulse rounded-xl bg-secondary" />
          ))}
        </div>
      </div>
    );
  }

  return (
    <div className="h-full overflow-y-auto space-y-6 p-6">
      {/* Header */}
      <div className="flex items-center justify-between">
        <div>
          <h1 className="text-lg font-semibold text-foreground">Publicaciones</h1>
          <p className="mt-1 text-sm text-muted-foreground">{publications.length} publicaciones en total</p>
        </div>
        <div className="flex items-center gap-2">
          {/* View toggle */}
          <div className="flex rounded-lg border border-border bg-card">
            <button
              onClick={() => setViewMode('grid')}
              className={`rounded-l-lg px-3 py-1.5 text-xs transition ${viewMode === 'grid' ? 'bg-primary text-white' : 'text-muted-foreground hover:text-foreground'}`}
            >
              <LayoutGrid className="h-4 w-4" />
            </button>
            <button
              onClick={() => setViewMode('calendar')}
              className={`rounded-r-lg px-3 py-1.5 text-xs transition ${viewMode === 'calendar' ? 'bg-primary text-white' : 'text-muted-foreground hover:text-foreground'}`}
            >
              <Calendar className="h-4 w-4" />
            </button>
          </div>
          <Link
            href={`/project/${shortId}/publications/new`}
            className="inline-flex items-center gap-1.5 rounded-lg bg-primary px-3 py-2 text-sm font-medium text-white transition hover:bg-primary/90"
          >
            <Plus className="h-4 w-4" /> Nueva publicacion
          </Link>
        </div>
      </div>

      {/* ── Empty state ── */}
      {publications.length === 0 && (
        <div className="flex flex-col items-center justify-center rounded-xl border border-dashed border-border bg-card py-16">
          <Globe className="mb-3 h-10 w-10 text-muted-foreground/30" />
          <h3 className="mb-1 text-lg font-semibold text-foreground">Sin publicaciones</h3>
          <p className="mb-4 max-w-sm text-center text-sm text-muted-foreground">
            Crea tu primera publicacion para compartir tu contenido en redes sociales
          </p>
          <Link
            href={`/project/${shortId}/publications/new`}
            className="inline-flex items-center gap-1.5 rounded-lg bg-primary px-4 py-2 text-sm font-medium text-white transition hover:bg-primary/90"
          >
            <Plus className="h-4 w-4" /> Crear publicacion
          </Link>
        </div>
      )}

      {/* ── Grid view ── */}
      {viewMode === 'grid' && publications.length > 0 && (
        <div className="grid grid-cols-1 gap-4 sm:grid-cols-2 lg:grid-cols-3">
          {publications.map((pub) => {
            const status = STATUS_CONFIG[pub.status ?? 'draft'] ?? STATUS_CONFIG.draft;
            const TypeIcon = TYPE_ICONS[pub.publication_type] ?? FileText;

            return (
              <Link
                key={pub.id}
                href={`/project/${shortId}/publications/${pub.short_id}`}
                className="group rounded-xl border border-border bg-card p-4 transition hover:border-primary/30"
              >
                {/* Type + Status row */}
                <div className="mb-3 flex items-center justify-between">
                  <div className="flex items-center gap-2">
                    <TypeIcon className="h-4 w-4 text-muted-foreground" />
                    <span className="text-xs font-medium text-muted-foreground capitalize">{pub.publication_type}</span>
                  </div>
                  <span className={`rounded-full px-2 py-0.5 text-[10px] font-medium ${status.bg} ${status.color}`}>
                    {status.label}
                  </span>
                </div>

                {/* Title + description */}
                <h3 className="mb-1 truncate text-sm font-semibold text-foreground group-hover:text-primary transition">
                  {pub.title}
                </h3>
                {pub.description && (
                  <p className="mb-3 line-clamp-2 text-xs text-muted-foreground">{pub.description}</p>
                )}

                {/* Hashtags */}
                {pub.hashtags && pub.hashtags.length > 0 && (
                  <div className="mb-3 flex flex-wrap gap-1">
                    {pub.hashtags.slice(0, 3).map((tag) => (
                      <span key={tag} className="rounded bg-primary/10 px-1.5 py-0.5 text-[10px] text-primary">
                        #{tag}
                      </span>
                    ))}
                    {pub.hashtags.length > 3 && (
                      <span className="text-[10px] text-muted-foreground">+{pub.hashtags.length - 3}</span>
                    )}
                  </div>
                )}

                {/* Footer: date + stats */}
                <div className="flex items-center justify-between border-t border-border pt-3">
                  <div className="flex items-center gap-1 text-[10px] text-muted-foreground">
                    <Clock className="h-3 w-3" />
                    {formatDate(pub.scheduled_at ?? pub.created_at)}
                  </div>
                  <div className="flex items-center gap-3 text-[10px] text-muted-foreground">
                    {pub.views_count != null && pub.views_count > 0 && (
                      <span className="flex items-center gap-0.5"><Eye className="h-3 w-3" />{pub.views_count}</span>
                    )}
                    {pub.likes_count != null && pub.likes_count > 0 && (
                      <span className="flex items-center gap-0.5"><Heart className="h-3 w-3" />{pub.likes_count}</span>
                    )}
                    {pub.comments_count != null && pub.comments_count > 0 && (
                      <span className="flex items-center gap-0.5"><MessageSquare className="h-3 w-3" />{pub.comments_count}</span>
                    )}
                  </div>
                </div>
              </Link>
            );
          })}
        </div>
      )}

      {/* ── Calendar view (simplified) ── */}
      {viewMode === 'calendar' && publications.length > 0 && (
        <div className="rounded-xl border border-border bg-card p-5">
          <p className="mb-4 text-sm text-muted-foreground">Vista de calendario</p>
          <div className="space-y-2">
            {publications.map((pub) => {
              const status = STATUS_CONFIG[pub.status ?? 'draft'] ?? STATUS_CONFIG.draft;
              return (
                <Link
                  key={pub.id}
                  href={`/project/${shortId}/publications/${pub.short_id}`}
                  className="flex items-center gap-3 rounded-lg border border-border bg-background px-4 py-3 transition hover:border-primary/30"
                >
                  <div className="w-28 shrink-0 text-xs font-mono text-muted-foreground">
                    {formatDate(pub.scheduled_at ?? pub.created_at)}
                  </div>
                  <div className="min-w-0 flex-1">
                    <h4 className="truncate text-sm font-medium text-foreground">{pub.title}</h4>
                  </div>
                  <span className={`shrink-0 rounded-full px-2 py-0.5 text-[10px] font-medium ${status.bg} ${status.color}`}>
                    {status.label}
                  </span>
                </Link>
              );
            })}
          </div>
        </div>
      )}
    </div>
  );
}
