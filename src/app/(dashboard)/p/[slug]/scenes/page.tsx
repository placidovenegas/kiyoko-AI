'use client';

import { useState, useEffect, useMemo, useRef } from 'react';
import { useParams } from 'next/navigation';
import { createClient } from '@/lib/supabase/client';
import { CopyButton } from '@/components/ui/CopyButton';
import { toast } from 'sonner';
import { IconUpload, IconX, IconPhoto } from '@tabler/icons-react';
import type { Scene, SceneType, ArcPhase } from '@/types/scene';

const TYPE_FILTERS: { label: string; value: string; color: string }[] = [
  { label: 'Todas', value: 'all', color: '' },
  { label: 'Originales', value: 'original', color: 'bg-scene-original' },
  { label: 'Mejoradas', value: 'improved', color: 'bg-scene-improved' },
  { label: 'Nuevas', value: 'new', color: 'bg-scene-new' },
  { label: 'Relleno', value: 'filler', color: 'bg-scene-filler' },
  { label: 'Video', value: 'video', color: 'bg-scene-video' },
];

const ARC_FILTERS: { label: string; value: string }[] = [
  { label: 'Todas', value: 'all' },
  { label: 'Gancho', value: 'hook' },
  { label: 'Desarrollo', value: 'build' },
  { label: 'Climax', value: 'peak' },
  { label: 'Cierre', value: 'close' },
];

const TYPE_BADGE_COLORS: Record<SceneType, string> = {
  original: 'bg-scene-original/20 text-scene-original',
  improved: 'bg-scene-improved/20 text-scene-improved',
  new: 'bg-scene-new/20 text-scene-new',
  filler: 'bg-scene-filler/20 text-scene-filler',
  video: 'bg-scene-video/20 text-scene-video',
};

const ARC_BADGE_COLORS: Record<ArcPhase, string> = {
  hook: 'bg-amber-500/20 text-amber-400',
  build: 'bg-blue-500/20 text-blue-400',
  peak: 'bg-red-500/20 text-red-400',
  close: 'bg-emerald-500/20 text-emerald-400',
};

const STATUS_BADGE_COLORS: Record<string, string> = {
  draft: 'bg-gray-500/20 text-gray-400',
  prompt_ready: 'bg-yellow-500/20 text-yellow-400',
  generating: 'bg-purple-500/20 text-purple-400',
  generated: 'bg-green-500/20 text-green-400',
  approved: 'bg-brand-500/20 text-brand-500',
  rejected: 'bg-red-500/20 text-red-400',
};

export default function ScenesPage() {
  const params = useParams();
  const slug = params.slug as string;

  const [scenes, setScenes] = useState<Scene[]>([]);
  const [loading, setLoading] = useState(true);
  const [activeTypeFilter, setActiveTypeFilter] = useState('all');
  const [activeArcFilter, setActiveArcFilter] = useState('all');
  const [expandedId, setExpandedId] = useState<string | null>(null);
  const [projectId, setProjectId] = useState<string | null>(null);
  const [uploadingId, setUploadingId] = useState<string | null>(null);
  const fileInputRefs = useRef<Record<string, HTMLInputElement | null>>({});

  useEffect(() => {
    if (!slug) return;
    const supabase = createClient();

    async function fetchScenes() {
      setLoading(true);

      // First get project_id from slug
      const { data: proj } = await supabase
        .from('projects')
        .select('id')
        .eq('slug', slug)
        .single();

      if (proj) {
        setProjectId(proj.id);
        const { data } = await supabase
          .from('scenes')
          .select('*')
          .eq('project_id', proj.id)
          .order('sort_order', { ascending: true });

        setScenes((data as Scene[]) ?? []);
      }

      setLoading(false);
    }

    fetchScenes();
  }, [slug]);

  const filteredScenes = useMemo(() => {
    return scenes.filter((scene) => {
      if (activeTypeFilter !== 'all' && scene.scene_type !== activeTypeFilter) return false;
      if (activeArcFilter !== 'all' && scene.arc_phase !== activeArcFilter) return false;
      return true;
    });
  }, [scenes, activeTypeFilter, activeArcFilter]);

  async function handleImageUpload(sceneId: string, file: File) {
    if (!projectId) return;
    setUploadingId(sceneId);

    try {
      const supabase = createClient();
      const fileExt = file.name.split('.').pop();
      const filePath = `${projectId}/generated/images/${sceneId}.${fileExt}`;

      const { error: uploadError } = await supabase.storage
        .from('project-assets')
        .upload(filePath, file, { cacheControl: '3600', upsert: true });

      if (uploadError) throw uploadError;

      const { data: { publicUrl } } = supabase.storage
        .from('project-assets')
        .getPublicUrl(filePath);

      const { error: updateError } = await supabase
        .from('scenes')
        .update({
          generated_image_url: publicUrl,
          generated_image_path: filePath,
        })
        .eq('id', sceneId);

      if (updateError) throw updateError;

      setScenes((prev) =>
        prev.map((s) =>
          s.id === sceneId
            ? { ...s, generated_image_url: publicUrl, generated_image_path: filePath }
            : s
        )
      );

      toast.success('Imagen subida');
    } catch (err) {
      console.error(err);
      toast.error('Error al subir imagen');
    } finally {
      setUploadingId(null);
    }
  }

  async function handleImageDelete(sceneId: string, filePath: string) {
    if (!projectId) return;

    try {
      const supabase = createClient();

      const { error: deleteError } = await supabase.storage
        .from('project-assets')
        .remove([filePath]);

      if (deleteError) throw deleteError;

      const { error: updateError } = await supabase
        .from('scenes')
        .update({
          generated_image_url: null,
          generated_image_path: null,
        })
        .eq('id', sceneId);

      if (updateError) throw updateError;

      setScenes((prev) =>
        prev.map((s) =>
          s.id === sceneId
            ? { ...s, generated_image_url: null, generated_image_path: null }
            : s
        )
      );

      toast.success('Imagen eliminada');
    } catch (err) {
      console.error(err);
      toast.error('Error al eliminar imagen');
    }
  }

  if (loading) {
    return (

      <div className="space-y-6">
        <div className="flex items-center justify-between">
          <div>
            <div className="h-6 w-32 animate-pulse rounded bg-surface-secondary" />
            <div className="mt-1 h-4 w-56 animate-pulse rounded bg-surface-secondary" />
          </div>
        </div>
        <div className="space-y-3">
          {Array.from({ length: 5 }).map((_, i) => (
            <div
              key={i}
              className="h-20 animate-pulse rounded-xl bg-surface-secondary"
            />
          ))}
        </div>
      </div>
    );
  }

  return (
    <div className="space-y-6">
      {/* Header */}
      <div className="flex items-center justify-between">
        <div>
          <h2 className="text-xl font-bold text-foreground">Escenas</h2>
          <p className="text-sm text-foreground-muted">
            {scenes.length} escenas en el storyboard
          </p>
        </div>
        <div className="flex gap-2">
          <button
            onClick={() => toast.info('Proximamente')}
            className="rounded-lg border border-surface-tertiary px-4 py-2 text-sm font-medium text-foreground-secondary transition hover:bg-surface-secondary"
          >
            Generar con IA
          </button>
          <button className="rounded-lg bg-brand-500 px-4 py-2 text-sm font-medium text-white transition hover:bg-brand-600">
            + Nueva escena
          </button>
        </div>
      </div>

      {/* Type Filters */}
      <div className="flex flex-wrap items-center gap-2">
        {TYPE_FILTERS.map((filter) => (
          <button
            key={filter.value}
            onClick={() => setActiveTypeFilter(filter.value)}
            className={`flex items-center gap-1.5 rounded-lg px-3 py-1.5 text-sm font-medium transition ${
              activeTypeFilter === filter.value
                ? 'bg-brand-500/10 text-brand-500'
                : 'text-foreground-muted hover:bg-surface-secondary hover:text-foreground-secondary'
            }`}
          >
            {filter.color && (
              <span className={`inline-block h-2 w-2 rounded-full ${filter.color}`} />
            )}
            {filter.label}
          </button>
        ))}

        <span className="mx-2 h-5 w-px bg-surface-tertiary" />

        {/* Arc Filters */}
        {ARC_FILTERS.map((filter) => (
          <button
            key={filter.value}
            onClick={() => setActiveArcFilter(filter.value)}
            className={`rounded-lg px-3 py-1.5 text-sm font-medium transition ${
              activeArcFilter === filter.value
                ? 'bg-brand-500/10 text-brand-500'
                : 'text-foreground-muted hover:bg-surface-secondary hover:text-foreground-secondary'
            }`}
          >
            {filter.label}
          </button>
        ))}
      </div>

      {/* Scenes list */}
      {filteredScenes.length === 0 ? (
        <div className="flex flex-col items-center justify-center rounded-2xl border border-dashed border-surface-tertiary py-20">
          <h3 className="mb-1 text-lg font-semibold text-foreground">
            No hay escenas
          </h3>
          <p className="mb-6 text-sm text-foreground-muted">
            {scenes.length === 0
              ? 'Crea tu primera escena manualmente o genera con IA'
              : 'No hay escenas que coincidan con los filtros seleccionados'}
          </p>
          {scenes.length === 0 && (
            <div className="flex gap-3">
              <button
                onClick={() => toast.info('Proximamente')}
                className="rounded-lg border border-surface-tertiary px-4 py-2 text-sm font-medium text-foreground-secondary transition hover:bg-surface-secondary"
              >
                Generar con IA
              </button>
              <button className="rounded-lg bg-brand-500 px-4 py-2 text-sm font-medium text-white transition hover:bg-brand-600">
                + Nueva escena
              </button>
            </div>
          )}
        </div>
      ) : (
        <div className="space-y-2">
          {filteredScenes.map((scene) => {
            const isExpanded = expandedId === scene.id;
            return (
              <div
                key={scene.id}
                id={`scene-${scene.id}`}
                className="rounded-xl border border-surface-tertiary bg-surface-secondary transition hover:border-brand-500/30"
              >
                {/* Scene header row */}
                <button
                  onClick={() =>
                    setExpandedId(isExpanded ? null : scene.id)
                  }
                  className="flex w-full items-center gap-3 p-4 text-left"
                >
                  {/* Scene number */}
                  <span className="flex h-8 w-8 shrink-0 items-center justify-center rounded-lg bg-surface-tertiary text-xs font-bold text-foreground">
                    {scene.scene_number}
                  </span>

                  {/* Title */}
                  <span className="min-w-0 flex-1 truncate text-sm font-medium text-foreground">
                    {scene.title}
                  </span>

                  {/* Type badge */}
                  <span
                    className={`shrink-0 rounded-full px-2 py-0.5 text-xs font-medium ${
                      TYPE_BADGE_COLORS[scene.scene_type] ?? 'bg-gray-500/20 text-gray-400'
                    }`}
                  >
                    {scene.scene_type}
                  </span>

                  {/* Duration */}
                  {scene.duration_seconds > 0 && (
                    <span className="shrink-0 text-xs text-foreground-muted">
                      {scene.duration_seconds}s
                    </span>
                  )}

                  {/* Arc phase badge */}
                  <span
                    className={`shrink-0 rounded-full px-2 py-0.5 text-xs font-medium ${
                      ARC_BADGE_COLORS[scene.arc_phase] ?? 'bg-gray-500/20 text-gray-400'
                    }`}
                  >
                    {scene.arc_phase}
                  </span>

                  {/* Status badge */}
                  <span
                    className={`shrink-0 rounded-full px-2 py-0.5 text-xs font-medium ${
                      STATUS_BADGE_COLORS[scene.status] ?? 'bg-gray-500/20 text-gray-400'
                    }`}
                  >
                    {scene.status}
                  </span>

                  {/* Expand icon */}
                  <svg
                    className={`h-4 w-4 shrink-0 text-foreground-muted transition-transform ${
                      isExpanded ? 'rotate-180' : ''
                    }`}
                    fill="none"
                    viewBox="0 0 24 24"
                    stroke="currentColor"
                    strokeWidth={2}
                  >
                    <path
                      strokeLinecap="round"
                      strokeLinejoin="round"
                      d="M19 9l-7 7-7-7"
                    />
                  </svg>
                </button>

                {/* Expanded content */}
                {isExpanded && (
                  <div className="border-t border-surface-tertiary px-4 pb-4 pt-3 space-y-4">
                    {/* Generated Image Upload Area */}
                    <div className="group relative">
                      <input
                        ref={(el) => { fileInputRefs.current[scene.id] = el; }}
                        type="file"
                        accept="image/*"
                        className="hidden"
                        onChange={(e) => {
                          const file = e.target.files?.[0];
                          if (file) handleImageUpload(scene.id, file);
                          e.target.value = '';
                        }}
                      />

                      {scene.generated_image_url ? (
                        <div className="relative aspect-video w-full overflow-hidden rounded-lg">
                          <img
                            src={scene.generated_image_url}
                            alt={scene.title}
                            className="h-full w-full rounded-lg object-cover"
                          />
                          {/* Delete button on hover */}
                          <button
                            onClick={() =>
                              scene.generated_image_path &&
                              handleImageDelete(scene.id, scene.generated_image_path)
                            }
                            className="absolute right-2 top-2 flex h-7 w-7 items-center justify-center rounded-full bg-black/60 text-white opacity-0 transition hover:bg-red-500 group-hover:opacity-100"
                          >
                            <IconX size={14} />
                          </button>
                          {/* Re-upload button on hover */}
                          <button
                            onClick={() => fileInputRefs.current[scene.id]?.click()}
                            className="absolute bottom-2 right-2 flex h-7 w-7 items-center justify-center rounded-full bg-black/60 text-white opacity-0 transition hover:bg-brand-500 group-hover:opacity-100"
                          >
                            <IconUpload size={14} />
                          </button>
                        </div>
                      ) : (
                        <button
                          onClick={() => fileInputRefs.current[scene.id]?.click()}
                          disabled={uploadingId === scene.id}
                          className="flex aspect-video w-full flex-col items-center justify-center gap-2 rounded-lg border-2 border-dashed border-surface-tertiary transition hover:border-brand-500/50 hover:bg-brand-500/5"
                        >
                          {uploadingId === scene.id ? (
                            <div className="h-6 w-6 animate-spin rounded-full border-2 border-brand-500 border-t-transparent" />
                          ) : (
                            <>
                              <IconPhoto size={28} className="text-foreground-muted" />
                              <span className="text-xs text-foreground-muted">
                                Subir imagen generada
                              </span>
                            </>
                          )}
                        </button>
                      )}
                    </div>

                    {/* Required references badges */}
                    {scene.required_references && scene.required_references.length > 0 && (
                      <div>
                        <h4 className="mb-1 text-xs font-semibold uppercase tracking-wider text-foreground-muted">
                          Referencias requeridas
                        </h4>
                        <div className="flex flex-wrap gap-1">
                          {scene.required_references.map((ref, idx) => (
                            <span
                              key={idx}
                              className="rounded-full bg-purple-500/10 px-2.5 py-0.5 text-xs font-medium text-purple-400"
                            >
                              {ref}
                            </span>
                          ))}
                        </div>
                      </div>
                    )}

                    {/* Description */}
                    {scene.description && (
                      <div>
                        <h4 className="mb-1 text-xs font-semibold uppercase tracking-wider text-foreground-muted">
                          Descripcion
                        </h4>
                        <p className="text-sm text-foreground-secondary">
                          {scene.description}
                        </p>
                      </div>
                    )}

                    {/* Prompt Image */}
                    {scene.prompt_image && (
                      <div>
                        <div className="mb-1 flex items-center justify-between">
                          <h4 className="text-xs font-semibold uppercase tracking-wider text-foreground-muted">
                            Prompt Imagen
                          </h4>
                          <CopyButton text={scene.prompt_image} />
                        </div>
                        <pre className="overflow-x-auto rounded-lg bg-surface-tertiary p-3 text-xs text-foreground-secondary">
                          <code>{scene.prompt_image}</code>
                        </pre>
                      </div>
                    )}

                    {/* Prompt Video */}
                    {scene.prompt_video && (
                      <div>
                        <div className="mb-1 flex items-center justify-between">
                          <h4 className="text-xs font-semibold uppercase tracking-wider text-foreground-muted">
                            Prompt Video
                          </h4>
                          <CopyButton text={scene.prompt_video} />
                        </div>
                        <pre className="overflow-x-auto rounded-lg bg-surface-tertiary p-3 text-xs text-foreground-secondary">
                          <code>{scene.prompt_video}</code>
                        </pre>
                      </div>
                    )}

                    {/* Improvements */}
                    {scene.improvements && scene.improvements.length > 0 && (
                      <div>
                        <h4 className="mb-1 text-xs font-semibold uppercase tracking-wider text-foreground-muted">
                          Mejoras
                        </h4>
                        <ul className="space-y-1">
                          {scene.improvements.map((imp, idx) => (
                            <li
                              key={idx}
                              className="flex items-start gap-2 text-sm text-foreground-secondary"
                            >
                              <span
                                className={`mt-0.5 inline-block rounded px-1.5 py-0.5 text-[10px] font-bold uppercase ${
                                  imp.type === 'improve'
                                    ? 'bg-amber-500/20 text-amber-400'
                                    : 'bg-emerald-500/20 text-emerald-400'
                                }`}
                              >
                                {imp.type}
                              </span>
                              <span>{imp.text}</span>
                            </li>
                          ))}
                        </ul>
                      </div>
                    )}

                    {/* Camera, Lighting, Mood row */}
                    <div className="grid gap-3 sm:grid-cols-3">
                      {(scene.camera_angle || scene.camera_movement) && (
                        <div>
                          <h4 className="mb-1 text-xs font-semibold uppercase tracking-wider text-foreground-muted">
                            Camara
                          </h4>
                          <p className="text-sm text-foreground-secondary">
                            {[scene.camera_angle, scene.camera_movement]
                              .filter(Boolean)
                              .join(' / ')}
                          </p>
                          {scene.camera_notes && (
                            <p className="mt-0.5 text-xs text-foreground-muted">
                              {scene.camera_notes}
                            </p>
                          )}
                        </div>
                      )}
                      {scene.lighting && (
                        <div>
                          <h4 className="mb-1 text-xs font-semibold uppercase tracking-wider text-foreground-muted">
                            Iluminacion
                          </h4>
                          <p className="text-sm text-foreground-secondary">
                            {scene.lighting}
                          </p>
                        </div>
                      )}
                      {scene.mood && (
                        <div>
                          <h4 className="mb-1 text-xs font-semibold uppercase tracking-wider text-foreground-muted">
                            Mood
                          </h4>
                          <p className="text-sm text-foreground-secondary">
                            {scene.mood}
                          </p>
                        </div>
                      )}
                    </div>
                  </div>
                )}
              </div>
            );
          })}
        </div>
      )}
    </div>
  );
}
