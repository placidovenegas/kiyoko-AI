'use client';

import { useState, useEffect, useRef } from 'react';
import { useParams } from 'next/navigation';
import { createClient } from '@/lib/supabase/client';
import { CopyButton } from '@/components/ui/CopyButton';
import { toast } from 'sonner';
import { IconPhoto, IconUpload, IconX } from '@tabler/icons-react';
import type { Background } from '@/types/background';

const TIME_LABELS: Record<string, string> = {
  dawn: 'Amanecer',
  morning: 'Manana',
  day: 'Dia',
  golden_hour: 'Hora dorada',
  evening: 'Atardecer',
  night: 'Noche',
};

const LOCATION_LABELS: Record<string, string> = {
  interior: 'Interior',
  exterior: 'Exterior',
  mixed: 'Mixto',
};

export default function BackgroundsPage() {
  const params = useParams();
  const slug = params.slug as string;

  const [backgrounds, setBackgrounds] = useState<Background[]>([]);
  const [loading, setLoading] = useState(true);
  const [projectId, setProjectId] = useState<string | null>(null);
  const [uploadingId, setUploadingId] = useState<string | null>(null);
  const fileInputRefs = useRef<Record<string, HTMLInputElement | null>>({});

  useEffect(() => {
    if (!slug) return;
    const supabase = createClient();

    async function fetchBackgrounds() {
      setLoading(true);

      const { data: proj } = await supabase
        .from('projects')
        .select('id')
        .eq('slug', slug)
        .single();

      if (proj) {
        setProjectId(proj.id);
        const { data } = await supabase
          .from('backgrounds')
          .select('*')
          .eq('project_id', proj.id)
          .order('sort_order', { ascending: true });

        setBackgrounds((data as Background[]) ?? []);
      }

      setLoading(false);
    }

    fetchBackgrounds();
  }, [slug]);

  async function handleImageUpload(backgroundId: string, file: File) {
    if (!projectId) return;
    setUploadingId(backgroundId);

    try {
      const supabase = createClient();
      const fileExt = file.name.split('.').pop();
      const filePath = `${projectId}/references/backgrounds/${backgroundId}.${fileExt}`;

      const { error: uploadError } = await supabase.storage
        .from('project-assets')
        .upload(filePath, file, { cacheControl: '3600', upsert: true });

      if (uploadError) throw uploadError;

      const {
        data: { publicUrl },
      } = supabase.storage.from('project-assets').getPublicUrl(filePath);

      const { error: updateError } = await supabase
        .from('backgrounds')
        .update({
          reference_image_url: publicUrl,
          reference_image_path: filePath,
        })
        .eq('id', backgroundId);

      if (updateError) throw updateError;

      setBackgrounds((prev) =>
        prev.map((bg) =>
          bg.id === backgroundId
            ? { ...bg, reference_image_url: publicUrl, reference_image_path: filePath }
            : bg
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

  async function handleImageDelete(backgroundId: string, filePath: string) {
    if (!projectId) return;

    try {
      const supabase = createClient();

      const { error: deleteError } = await supabase.storage
        .from('project-assets')
        .remove([filePath]);

      if (deleteError) throw deleteError;

      const { error: updateError } = await supabase
        .from('backgrounds')
        .update({
          reference_image_url: null,
          reference_image_path: null,
        })
        .eq('id', backgroundId);

      if (updateError) throw updateError;

      setBackgrounds((prev) =>
        prev.map((bg) =>
          bg.id === backgroundId
            ? { ...bg, reference_image_url: null, reference_image_path: null }
            : bg
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
            <div className="mt-1 h-4 w-48 animate-pulse rounded bg-surface-secondary" />
          </div>
        </div>
        <div className="grid gap-4 sm:grid-cols-2 lg:grid-cols-3">
          {Array.from({ length: 3 }).map((_, i) => (
            <div
              key={i}
              className="h-56 animate-pulse rounded-xl bg-surface-secondary"
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
          <h2 className="text-xl font-bold text-foreground">Fondos</h2>
          <p className="text-sm text-foreground-muted">
            {backgrounds.length} fondos y locaciones definidos
          </p>
        </div>
        <button className="rounded-lg bg-brand-500 px-4 py-2 text-sm font-medium text-white transition hover:bg-brand-600">
          + Nuevo fondo
        </button>
      </div>

      {/* Backgrounds grid */}
      {backgrounds.length === 0 ? (
        <div className="flex flex-col items-center justify-center rounded-2xl border border-dashed border-surface-tertiary py-20">
          <h3 className="mb-1 text-lg font-semibold text-foreground">
            No hay fondos
          </h3>
          <p className="mb-6 max-w-sm text-center text-sm text-foreground-muted">
            Define los fondos y locaciones para reutilizarlos en las escenas del
            storyboard
          </p>
          <button className="rounded-lg bg-brand-500 px-4 py-2 text-sm font-medium text-white transition hover:bg-brand-600">
            + Nuevo fondo
          </button>
        </div>
      ) : (
        <div className="grid gap-4 sm:grid-cols-2 lg:grid-cols-3">
          {backgrounds.map((bg) => (
            <div
              key={bg.id}
              className="rounded-xl border border-surface-tertiary bg-surface-secondary p-4 transition hover:border-brand-500/30"
            >
              {/* Reference Image Upload Area */}
              <div className="group relative mb-3">
                <input
                  ref={(el) => {
                    fileInputRefs.current[bg.id] = el;
                  }}
                  type="file"
                  accept="image/*"
                  className="hidden"
                  onChange={(e) => {
                    const file = e.target.files?.[0];
                    if (file) handleImageUpload(bg.id, file);
                    e.target.value = '';
                  }}
                />

                {bg.reference_image_url ? (
                  <div className="relative aspect-video w-full overflow-hidden rounded-lg">
                    <img
                      src={bg.reference_image_url}
                      alt={bg.name}
                      className="h-full w-full object-cover"
                    />
                    {/* Delete button on hover */}
                    <button
                      onClick={() =>
                        bg.reference_image_path &&
                        handleImageDelete(bg.id, bg.reference_image_path)
                      }
                      className="absolute right-2 top-2 flex h-7 w-7 items-center justify-center rounded-full bg-black/60 text-white opacity-0 transition hover:bg-red-500 group-hover:opacity-100"
                    >
                      <IconX size={14} />
                    </button>
                    {/* Re-upload button on hover */}
                    <button
                      onClick={() => fileInputRefs.current[bg.id]?.click()}
                      className="absolute bottom-2 right-2 flex h-7 w-7 items-center justify-center rounded-full bg-black/60 text-white opacity-0 transition hover:bg-brand-500 group-hover:opacity-100"
                    >
                      <IconUpload size={14} />
                    </button>
                  </div>
                ) : (
                  <button
                    onClick={() => fileInputRefs.current[bg.id]?.click()}
                    disabled={uploadingId === bg.id}
                    className="flex aspect-video w-full flex-col items-center justify-center gap-2 rounded-lg border-2 border-dashed border-surface-tertiary transition hover:border-brand-500/50 hover:bg-brand-500/5"
                  >
                    {uploadingId === bg.id ? (
                      <div className="h-6 w-6 animate-spin rounded-full border-2 border-brand-500 border-t-transparent" />
                    ) : (
                      <>
                        <IconPhoto size={24} className="text-foreground-muted" />
                        <span className="text-xs text-foreground-muted">
                          Subir imagen de referencia
                        </span>
                      </>
                    )}
                  </button>
                )}
              </div>

              {/* Name + code */}
              <div className="mb-2 flex items-center gap-2">
                <span className="rounded bg-brand-500/10 px-1.5 py-0.5 text-[10px] font-bold text-brand-500">
                  {bg.code}
                </span>
                <h3 className="truncate text-sm font-semibold text-foreground">
                  {bg.name}
                </h3>
              </div>

              {/* Location type + time of day */}
              <div className="mb-3 flex gap-2">
                <span className="rounded bg-surface-tertiary px-2 py-0.5 text-xs text-foreground-secondary">
                  {LOCATION_LABELS[bg.location_type] ?? bg.location_type}
                </span>
                <span className="rounded bg-surface-tertiary px-2 py-0.5 text-xs text-foreground-secondary">
                  {TIME_LABELS[bg.time_of_day] ?? bg.time_of_day}
                </span>
              </div>

              {/* Prompt snippet */}
              {bg.prompt_snippet && (
                <div className="mb-3">
                  <div className="mb-1 flex items-center justify-between">
                    <span className="text-[10px] font-semibold uppercase tracking-wider text-foreground-muted">
                      Prompt snippet
                    </span>
                    <CopyButton text={bg.prompt_snippet} />
                  </div>
                  <pre className="overflow-x-auto rounded-lg bg-surface-tertiary p-2 text-[11px] leading-relaxed text-foreground-secondary">
                    <code>{bg.prompt_snippet}</code>
                  </pre>
                </div>
              )}

              {/* Used in scenes */}
              {bg.used_in_scenes && bg.used_in_scenes.length > 0 && (
                <div>
                  <span className="text-[10px] font-semibold uppercase tracking-wider text-foreground-muted">
                    Usado en:
                  </span>
                  <div className="mt-1 flex flex-wrap gap-1">
                    {bg.used_in_scenes.map((sceneNum) => (
                      <span
                        key={sceneNum}
                        className="rounded bg-brand-500/10 px-1.5 py-0.5 text-[10px] font-medium text-brand-500"
                      >
                        E{sceneNum}
                      </span>
                    ))}
                  </div>
                </div>
              )}
            </div>
          ))}
        </div>
      )}
    </div>
  );
}
