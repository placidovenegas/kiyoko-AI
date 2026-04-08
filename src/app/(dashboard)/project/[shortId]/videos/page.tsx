'use client';

import { useState, useRef, useEffect } from 'react';
import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query';
import { useProject } from '@/contexts/ProjectContext';
import { createClient } from '@/lib/supabase/client';
import { queryKeys } from '@/lib/query/keys';
import { toast } from 'sonner';
import { cn } from '@/lib/utils/cn';
import {
  Plus, Clock, MoreHorizontal, Copy, Trash2,
  Pencil, ExternalLink, CheckCircle2, Video, Sparkles,
} from 'lucide-react';
import Link from 'next/link';
import { VideoCreateModal } from '@/components/modals';
import { useActiveVideoStore } from '@/stores/useActiveVideoStore';
import { generateShortId } from '@/lib/utils/nanoid';
import type { Video as VideoType } from '@/types';

/* ── Constants ────────────────────────────────────────── */

const PLATFORM_ICONS: Record<string, string> = {
  youtube: '📺', instagram_reels: '📸', tiktok: '📱',
  tv_commercial: '📡', web: '🌐', custom: '🎬',
};

const PLATFORM_LABELS: Record<string, string> = {
  youtube: 'YouTube', instagram_reels: 'Instagram Reels', tiktok: 'TikTok',
  tv_commercial: 'TV', web: 'Web', custom: 'Custom',
};

import { VIDEO_STATUS_LABELS, VIDEO_STATUS_BADGE } from '@/lib/constants/status';

const VIDEO_STATUSES = [
  'draft', 'prompting', 'generating', 'review', 'approved', 'exported',
] as const;

type VideoStatusValue = typeof VIDEO_STATUSES[number];

/* ── Video Row Component ──────────────────────────────── */
function VideoRow({
  video,
  projectShortId,
  onDuplicate,
  onDelete,
  onStatusChange,
}: {
  video: VideoType & { scene_count: number };
  projectShortId: string;
  onDuplicate: (v: VideoType) => void;
  onDelete: (id: string) => void;
  onStatusChange: (id: string, status: VideoStatusValue) => void;
}) {
  const targetDuration = video.target_duration_seconds ?? 0;
  const [menuOpen, setMenuOpen] = useState(false);
  const menuRef = useRef<HTMLDivElement>(null);

  useEffect(() => {
    if (!menuOpen) return;
    const handler = (e: MouseEvent) => {
      if (menuRef.current && !menuRef.current.contains(e.target as Node)) {
        setMenuOpen(false);
      }
    };
    document.addEventListener('mousedown', handler);
    return () => document.removeEventListener('mousedown', handler);
  }, [menuOpen]);

  return (
    <div className="group relative rounded-xl border border-border bg-card p-4 transition-colors hover:border-primary/20">
      <Link
        href={`/project/${projectShortId}/video/${video.short_id}`}
        className="absolute inset-0 rounded-xl"
        aria-label={video.title}
      />

      <div className="flex items-start justify-between gap-4">
        {/* Left: platform icon + info */}
        <div className="flex items-start gap-3 min-w-0">
          <div className="flex h-10 w-10 shrink-0 items-center justify-center rounded-lg border border-border bg-secondary text-xl">
            {PLATFORM_ICONS[video.platform] ?? '🎬'}
          </div>
          <div className="min-w-0">
            <div className="flex items-center gap-2 flex-wrap">
              <h3 className="text-sm font-medium text-foreground truncate">
                {video.title}
              </h3>
              {video.is_primary && (
                <span className="shrink-0 flex items-center gap-1 rounded-full bg-primary/10 px-2 py-0.5 text-[10px] font-medium text-primary">
                  <CheckCircle2 className="h-3 w-3" /> Principal
                </span>
              )}
            </div>
            <div className="mt-1 flex items-center gap-3 text-xs text-muted-foreground flex-wrap">
              <span>{PLATFORM_LABELS[video.platform] ?? video.platform}</span>
              {video.aspect_ratio && <span className="font-mono">{video.aspect_ratio}</span>}
              {targetDuration > 0 && (
                <span className="flex items-center gap-1">
                  <Clock className="h-3 w-3" />
                  {targetDuration}s objetivo
                </span>
              )}
            </div>
          </div>
        </div>

        {/* Right: status + menu */}
        <div className="flex shrink-0 items-center gap-2 relative z-10">
          <span className={cn(
            'rounded-full px-2.5 py-0.5 text-[11px] font-medium',
            VIDEO_STATUS_BADGE[video.status] ?? 'bg-muted-foreground/15 text-muted-foreground'
          )}>
            {VIDEO_STATUS_LABELS[video.status] ?? video.status}
          </span>
          <div ref={menuRef} className="relative">
            <button
              onClick={(e) => { e.preventDefault(); setMenuOpen(!menuOpen); }}
              className="flex h-7 w-7 items-center justify-center rounded-lg text-muted-foreground opacity-0 transition hover:bg-accent hover:text-foreground group-hover:opacity-100"
            >
              <MoreHorizontal className="h-4 w-4" />
            </button>
            {menuOpen && (
              <div className="absolute right-0 top-8 z-50 w-48 rounded-lg border border-border bg-card py-1 shadow-lg">
                <a
                  href={`/project/${projectShortId}/video/${video.short_id}`}
                  className="flex items-center gap-2 px-3 py-2 text-sm text-foreground hover:bg-accent"
                >
                  <ExternalLink className="h-4 w-4" /> Abrir video
                </a>
                <button
                  onClick={() => { onDuplicate(video); setMenuOpen(false); }}
                  className="flex w-full items-center gap-2 px-3 py-2 text-sm text-foreground hover:bg-accent"
                >
                  <Copy className="h-4 w-4" /> Duplicar
                </button>
                <div className="my-1 border-t border-border" />
                {VIDEO_STATUSES.map((s) => (
                  <button
                    key={s}
                    onClick={() => { onStatusChange(video.id, s); setMenuOpen(false); }}
                    className={cn(
                      'flex w-full items-center justify-between px-3 py-1.5 text-sm hover:bg-accent',
                      video.status === s ? 'text-primary font-medium' : 'text-foreground'
                    )}
                  >
                    {VIDEO_STATUS_LABELS[s]}
                    {video.status === s && <CheckCircle2 className="h-3.5 w-3.5" />}
                  </button>
                ))}
                <div className="my-1 border-t border-border" />
                <button
                  onClick={() => { onDelete(video.id); setMenuOpen(false); }}
                  className="flex w-full items-center gap-2 px-3 py-2 text-sm text-red-400 hover:bg-accent"
                >
                  <Trash2 className="h-4 w-4" /> Eliminar
                </button>
              </div>
            )}
          </div>
        </div>
      </div>

      {/* Scene count */}
      <div className="mt-3 text-xs text-muted-foreground">
        {video.scene_count} escena{video.scene_count !== 1 ? 's' : ''}
      </div>
    </div>
  );
}

/* ── Skeleton ─────────────────────────────────────────── */
function VideoSkeleton() {
  return (
    <div className="space-y-3">
      {Array.from({ length: 3 }).map((_, i) => (
        <div key={i} className="h-28 animate-pulse rounded-lg bg-card" />
      ))}
    </div>
  );
}

/* ── Main Page ─────────────────────────────────────────── */
export default function VideosPage() {
  const { project } = useProject();
  const supabase = createClient();
  const queryClient = useQueryClient();
  const { triggerRefresh } = useActiveVideoStore();
  const [createModalOpen, setCreateModalOpen] = useState(false);

  const { data: videos = [], isLoading } = useQuery({
    queryKey: queryKeys.videos.byProject(project?.id ?? ''),
    queryFn: async () => {
      const { data } = await supabase
        .from('videos')
        .select(`
          *,
          scene_count:scenes(count)
        `)
        .eq('project_id', project!.id)
        .order('sort_order');

      return (data ?? []).map((v) => ({
        ...v,
        scene_count: Array.isArray(v.scene_count) ? (v.scene_count[0] as { count: number }).count : 0,
      }));
    },
    enabled: !!project?.id,
  });

  const duplicateMutation = useMutation({
    mutationFn: async (video: VideoType) => {
      const { error } = await supabase.from('videos').insert({
        project_id: project!.id,
        short_id: generateShortId(),
        slug: `${video.slug}-copy-${Date.now().toString(36)}`,
        title: `${video.title} (copia)`,
        description: video.description,
        target_duration_seconds: video.target_duration_seconds,
        platform: video.platform,
        aspect_ratio: video.aspect_ratio,
        status: 'draft' as const,
        sort_order: Math.floor(Date.now() / 1000),
      });
      if (error) throw error;
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: queryKeys.videos.byProject(project?.id ?? '') });
      triggerRefresh();
      toast.success('Vídeo duplicado');
    },
    onError: () => toast.error('Error al duplicar'),
  });

  const deleteMutation = useMutation({
    mutationFn: async (videoId: string) => {
      const { error } = await supabase.from('videos').delete().eq('id', videoId);
      if (error) throw error;
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: queryKeys.videos.byProject(project?.id ?? '') });
      triggerRefresh();
      toast.success('Vídeo eliminado');
    },
    onError: () => toast.error('Error al eliminar'),
  });

  const statusMutation = useMutation({
    mutationFn: async ({ id, status }: { id: string; status: VideoStatusValue }) => {
      const { error } = await supabase.from('videos').update({ status }).eq('id', id);
      if (error) throw error;
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: queryKeys.videos.byProject(project?.id ?? '') });
    },
    onError: () => toast.error('Error al cambiar estado'),
  });

  const handleDelete = (videoId: string) => {
    if (!confirm('¿Eliminar este vídeo? Esta acción no se puede deshacer.')) return;
    deleteMutation.mutate(videoId);
  };

  return (
    <div className="mx-auto max-w-7xl px-4 py-6 space-y-6">
      {/* Header */}
      <div className="flex items-center justify-between">
        <div>
          <h2 className="text-lg font-semibold text-foreground">Vídeos</h2>
          <p className="text-sm text-muted-foreground">
            {videos.length} vídeo{videos.length !== 1 ? 's' : ''}
          </p>
        </div>
        <div className="flex items-center gap-2">
          <button
            onClick={() => toast.success('Generación de video con IA próximamente')}
            className="flex items-center gap-1.5 rounded-lg border border-border px-3 py-2 text-sm font-medium text-muted-foreground transition-colors hover:bg-accent hover:text-foreground"
          >
            <Sparkles className="h-4 w-4" />
            Generar video con IA
          </button>
          <button
            onClick={() => setCreateModalOpen(true)}
            className="flex items-center gap-2 rounded-lg bg-primary px-4 py-2 text-sm font-medium text-white transition-colors hover:bg-primary/90"
          >
            <Plus className="h-4 w-4" />
            Nuevo vídeo
          </button>
        </div>
      </div>

      {/* Content */}
      {isLoading ? (
        <VideoSkeleton />
      ) : videos.length === 0 ? (
        <div className="flex flex-col items-center justify-center rounded-xl border border-dashed border-border py-20 text-center">
          <Video className="mb-4 h-12 w-12 text-muted-foreground/20" />
          <h3 className="text-base font-semibold text-foreground">Sin vídeos</h3>
          <p className="mt-1 mb-6 max-w-xs text-sm text-muted-foreground">
            Crea tu primer vídeo para empezar a producir escenas y contenido.
          </p>
          <button
            onClick={() => setCreateModalOpen(true)}
            className="flex items-center gap-2 rounded-lg bg-primary px-4 py-2 text-sm font-medium text-white hover:bg-primary"
          >
            <Plus className="h-4 w-4" />
            Crear primer vídeo
          </button>
        </div>
      ) : (
        <div className="space-y-3">
          {videos.map((video) => (
            <VideoRow
              key={video.id}
              video={{ ...video, scene_count: video.scene_count ?? 0 }}
              projectShortId={project!.short_id}
              onDuplicate={(v) => duplicateMutation.mutate(v)}
              onDelete={handleDelete}
              onStatusChange={(id, status) => statusMutation.mutate({ id, status })}
            />
          ))}
        </div>
      )}

      {/* Create Modal */}
      {project?.id && (
        <VideoCreateModal
          open={createModalOpen}
          onOpenChange={setCreateModalOpen}
          projectId={project.id}
          projectShortId={project.short_id}
          onSuccess={() => {
            queryClient.invalidateQueries({ queryKey: queryKeys.videos.byProject(project.id) });
          }}
        />
      )}
    </div>
  );
}
