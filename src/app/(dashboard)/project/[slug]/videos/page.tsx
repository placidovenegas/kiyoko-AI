'use client';

import { useState, useEffect, useCallback } from 'react';
import { useProject } from '@/contexts/ProjectContext';
import { createClient } from '@/lib/supabase/client';
import { toast } from 'sonner';
import { cn } from '@/lib/utils/cn';
import { KButton } from '@/components/ui/kiyoko-button';
import {
  Plus, Sparkles, Video, Calendar, Clock, Copy, Trash2,
  MoreVertical, Check, ArrowRight,
} from 'lucide-react';
import Link from 'next/link';
import { VideoCreateModal } from '@/components/videos/VideoCreateModal';
import { useActiveVideoStore } from '@/stores/useActiveVideoStore';

interface VideoItem {
  id: string;
  name: string;
  slug: string;
  description: string | null;
  target_duration_seconds: number;
  platform: string;
  is_primary: boolean;
  sort_order: number;
  status: string;
  aspect_ratio: string;
  created_at: string;
}

const PLATFORM_LABELS: Record<string, string> = {
  youtube: 'YouTube',
  instagram_reels: 'Instagram Reels',
  tiktok: 'TikTok',
  tv_commercial: 'TV',
  tv: 'TV',
  web: 'Web',
  custom: 'Custom',
};

const STATUS_LABELS: Record<string, string> = {
  draft: 'Borrador',
  planning: 'Planificando',
  in_progress: 'En progreso',
  review: 'Revisión',
  approved: 'Aprobado',
  published: 'Publicado',
};

const STATUS_COLORS: Record<string, string> = {
  draft: 'bg-gray-500/20 text-gray-400',
  planning: 'bg-blue-500/20 text-blue-400',
  in_progress: 'bg-amber-500/20 text-amber-400',
  review: 'bg-purple-500/20 text-purple-400',
  approved: 'bg-green-500/20 text-green-400',
  published: 'bg-cyan-500/20 text-cyan-400',
};

export default function VideosPage() {
  const { project, loading: projectLoading } = useProject();
  const { triggerRefresh } = useActiveVideoStore();
  const [videos, setVideos] = useState<VideoItem[]>([]);
  const [loading, setLoading] = useState(true);
  const [createModalOpen, setCreateModalOpen] = useState(false);
  const [menuOpenId, setMenuOpenId] = useState<string | null>(null);

  const fetchVideos = useCallback(async () => {
    if (!project?.id) return;
    setLoading(true);
    const supabase = createClient();
    const { data, error } = await supabase
      .from('video_cuts')
      .select('*')
      .eq('project_id', project.id)
      .order('sort_order');

    if (!error) {
      setVideos((data as VideoItem[]) ?? []);
    }
    setLoading(false);
  }, [project?.id]);

  useEffect(() => {
    if (!projectLoading && project?.id) fetchVideos();
  }, [fetchVideos, projectLoading, project?.id]);

  const handleDuplicate = async (video: VideoItem) => {
    if (!project?.id) return;
    const supabase = createClient();

    const slug = video.name.toLowerCase().replace(/[^a-z0-9]+/g, '-').replace(/^-|-$/g, '') + '-copy-' + Math.random().toString(36).slice(2, 8);
    const { error } = await supabase.from('video_cuts').insert({
      project_id: project.id,
      name: `${video.name} (copia)`,
      slug,
      description: video.description,
      target_duration_seconds: video.target_duration_seconds,
      platform: video.platform,
      aspect_ratio: video.aspect_ratio,
      status: 'draft',
      sort_order: videos.length,
    });

    if (error) {
      toast.error('Error al duplicar video');
    } else {
      toast.success('Video duplicado');
      fetchVideos();
      triggerRefresh();
    }
    setMenuOpenId(null);
  };

  const handleDelete = async (videoId: string) => {
    if (!confirm('¿Eliminar este video? Esta acción no se puede deshacer.')) return;
    const supabase = createClient();
    const { error } = await supabase.from('video_cuts').delete().eq('id', videoId);

    if (error) {
      toast.error('Error al eliminar video');
    } else {
      toast.success('Video eliminado');
      fetchVideos();
      triggerRefresh();
    }
    setMenuOpenId(null);
  };

  if (loading || projectLoading) {
    return (
      <div className="space-y-6 p-6">
        <div className="h-8 w-48 animate-pulse rounded-lg bg-surface-secondary" />
        <div className="grid grid-cols-1 gap-4 sm:grid-cols-2 lg:grid-cols-3">
          {Array.from({ length: 3 }).map((_, i) => (
            <div key={i} className="h-56 animate-pulse rounded-xl bg-surface-secondary" />
          ))}
        </div>
      </div>
    );
  }

  return (
    <div className="space-y-6 p-6">
      {/* Header */}
      <div className="flex items-center justify-between">
        <div>
          <h2 className="text-lg font-bold text-foreground">Videos</h2>
          <p className="text-sm text-foreground-muted">
            {videos.length} video{videos.length !== 1 ? 's' : ''} en el proyecto
          </p>
        </div>
        <div className="flex gap-2">
          <KButton
            variant="ai"
            size="md"
            icon={<Sparkles className="h-4 w-4" />}
            onClick={() => toast.info('Próximamente: generar video con IA desde brief')}
          >
            Generar con IA
          </KButton>
          <KButton
            size="md"
            icon={<Plus className="h-4 w-4" />}
            onClick={() => setCreateModalOpen(true)}
          >
            Nuevo video
          </KButton>
        </div>
      </div>

      {/* Grid */}
      {videos.length === 0 ? (
        <div className="flex flex-col items-center justify-center rounded-xl border border-dashed border-surface-tertiary py-20">
          <Video className="mb-3 h-12 w-12 text-foreground-muted/30" />
          <h3 className="mb-1 text-lg font-semibold text-foreground">No hay videos</h3>
          <p className="mb-6 max-w-sm text-center text-sm text-foreground-muted">
            Los videos son producciones individuales dentro del proyecto.
            Crea tu primer video para organizar escenas por plataforma y duración.
          </p>
          <div className="flex gap-3">
            <KButton
              variant="ai"
              icon={<Sparkles className="h-4 w-4" />}
              onClick={() => toast.info('Próximamente')}
            >
              Generar con IA
            </KButton>
            <KButton
              icon={<Plus className="h-4 w-4" />}
              onClick={() => setCreateModalOpen(true)}
            >
              Crear primer video
            </KButton>
          </div>
        </div>
      ) : (
        <div className="grid grid-cols-1 gap-4 sm:grid-cols-2 lg:grid-cols-3">
          {videos.map((video) => (
            <Link
              key={video.id}
              href={`/project/${project!.slug}/video/${video.slug}`}
              className={cn(
                'group relative block rounded-xl border bg-surface transition',
                'border-surface-tertiary hover:border-brand-500/30 hover:shadow-lg',
              )}
            >
              {/* Thumbnail */}
              <div className="flex aspect-video items-center justify-center rounded-t-xl bg-surface-tertiary">
                <Video className="h-10 w-10 text-foreground-muted/20" />
              </div>

              {/* Primary badge */}
              {video.is_primary && (
                <div className="absolute left-3 top-3 flex items-center gap-1 rounded-full bg-brand-500 px-2 py-0.5 text-[10px] font-bold text-white">
                  <Check className="h-3 w-3" /> Principal
                </div>
              )}

              {/* Menu */}
              <div className="absolute right-2 top-2">
                <button
                  onClick={(e) => {
                    e.stopPropagation();
                    setMenuOpenId(menuOpenId === video.id ? null : video.id);
                  }}
                  className="flex h-7 w-7 items-center justify-center rounded-lg bg-black/40 text-white opacity-0 backdrop-blur-sm transition group-hover:opacity-100"
                >
                  <MoreVertical className="h-4 w-4" />
                </button>
                {menuOpenId === video.id && (
                  <div className="absolute right-0 top-8 z-20 w-40 rounded-lg border border-surface-tertiary bg-surface p-1 shadow-xl">
                    <button
                      onClick={() => handleDuplicate(video)}
                      className="flex w-full items-center gap-2 rounded-md px-3 py-2 text-sm text-foreground-secondary transition hover:bg-surface-secondary"
                    >
                      <Copy className="h-3.5 w-3.5" /> Duplicar
                    </button>
                    <button
                      onClick={() => handleDelete(video.id)}
                      className="flex w-full items-center gap-2 rounded-md px-3 py-2 text-sm text-red-400 transition hover:bg-red-500/10"
                    >
                      <Trash2 className="h-3.5 w-3.5" /> Eliminar
                    </button>
                  </div>
                )}
              </div>

              <div className="p-4">
                {/* Title + status */}
                <div className="flex items-start justify-between gap-2">
                  <h3 className="text-sm font-semibold text-foreground">{video.name}</h3>
                  <span className={cn('shrink-0 rounded-full px-2 py-0.5 text-[10px] font-medium', STATUS_COLORS[video.status] ?? 'bg-gray-500/20 text-gray-400')}>
                    {STATUS_LABELS[video.status] ?? video.status}
                  </span>
                </div>

                {/* Platform + duration + aspect */}
                <div className="mt-2 flex items-center gap-3 text-xs text-foreground-muted">
                  <span>{PLATFORM_LABELS[video.platform] ?? video.platform}</span>
                  <span className="inline-flex items-center gap-0.5">
                    <Clock className="h-3 w-3" />
                    {video.target_duration_seconds}s
                  </span>
                  {video.aspect_ratio && <span>{video.aspect_ratio}</span>}
                </div>

                {/* Created date */}
                <div className="mt-2 flex items-center gap-3 text-xs text-foreground-muted">
                  <span className="inline-flex items-center gap-0.5">
                    <Calendar className="h-3 w-3" />
                    {new Date(video.created_at).toLocaleDateString('es-ES', { day: 'numeric', month: 'short', year: 'numeric' })}
                  </span>
                </div>
              </div>
            </Link>
          ))}
        </div>
      )}

      {/* Create Modal */}
      {project?.id && (
        <VideoCreateModal
          open={createModalOpen}
          onClose={() => setCreateModalOpen(false)}
          projectId={project.id}
          onCreated={() => { fetchVideos(); triggerRefresh(); }}
        />
      )}
    </div>
  );
}
