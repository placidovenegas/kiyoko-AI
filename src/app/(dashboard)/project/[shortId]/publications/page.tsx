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
  Clock,
  Eye,
  Heart,
  MessageSquare,
  Globe,
} from 'lucide-react';
import type { Publication } from '@/types';

/* ── Platform mockup preview ── */
function PlatformMockup({ platform, title, caption }: { platform: string; title: string; caption: string }) {
  if (platform === 'instagram') {
    return (
      <div className="rounded-lg border border-border bg-background p-2 mt-2">
        <div className="flex items-center gap-2 mb-2">
          <div className="size-6 rounded-full bg-primary/20" />
          <span className="text-[10px] font-medium text-foreground">kiyoko.ai</span>
        </div>
        <div className="aspect-square bg-muted rounded-md mb-2 flex items-center justify-center">
          <span className="text-xs text-muted-foreground/40">Imagen</span>
        </div>
        <p className="text-[10px] text-muted-foreground line-clamp-2">{caption}</p>
      </div>
    );
  }
  if (platform === 'tiktok') {
    return (
      <div className="rounded-lg border border-border bg-background p-2 mt-2">
        <div className="aspect-[9/16] max-h-32 bg-muted rounded-md mb-2 flex items-center justify-center relative">
          <span className="text-xs text-muted-foreground/40">Video 9:16</span>
          <div className="absolute bottom-1 left-1 right-1">
            <p className="text-[8px] text-white bg-black/50 rounded px-1 py-0.5 line-clamp-1">{caption}</p>
          </div>
        </div>
        <div className="flex items-center gap-2">
          <div className="size-5 rounded-full bg-primary/20" />
          <span className="text-[10px] font-medium text-foreground">@kiyoko.ai</span>
        </div>
      </div>
    );
  }
  if (platform === 'youtube') {
    return (
      <div className="rounded-lg border border-border bg-background p-2 mt-2">
        <div className="aspect-video bg-muted rounded-md mb-2 flex items-center justify-center">
          <span className="text-xs text-muted-foreground/40">Video 16:9</span>
        </div>
        <p className="text-[10px] font-medium text-foreground line-clamp-1">{title}</p>
        <p className="text-[9px] text-muted-foreground mt-0.5">kiyoko.ai &middot; 0 visualizaciones</p>
      </div>
    );
  }
  return null;
}

/* ── Platform config ── */
const PLATFORM_BADGE: Record<string, { label: string; className: string }> = {
  instagram: { label: 'Instagram', className: 'bg-pink-500/10 text-pink-400 border-pink-500/20' },
  tiktok: { label: 'TikTok', className: 'bg-zinc-500/10 text-zinc-300 border-zinc-500/20' },
  youtube: { label: 'YouTube', className: 'bg-red-500/10 text-red-400 border-red-500/20' },
  twitter: { label: 'Twitter', className: 'bg-sky-500/10 text-sky-400 border-sky-500/20' },
};

/* ── Status config ── */
const STATUS_CONFIG: Record<string, { label: string; className: string }> = {
  draft: { label: 'Borrador', className: 'bg-zinc-500/10 text-zinc-400 border-zinc-500/20' },
  scheduled: { label: 'Programado', className: 'bg-blue-500/10 text-blue-400 border-blue-500/20' },
  published: { label: 'Publicado', className: 'bg-emerald-500/10 text-emerald-400 border-emerald-500/20' },
  failed: { label: 'Fallido', className: 'bg-red-500/10 text-red-400 border-red-500/20' },
};

/* ── Type config ── */
const TYPE_BADGE: Record<string, { label: string; className: string }> = {
  video: { label: 'Reel', className: 'bg-violet-500/10 text-violet-400' },
  image: { label: 'Post', className: 'bg-sky-500/10 text-sky-400' },
  carousel: { label: 'Carrusel', className: 'bg-amber-500/10 text-amber-400' },
  story: { label: 'Story', className: 'bg-pink-500/10 text-pink-400' },
};

type PublicationWithPlatform = Publication & { platform?: string };

function formatDate(dateStr: string | null): string {
  if (!dateStr) return '';
  return new Date(dateStr).toLocaleDateString('es-ES', {
    day: 'numeric',
    month: 'short',
    year: 'numeric',
  });
}

export default function PublicationsPage() {
  const { project, loading: projectLoading } = useProject();
  const params = useParams();
  const shortId = params.shortId as string;
  const [showPreview, setShowPreview] = useState<string | null>(null);

  const { data: publications = [], isLoading } = useQuery({
    queryKey: queryKeys.publications.byProject(project?.id ?? ''),
    queryFn: async () => {
      const supabase = createClient();
      const { data, error } = await supabase
        .from('publications')
        .select('*, social_profiles!inner(platform)')
        .eq('project_id', project!.id)
        .order('created_at', { ascending: false });
      if (error) {
        // Fallback without join
        const { data: fallbackData, error: fallbackError } = await supabase
          .from('publications')
          .select('*')
          .eq('project_id', project!.id)
          .order('created_at', { ascending: false });
        if (fallbackError) throw fallbackError;
        return (fallbackData ?? []) as PublicationWithPlatform[];
      }
      return (data ?? []).map((row) => ({
        ...row,
        platform: (row.social_profiles as unknown as { platform: string })?.platform ?? undefined,
      })) as PublicationWithPlatform[];
    },
    enabled: !!project?.id,
  });

  const loading = projectLoading || isLoading;

  /* ── Loading skeleton ── */
  if (loading) {
    return (
      <div className="mx-auto max-w-7xl px-4 py-6 space-y-6">
        <div className="flex items-center justify-between">
          <div className="h-8 w-48 animate-pulse rounded-lg bg-secondary" />
          <div className="h-9 w-40 animate-pulse rounded-lg bg-secondary" />
        </div>
        <div className="grid grid-cols-1 gap-4 sm:grid-cols-2 lg:grid-cols-3">
          {Array.from({ length: 6 }).map((_, i) => (
            <div key={i} className="h-44 animate-pulse rounded-xl bg-secondary" />
          ))}
        </div>
      </div>
    );
  }

  return (
    <div className="mx-auto max-w-7xl px-4 py-6 space-y-6">
      {/* ── Header ── */}
      <div className="flex items-center justify-between">
        <div className="flex items-center gap-3">
          <h1 className="text-2xl font-semibold tracking-tight text-foreground">Publicaciones</h1>
          <span className="rounded-full bg-secondary px-2.5 py-0.5 text-xs font-medium text-muted-foreground">
            {publications.length}
          </span>
        </div>
        <Link
          href={`/project/${shortId}/publications/new`}
          className="inline-flex items-center gap-1.5 rounded-lg bg-primary px-3 py-2 text-sm font-medium text-white transition hover:bg-primary/90"
        >
          <Plus className="h-4 w-4" />
          Nueva publicacion
        </Link>
      </div>

      {/* ── Empty state ── */}
      {publications.length === 0 && (
        <div className="flex flex-col items-center justify-center rounded-xl border border-dashed border-border bg-card py-16">
          <Globe className="mb-3 h-10 w-10 text-muted-foreground/30" />
          <h3 className="mb-1 text-lg font-semibold text-foreground">Sin publicaciones</h3>
          <p className="mb-4 max-w-sm text-center text-sm text-muted-foreground">
            Crea tu primera publicacion para compartir tu contenido en redes sociales.
          </p>
          <Link
            href={`/project/${shortId}/publications/new`}
            className="inline-flex items-center gap-1.5 rounded-lg bg-primary px-4 py-2 text-sm font-medium text-white transition hover:bg-primary/90"
          >
            <Plus className="h-4 w-4" />
            Crear publicacion
          </Link>
        </div>
      )}

      {/* ── Publication cards grid ── */}
      {publications.length > 0 && (
        <div className="grid grid-cols-1 gap-4 sm:grid-cols-2 lg:grid-cols-3">
          {publications.map((pub) => {
            const status = STATUS_CONFIG[pub.status ?? 'draft'] ?? STATUS_CONFIG.draft;
            const typeBadge = TYPE_BADGE[pub.publication_type] ?? TYPE_BADGE.image;
            const platformBadge = pub.platform
              ? PLATFORM_BADGE[pub.platform.toLowerCase()] ?? null
              : null;

            return (
              <Link
                key={pub.id}
                href={`/project/${shortId}/publications/${pub.short_id}`}
                className="group rounded-xl border border-border bg-card p-4 transition hover:border-primary/20"
              >
                {/* Row 1: Platform + Title + Status */}
                <div className="mb-2 flex items-start justify-between gap-2">
                  <div className="flex items-center gap-2 min-w-0">
                    {platformBadge && (
                      <span className={`shrink-0 rounded-md border px-1.5 py-0.5 text-[10px] font-medium ${platformBadge.className}`}>
                        {platformBadge.label}
                      </span>
                    )}
                    <h3 className="truncate text-sm font-semibold text-foreground group-hover:text-primary transition">
                      {pub.title}
                    </h3>
                  </div>
                  <span className={`shrink-0 rounded-full border px-2 py-0.5 text-[10px] font-medium ${status.className}`}>
                    {status.label}
                  </span>
                </div>

                {/* Row 2: Caption (2 lines max) */}
                {(pub.caption ?? pub.description) && (
                  <p className="mb-2 line-clamp-2 text-xs text-muted-foreground">
                    {pub.caption ?? pub.description}
                  </p>
                )}

                {/* Row 3: Hashtags */}
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

                {/* Preview toggle */}
                {platformBadge && (
                  <div>
                    <button
                      type="button"
                      onClick={(e) => {
                        e.preventDefault();
                        e.stopPropagation();
                        setShowPreview(showPreview === pub.id ? null : pub.id);
                      }}
                      className="text-[10px] text-primary hover:text-primary/80 transition-colors"
                    >
                      {showPreview === pub.id ? 'Ocultar preview' : 'Ver preview'}
                    </button>
                    {showPreview === pub.id && (
                      <PlatformMockup
                        platform={(pub.platform ?? '').toLowerCase()}
                        title={pub.title}
                        caption={pub.caption ?? pub.description ?? ''}
                      />
                    )}
                  </div>
                )}

                {/* Row 4: Date + Type + Stats */}
                <div className="flex items-center justify-between border-t border-border pt-3">
                  <div className="flex items-center gap-2">
                    <span className="flex items-center gap-1 text-[10px] text-muted-foreground">
                      <Clock className="h-3 w-3" />
                      {formatDate(pub.scheduled_at ?? pub.created_at)}
                    </span>
                    <span className={`rounded px-1.5 py-0.5 text-[10px] font-medium ${typeBadge.className}`}>
                      {typeBadge.label}
                    </span>
                  </div>
                  <div className="flex items-center gap-2.5 text-[10px] text-muted-foreground">
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
    </div>
  );
}
