'use client';

import { useState, useCallback, useRef, type ChangeEvent } from 'react';
import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query';
import { useParams, useRouter } from 'next/navigation';
import Image from 'next/image';
import { createClient } from '@/lib/supabase/client';
import { Button } from '@heroui/react';
import { useProject } from '@/contexts/ProjectContext';
import { queryKeys } from '@/lib/query/keys';
import { useUIStore } from '@/stores/useUIStore';
import { toast } from 'sonner';
import type { Background, BackgroundUpdate } from '@/types';

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
    },
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
      <div className="flex items-center justify-center min-h-[60vh]">
        <div className="animate-spin rounded-full h-8 w-8 border-t-2 border-b-2 border-primary" />
      </div>
    );
  }

  if (!background) {
    return (
      <div className="p-6 text-center">
        <p className="text-muted-foreground">Fondo no encontrado</p>
        <button
          onClick={() => router.back()}
          className="mt-4 text-primary hover:text-primary/80 text-sm"
        >
          Volver
        </button>
      </div>
    );
  }

  const aiAnalysis = background.ai_visual_analysis as Record<string, unknown> | null;

  return (
    <div className="p-6 max-w-7xl mx-auto h-full overflow-y-auto">
      {/* Header */}
      <div className="flex items-center gap-3 mb-6">
        <button
          onClick={() => router.push(`/project/${shortId}/resources`)}
          className="text-muted-foreground hover:text-foreground transition-colors"
        >
          <svg className="w-5 h-5" fill="none" viewBox="0 0 24 24" stroke="currentColor">
            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M15 19l-7-7 7-7" />
          </svg>
        </button>
        <div>
          <h1 className="text-lg font-semibold text-foreground">{background.name}</h1>
          <p className="text-sm text-muted-foreground">
            <span className="font-mono text-foreground">{background.code}</span>
            {background.location_type && <span className="ml-2">{background.location_type}</span>}
            {background.time_of_day && <span className="ml-2">| {background.time_of_day}</span>}
          </p>
        </div>
      </div>

      <div className="grid grid-cols-1 lg:grid-cols-5 gap-6">
        {/* ===== LEFT COLUMN: Image & Angles ===== */}
        <div className="lg:col-span-2 space-y-4">
          {/* Reference image */}
          <div className="rounded-xl border border-border bg-card overflow-hidden">
            <input ref={fileInputRef} type="file" accept="image/*" className="hidden" onChange={handleReferenceUpload} />
            {background.reference_image_url ? (
              <button type="button" onClick={handleOpenPreview} className="relative block aspect-video w-full overflow-hidden">
                <Image
                  src={background.reference_image_url}
                  alt={background.name}
                  fill
                  className="object-cover"
                />
              </button>
            ) : (
              <div className="aspect-video flex items-center justify-center bg-secondary">
                <svg className="w-12 h-12 text-muted-foreground" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={1.5} d="M2.25 15.75l5.159-5.159a2.25 2.25 0 013.182 0l5.159 5.159m-1.5-1.5l1.409-1.41a2.25 2.25 0 013.182 0l2.909 2.91m-18 3.75h16.5a1.5 1.5 0 001.5-1.5V6a1.5 1.5 0 00-1.5-1.5H3.75A1.5 1.5 0 002.25 6v12a1.5 1.5 0 001.5 1.5zm10.5-11.25h.008v.008h-.008V8.25zm.375 0a.375.375 0 11-.75 0 .375.375 0 01.75 0z" />
                </svg>
              </div>
            )}
            <div className="flex items-center justify-between border-t border-border px-4 py-3">
              <p className="text-xs text-muted-foreground">Referencia visual principal del fondo</p>
              <Button size="sm" variant="outline" onPress={() => fileInputRef.current?.click()} isDisabled={uploadReferenceMutation.isPending}>
                {uploadReferenceMutation.isPending ? 'Subiendo...' : 'Subir imagen'}
              </Button>
            </div>
          </div>

          {/* Available angles */}
          <div className="rounded-xl border border-border bg-card p-4">
            <h3 className="text-sm font-medium text-foreground mb-3">Angulos disponibles</h3>
            {background.available_angles && background.available_angles.length > 0 ? (
              <div className="flex flex-wrap gap-2">
                {background.available_angles.map((angle, i) => (
                  <span
                    key={i}
                    className="text-xs bg-secondary border border-border text-foreground px-2.5 py-1 rounded-lg"
                  >
                    {angle}
                  </span>
                ))}
              </div>
            ) : (
              <p className="text-xs text-muted-foreground">Sin angulos definidos.</p>
            )}
          </div>
        </div>

        {/* ===== RIGHT COLUMN: Details ===== */}
        <div className="lg:col-span-3 space-y-4">
          {/* Basic Info */}
          <section className="rounded-xl border border-border bg-card p-4 space-y-3">
            <h3 className="text-sm font-medium text-foreground mb-1">Informacion basica</h3>
            <InfoRow label="Nombre" value={background.name} />
            <InfoRow label="Codigo" value={background.code} />
            <InfoRow label="Tipo de locacion" value={background.location_type} />
            <InfoRow label="Hora del dia" value={background.time_of_day} />
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
            <section className="rounded-xl border border-border bg-card p-4">
              <h3 className="text-sm font-medium text-foreground mb-2">Analisis visual IA</h3>
              <pre className="text-xs text-muted-foreground whitespace-pre-wrap bg-secondary rounded-lg p-3 max-h-48 overflow-y-auto">
                {JSON.stringify(aiAnalysis, null, 2)}
              </pre>
            </section>
          )}

          {/* Prompt snippet (read-only) */}
          {background.prompt_snippet && (
            <section className="rounded-xl border border-border bg-card p-4">
              <h3 className="text-sm font-medium text-foreground mb-2">Prompt snippet</h3>
              <p className="text-sm text-muted-foreground bg-secondary rounded-lg p-3 font-mono">
                {background.prompt_snippet}
              </p>
            </section>
          )}

          {/* Scenes using this background */}
          <section className="rounded-xl border border-border bg-card p-4">
            <h3 className="text-sm font-medium text-foreground mb-3">
              Escenas ({sceneLinks?.length ?? 0})
            </h3>
            {sceneLinks && sceneLinks.length > 0 ? (
              <div className="space-y-2">
                {sceneLinks.map((link) => {
                  const scene = link.scene;
                  return (
                    <div
                      key={link.scene_id}
                      className="bg-secondary rounded-lg p-3 border border-border/50 hover:border-zinc-600 transition-colors cursor-pointer"
                    >
                      <div className="flex items-center gap-2">
                        <span className="text-xs font-mono text-blue-400">
                          {scene.scene_number}
                        </span>
                        <span className="text-sm text-foreground">{scene.title}</span>
                        {link.is_primary && (
                          <span className="text-[10px] bg-blue-600/30 text-blue-300 px-1.5 py-0.5 rounded">
                            Primario
                          </span>
                        )}
                        {link.angle && (
                          <span className="text-[10px] bg-secondary text-muted-foreground px-1.5 py-0.5 rounded">
                            {link.angle}
                          </span>
                        )}
                        {link.time_of_day && (
                          <span className="text-[10px] bg-secondary text-muted-foreground px-1.5 py-0.5 rounded">
                            {link.time_of_day}
                          </span>
                        )}
                      </div>
                      {scene.description && (
                        <p className="text-xs text-muted-foreground mt-1 line-clamp-1">
                          {scene.description}
                        </p>
                      )}
                    </div>
                  );
                })}
              </div>
            ) : (
              <p className="text-xs text-muted-foreground">
                Este fondo no se usa en ninguna escena aun.
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
      <span className="text-xs text-muted-foreground w-32 shrink-0 pt-0.5">{label}</span>
      <span className="text-sm text-foreground">{value || <span className="text-muted-foreground/50 italic">-</span>}</span>
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
    <section className="rounded-xl border border-border bg-card p-4">
      <div className="flex items-center justify-between mb-2">
        <h3 className="text-sm font-medium text-foreground">{label}</h3>
        {!isEditing && (
          <button
            onClick={() => onStartEdit(fieldKey, value ?? '')}
            className="text-xs text-blue-400 hover:text-blue-300"
          >
            Editar
          </button>
        )}
      </div>
      {isEditing ? (
        <div className="space-y-2">
          <textarea
            value={editValue}
            onChange={(e) => onChangeValue(e.target.value)}
            rows={4}
            className="w-full bg-secondary border border-border text-foreground text-sm rounded-lg p-3 resize-y placeholder:text-muted-foreground/50 focus:border-primary focus:outline-none"
          />
          <div className="flex gap-2 justify-end">
            <button
              onClick={onCancel}
              className="text-xs text-muted-foreground hover:text-foreground px-3 py-1.5"
            >
              Cancelar
            </button>
            <button
              onClick={() => onSave(fieldKey)}
              disabled={saving}
              className="text-xs bg-blue-600 hover:bg-blue-500 disabled:opacity-50 text-white px-4 py-1.5 rounded-lg transition-colors"
            >
              {saving ? 'Guardando...' : 'Guardar'}
            </button>
          </div>
        </div>
      ) : (
        <p className="text-sm text-muted-foreground whitespace-pre-wrap">
          {value || <span className="italic text-muted-foreground/50">Sin contenido</span>}
        </p>
      )}
    </section>
  );
}
