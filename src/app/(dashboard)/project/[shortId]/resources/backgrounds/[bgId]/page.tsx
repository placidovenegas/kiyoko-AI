'use client';

import { useState, useCallback, useRef, type ChangeEvent } from 'react';
import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query';
import { useParams, useRouter } from 'next/navigation';
import Image from 'next/image';
import Link from 'next/link';
import { createClient } from '@/lib/supabase/client';
import { useProject } from '@/contexts/ProjectContext';
import { queryKeys } from '@/lib/query/keys';
import { useUIStore } from '@/stores/useUIStore';
import { cn } from '@/lib/utils/cn';
import { toast } from 'sonner';
import type { Background, BackgroundUpdate } from '@/types';
import {
  ArrowLeft, Camera, ChevronRight, Clock, Film,
  ImagePlus, MapPin, Pencil, Save, Upload, X,
} from 'lucide-react';

interface SceneWithBackground {
  scene_id: string;
  is_primary: boolean | null;
  angle: string | null;
  time_of_day: string | null;
  scene: {
    id: string;
    scene_number: string;
    title: string;
    description: string | null;
  };
}

export default function BackgroundDetailPage() {
  const params = useParams();
  const router = useRouter();
  const queryClient = useQueryClient();
  const { project } = useProject();
  const openFilePreview = useUIStore((state) => state.openFilePreview);
  const bgId = params.bgId as string;
  const shortId = params.shortId as string;
  const fileInputRef = useRef<HTMLInputElement | null>(null);

  const supabase = createClient();

  // ---------- Queries ----------

  const { data: background, isLoading: bgLoading } = useQuery({
    queryKey: ['background', bgId],
    queryFn: async () => {
      const { data, error } = await supabase
        .from('backgrounds')
        .select('*')
        .eq('id', bgId)
        .single();
      if (error) throw error;
      return data as Background;
    },
    enabled: !!bgId,
  });

  const { data: sceneLinks } = useQuery({
    queryKey: ['background-scenes', bgId],
    queryFn: async () => {
      const { data, error } = await supabase
        .from('scene_backgrounds')
        .select('scene_id, is_primary, angle, time_of_day, scene:scenes(id, scene_number, title, description)')
        .eq('background_id', bgId);
      if (error) throw error;
      return (data ?? []) as unknown as SceneWithBackground[];
    },
    enabled: !!bgId,
  });

  // ---------- Editable fields ----------

  const [editField, setEditField] = useState<string | null>(null);
  const [editValue, setEditValue] = useState('');

  const startEdit = useCallback((field: string, value: string) => {
    setEditField(field);
    setEditValue(value ?? '');
  }, []);

  const updateMutation = useMutation({
    mutationFn: async (updates: BackgroundUpdate) => {
      const { error } = await supabase
        .from('backgrounds')
        .update(updates)
        .eq('id', bgId);
      if (error) throw error;
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['background', bgId] });
      if (project) {
        queryClient.invalidateQueries({ queryKey: queryKeys.backgrounds.byProject(project.id) });
      }
      setEditField(null);
      toast.success('Fondo actualizado');
    },
    onError: () => toast.error('Error al actualizar'),
  });

  const uploadReferenceMutation = useMutation({
    mutationFn: async (file: File) => {
      if (!project) throw new Error('Proyecto no disponible');
      const ext = file.name.split('.').pop() ?? 'jpg';
      const path = `projects/${project.id}/backgrounds/${bgId}/${crypto.randomUUID()}.${ext}`;
      const payload = new FormData();
      payload.append('bucket', 'project-assets');
      payload.append('path', path);
      payload.append('file', file);

      const response = await fetch('/api/storage/object', { method: 'POST', body: payload });
      const body = (await response.json().catch(() => null)) as { file?: { url: string; path?: string }; error?: string } | null;
      if (!response.ok || !body?.file?.url) {
        throw new Error(body?.error ?? 'No se pudo subir la imagen');
      }

      const { error } = await supabase
        .from('backgrounds')
        .update({ reference_image_url: body.file.url, reference_image_path: body.file.path ?? path })
        .eq('id', bgId);
      if (error) throw error;
      return body.file.url;
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['background', bgId] });
      if (project) {
        queryClient.invalidateQueries({ queryKey: queryKeys.backgrounds.byProject(project.id) });
      }
      toast.success('Referencia del fondo actualizada');
    },
    onError: (error) => {
      console.error(error);
      toast.error(error instanceof Error ? error.message : 'No se pudo subir la imagen');
    },
  });

  const saveField = useCallback((field: string) => {
    updateMutation.mutate({ [field]: editValue } as BackgroundUpdate);
  }, [editValue, updateMutation]);

  function handleOpenPreview() {
    if (!background?.reference_image_url) return;
    openFilePreview([
      {
        id: `background-reference-${bgId}`,
        url: background.reference_image_url,
        name: background.name,
        type: 'image/*',
      },
    ], 0);
  }

  function handleReferenceUpload(event: ChangeEvent<HTMLInputElement>) {
    const file = event.target.files?.[0];
    if (!file) return;
    uploadReferenceMutation.mutate(file);
    event.target.value = '';
  }

  // ---------- Loading / Error ----------

  if (bgLoading) {
    return (
      <div className="mx-auto max-w-7xl p-6">
        <div className="h-10 w-56 animate-pulse rounded-xl bg-muted" />
        <div className="mt-6 h-96 animate-pulse rounded-3xl border border-border bg-card" />
      </div>
    );
  }

  if (!background) {
    return (
      <div className="mx-auto max-w-7xl p-6">
        <section className="flex flex-col items-center justify-center rounded-3xl border border-border bg-card px-6 py-20 text-center shadow-sm">
          <MapPin className="h-12 w-12 text-muted-foreground/30" />
          <h2 className="mt-4 text-lg font-semibold text-foreground">Fondo no encontrado</h2>
          <p className="mt-2 max-w-md text-sm leading-6 text-muted-foreground">
            El fondo que buscas no existe o fue eliminado.
          </p>
          <button
            type="button"
            onClick={() => router.back()}
            className="mt-6 inline-flex h-11 items-center justify-center gap-2 rounded-xl bg-primary px-4 text-sm font-medium text-primary-foreground transition-colors hover:bg-primary/90"
          >
            Volver
          </button>
        </section>
      </div>
    );
  }

  const aiAnalysis = background.ai_visual_analysis as Record<string, unknown> | null;

  return (
    <div className="mx-auto max-w-7xl p-6">
      {/* Header */}
      <section className="rounded-3xl border border-border bg-card p-6 shadow-sm">
        <div className="flex items-center gap-3">
          <button
            type="button"
            onClick={() => router.push(`/project/${shortId}/resources/backgrounds`)}
            className="flex size-9 items-center justify-center rounded-xl border border-border bg-background text-muted-foreground transition-colors hover:bg-accent hover:text-foreground"
          >
            <ArrowLeft className="h-4 w-4" />
          </button>
          <div className="min-w-0 flex-1">
            <h1 className="text-2xl font-semibold tracking-tight text-foreground">{background.name}</h1>
            <div className="mt-1 flex items-center gap-3 text-sm text-muted-foreground">
              <span className="font-mono text-xs text-foreground/70">{background.code}</span>
              {background.location_type && (
                <span className="inline-flex items-center gap-1 rounded-full bg-primary/10 px-2.5 py-0.5 text-xs font-medium text-primary">
                  <MapPin className="h-3 w-3" />
                  {background.location_type}
                </span>
              )}
              {background.time_of_day && (
                <span className="inline-flex items-center gap-1 text-xs">
                  <Clock className="h-3 w-3" />
                  {background.time_of_day}
                </span>
              )}
            </div>
          </div>
        </div>
      </section>

      <div className="mt-6 grid grid-cols-1 gap-6 lg:grid-cols-5">
        {/* ===== LEFT COLUMN: Image & Angles ===== */}
        <div className="space-y-6 lg:col-span-2">
          {/* Reference image */}
          <section className="overflow-hidden rounded-3xl border border-border bg-card shadow-sm">
            <input ref={fileInputRef} type="file" accept="image/*" className="hidden" onChange={handleReferenceUpload} />
            {background.reference_image_url ? (
              <button type="button" onClick={handleOpenPreview} className="relative block aspect-video w-full overflow-hidden cursor-pointer">
                <Image
                  src={background.reference_image_url}
                  alt={background.name}
                  fill
                  className="object-cover transition-transform duration-300 hover:scale-105"
                />
              </button>
            ) : (
              <div className="flex aspect-video items-center justify-center bg-muted/50">
                <ImagePlus className="h-12 w-12 text-muted-foreground/20" />
              </div>
            )}
            <div className="flex items-center justify-between border-t border-border px-5 py-3">
              <p className="text-xs text-muted-foreground">Referencia visual principal</p>
              <button
                type="button"
                onClick={() => fileInputRef.current?.click()}
                disabled={uploadReferenceMutation.isPending}
                className="inline-flex h-9 items-center justify-center gap-2 rounded-xl border border-border bg-background px-3 text-xs font-medium text-foreground transition-colors hover:bg-accent disabled:opacity-50"
              >
                <Upload className="h-3.5 w-3.5" />
                {uploadReferenceMutation.isPending ? 'Subiendo...' : 'Subir imagen'}
              </button>
            </div>
          </section>

          {/* Available angles */}
          <section className="rounded-3xl border border-border bg-card p-6 shadow-sm">
            <div className="flex items-center gap-2 mb-4">
              <Camera className="h-4 w-4 text-primary" />
              <h3 className="text-sm font-medium text-foreground">Angulos disponibles</h3>
            </div>
            {background.available_angles && background.available_angles.length > 0 ? (
              <div className="flex flex-wrap gap-2">
                {background.available_angles.map((angle, i) => (
                  <span
                    key={i}
                    className="rounded-lg border border-border bg-background px-3 py-1.5 text-xs font-medium text-foreground"
                  >
                    {angle}
                  </span>
                ))}
              </div>
            ) : (
              <p className="text-xs text-muted-foreground">Sin angulos definidos.</p>
            )}
          </section>
        </div>

        {/* ===== RIGHT COLUMN: Details ===== */}
        <div className="space-y-6 lg:col-span-3">
          {/* Basic Info */}
          <section className="rounded-3xl border border-border bg-card p-6 shadow-sm">
            <h3 className="mb-4 text-sm font-medium text-foreground">Informacion basica</h3>
            <div className="space-y-3">
              <InfoRow label="Nombre" value={background.name} />
              <InfoRow label="Codigo" value={background.code} />
              <InfoRow label="Tipo de locacion" value={background.location_type} />
              <InfoRow label="Hora del dia" value={background.time_of_day} />
            </div>
          </section>

          {/* Editable: description */}
          <EditableSection
            label="Descripcion"
            value={background.description}
            fieldKey="description"
            editField={editField}
            editValue={editValue}
            onStartEdit={startEdit}
            onChangeValue={setEditValue}
            onSave={saveField}
            onCancel={() => setEditField(null)}
            saving={updateMutation.isPending}
          />

          {/* Editable: ai_prompt_description */}
          <EditableSection
            label="Descripcion para prompt IA"
            value={background.ai_prompt_description}
            fieldKey="ai_prompt_description"
            editField={editField}
            editValue={editValue}
            onStartEdit={startEdit}
            onChangeValue={setEditValue}
            onSave={saveField}
            onCancel={() => setEditField(null)}
            saving={updateMutation.isPending}
          />

          {/* AI Visual Analysis (read-only) */}
          {aiAnalysis && (
            <section className="rounded-3xl border border-border bg-card p-6 shadow-sm">
              <h3 className="mb-4 text-sm font-medium text-foreground">Analisis visual IA</h3>
              <pre className="max-h-48 overflow-y-auto whitespace-pre-wrap rounded-xl bg-background p-4 text-xs text-muted-foreground">
                {JSON.stringify(aiAnalysis, null, 2)}
              </pre>
            </section>
          )}

          {/* Prompt snippet (read-only) */}
          {background.prompt_snippet && (
            <section className="rounded-3xl border border-border bg-card p-6 shadow-sm">
              <h3 className="mb-4 text-sm font-medium text-foreground">Prompt snippet</h3>
              <p className="rounded-xl bg-background p-4 font-mono text-sm text-muted-foreground">
                {background.prompt_snippet}
              </p>
            </section>
          )}

          {/* Scenes using this background */}
          <section className="rounded-3xl border border-border bg-card p-6 shadow-sm">
            <div className="mb-4 flex items-center gap-2">
              <Film className="h-4 w-4 text-primary" />
              <h3 className="text-sm font-medium text-foreground">
                Escenas ({sceneLinks?.length ?? 0})
              </h3>
            </div>
            {sceneLinks && sceneLinks.length > 0 ? (
              <div className="space-y-2">
                {sceneLinks.map((link) => {
                  const scene = link.scene;
                  return (
                    <div
                      key={link.scene_id}
                      className="group/scene flex items-center justify-between rounded-xl border border-border bg-background p-3 transition-colors hover:border-primary/20"
                    >
                      <div className="flex items-center gap-3 min-w-0">
                        <span className="shrink-0 rounded-lg bg-primary/10 px-2 py-1 font-mono text-xs font-medium text-primary">
                          {scene.scene_number}
                        </span>
                        <div className="min-w-0">
                          <p className="truncate text-sm font-medium text-foreground">{scene.title}</p>
                          {scene.description && (
                            <p className="mt-0.5 line-clamp-1 text-xs text-muted-foreground">{scene.description}</p>
                          )}
                        </div>
                      </div>
                      <div className="flex items-center gap-2">
                        {link.is_primary && (
                          <span className="rounded-full bg-primary/10 px-2 py-0.5 text-[10px] font-medium text-primary">
                            Primario
                          </span>
                        )}
                        {link.angle && (
                          <span className="rounded-full bg-background px-2 py-0.5 text-[10px] text-muted-foreground">
                            {link.angle}
                          </span>
                        )}
                        <ChevronRight className="h-4 w-4 text-muted-foreground opacity-0 transition-opacity group-hover/scene:opacity-100" />
                      </div>
                    </div>
                  );
                })}
              </div>
            ) : (
              <p className="text-xs text-muted-foreground">
                Este fondo no se usa en ninguna escena todavia.
              </p>
            )}
          </section>
        </div>
      </div>
    </div>
  );
}

// ---------- Sub-components ----------

function InfoRow({ label, value }: { label: string; value: string | null | undefined }) {
  return (
    <div className="flex items-start gap-2">
      <span className="w-32 shrink-0 pt-0.5 text-xs text-muted-foreground">{label}</span>
      <span className="text-sm text-foreground">{value || <span className="italic text-muted-foreground/50">-</span>}</span>
    </div>
  );
}

interface EditableSectionProps {
  label: string;
  value: string | null | undefined;
  fieldKey: string;
  editField: string | null;
  editValue: string;
  onStartEdit: (field: string, value: string) => void;
  onChangeValue: (value: string) => void;
  onSave: (field: string) => void;
  onCancel: () => void;
  saving: boolean;
}

function EditableSection({
  label,
  value,
  fieldKey,
  editField,
  editValue,
  onStartEdit,
  onChangeValue,
  onSave,
  onCancel,
  saving,
}: EditableSectionProps) {
  const isEditing = editField === fieldKey;

  return (
    <section className="rounded-3xl border border-border bg-card p-6 shadow-sm">
      <div className="mb-3 flex items-center justify-between">
        <h3 className="text-sm font-medium text-foreground">{label}</h3>
        {!isEditing && (
          <button
            type="button"
            onClick={() => onStartEdit(fieldKey, value ?? '')}
            className="inline-flex items-center gap-1.5 rounded-lg px-2.5 py-1 text-xs font-medium text-primary transition-colors hover:bg-primary/10"
          >
            <Pencil className="h-3 w-3" />
            Editar
          </button>
        )}
      </div>
      {isEditing ? (
        <div className="space-y-3">
          <textarea
            value={editValue}
            onChange={(e) => onChangeValue(e.target.value)}
            rows={4}
            className="w-full resize-y rounded-xl border border-border bg-background p-3 text-sm text-foreground placeholder:text-muted-foreground/50 focus:border-primary focus:outline-none"
          />
          <div className="flex justify-end gap-2">
            <button
              type="button"
              onClick={onCancel}
              className="inline-flex h-9 items-center justify-center gap-1.5 rounded-xl border border-border bg-background px-3 text-xs font-medium text-muted-foreground transition-colors hover:bg-accent hover:text-foreground"
            >
              <X className="h-3 w-3" />
              Cancelar
            </button>
            <button
              type="button"
              onClick={() => onSave(fieldKey)}
              disabled={saving}
              className="inline-flex h-9 items-center justify-center gap-1.5 rounded-xl bg-primary px-4 text-xs font-medium text-primary-foreground transition-colors hover:bg-primary/90 disabled:opacity-50"
            >
              <Save className="h-3 w-3" />
              {saving ? 'Guardando...' : 'Guardar'}
            </button>
          </div>
        </div>
      ) : (
        <p className="whitespace-pre-wrap text-sm text-muted-foreground">
          {value || <span className="italic text-muted-foreground/50">Sin contenido</span>}
        </p>
      )}
    </section>
  );
}
