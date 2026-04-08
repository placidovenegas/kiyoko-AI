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
  ArrowLeft, Camera, ChevronRight, Clock, Copy, Film,
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

  /* ---- Queries ---- */

  const { data: background, isLoading: bgLoading } = useQuery({
    queryKey: ['background', bgId],
    queryFn: async () => {
      const { data, error } = await supabase.from('backgrounds').select('*').eq('id', bgId).single();
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

  /* ---- Editable fields ---- */

  const [editField, setEditField] = useState<string | null>(null);
  const [editValue, setEditValue] = useState('');

  const startEdit = useCallback((field: string, value: string) => {
    setEditField(field);
    setEditValue(value ?? '');
  }, []);

  const updateMutation = useMutation({
    mutationFn: async (updates: BackgroundUpdate) => {
      const { error } = await supabase.from('backgrounds').update(updates).eq('id', bgId);
      if (error) throw error;
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['background', bgId] });
      if (project) queryClient.invalidateQueries({ queryKey: queryKeys.backgrounds.byProject(project.id) });
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
      if (!response.ok || !body?.file?.url) throw new Error(body?.error ?? 'No se pudo subir la imagen');

      const { error } = await supabase
        .from('backgrounds')
        .update({ reference_image_url: body.file.url, reference_image_path: body.file.path ?? path })
        .eq('id', bgId);
      if (error) throw error;
      return body.file.url;
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['background', bgId] });
      if (project) queryClient.invalidateQueries({ queryKey: queryKeys.backgrounds.byProject(project.id) });
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
    openFilePreview([{ id: `background-reference-${bgId}`, url: background.reference_image_url, name: background.name, type: 'image/*' }], 0);
  }

  function handleReferenceUpload(event: ChangeEvent<HTMLInputElement>) {
    const file = event.target.files?.[0];
    if (!file) return;
    uploadReferenceMutation.mutate(file);
    event.target.value = '';
  }

  const handleCopyPrompt = async () => {
    const text = background?.prompt_snippet ?? '';
    if (!text) { toast.error('No hay prompt para copiar'); return; }
    await navigator.clipboard.writeText(text);
    toast.success('Prompt copiado');
  };

  /* ---- Loading / Error ---- */

  if (bgLoading) {
    return (
      <div className="mx-auto max-w-5xl px-4 py-6 space-y-6">
        <div className="h-10 w-56 animate-pulse rounded-xl bg-muted" />
        <div className="h-96 animate-pulse rounded-xl border border-border bg-card" />
      </div>
    );
  }

  if (!background) {
    return (
      <div className="mx-auto max-w-5xl px-4 py-6">
        <MapPin className="h-12 w-12 text-muted-foreground/30" />
        <h2 className="mt-4 text-lg font-semibold text-foreground">Fondo no encontrado</h2>
        <p className="mt-2 text-sm text-muted-foreground">El fondo que buscas no existe o fue eliminado.</p>
        <Link href={`/project/${shortId}/resources/backgrounds`} className="mt-4 inline-flex items-center gap-1 text-sm text-primary hover:underline">
          <ArrowLeft className="h-3.5 w-3.5" /> Volver a fondos
        </Link>
      </div>
    );
  }

  return (
    <div className="mx-auto max-w-5xl px-4 py-6 space-y-6">
      <input ref={fileInputRef} type="file" accept="image/*" className="hidden" onChange={handleReferenceUpload} />

      {/* Back link */}
      <Link
        href={`/project/${shortId}/resources/backgrounds`}
        className="inline-flex items-center gap-1.5 text-sm text-muted-foreground hover:text-foreground"
      >
        <ArrowLeft className="h-3.5 w-3.5" />
        Fondos
      </Link>

      {/* ===== Header ===== */}
      <section className="flex items-center gap-4">
        {/* Thumbnail */}
        <div className="relative h-16 w-24 shrink-0 overflow-hidden rounded-lg border border-border bg-muted">
          {background.reference_image_url ? (
            <Image src={background.reference_image_url} alt={background.name} fill className="object-cover" />
          ) : (
            <div className="flex h-full w-full items-center justify-center">
              <MapPin className="h-6 w-6 text-muted-foreground/30" />
            </div>
          )}
        </div>
        <div className="min-w-0 flex-1">
          <div className="flex items-center gap-3">
            <h1 className="text-2xl font-semibold tracking-tight text-foreground">{background.name}</h1>
            {background.location_type && (
              <span className="rounded-md bg-primary/10 px-2 py-0.5 text-xs font-medium text-primary">
                <MapPin className="inline h-3 w-3 mr-0.5" />
                {background.location_type}
              </span>
            )}
            {background.time_of_day && (
              <span className="text-xs text-muted-foreground">
                <Clock className="inline h-3 w-3 mr-0.5" />
                {background.time_of_day}
              </span>
            )}
          </div>
          <p className="mt-1 text-xs text-muted-foreground font-mono">{background.code}</p>
        </div>
      </section>

      {/* ===== Two-column layout ===== */}
      <div className="grid grid-cols-1 gap-6 lg:grid-cols-[3fr_2fr]">

        {/* ===== LEFT COLUMN ===== */}
        <div className="space-y-6">

          {/* Reference image */}
          <section className="rounded-xl border border-border bg-card overflow-hidden">
            {background.reference_image_url ? (
              <button type="button" onClick={handleOpenPreview} className="relative block aspect-video w-full overflow-hidden cursor-pointer">
                <Image src={background.reference_image_url} alt={background.name} fill className="object-cover transition-transform duration-300 hover:scale-105" />
              </button>
            ) : (
              <div className="flex aspect-video items-center justify-center bg-muted/50">
                <ImagePlus className="h-12 w-12 text-muted-foreground/20" />
              </div>
            )}
            <div className="flex items-center justify-between border-t border-border px-4 py-3">
              <p className="text-xs text-muted-foreground">Referencia visual principal</p>
              <button
                type="button"
                onClick={() => fileInputRef.current?.click()}
                disabled={uploadReferenceMutation.isPending}
                className="rounded-lg px-2 py-1.5 text-xs text-muted-foreground hover:bg-accent hover:text-foreground disabled:opacity-50"
              >
                <Upload className="inline h-3.5 w-3.5 mr-1" />
                {uploadReferenceMutation.isPending ? 'Subiendo...' : 'Subir imagen'}
              </button>
            </div>
          </section>

          {/* Editable fields */}
          <section className="rounded-xl border border-border bg-card p-4 space-y-4">
            <p className="text-xs font-semibold uppercase tracking-wider text-muted-foreground">Informacion basica</p>

            <EditableRow label="Nombre" value={background.name} fieldKey="name" editField={editField} editValue={editValue} onStartEdit={startEdit} onChangeValue={setEditValue} onSave={saveField} onCancel={() => setEditField(null)} saving={updateMutation.isPending} />
            <EditableRow label="Tipo de locacion" value={background.location_type} fieldKey="location_type" editField={editField} editValue={editValue} onStartEdit={startEdit} onChangeValue={setEditValue} onSave={saveField} onCancel={() => setEditField(null)} saving={updateMutation.isPending} />
            <EditableRow label="Hora del dia" value={background.time_of_day} fieldKey="time_of_day" editField={editField} editValue={editValue} onStartEdit={startEdit} onChangeValue={setEditValue} onSave={saveField} onCancel={() => setEditField(null)} saving={updateMutation.isPending} />

            <EditableTextarea label="Descripcion" value={background.description} fieldKey="description" editField={editField} editValue={editValue} onStartEdit={startEdit} onChangeValue={setEditValue} onSave={saveField} onCancel={() => setEditField(null)} saving={updateMutation.isPending} />
            <EditableTextarea label="Descripcion para prompt IA" value={background.ai_prompt_description} fieldKey="ai_prompt_description" editField={editField} editValue={editValue} onStartEdit={startEdit} onChangeValue={setEditValue} onSave={saveField} onCancel={() => setEditField(null)} saving={updateMutation.isPending} />
          </section>

          {/* Available angles */}
          {background.available_angles && background.available_angles.length > 0 && (
            <section className="rounded-xl border border-border bg-card p-4 space-y-3">
              <p className="text-xs font-semibold uppercase tracking-wider text-muted-foreground">
                <Camera className="inline h-3.5 w-3.5 mr-1" />
                Angulos disponibles
              </p>
              <div className="flex flex-wrap gap-2">
                {background.available_angles.map((angle, i) => (
                  <span key={i} className="rounded-lg border border-border bg-background px-3 py-1.5 text-xs font-medium text-foreground">
                    {angle}
                  </span>
                ))}
              </div>
            </section>
          )}
        </div>

        {/* ===== RIGHT COLUMN ===== */}
        <div className="space-y-6">

          {/* Prompt snippet - prominent */}
          <section className="rounded-xl border border-border bg-card p-4 space-y-3">
            <div className="flex items-center justify-between">
              <p className="text-xs font-semibold uppercase tracking-wider text-muted-foreground">Prompt snippet</p>
              <button type="button" onClick={handleCopyPrompt} className="rounded-lg px-2 py-1.5 text-xs text-muted-foreground hover:bg-accent hover:text-foreground">
                <Copy className="inline h-3 w-3 mr-1" /> Copiar
              </button>
            </div>

            {editField === 'prompt_snippet' ? (
              <div className="space-y-2">
                <textarea
                  value={editValue}
                  onChange={(e) => setEditValue(e.target.value)}
                  rows={6}
                  className="w-full rounded-lg border border-border bg-background px-3 py-2 font-mono text-sm outline-none focus:border-primary/30 focus:ring-1 focus:ring-primary/10"
                />
                <div className="flex justify-end gap-2">
                  <button type="button" onClick={() => setEditField(null)} className="rounded-lg px-2 py-1.5 text-xs text-muted-foreground hover:bg-accent hover:text-foreground">
                    <X className="inline h-3 w-3 mr-1" /> Cancelar
                  </button>
                  <button type="button" onClick={() => saveField('prompt_snippet')} disabled={updateMutation.isPending} className="rounded-xl bg-primary px-3 py-2 text-sm font-medium text-primary-foreground hover:bg-primary/90 disabled:opacity-50">
                    <Save className="inline h-3 w-3 mr-1" /> Guardar
                  </button>
                </div>
              </div>
            ) : (
              <button type="button" onClick={() => startEdit('prompt_snippet', background.prompt_snippet ?? '')} className="w-full text-left">
                <pre className="whitespace-pre-wrap rounded-lg border border-border bg-background p-3 font-mono text-sm text-muted-foreground">
                  {background.prompt_snippet || 'Sin prompt snippet. Haz clic para editar.'}
                </pre>
              </button>
            )}
          </section>

          {/* AI Visual Analysis (read-only) */}
          {background.ai_visual_analysis && (
            <section className="rounded-xl border border-border bg-card p-4 space-y-3">
              <p className="text-xs font-semibold uppercase tracking-wider text-muted-foreground">Analisis visual IA</p>
              <pre className="max-h-48 overflow-y-auto whitespace-pre-wrap rounded-lg border border-border bg-background p-3 text-xs text-muted-foreground">
                {JSON.stringify(background.ai_visual_analysis, null, 2)}
              </pre>
            </section>
          )}

          {/* Scenes using this background */}
          <section className="rounded-xl border border-border bg-card p-4 space-y-3">
            <p className="text-xs font-semibold uppercase tracking-wider text-muted-foreground">
              <Film className="inline h-3.5 w-3.5 mr-1" />
              Escenas ({sceneLinks?.length ?? 0})
            </p>

            {sceneLinks && sceneLinks.length > 0 ? (
              <div className="space-y-2">
                {sceneLinks.map((link) => {
                  const scene = link.scene;
                  return (
                    <div
                      key={link.scene_id}
                      className="flex items-center justify-between rounded-lg border border-border bg-background px-3 py-2 transition-colors hover:border-primary/20"
                    >
                      <div className="flex items-center gap-2 min-w-0">
                        <span className="shrink-0 rounded bg-primary/10 px-1.5 py-0.5 font-mono text-xs font-medium text-primary">
                          {scene.scene_number}
                        </span>
                        <div className="min-w-0">
                          <p className="truncate text-sm text-foreground">{scene.title}</p>
                          {scene.description && (
                            <p className="mt-0.5 line-clamp-1 text-xs text-muted-foreground">{scene.description}</p>
                          )}
                        </div>
                      </div>
                      <div className="flex items-center gap-2 shrink-0">
                        {link.is_primary && (
                          <span className="rounded bg-primary/10 px-1.5 py-0.5 text-[10px] font-medium text-primary">Primario</span>
                        )}
                        {link.angle && (
                          <span className="text-[10px] text-muted-foreground">{link.angle}</span>
                        )}
                        <ChevronRight className="h-3.5 w-3.5 text-muted-foreground" />
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

/* ------------------------------------------------------------------ */
/*  Sub-components                                                     */
/* ------------------------------------------------------------------ */

function EditableRow({
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
}: {
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
}) {
  const isEditing = editField === fieldKey;

  return (
    <div>
      <p className="text-xs font-semibold uppercase tracking-wider text-muted-foreground mb-1">{label}</p>
      {isEditing ? (
        <div className="space-y-2">
          <input
            value={editValue}
            onChange={(e) => onChangeValue(e.target.value)}
            className="w-full rounded-lg border border-border bg-background px-3 py-2 text-sm outline-none focus:border-primary/30 focus:ring-1 focus:ring-primary/10"
          />
          <div className="flex justify-end gap-2">
            <button type="button" onClick={onCancel} className="rounded-lg px-2 py-1.5 text-xs text-muted-foreground hover:bg-accent hover:text-foreground">
              <X className="inline h-3 w-3 mr-1" /> Cancelar
            </button>
            <button type="button" onClick={() => onSave(fieldKey)} disabled={saving} className="rounded-xl bg-primary px-3 py-2 text-sm font-medium text-primary-foreground hover:bg-primary/90 disabled:opacity-50">
              <Save className="inline h-3 w-3 mr-1" /> Guardar
            </button>
          </div>
        </div>
      ) : (
        <div className="flex items-center gap-2">
          <span className="text-sm text-foreground">{value || <span className="italic text-muted-foreground/50">-</span>}</span>
          <button type="button" onClick={() => onStartEdit(fieldKey, value ?? '')} className="rounded-lg px-2 py-1.5 text-xs text-muted-foreground hover:bg-accent hover:text-foreground">
            <Pencil className="inline h-3 w-3" />
          </button>
        </div>
      )}
    </div>
  );
}

function EditableTextarea({
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
}: {
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
}) {
  const isEditing = editField === fieldKey;

  return (
    <div>
      <div className="flex items-center justify-between mb-1">
        <p className="text-xs font-semibold uppercase tracking-wider text-muted-foreground">{label}</p>
        {!isEditing && (
          <button type="button" onClick={() => onStartEdit(fieldKey, value ?? '')} className="rounded-lg px-2 py-1.5 text-xs text-muted-foreground hover:bg-accent hover:text-foreground">
            <Pencil className="inline h-3 w-3 mr-1" /> Editar
          </button>
        )}
      </div>
      {isEditing ? (
        <div className="space-y-2">
          <textarea
            value={editValue}
            onChange={(e) => onChangeValue(e.target.value)}
            rows={4}
            className="w-full rounded-lg border border-border bg-background px-3 py-2 text-sm outline-none focus:border-primary/30 focus:ring-1 focus:ring-primary/10"
          />
          <div className="flex justify-end gap-2">
            <button type="button" onClick={onCancel} className="rounded-lg px-2 py-1.5 text-xs text-muted-foreground hover:bg-accent hover:text-foreground">
              <X className="inline h-3 w-3 mr-1" /> Cancelar
            </button>
            <button type="button" onClick={() => onSave(fieldKey)} disabled={saving} className="rounded-xl bg-primary px-3 py-2 text-sm font-medium text-primary-foreground hover:bg-primary/90 disabled:opacity-50">
              <Save className="inline h-3 w-3 mr-1" /> Guardar
            </button>
          </div>
        </div>
      ) : (
        <p className="whitespace-pre-wrap text-sm text-muted-foreground">
          {value || <span className="italic text-muted-foreground/50">Sin contenido</span>}
        </p>
      )}
    </div>
  );
}
