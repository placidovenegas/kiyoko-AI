'use client';

import { useState, useCallback } from 'react';
import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query';
import { useParams, useRouter } from 'next/navigation';
import Image from 'next/image';
import { createClient } from '@/lib/supabase/client';
import { Button } from '@/components/ui/button';
import { useProject } from '@/contexts/ProjectContext';
import { queryKeys } from '@/lib/query/keys';
import type { Character, CharacterImage, CharacterUpdate } from '@/types';

interface CharacterRules {
  always?: string[];
  never?: string[];
}

interface SceneWithCharacter {
  scene_id: string;
  role_in_scene: string | null;
  scene: {
    id: string;
    scene_number: string;
    title: string;
    description: string | null;
  };
}

export default function CharacterDetailPage() {
  const params = useParams();
  const router = useRouter();
  const queryClient = useQueryClient();
  const { project } = useProject();
  const charId = params.charId as string;
  const shortId = params.shortId as string;

  const supabase = createClient();

  // ---------- Queries ----------

  const { data: character, isLoading: charLoading } = useQuery({
    queryKey: queryKeys.characters.detail(charId),
    queryFn: async () => {
      const { data, error } = await supabase
        .from('characters')
        .select('*')
        .eq('id', charId)
        .single();
      if (error) throw error;
      return data as Character;
    },
    enabled: !!charId,
  });

  const { data: images } = useQuery({
    queryKey: queryKeys.characters.images(charId),
    queryFn: async () => {
      const { data, error } = await supabase
        .from('character_images')
        .select('*')
        .eq('character_id', charId)
        .order('sort_order', { ascending: true });
      if (error) throw error;
      return data as CharacterImage[];
    },
    enabled: !!charId,
  });

  const { data: sceneLinks } = useQuery({
    queryKey: ['character-scenes', charId],
    queryFn: async () => {
      const { data, error } = await supabase
        .from('scene_characters')
        .select('scene_id, role_in_scene, scene:scenes(id, scene_number, title, description)')
        .eq('character_id', charId);
      if (error) throw error;
      return (data ?? []) as unknown as SceneWithCharacter[];
    },
    enabled: !!charId,
  });

  // ---------- Editable fields ----------

  const [editField, setEditField] = useState<string | null>(null);
  const [editValue, setEditValue] = useState('');

  const startEdit = useCallback((field: string, value: string) => {
    setEditField(field);
    setEditValue(value ?? '');
  }, []);

  const updateMutation = useMutation({
    mutationFn: async (updates: CharacterUpdate) => {
      const { error } = await supabase
        .from('characters')
        .update(updates)
        .eq('id', charId);
      if (error) throw error;
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: queryKeys.characters.detail(charId) });
      if (project) {
        queryClient.invalidateQueries({ queryKey: queryKeys.characters.byProject(project.id) });
      }
      setEditField(null);
    },
  });

  const saveField = useCallback((field: string) => {
    updateMutation.mutate({ [field]: editValue } as CharacterUpdate);
  }, [editValue, updateMutation]);

  // ---------- Rules management ----------

  const rules = (character?.rules ?? { always: [], never: [] }) as CharacterRules;

  const [newRule, setNewRule] = useState('');
  const [ruleType, setRuleType] = useState<'always' | 'never'>('always');

  const addRule = useCallback(() => {
    if (!newRule.trim()) return;
    const updated = { ...rules };
    if (!updated[ruleType]) updated[ruleType] = [];
    updated[ruleType] = [...(updated[ruleType] ?? []), newRule.trim()];
    updateMutation.mutate({ rules: updated as unknown as CharacterUpdate['rules'] });
    setNewRule('');
  }, [newRule, ruleType, rules, updateMutation]);

  const removeRule = useCallback((type: 'always' | 'never', index: number) => {
    const updated = { ...rules };
    updated[type] = (updated[type] ?? []).filter((_: string, i: number) => i !== index);
    updateMutation.mutate({ rules: updated as unknown as CharacterUpdate['rules'] });
  }, [rules, updateMutation]);

  // ---------- Loading / Error ----------

  if (charLoading) {
    return (
      <div className="flex items-center justify-center min-h-[60vh]">
        <div className="animate-spin rounded-full h-8 w-8 border-t-2 border-b-2 border-primary" />
      </div>
    );
  }

  if (!character) {
    return (
      <div className="p-6 text-center">
        <p className="text-muted-foreground">Personaje no encontrado</p>
        <button
          onClick={() => router.back()}
          className="mt-4 text-primary hover:text-primary/80 text-sm"
        >
          Volver
        </button>
      </div>
    );
  }

  const aiAnalysis = character.ai_visual_analysis as Record<string, unknown> | null;

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
          <h1 className="text-lg font-semibold text-foreground">{character.name}</h1>
          <p className="text-sm text-muted-foreground">{character.role ?? 'Sin rol definido'}</p>
        </div>
        <span
          className="ml-3 w-4 h-4 rounded-full border border-border"
          style={{ backgroundColor: character.color_accent ?? '#6366f1' }}
          title="Color de acento"
        />
      </div>

      <div className="grid grid-cols-1 lg:grid-cols-5 gap-6">
        {/* ===== LEFT COLUMN: Images ===== */}
        <div className="lg:col-span-2 space-y-4">
          {/* Reference image */}
          <div className="rounded-xl border border-border bg-card overflow-hidden">
            {character.reference_image_url ? (
              <div className="relative aspect-square">
                <Image
                  src={character.reference_image_url}
                  alt={character.name}
                  fill
                  className="object-cover"
                />
              </div>
            ) : (
              <div className="aspect-square flex items-center justify-center bg-secondary">
                <span className="text-5xl font-bold text-muted-foreground">
                  {character.initials}
                </span>
              </div>
            )}
          </div>

          {/* Image Gallery */}
          <div className="rounded-xl border border-border bg-card p-4">
            <h3 className="text-sm font-medium text-foreground mb-3">Galeria de imagenes</h3>
            {images && images.length > 0 ? (
              <div className="grid grid-cols-3 gap-2">
                {images.map((img) => (
                  <div key={img.id} className="relative aspect-square rounded-lg overflow-hidden border border-border group">
                    <Image
                      src={img.file_url ?? img.thumbnail_url ?? ''}
                      alt={img.angle_description ?? 'Character image'}
                      fill
                      className="object-cover"
                    />
                    {img.is_primary && (
                      <span className="absolute top-1 left-1 bg-blue-500/80 text-[10px] px-1.5 py-0.5 rounded text-white">
                        Principal
                      </span>
                    )}
                    <span className="absolute bottom-0 inset-x-0 bg-black/70 text-[10px] text-foreground px-1.5 py-0.5 truncate opacity-0 group-hover:opacity-100 transition-opacity">
                      {img.image_type}
                    </span>
                  </div>
                ))}
              </div>
            ) : (
              <p className="text-xs text-muted-foreground">No hay imagenes aun.</p>
            )}

            {/* Action buttons */}
            <div className="mt-3 flex gap-2">
              <Button variant="bordered" size="sm" className="flex-1 text-xs">
                Subir imagen
              </Button>
              <Button variant="solid" color="primary" size="sm" className="flex-1 text-xs">
                Generar con IA
              </Button>
            </div>
          </div>
        </div>

        {/* ===== RIGHT COLUMN: Details ===== */}
        <div className="lg:col-span-3 space-y-4">
          {/* Basic Info */}
          <section className="rounded-xl border border-border bg-card p-4 space-y-3">
            <h3 className="text-sm font-medium text-foreground mb-1">Informacion basica</h3>

            <InfoRow label="Nombre" value={character.name} />
            <InfoRow label="Rol" value={character.role} />
            <InfoRow label="Personalidad" value={character.personality} />
            <InfoRow label="Cabello" value={character.hair_description} />
            <InfoRow label="Ropa caracteristica" value={character.signature_clothing} />
            <InfoRow label="Accesorios" value={character.accessories?.join(', ')} />
            <InfoRow label="Herramientas" value={character.signature_tools?.join(', ')} />
          </section>

          {/* Editable: visual_description */}
          <EditableSection
            label="Descripcion visual"
            value={character.visual_description}
            fieldKey="visual_description"
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
            value={character.ai_prompt_description}
            fieldKey="ai_prompt_description"
            editField={editField}
            editValue={editValue}
            onStartEdit={startEdit}
            onChangeValue={setEditValue}
            onSave={saveField}
            onCancel={() => setEditField(null)}
            saving={updateMutation.isPending}
          />

          {/* Editable: description */}
          <EditableSection
            label="Descripcion general"
            value={character.description}
            fieldKey="description"
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
          {character.prompt_snippet && (
            <section className="rounded-xl border border-border bg-card p-4">
              <h3 className="text-sm font-medium text-foreground mb-2">Prompt snippet</h3>
              <p className="text-sm text-muted-foreground bg-secondary rounded-lg p-3 font-mono">
                {character.prompt_snippet}
              </p>
            </section>
          )}

          {/* Rules: always / never */}
          <section className="rounded-xl border border-border bg-card p-4">
            <h3 className="text-sm font-medium text-foreground mb-3">Reglas de consistencia</h3>

            <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
              {/* Always */}
              <div>
                <h4 className="text-xs font-semibold text-green-400 mb-2 uppercase tracking-wider">Siempre</h4>
                {(rules.always ?? []).length > 0 ? (
                  <ul className="space-y-1">
                    {(rules.always ?? []).map((r: string, i: number) => (
                      <li key={i} className="flex items-start gap-2 text-xs text-foreground">
                        <span className="text-green-500 mt-0.5">+</span>
                        <span className="flex-1">{r}</span>
                        <Button variant="ghost" size="xs" isIconOnly className="h-5 w-5 text-xs text-muted-foreground/50 hover:text-red-400 shrink-0" onClick={() => removeRule('always', i)}>x</Button>
                      </li>
                    ))}
                  </ul>
                ) : (
                  <p className="text-xs text-muted-foreground/50">Sin reglas &quot;siempre&quot;</p>
                )}
              </div>

              {/* Never */}
              <div>
                <h4 className="text-xs font-semibold text-red-400 mb-2 uppercase tracking-wider">Nunca</h4>
                {(rules.never ?? []).length > 0 ? (
                  <ul className="space-y-1">
                    {(rules.never ?? []).map((r: string, i: number) => (
                      <li key={i} className="flex items-start gap-2 text-xs text-foreground">
                        <span className="text-red-500 mt-0.5">-</span>
                        <span className="flex-1">{r}</span>
                        <Button variant="ghost" size="xs" isIconOnly className="h-5 w-5 text-xs text-muted-foreground/50 hover:text-red-400 shrink-0" onClick={() => removeRule('never', i)}>x</Button>
                      </li>
                    ))}
                  </ul>
                ) : (
                  <p className="text-xs text-muted-foreground/50">Sin reglas &quot;nunca&quot;</p>
                )}
              </div>
            </div>

            {/* Add rule */}
            <div className="mt-3 flex gap-2">
              <select
                value={ruleType}
                onChange={(e) => setRuleType(e.target.value as 'always' | 'never')}
                className="bg-secondary border border-border text-foreground text-xs rounded-lg px-2 py-1.5"
              >
                <option value="always">Siempre</option>
                <option value="never">Nunca</option>
              </select>
              <input
                value={newRule}
                onChange={(e) => setNewRule(e.target.value)}
                onKeyDown={(e) => e.key === 'Enter' && addRule()}
                placeholder="Nueva regla..."
                className="flex-1 bg-secondary border border-border text-foreground text-xs rounded-lg px-3 py-1.5 placeholder:text-muted-foreground/50"
              />
              <button
                onClick={addRule}
                className="text-xs bg-secondary hover:bg-secondary/60 text-foreground px-3 py-1.5 rounded-lg transition-colors"
              >
                Agregar
              </button>
            </div>
          </section>

          {/* Scenes where character appears */}
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
                        {link.role_in_scene && (
                          <span className="text-[10px] bg-secondary text-muted-foreground px-1.5 py-0.5 rounded">
                            {link.role_in_scene}
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
                Este personaje no aparece en ninguna escena aun.
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
            <Button variant="bordered" size="sm" onClick={onCancel}>
              Cancelar
            </Button>
            <Button variant="solid" color="primary" size="sm" onClick={() => onSave(fieldKey)} disabled={saving}>
              {saving ? 'Guardando...' : 'Guardar'}
            </Button>
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
